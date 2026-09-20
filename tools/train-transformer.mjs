/* train-transformer.mjs — offline trainer for the Transformer section.
   Plain JS, zero dependencies. NOT shipped to the browser: it runs here, by hand,
   and writes the weight files the section loads.

     node tools/train-transformer.mjs --gradcheck    verify backprop, train nothing
     node tools/train-transformer.mjs                train both models and write JSON

   Two models share one vocabulary, so the only thing that changes between them is
   capacity — which is exactly the comparison the section wants to show.

   Architecture is pre-LN GPT with a tied unembedding, matching what the section
   renders step by step: embed → (LN → causal MHA → residual → LN → GELU MLP →
   residual) × blocks → final LN → logits. */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/* ── rng ─────────────────────────────────────────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rnd) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ── tiny tensor ─────────────────────────────────────────────── */
const mat = (r, c) => ({ r, c, d: new Float64Array(r * c) });
function randMat(r, c, std, rnd) {
  const m = mat(r, c);
  for (let i = 0; i < m.d.length; i++) m.d[i] = gaussian(rnd) * std;
  return m;
}

/* ── vocabulary ──────────────────────────────────────────────── */
/* <q> and <a> are the chat template. A question is answered by wrapping it as
   <bos> <q> …question… <a> and letting ordinary next-token prediction continue
   — that wrapper is the only thing that turns "continue this" into "answer this". */
const BOS = 0, EOS = 1, UNK = 2, QS = 3, AS = 4;
const SPECIALS = ['<bos>', '<eos>', '<unk>', '<q>', '<a>'];

function buildVocab(lines, minCount) {
  const freq = new Map();
  for (const line of lines) for (const w of line.split(' ')) freq.set(w, (freq.get(w) || 0) + 1);
  const words = [...freq.entries()]
    .filter(([, n]) => n >= minCount)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([w]) => w);
  const itos = [...SPECIALS, ...words];
  const stoi = new Map(itos.map((w, i) => [w, i]));
  return { itos, stoi };
}
const ids = (vocab, line) =>
  line.split(' ').filter(Boolean).map((w) => (vocab.stoi.has(w) ? vocab.stoi.get(w) : UNK));

/** A plain sentence: predict every token. */
const encode = (vocab, line) => ({ seq: [BOS, ...ids(vocab, line), EOS], answerFrom: 0 });

/** A Q→A pair: predict only the answer, which is what instruction tuning does.
    `answerFrom` is the first position whose *target* counts towards the loss. */
function encodeQA(vocab, q, a) {
  const qi = ids(vocab, q), ai = ids(vocab, a);
  const seq = [BOS, QS, ...qi, AS, ...ai, EOS];
  return { seq, answerFrom: 1 + 1 + qi.length };   // the <a> position predicts the first answer word
}

/* ── parameters ──────────────────────────────────────────────── */
function initParams(cfg, seed) {
  const rnd = mulberry32(seed);
  const { V, D, F, L } = cfg;
  const P = new Map();
  const put = (name, m, decay) => P.set(name, { ...m, decay });

  put('tok', randMat(V, D, 0.08, rnd), true);   // tied: input embedding + output head
  put('pos', randMat(cfg.ctx, D, 0.02, rnd), true);
  for (let l = 0; l < L; l++) {
    put(`b${l}.ln1.g`, ones(D), false); put(`b${l}.ln1.b`, mat(1, D), false);
    put(`b${l}.qkv.w`, randMat(D, 3 * D, 1 / Math.sqrt(D), rnd), true);
    put(`b${l}.qkv.b`, mat(1, 3 * D), false);
    put(`b${l}.proj.w`, randMat(D, D, 1 / Math.sqrt(D * 2 * cfg.L), rnd), true);
    put(`b${l}.proj.b`, mat(1, D), false);
    put(`b${l}.ln2.g`, ones(D), false); put(`b${l}.ln2.b`, mat(1, D), false);
    put(`b${l}.fc.w`, randMat(D, F, 1 / Math.sqrt(D), rnd), true);
    put(`b${l}.fc.b`, mat(1, F), false);
    put(`b${l}.out.w`, randMat(F, D, 1 / Math.sqrt(F * 2 * cfg.L), rnd), true);
    put(`b${l}.out.b`, mat(1, D), false);
  }
  put('lnf.g', ones(D), false); put('lnf.b', mat(1, D), false);
  return P;
}
function ones(n) { const m = mat(1, n); m.d.fill(1); return m; }

