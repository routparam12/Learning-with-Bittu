/* check-transformer.mjs — proves the section shows real numbers.

   The engine the browser runs (src/sections/transformer/scripts/engine.js) and
   the forward pass the trainer used (train-transformer.mjs) are two separate
   implementations. If their logits agree to floating-point noise on the same
   weights, the numbers on screen are genuinely the model's.

     node tools/check-transformer.mjs */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { run, checkInput } from '../src/sections/transformer/scripts/engine.js';
import { loadModel, tokenize, promptFor, BOS, EOS, QS, AS } from '../src/sections/transformer/scripts/model.js';
import { forward } from './train-transformer.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

/* rebuild the trainer's parameter map from a shipped JSON */
function paramsFromJson(json) {
  const P = new Map();
  for (const k of Object.keys(json.weights)) {
    const arr = Float64Array.from(json.weights[k]);
    P.set(k, { r: 1, c: arr.length, d: arr, decay: false });
  }
  return P;
}

const SENTENCES = [
  'the weather is',
  'i would like some',
  'good morning how are',
  'she goes to school by',
  'quantum bratwurst zeppelin',          // entirely out of vocabulary
  'The CAT   sat, on the MAT!!',         // punctuation + casing
];

for (const id of ['simple', 'real']) {
  const json = JSON.parse(readFileSync(join(ROOT, `src/sections/transformer/data/model-${id}.json`), 'utf8'));
  const model = loadModel(json);
  const P = paramsFromJson(json);
  const cfg = model.cfg;
  console.log(`\n${id}: D=${cfg.D} L=${cfg.L} H=${cfg.H} V=${cfg.V} ppl=${cfg.perplexity}  (${model.params.toLocaleString()} params)`);

  for (const text of SENTENCES) {
    const res = run(model, text, { temperature: 0 });
    if (res.error) { console.log(`  ✗ "${text}" → engine refused: ${res.error.k}`); failures++; continue; }
    const { frames } = res;

    /* 1. frame count matches the documented stage list */
    const perToken = 7 + 11 * cfg.L;
    const gens = new Set(frames.filter((f) => f.stage === 'embed').map((f) => f.gen)).size;
    const expect = 1 + gens * perToken + 1;   // tokenize + N words + done
    ok(frames.length === expect, `"${text}" → ${frames.length} frames (${gens} words, expected ${expect})`);

    /* 2. attention rows are a real probability distribution, and causal */
    let rowsOk = true, causalOk = true;
    for (const f of frames.filter((x) => x.attnMode === 'probs')) {
      const T = f.tokens.length;
      for (const head of f.attn) {
        for (let r = 0; r < T; r++) {
          let s = 0;
          for (let c = 0; c <= r; c++) s += head[r * T + c];
          if (Math.abs(s - 1) > 1e-9) rowsOk = false;
          for (let c = r + 1; c < T; c++) if (Number.isFinite(head[r * T + c])) causalOk = false;
        }
      }
    }
    ok(rowsOk, '    attention rows each sum to 1');
    ok(causalOk, '    nothing above the diagonal survives the mask');

    /* 3. the distribution is a distribution */
    const dists = frames.filter((f) => f.dist);
    let distOk = dists.length > 0;
    for (const f of dists) {
      if (f.dist.some((x) => x.p < 0 || x.p > 1)) distOk = false;
      for (let k = 1; k < f.dist.length; k++) if (f.dist[k].p > f.dist[k - 1].p + 1e-12) distOk = false;
    }
    ok(distOk, '    top-k probabilities are in range and sorted');

    /* 4. THE ONE THAT MATTERS: engine logits == trainer's independent forward */
    let worst = 0;
    for (const f of frames.filter((x) => x.stage === 'logits')) {
      const ids = f.tokens.map((t) => t.id);
      const ref = forward(P, cfg, ids);
      const T = ids.length;
      // recompute what the engine displayed for the last position
      const top = f.work.p[0];                   // the word name the engine reported
      let best = 0;
      for (let v = 1; v < cfg.V; v++)
        if (ref.logits.d[(T - 1) * cfg.V + v] > ref.logits.d[(T - 1) * cfg.V + best]) best = v;
      if (json.vocab[best] !== top) worst = Infinity;
    }
    ok(worst === 0, '    engine\'s top logit matches the reference forward pass');
  }

  /* 5. numeric agreement across the whole logit vector, to floating-point noise */
  const ids = tokenize(model, 'the weather is').map((t) => t.id);
  const ref = forward(P, cfg, ids);
  const res = run(model, 'the weather is', { temperature: 0 });
  const lf = res.frames.find((f) => f.stage === 'logits');
  // engine keeps xf in the stream at the logits frame; recompute logits from it
  const T = ids.length, D = cfg.D;
  let maxDiff = 0;
  for (let v = 0; v < cfg.V; v++) {
    let s = 0;
    for (let j = 0; j < D; j++) s += lf.stream[(T - 1) * D + j] * model.W.tok[v * D + j];
    maxDiff = Math.max(maxDiff, Math.abs(s - ref.logits.d[(T - 1) * cfg.V + v]));
  }
  ok(maxDiff < 1e-9, `  full logit vector matches reference (max diff ${maxDiff.toExponential(2)})`);

  /* 6. what it actually writes, continuing text */
  console.log('  continue:');
  for (const text of ['the weather is', 'i would like some', 'good morning how are']) {
    const r = run(model, text, { temperature: 0 });
    console.log(`    "${text}" → "${r.generated.join(' ')}"`);
  }

  /* 7. answer mode: the template, the stop token, and the answers */
  const QUESTIONS = ['how are you', 'what is your name', 'where do you live',
    'what is the weather today', 'are you hungry', 'how do you go to school'];

  // the wrapper is exactly <bos> <q> …words… <a>
  const p0 = promptFor(model, 'how are you', 'answer').map((t) => t.id);
  ok(p0[0] === BOS && p0[1] === QS && p0[p0.length - 1] === AS,
    'answer prompt is wrapped as <bos> <q> … <a>');
  ok(promptFor(model, 'how are you', 'continue').every((t) => t.id !== QS && t.id !== AS),
    'continue mode adds no template tokens');

  let stopped = 0, cleanAll = true;
  console.log('  answer:');
  for (const q of QUESTIONS) {
    const r = run(model, q, { mode: 'answer', temperature: 0 });
    if (r.error) { console.log(`    ✗ "${q}" refused`); failures++; continue; }
    if (r.frames.some((f) => f.stage === 'eos')) stopped++;
    // an answer must never contain a template or unknown token
    if (r.generated.some((w) => ['<q>', '<a>', '<bos>', '<unk>'].includes(w))) cleanAll = false;
    console.log(`    "${q}" → "${r.generated.join(' ')}"`);
  }
  ok(cleanAll, '    no answer contains a template or <unk> token');
  ok(stopped > 0, `    ${stopped}/${QUESTIONS.length} answers ended on <eos> rather than the ceiling`);

  // frame accounting in answer mode includes the extra template frame
  const ra = run(model, 'how are you', { mode: 'answer', temperature: 0 });
  const gensA = new Set(ra.frames.filter((f) => f.stage === 'embed').map((f) => f.gen)).size;
  ok(ra.frames.length === 2 + gensA * (7 + 11 * cfg.L) + 1,
    `    answer run frames = tokenize + template + ${gensA} words + done`);
  ok(ra.frames[1].stage === 'template', '    the template step is its own frame');
}

/* 7. input guards */
const json = JSON.parse(readFileSync(join(ROOT, 'src/sections/transformer/data/model-simple.json'), 'utf8'));
const m = loadModel(json);
console.log('\nguards:');
ok(!!checkInput(m, '').error, 'empty input is refused');
ok(!!checkInput(m, '!!! ???').error, 'punctuation-only input is refused');
ok(!checkInput(m, 'the weather is').error, 'a normal sentence is accepted');
ok(!!checkInput(m, 'a '.repeat(40)).error, 'an over-long sentence is refused');
ok(!!checkInput(m, '', 'answer').error, 'empty question is refused');
ok(!checkInput(m, 'how are you', 'answer').error, 'a normal question is accepted');
ok(!!checkInput(m, 'a '.repeat(40), 'answer').error, 'an over-long question is refused');

console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
process.exit(failures ? 1 : 0);
