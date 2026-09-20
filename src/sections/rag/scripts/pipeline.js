/* pipeline.js — the one question that travels the whole RAG page.

   The reader types a question at the top; every game reads it from here and
   writes its own stage output back, so the widgets behave like one machine
   instead of eight unrelated demos. Persisted to sessionStorage so scrolling
   away and back keeps the state.

   get()            → { question, stages: { rewrite, embed, search, ... } }
   setQuestion(q)   → updates the question, clears downstream stage outputs
   setStage(id, v)  → records a stage's output
   subscribe(fn)    → fn(state) on every change; returns an unsubscribe
*/

const KEY = 'rag:pipeline';
const DEFAULT_Q = 'How much parental leave do I get?';
const DEFAULT_PATTERN = 'basic';

const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY));
    if (raw && typeof raw.question === 'string') {
      return { pattern: DEFAULT_PATTERN, ...raw };
    }
  } catch (e) { /* first visit */ }
  return { question: DEFAULT_Q, pattern: DEFAULT_PATTERN, stages: {} };
}

let state = load();

function save() {
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

function emit() {
  listeners.forEach((fn) => { try { fn(state); } catch (e) {} });
}

export function get() { return state; }
export const question = () => state.question;
export const DEFAULT_QUESTION = DEFAULT_Q;

export function setQuestion(q) {
  const next = (q || '').trim() || DEFAULT_Q;
  if (next === state.question) return;
  // A new question invalidates every downstream stage output, but not the
  // chosen pattern: rebuilding state from scratch dropped `pattern`, so the
  // applied pattern stayed on screen and vanished on the next reload.
  state = { ...state, question: next, stages: {} };
  save();
  emit();
}

export function setStage(id, value) {
  state = { ...state, stages: { ...state.stages, [id]: value } };
  save();
  emit();
}

export const pattern = () => state.pattern || DEFAULT_PATTERN;
export const DEFAULT_PATTERN_ID = DEFAULT_PATTERN;

export function setPattern(id) {
  const next = id || DEFAULT_PATTERN;
  if (next === state.pattern) return;
  state = { ...state, pattern: next };
  save();
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