/* ── activations ─────────────────────────────────────────────── */
const GC = Math.sqrt(2 / Math.PI);
function gelu(x) {
  const inner = GC * (x + 0.044715 * x * x * x);
  return 0.5 * x * (1 + Math.tanh(inner));
}
function dgelu(x) {
  const inner = GC * (x + 0.044715 * x * x * x);
  const t = Math.tanh(inner);
  return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * GC * (1 + 3 * 0.044715 * x * x);
}

/* ── forward ─────────────────────────────────────────────────── */
/* Returns logits (T×V) plus every intermediate the backward pass needs. */
export function forward(P, cfg, ids) {
  const T = ids.length, { D, F, L, H } = cfg, dh = D / H;
  const g = (n) => P.get(n).d;

  const x = mat(T, D);
  for (let t = 0; t < T; t++)
    for (let j = 0; j < D; j++) x.d[t * D + j] = g('tok')[ids[t] * D + j] + g('pos')[t * D + j];

  const cache = { blocks: [], x0: copy(x) };
  let cur = x;

  for (let l = 0; l < L; l++) {
    const c = {};
    c.inp = copy(cur);
    const { y: y1, mean: m1, rstd: r1, xhat: h1 } = layerNorm(cur, g(`b${l}.ln1.g`), g(`b${l}.ln1.b`), T, D);
    c.ln1 = { mean: m1, rstd: r1, xhat: h1, y: y1 };

    const qkv = affine(y1, P.get(`b${l}.qkv.w`), g(`b${l}.qkv.b`), T, D, 3 * D);
    c.qkv = qkv;

    const att = [], out = mat(T, D);
    const scale = 1 / Math.sqrt(dh);
    for (let h = 0; h < H; h++) {
      const p = mat(T, T);
      for (let i = 0; i < T; i++) {
        let mx = -Infinity;
        const raw = new Float64Array(i + 1);
        for (let j = 0; j <= i; j++) {
          let s = 0;
          for (let k = 0; k < dh; k++)
            s += qkv.d[i * 3 * D + h * dh + k] * qkv.d[j * 3 * D + D + h * dh + k];
          raw[j] = s * scale;
          if (raw[j] > mx) mx = raw[j];
        }
        let sum = 0;
        for (let j = 0; j <= i; j++) { raw[j] = Math.exp(raw[j] - mx); sum += raw[j]; }
        for (let j = 0; j <= i; j++) p.d[i * T + j] = raw[j] / sum;
        for (let k = 0; k < dh; k++) {
          let acc = 0;
          for (let j = 0; j <= i; j++) acc += p.d[i * T + j] * qkv.d[j * 3 * D + 2 * D + h * dh + k];
          out.d[i * D + h * dh + k] = acc;
        }
      }
      att.push(p);
    }
    c.att = att; c.concat = copy(out);

    const proj = affine(out, P.get(`b${l}.proj.w`), g(`b${l}.proj.b`), T, D, D);
    const res1 = mat(T, D);
    for (let i = 0; i < T * D; i++) res1.d[i] = cur.d[i] + proj.d[i];
    c.res1 = copy(res1);

    const { y: y2, mean: m2, rstd: r2, xhat: h2 } = layerNorm(res1, g(`b${l}.ln2.g`), g(`b${l}.ln2.b`), T, D);
    c.ln2 = { mean: m2, rstd: r2, xhat: h2, y: y2 };

    const u = affine(y2, P.get(`b${l}.fc.w`), g(`b${l}.fc.b`), T, D, F);
    const a = mat(T, F);
    for (let i = 0; i < T * F; i++) a.d[i] = gelu(u.d[i]);
    c.u = u; c.a = a;

    const dn = affine(a, P.get(`b${l}.out.w`), g(`b${l}.out.b`), T, F, D);
    const res2 = mat(T, D);
    for (let i = 0; i < T * D; i++) res2.d[i] = res1.d[i] + dn.d[i];
    c.mlpOut = copy(dn);

    cache.blocks.push(c);
    cur = res2;
  }

  const { y: xf, mean: mf, rstd: rf, xhat: hf } = layerNorm(cur, g('lnf.g'), g('lnf.b'), T, D);
  cache.preF = copy(cur);
  cache.lnf = { mean: mf, rstd: rf, xhat: hf };
  cache.xf = copy(xf);

  const V = cfg.V, logits = mat(T, V);
  for (let t = 0; t < T; t++)
    for (let v = 0; v < V; v++) {
      let s = 0;
      for (let j = 0; j < D; j++) s += xf.d[t * D + j] * g('tok')[v * D + j];
      logits.d[t * V + v] = s;
    }
  return { logits, cache, T };
}

