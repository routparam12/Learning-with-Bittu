/* model.js — loads a weight file and turns text into tokens.

   The two models in data/ are produced by tools/train-transformer.mjs and share
   one vocabulary, so switching between them changes capacity and nothing else.
   Weights are plain arrays in the JSON; we view them as Float64Array here. */

export const BOS = 0, EOS = 1, UNK = 2, QS = 3, AS = 4;
export const SPECIAL_IDS = new Set([BOS, EOS, UNK, QS, AS]);

/** Wrap a parsed model JSON in the shape engine.js expects. */
export function loadModel(json) {
  const W = Object.create(null);
  for (const k of Object.keys(json.weights)) W[k] = Float64Array.from(json.weights[k]);
  const stoi = new Map(json.vocab.map((w, i) => [w, i]));
  const cfg = json.meta;
  return {
    id: cfg.id,
    cfg,
    vocab: json.vocab,
    stoi,
    W,
    params: Object.values(W).reduce((n, a) => n + a.length, 0),
    dh: cfg.D / cfg.H,
  };
}

/** Everything the tokenizer throws away, so the UI can say what it did. */
export function normalise(text) {
  return String(text).toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const tok = (word, id, extra = {}) => ({ word, id, known: id !== UNK, special: false, ...extra });

/** The reader's words, normalised and looked up. No wrapper. */
function body(model, text) {
  const clean = normalise(text);
  return (clean ? clean.split(' ') : [])
    .map((w) => tok(w, model.stoi.has(w) ? model.stoi.get(w) : UNK));
}

/** text → [{ word, id, known }], always starting with <bos>. */
export function tokenize(model, text) {
  return [tok('<bos>', BOS, { special: true }), ...body(model, text)];
}

/**
 * Build the token sequence the model actually runs on.
 *
 * 'continue' → <bos> your words…            the model carries the text on
 * 'answer'   → <bos> <q> your words… <a>    the model carries *that* on, and
 *                                            continuing it is an answer
 *
 * The wrapper is the entire difference between the two modes. Same weights,
 * same loop — only the tokens in front of them change.
 */
export function promptFor(model, text, mode = 'continue') {
  if (mode !== 'answer') return tokenize(model, text);
  return [
    tok('<bos>', BOS, { special: true }),
    tok('<q>', QS, { special: true, tmpl: true }),
    ...body(model, text),
    tok('<a>', AS, { special: true, tmpl: true }),
  ];
}

export const wordFor = (model, id) => model.vocab[id] ?? '<?>';
