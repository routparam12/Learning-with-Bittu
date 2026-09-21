/* engine.js — pure logic. No DOM, no language.

   Runs a real forward pass of the model in data/ and pushes one "frame" per
   press of Next, exactly like src/sections/dsa/scripts/engine.js does for a
   sort. Narration is never a string here: it is { k, p } — a dictionary key
   plus its parameters — so the same frames paint in English or Hinglish.

   The maths below is the same pre-LN GPT that tools/train-transformer.mjs
   trained, op for op. Every number a frame carries was computed here from the
   reader's own sentence; nothing is canned. */

import { BOS, EOS, UNK, QS, AS, promptFor, tokenize, wordFor } from './model.js';

export const MAX_WORDS = 12;      // most input words we accept
export const MAX_NEW = 6;         // continuation words per run
export const MAX_ANSWER = 10;     // an answer runs until <eos>, with this as the ceiling

const S = (k, ...p) => ({ k, p });

/* ── formatting helpers (language-free: digits only) ─────────── */
const f2 = (x) => (Object.is(x, -0) ? 0 : x).toFixed(2);
/** A vector as text, truncated when the model is too wide to read. */
function vec(a, from, n, limit = 6) {
  const out = [];
  for (let i = 0; i < Math.min(n, limit); i++) out.push(f2(a[from + i]));
  return '[' + out.join(', ') + (n > limit ? `, … +${n - limit}` : '') + ']';
}

/* ── the maths, matching the trainer op for op ───────────────── */
const GC = Math.sqrt(2 / Math.PI);
const gelu = (x) => 0.5 * x * (1 + Math.tanh(GC * (x + 0.044715 * x * x * x)));

function layerNorm(x, T, D, gain, bias) {
  const y = new Float64Array(T * D), stats = [];
  for (let t = 0; t < T; t++) {
    let mu = 0;
    for (let j = 0; j < D; j++) mu += x[t * D + j];
    mu /= D;
    let va = 0;
    for (let j = 0; j < D; j++) { const d = x[t * D + j] - mu; va += d * d; }
    va /= D;
    const rs = 1 / Math.sqrt(va + 1e-5);
    stats.push({ mean: mu, std: Math.sqrt(va) });
    for (let j = 0; j < D; j++) y[t * D + j] = (x[t * D + j] - mu) * rs * gain[j] + bias[j];
  }
  return { y, stats };
}

function affine(x, T, inD, outD, W, b) {
  const y = new Float64Array(T * outD);
  for (let t = 0; t < T; t++)
    for (let o = 0; o < outD; o++) {
      let s = b[o];
      for (let i = 0; i < inD; i++) s += x[t * inD + i] * W[i * outD + o];
      y[t * outD + o] = s;
    }
  return y;
}

function softmaxRow(src, n) {
  let mx = -Infinity;
  for (let i = 0; i < n; i++) mx = Math.max(mx, src[i]);
  let sum = 0;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) { out[i] = Math.exp(src[i] - mx); sum += out[i]; }
  for (let i = 0; i < n; i++) out[i] /= sum;
  return out;
}

/** Deterministic RNG so a given sentence + temperature always replays the same. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── input validation ────────────────────────────────────────── */
export function checkInput(model, text, mode = 'continue') {
  const toks = promptFor(model, text, mode);
  const words = toks.filter((t) => !t.special).length;
  const room = mode === 'answer' ? MAX_ANSWER : MAX_NEW;
  if (words < 1) return { error: mode === 'answer' ? S('err.emptyQ') : S('err.empty') };
  if (words > MAX_WORDS) return { error: S('err.tooLong', MAX_WORDS) };
  if (toks.length + room > model.cfg.ctx)
    return { error: S('err.tooLong', model.cfg.ctx - room - toks.length + words) };
  return { tokens: toks };
}

/* ── the run ─────────────────────────────────────────────────── */
/**
 * Run the model, emitting one frame per step.
 *   mode 'continue' → carry the sentence on for up to MAX_NEW words
 *   mode 'answer'   → wrap the question as <bos> <q> … <a> and generate until
 *                     the model emits <eos>, capped at MAX_ANSWER words
 * @returns { frames, tokens, generated, mode } or { error }
 */