const copy = (m) => ({ r: m.r, c: m.c, d: Float64Array.from(m.d) });

function layerNorm(x, gain, bias, T, D) {
  const y = mat(T, D), mean = new Float64Array(T), rstd = new Float64Array(T), xhat = mat(T, D);
  for (let t = 0; t < T; t++) {
    let mu = 0;
    for (let j = 0; j < D; j++) mu += x.d[t * D + j];
    mu /= D;
    let va = 0;
    for (let j = 0; j < D; j++) { const d = x.d[t * D + j] - mu; va += d * d; }
    va /= D;
    const rs = 1 / Math.sqrt(va + 1e-5);
    mean[t] = mu; rstd[t] = rs;
    for (let j = 0; j < D; j++) {
      const h = (x.d[t * D + j] - mu) * rs;
      xhat.d[t * D + j] = h;
      y.d[t * D + j] = h * gain[j] + bias[j];
    }
  }
  return { y, mean, rstd, xhat };
}

function affine(x, W, b, T, inD, outD) {
  const y = mat(T, outD);
  for (let t = 0; t < T; t++)
    for (let o = 0; o < outD; o++) {
      let s = b[o];
      for (let i = 0; i < inD; i++) s += x.d[t * inD + i] * W.d[i * outD + o];
      y.d[t * outD + o] = s;
    }
  return y;
}

/* ── loss + backward ─────────────────────────────────────────── */
/* Cross-entropy on next-token prediction; returns loss and parameter grads. */
export function lossAndGrads(P, cfg, ids, grads, answerFrom = 0) {
  const { logits, cache, T } = forward(P, cfg, ids);
  const { D, F, L, H, V } = cfg, dh = D / H;
  const g = (n) => P.get(n).d;
  const G = (n) => grads.get(n).d;
  // positions before answerFrom are context we never ask the model to produce
  const first = Math.min(answerFrom, T - 2);
  const nPred = T - 1 - first;

  // softmax + CE over positions first..T-2 predicting ids[t+1]
  let loss = 0;
  const dlogits = mat(T, V);
  for (let t = first; t < T - 1; t++) {
    let mx = -Infinity;
    for (let v = 0; v < V; v++) mx = Math.max(mx, logits.d[t * V + v]);
    let sum = 0;
    for (let v = 0; v < V; v++) sum += Math.exp(logits.d[t * V + v] - mx);
    const lse = mx + Math.log(sum);
    const tgt = ids[t + 1];
    loss += lse - logits.d[t * V + tgt];
    for (let v = 0; v < V; v++) {
      const p = Math.exp(logits.d[t * V + v] - lse);
      dlogits.d[t * V + v] = (p - (v === tgt ? 1 : 0)) / nPred;
    }
  }
  loss /= nPred;

  // unembedding (tied with tok)
  const dxf = mat(T, D);
  for (let t = first; t < T - 1; t++)
    for (let v = 0; v < V; v++) {
      const dl = dlogits.d[t * V + v];
      if (dl === 0) continue;
      for (let j = 0; j < D; j++) {
        dxf.d[t * D + j] += dl * g('tok')[v * D + j];
        G('tok')[v * D + j] += dl * cache.xf.d[t * D + j];
      }
    }

  let dcur = lnBackward(dxf, cache.lnf, cache.preF, g('lnf.g'), G('lnf.g'), G('lnf.b'), T, D);

  for (let l = L - 1; l >= 0; l--) {
    const c = cache.blocks[l];

    // residual 2: res2 = res1 + mlpOut
    const dmlp = copy(dcur);
    const dres1 = copy(dcur);

    // mlp down
    const da = matBackward(dmlp, c.a, P.get(`b${l}.out.w`), G(`b${l}.out.w`), G(`b${l}.out.b`), T, F, D);
    // gelu
    const du = mat(T, F);
    for (let i = 0; i < T * F; i++) du.d[i] = da.d[i] * dgelu(c.u.d[i]);
    // mlp up
    const dy2 = matBackward(du, c.ln2.y, P.get(`b${l}.fc.w`), G(`b${l}.fc.w`), G(`b${l}.fc.b`), T, D, F);
    // ln2
    const dres1b = lnBackward(dy2, c.ln2, c.res1, g(`b${l}.ln2.g`), G(`b${l}.ln2.g`), G(`b${l}.ln2.b`), T, D);
    for (let i = 0; i < T * D; i++) dres1.d[i] += dres1b.d[i];

    // residual 1: res1 = inp + proj
    const dproj = copy(dres1);
    const dinp = copy(dres1);

    // output projection
    const dconcat = matBackward(dproj, c.concat, P.get(`b${l}.proj.w`), G(`b${l}.proj.w`), G(`b${l}.proj.b`), T, D, D);

    // attention
    const dqkv = mat(T, 3 * D);
    const scale = 1 / Math.sqrt(dh);
    for (let h = 0; h < H; h++) {
      const p = c.att[h];
      for (let i = 0; i < T; i++) {
        // dV and dP from out = P @ V
        const dp = new Float64Array(i + 1);
        for (let j = 0; j <= i; j++) {
          let s = 0;
          for (let k = 0; k < dh; k++) {
            const go = dconcat.d[i * D + h * dh + k];
            s += go * c.qkv.d[j * 3 * D + 2 * D + h * dh + k];
            dqkv.d[j * 3 * D + 2 * D + h * dh + k] += go * p.d[i * T + j];
          }
          dp[j] = s;
        }
        // softmax backward
        let dot = 0;
        for (let j = 0; j <= i; j++) dot += dp[j] * p.d[i * T + j];
        for (let j = 0; j <= i; j++) {
          const ds = p.d[i * T + j] * (dp[j] - dot) * scale;
          for (let k = 0; k < dh; k++) {
            dqkv.d[i * 3 * D + h * dh + k] += ds * c.qkv.d[j * 3 * D + D + h * dh + k];
            dqkv.d[j * 3 * D + D + h * dh + k] += ds * c.qkv.d[i * 3 * D + h * dh + k];
          }
        }
      }
    }

    const dy1 = matBackward(dqkv, c.ln1.y, P.get(`b${l}.qkv.w`), G(`b${l}.qkv.w`), G(`b${l}.qkv.b`), T, D, 3 * D);
    const dinp2 = lnBackward(dy1, c.ln1, c.inp, g(`b${l}.ln1.g`), G(`b${l}.ln1.g`), G(`b${l}.ln1.b`), T, D);
    for (let i = 0; i < T * D; i++) dinp.d[i] += dinp2.d[i];
    dcur = dinp;
  }

  // embeddings
  for (let t = 0; t < T; t++)
    for (let j = 0; j < D; j++) {
      G('tok')[ids[t] * D + j] += dcur.d[t * D + j];
      G('pos')[t * D + j] += dcur.d[t * D + j];
    }

  return loss;
}