export function run(model, text, { temperature = 0, mode = 'continue', maxNew } = {}) {
  const answering = mode === 'answer';
  if (maxNew == null) maxNew = answering ? MAX_ANSWER : MAX_NEW;
  const checked = checkInput(model, text, mode);
  if (checked.error) return checked;

  const { D, F, L, H, V, ctx } = model.cfg;
  const dh = model.dh;
  const W = model.W;
  const rnd = mulberry32(1337);

  let toks = checked.tokens.map((t) => ({ ...t, isNew: false }));
  const frames = [];
  let gen = 0;

  /* state carried into every frame */
  const st = { stream: null, prevStream: null, attn: null, scores: null, focus: null, block: null };

  const push = (o = {}) => frames.push({
    gen,
    tokens: toks.map((t) => ({ ...t })),
    block: st.block,
    focus: st.focus,
    stream: st.stream ? Float64Array.from(st.stream) : null,
    prevStream: st.prevStream ? Float64Array.from(st.prevStream) : null,
    attn: st.attn,
    scores: st.scores,
    D, H, L,
    work: null, dist: null, picked: null, heads: null,
    ...o,
  });

  /* In answer mode the reader's own words are shown first, bare. The wrapper is
     the next frame's reveal — seeing it appear is the point. */
  const bare = answering ? tokenize(model, text).map((t) => ({ ...t, isNew: false })) : toks;
  push({
    stage: 'tokenize', tag: S('tag.tokenize'), line: 0,
    tokens: bare.map((t) => ({ ...t })),
    say: S('say.tokenize', bare.length, bare.filter((t) => !t.known).length),
    work: S('work.tokenize', bare.map((t) => t.id).join(', ')),
  });

  /* The whole difference between the two modes lives in this one frame. */
  if (answering) push({
    stage: 'template', tag: S('tag.template'), line: 0,
    say: S('say.template'),
    work: S('work.template', toks.map((t) => t.word).join(' ')),
  });

  for (; gen < maxNew; gen++) {
    const T = toks.length;
    const ids = toks.map((t) => t.id);
    if (T >= ctx) break;

    /* ── 1. embeddings ── */
    let x = new Float64Array(T * D);
    for (let t = 0; t < T; t++)
      for (let j = 0; j < D; j++) x[t * D + j] = W.tok[ids[t] * D + j];
    st.stream = x; st.prevStream = null; st.focus = T - 1; st.block = null;
    push({
      stage: 'embed', tag: S('tag.embed'), line: 1,
      say: gen === 0 ? S('say.prefill', T, D) : S('say.decode', gen + 1, D),
      streamLabel: S('panel.embed'),
      work: S('work.embed', toks[T - 1].word, ids[T - 1], vec(x, (T - 1) * D, D)),
    });

    const beforePos = Float64Array.from(x);
    for (let t = 0; t < T; t++)
      for (let j = 0; j < D; j++) x[t * D + j] += W.pos[t * D + j];
    st.stream = x; st.prevStream = beforePos;
    push({
      stage: 'pos', tag: S('tag.pos'), line: 1,
      say: S('say.pos'),
      streamLabel: S('panel.pos'),
      work: S('work.pos', T - 1, vec(W.pos, (T - 1) * D, D), vec(x, (T - 1) * D, D)),
    });

    /* ── 2. blocks ── */
    for (let l = 0; l < L; l++) {
      st.block = l;
      const blockIn = Float64Array.from(x);

      const { y: y1, stats: s1 } = layerNorm(x, T, D, W[`b${l}.ln1.g`], W[`b${l}.ln1.b`]);
      st.prevStream = Float64Array.from(x); st.stream = y1;
      push({
        stage: 'ln1', tag: S('tag.ln', l + 1), line: 3,
        say: S('say.ln1', l + 1),
        streamLabel: S('panel.ln1'),
        work: S('work.ln', f2(s1[T - 1].mean), f2(s1[T - 1].std), vec(y1, (T - 1) * D, D)),
      });

      const qkv = affine(y1, T, D, 3 * D, W[`b${l}.qkv.w`], W[`b${l}.qkv.b`]);
      st.prevStream = null; st.stream = y1;
      push({
        stage: 'qkv', tag: S('tag.qkv', l + 1), line: 4,
        say: S('say.qkv', H, dh),
        streamLabel: S('panel.qkv'),
        work: S('work.qkv',
          vec(qkv, (T - 1) * 3 * D, D), vec(qkv, (T - 1) * 3 * D + D, D), vec(qkv, (T - 1) * 3 * D + 2 * D, D)),
      });

      /* scores, mask, softmax — one frame each, all heads shown together */
      const rawScores = [], probs = [];
      const scale = 1 / Math.sqrt(dh);
      for (let h = 0; h < H; h++) {
        const sc = new Float64Array(T * T).fill(NaN);
        for (let i = 0; i < T; i++)
          for (let j = 0; j < T; j++) {
            let s = 0;
            for (let k = 0; k < dh; k++)
              s += qkv[i * 3 * D + h * dh + k] * qkv[j * 3 * D + D + h * dh + k];
            sc[i * T + j] = s * scale;
          }
        rawScores.push(sc);
      }
      st.attn = rawScores.map((m) => Float64Array.from(m));
      st.scores = true;
      let qk0 = 0;
      for (let k = 0; k < dh; k++) qk0 += qkv[(T - 1) * 3 * D + k] * qkv[(T - 1) * 3 * D + D + k];
      push({
        stage: 'scores', tag: S('tag.scores', l + 1), line: 5,
        say: S('say.scores'), attnMode: 'scores',
        work: S('work.score', T - 1, T - 1, f2(qk0), dh, f2(qk0 * scale)),
      });

      const masked = rawScores.map((sc) => {
        const m = Float64Array.from(sc);
        for (let i = 0; i < T; i++) for (let j = i + 1; j < T; j++) m[i * T + j] = NaN;
        return m;
      });
      st.attn = masked;
      push({
        stage: 'mask', tag: S('tag.mask', l + 1), line: 6,
        say: S('say.mask'), attnMode: 'masked',
        work: S('work.mask', (T * (T - 1)) / 2),
      });

      for (let h = 0; h < H; h++) {
        const p = new Float64Array(T * T).fill(NaN);
        for (let i = 0; i < T; i++) {
          const row = softmaxRow(rawScores[h].subarray(i * T, i * T + i + 1), i + 1);
          for (let j = 0; j <= i; j++) p[i * T + j] = row[j];
        }
        probs.push(p);
      }
      st.attn = probs;
      const lastRow = [];
      for (let j = 0; j < T; j++) lastRow.push(f2(probs[0][(T - 1) * T + j]));
      push({
        stage: 'attnsoftmax', tag: S('tag.softmax', l + 1), line: 7,
        say: S('say.attnsoftmax'), attnMode: 'probs',
        work: S('work.attnsoftmax', toks[T - 1].word, lastRow.join(', ')),
      });

      /* weighted sum of V */
      const cat = new Float64Array(T * D);
      for (let h = 0; h < H; h++)
        for (let i = 0; i < T; i++)
          for (let k = 0; k < dh; k++) {
            let acc = 0;
            for (let j = 0; j <= i; j++) acc += probs[h][i * T + j] * qkv[j * 3 * D + 2 * D + h * dh + k];
            cat[i * D + h * dh + k] = acc;
          }
      st.stream = cat; st.prevStream = null;
      push({
        stage: 'weighted', tag: S('tag.weighted', l + 1), line: 8,
        say: S('say.weighted'), attnMode: 'probs',
        streamLabel: S('panel.weighted'),
        work: S('work.weighted', vec(cat, (T - 1) * D, D)),
      });

      const proj = affine(cat, T, D, D, W[`b${l}.proj.w`], W[`b${l}.proj.b`]);
      st.attn = null; st.scores = null;
      st.stream = proj;
      push({
        stage: 'proj', tag: S('tag.proj', l + 1), line: 9,
        say: S('say.proj'),
        streamLabel: S('panel.proj'),
        work: S('work.proj', vec(proj, (T - 1) * D, D)),
      });

      const res1 = new Float64Array(T * D);
      for (let i = 0; i < T * D; i++) res1[i] = blockIn[i] + proj[i];
      st.prevStream = Float64Array.from(blockIn); st.stream = res1;
      push({
        stage: 'res1', tag: S('tag.res', l + 1), line: 10,
        say: S('say.res1'),
        streamLabel: S('panel.res1'),
        work: S('work.res', vec(blockIn, (T - 1) * D, D), vec(proj, (T - 1) * D, D), vec(res1, (T - 1) * D, D)),
      });

      const { y: y2, stats: s2 } = layerNorm(res1, T, D, W[`b${l}.ln2.g`], W[`b${l}.ln2.b`]);
      st.prevStream = Float64Array.from(res1); st.stream = y2;
      push({
        stage: 'ln2', tag: S('tag.ln', l + 1), line: 11,
        say: S('say.ln2'),
        streamLabel: S('panel.ln2'),
        work: S('work.ln', f2(s2[T - 1].mean), f2(s2[T - 1].std), vec(y2, (T - 1) * D, D)),
      });

      const u = affine(y2, T, D, F, W[`b${l}.fc.w`], W[`b${l}.fc.b`]);
      const a = new Float64Array(T * F);
      for (let i = 0; i < T * F; i++) a[i] = gelu(u[i]);
      st.prevStream = null; st.stream = a; st.wide = F;
      push({
        stage: 'mlpup', tag: S('tag.mlp', l + 1), line: 12,
        say: S('say.mlpup', D, F),
        streamLabel: S('panel.mlpup', F),
        width: F,
        work: S('work.mlpup', vec(u, (T - 1) * F, F), vec(a, (T - 1) * F, F)),
      });

      const dn = affine(a, T, F, D, W[`b${l}.out.w`], W[`b${l}.out.b`]);
      const res2 = new Float64Array(T * D);
      for (let i = 0; i < T * D; i++) res2[i] = res1[i] + dn[i];
      st.prevStream = Float64Array.from(res1); st.stream = res2;
      push({
        stage: 'mlpdown', tag: S('tag.mlp', l + 1), line: 13,
        say: S('say.mlpdown', l + 1, L),
        streamLabel: S('panel.res2'),
        work: S('work.res', vec(res1, (T - 1) * D, D), vec(dn, (T - 1) * D, D), vec(res2, (T - 1) * D, D)),
      });

      x = res2;
    }

    /* ── 3. final norm + logits ── */
    st.block = null;
    const { y: xf } = layerNorm(x, T, D, W['lnf.g'], W['lnf.b']);
    st.prevStream = Float64Array.from(x); st.stream = xf;
    push({
      stage: 'lnf', tag: S('tag.lnf'), line: 14,
      say: S('say.lnf'),
      streamLabel: S('panel.lnf'),
      work: S('work.lnfin', vec(xf, (T - 1) * D, D)),
    });

    const logits = new Float64Array(V);
    for (let v = 0; v < V; v++) {
      let s = 0;
      for (let j = 0; j < D; j++) s += xf[(T - 1) * D + j] * W.tok[v * D + j];
      logits[v] = s;
    }
    const order = Array.from(logits.keys()).sort((p, q) => logits[q] - logits[p]);
    st.prevStream = null; st.stream = xf;
    push({
      stage: 'logits', tag: S('tag.logits'), line: 15,
      say: S('say.logits', V),
      streamLabel: S('panel.lnf'),
      work: S('work.logits', wordFor(model, order[0]), f2(logits[order[0]]),
        wordFor(model, order[1]), f2(logits[order[1]])),
    });

    const p = softmaxRow(logits, V);
    const top = order.slice(0, 8).map((id) => ({ id, word: wordFor(model, id), p: p[id] }));
    push({
      stage: 'probs', tag: S('tag.probs'), line: 16,
      say: S('say.probs'), dist: top,
      work: S('work.probs', f2(p[order[0]] * 100), wordFor(model, order[0])),
    });

    /* ── 4. pick ──
       <bos> and <unk> stay in the distribution shown on screen — that is the
       model's honest opinion — but they are never written out. <unk> means "a
       word I was never taught"; emitting it as text would be nonsense. <eos>
       stays pickable, because stopping is a real decision. */
    const pickable = (id) => id !== BOS && id !== UNK;
    let pickId = order.find(pickable);
    if (temperature > 0) {
      const scaled = new Float64Array(V);
      for (let v = 0; v < V; v++) scaled[v] = pickable(v) ? logits[v] / temperature : -Infinity;
      const ps = softmaxRow(scaled, V);
      let r = rnd(), acc = 0;
      for (let v = 0; v < V; v++) { acc += ps[v]; if (r <= acc) { pickId = v; break; } }
    }
    const pickWord = wordFor(model, pickId);
    const skipped = pickId !== order[0];
    push({
      stage: 'sample', tag: S('tag.sample'), line: 17,
      say: temperature > 0 ? S('say.sampleTemp', temperature)
        : skipped ? S('say.sampleSkip', wordFor(model, order[0])) : S('say.sampleGreedy'),
      dist: top, picked: { id: pickId, word: pickWord, p: p[pickId] },
      work: S('work.sample', pickWord, f2(p[pickId] * 100)),
    });

    if (pickId === EOS) {
      push({
        stage: 'eos', tag: S('tag.done'), line: 18,
        say: answering ? S('say.eosAnswer') : S('say.eos'),
        dist: top, picked: { id: pickId, word: pickWord, p: p[pickId] },
        work: S('work.eos'),
      });
      gen++;
      break;
    }

    toks = [...toks, { word: pickWord, id: pickId, known: pickId !== UNK, special: false, isNew: true }];
    // the new token has no vector yet, so the stream from this round no longer
    // describes the sequence — drop it rather than show a row short
    st.stream = null; st.prevStream = null; st.focus = null;
    push({
      stage: 'append', tag: S('tag.append'), line: 18,
      say: S('say.append', pickWord, gen + 1),
      picked: { id: pickId, word: pickWord, p: p[pickId] },
      work: S('work.append', toks.length),
    });
  }

  st.stream = null; st.attn = null; st.focus = null;
  const made = toks.filter((t) => t.isNew).map((t) => t.word);
  const shown = answering
    ? made.join(' ')
    : toks.filter((t) => !t.special).map((t) => t.word).join(' ');
  push({
    stage: 'done', tag: S('tag.done'), line: 18,
    say: answering ? S('say.doneAnswer', made.length, L) : S('say.done', made.length, L),
    work: answering ? S('work.doneAnswer', shown) : S('work.done', shown),
  });

  return { frames, tokens: toks, generated: made, mode };
}