/* y = x @ W + b  →  accumulate dW, db; return dx */
function matBackward(dy, x, W, dW, db, T, inD, outD) {
  const dx = mat(T, inD);
  for (let t = 0; t < T; t++)
    for (let o = 0; o < outD; o++) {
      const go = dy.d[t * outD + o];
      if (go === 0) continue;
      db[o] += go;
      for (let i = 0; i < inD; i++) {
        dW[i * outD + o] += x.d[t * inD + i] * go;
        dx.d[t * inD + i] += W.d[i * outD + o] * go;
      }
    }
  return dx;
}

function lnBackward(dy, cache, xin, gain, dgain, dbias, T, D) {
  const dx = mat(T, D);
  for (let t = 0; t < T; t++) {
    let m1 = 0, m2 = 0;
    const dh = new Float64Array(D);
    for (let j = 0; j < D; j++) {
      const go = dy.d[t * D + j], xh = cache.xhat.d[t * D + j];
      dgain[j] += go * xh; dbias[j] += go;
      dh[j] = go * gain[j];
      m1 += dh[j]; m2 += dh[j] * xh;
    }
    m1 /= D; m2 /= D;
    for (let j = 0; j < D; j++)
      dx.d[t * D + j] = cache.rstd[t] * (dh[j] - m1 - cache.xhat.d[t * D + j] * m2);
  }
  return dx;
}

/* ── gradient check ──────────────────────────────────────────── */
function zerosLike(P) {
  const G = new Map();
  for (const [k, v] of P) G.set(k, mat(v.r, v.c));
  return G;
}

function gradcheck(answerFrom = 0) {
  const cfg = { V: 9, D: 4, F: 8, L: 2, H: 2, ctx: 6 };
  const P = initParams(cfg, 7);
  const ids = [0, 4, 6, 3, 1];
  const G = zerosLike(P);
  const base = lossAndGrads(P, cfg, ids, G, answerFrom);

  let worst = 0, worstName = '', checked = 0;
  const eps = 1e-5;
  for (const [name, t] of P) {
    for (let i = 0; i < t.d.length; i++) {
      const orig = t.d[i];
      t.d[i] = orig + eps; const lp = lossAndGrads(P, cfg, ids, zerosLike(P), answerFrom);
      t.d[i] = orig - eps; const lm = lossAndGrads(P, cfg, ids, zerosLike(P), answerFrom);
      t.d[i] = orig;
      const num = (lp - lm) / (2 * eps);
      const ana = G.get(name).d[i];
      const denom = Math.max(1e-8, Math.abs(num) + Math.abs(ana));
      const rel = Math.abs(num - ana) / denom;
      checked++;
      if (rel > worst) { worst = rel; worstName = `${name}[${i}] num=${num.toExponential(3)} ana=${ana.toExponential(3)}`; }
    }
  }
  console.log(`gradcheck (answerFrom=${answerFrom}): loss=${base.toFixed(6)}  params checked=${checked}  worst rel err ${worst.toExponential(3)}`);
  if (worst >= 1e-5) console.log(`  ✗ BACKPROP IS WRONG  (${worstName})`);
  return worst < 1e-5;
}
/** Both the plain loss and the answer-only masked loss must be differentiated correctly. */
const gradcheckAll = () => [0, 2].every((a) => gradcheck(a));

/* ── training ────────────────────────────────────────────────── */
function train(cfg, items, vocab, opts) {
  const P = initParams(cfg, opts.seed);
  const m = new Map(), v = new Map();
  for (const [k, t] of P) { m.set(k, mat(t.r, t.c)); v.set(k, mat(t.r, t.c)); }
  const rnd = mulberry32(opts.seed + 99);
  let step = 0;
  const nParams = [...P.values()].reduce((s, t) => s + t.d.length, 0);
  console.log(`\n${opts.name}: D=${cfg.D} blocks=${cfg.L} heads=${cfg.H} ctx=${cfg.ctx} V=${cfg.V} → ${nParams.toLocaleString()} params`);

  for (let epoch = 0; epoch < opts.epochs; epoch++) {
    const order = [...items.keys()].sort(() => rnd() - 0.5);
    let epochLoss = 0, nb = 0;
    for (let b = 0; b < order.length; b += opts.batch) {
      const G = zerosLike(P);
      let bl = 0, cnt = 0;
      for (let i = b; i < Math.min(b + opts.batch, order.length); i++) {
        const it = items[order[i]];
        bl += lossAndGrads(P, cfg, it.seq, G, it.answerFrom); cnt++;
      }
      bl /= cnt;
      epochLoss += bl; nb++;
      step++;
      const lr = opts.lr * Math.min(1, step / opts.warmup) *
        (0.5 * (1 + Math.cos(Math.PI * Math.min(1, step / opts.totalSteps))) * 0.9 + 0.1);
      // AdamW
      for (const [k, t] of P) {
        const gt = G.get(k).d, mt = m.get(k).d, vt = v.get(k).d;
        for (let i = 0; i < t.d.length; i++) {
          const gi = gt[i] / cnt;
          mt[i] = 0.9 * mt[i] + 0.1 * gi;
          vt[i] = 0.95 * vt[i] + 0.05 * gi * gi;
          const mh = mt[i] / (1 - Math.pow(0.9, step));
          const vh = vt[i] / (1 - Math.pow(0.95, step));
          if (t.decay) t.d[i] -= lr * opts.wd * t.d[i];
          t.d[i] -= lr * mh / (Math.sqrt(vh) + 1e-8);
        }
      }
    }
    if (epoch % opts.report === 0 || epoch === opts.epochs - 1)
      console.log(`  epoch ${String(epoch + 1).padStart(3)}  loss ${(epochLoss / nb).toFixed(4)}  ppl ${Math.exp(epochLoss / nb).toFixed(2)}`);
  }
  return P;
}

function evaluate(P, cfg, items) {
  let total = 0, n = 0;
  for (const { seq: ids, answerFrom } of items) {
    const { logits, T } = forward(P, cfg, ids);
    for (let t = Math.min(answerFrom, T - 2); t < T - 1; t++) {
      let mx = -Infinity;
      for (let v2 = 0; v2 < cfg.V; v2++) mx = Math.max(mx, logits.d[t * cfg.V + v2]);
      let sum = 0;
      for (let v2 = 0; v2 < cfg.V; v2++) sum += Math.exp(logits.d[t * cfg.V + v2] - mx);
      total += mx + Math.log(sum) - logits.d[t * cfg.V + ids[t + 1]];
      n++;
    }
  }
  return Math.exp(total / n);
}

/** Baseline over exactly the positions the model is scored on, so it is a fair floor. */
function unigramPerplexity(items, V) {
  const counts = new Float64Array(V);
  let n = 0;
  for (const { seq, answerFrom } of items)
    for (let t = Math.max(1, answerFrom + 1); t < seq.length; t++) { counts[seq[t]]++; n++; }
  let total = 0, m = 0;
  for (const { seq, answerFrom } of items)
    for (let t = Math.max(1, answerFrom + 1); t < seq.length; t++) {
      total += -Math.log((counts[seq[t]] + 1) / (n + V)); m++;
    }
  return Math.exp(total / m);
}

/* ── export ──────────────────────────────────────────────────── */
function exportModel(P, cfg, vocab, meta, file) {
  const round = (x, dp) => Number(x.toFixed(dp));
  const w = {};
  for (const [k, t] of P) w[k] = Array.from(t.d, (x) => round(x, 4));
  const json = { meta: { ...meta, ...cfg }, vocab: vocab.itos, weights: w };
  const out = JSON.stringify(json);
  writeFileSync(file, out);
  console.log(`  wrote ${file.replace(ROOT + '/', '')}  ${(out.length / 1024).toFixed(1)} KB`);
}

/* ── main ────────────────────────────────────────────────────── */
/* Only when run directly: check-transformer.mjs imports forward() from here and
   must not kick off a training run as a side effect. */
const IS_MAIN = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (!IS_MAIN) { /* imported as a library — export only */ }
else main();

function main() {
const plain = readFileSync(join(HERE, 'corpus-everyday.txt'), 'utf8')
  .split('\n').map((x) => x.trim().toLowerCase()).filter(Boolean);
const qaRaw = readFileSync(join(HERE, 'corpus-qa.txt'), 'utf8')
  .split('\n').map((x) => x.trim().toLowerCase()).filter(Boolean)
  .map((l) => l.split('|').map((x) => x.trim()))
  .filter((p2) => p2.length === 2 && p2[0] && p2[1]);

if (process.argv.includes('--gradcheck')) process.exit(gradcheckAll() ? 0 : 1);
if (!gradcheckAll()) { console.error('refusing to train with a broken backward pass'); process.exit(1); }

// one vocabulary over everything, so both modes share a tokenizer
const vocab = buildVocab([...plain, ...qaRaw.flat()], 2);
const V = vocab.itos.length;
const CTX = 24;

const items = [
  ...plain.map((l) => encode(vocab, l)),
  ...qaRaw.map(([q, a]) => encodeQA(vocab, q, a)),
].filter((it) => it.seq.length <= CTX);

const nQA = items.filter((it) => it.answerFrom > 0).length;
console.log(`\ncorpus: ${plain.length} sentences + ${qaRaw.length} Q&A pairs, vocab ${V}`);
console.log(`        ${items.length} sequences fit ctx ${CTX} (${nQA} of them Q&A, scored on the answer only)`);
console.log(`unigram baseline perplexity: ${unigramPerplexity(items, V).toFixed(2)}`);

const SIMPLE = { V, D: 4, F: 16, L: 1, H: 1, ctx: CTX };
const REAL = { V, D: 32, F: 128, L: 2, H: 4, ctx: CTX };
const steps = Math.ceil(items.length / 16);

const ps = train(SIMPLE, items, vocab, {
  name: 'simple', seed: 1, epochs: 300, batch: 16, lr: 0.05, wd: 0.001, warmup: 60, totalSteps: 300 * steps, report: 50,
});
const pplS = evaluate(ps, SIMPLE, items);
console.log(`  final perplexity: ${pplS.toFixed(2)}`);

const pr = train(REAL, items, vocab, {
  name: 'real', seed: 2, epochs: 300, batch: 16, lr: 0.02, wd: 0.01, warmup: 80, totalSteps: 300 * steps, report: 50,
});
const pplR = evaluate(pr, REAL, items);
console.log(`  final perplexity: ${pplR.toFixed(2)}`);

exportModel(ps, SIMPLE, vocab, { id: 'simple', perplexity: Number(pplS.toFixed(2)), sentences: items.length, qa: nQA }, join(ROOT, 'src/sections/transformer/data/model-simple.json'));
exportModel(pr, REAL, vocab, { id: 'real', perplexity: Number(pplR.toFixed(2)), sentences: items.length, qa: nQA }, join(ROOT, 'src/sections/transformer/data/model-real.json'));
}
