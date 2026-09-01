/* The 15 production RAG patterns. The 11 pipeline stages never change; a pattern
   changes the *procedure* at a few of them. Structural bits live here; the name,
   tagline, impact bullets and per-stage notes are localised in i18n/*.js under
   `patterns[id]`.

   - affects   0-indexed stage numbers this pattern changes (gets a "With …" note)
   - flow      how the rail should bend for this pattern, or null:
       { type:'loop',    from, to, label }   arrow from one dot back up to another
       { type:'fanout',  at, label }         parallel branches out of one dot
       { type:'twopass', at, label }         a small return loop on one dot
*/
export const PATTERNS = [
  { id: 'basic',        num: 1,  icon: '🔍', affects: [],       flow: null },
  { id: 'metadata',     num: 2,  icon: '🏷️', affects: [3, 5],   flow: null },
  { id: 'rewrite',      num: 3,  icon: '✏️', affects: [4],      flow: null },
  { id: 'hybrid',       num: 4,  icon: '⚗️', affects: [2, 5],   flow: null },
  { id: 'rerank',       num: 5,  icon: '↕️', affects: [6],      flow: null },
  { id: 'multivec',     num: 6,  icon: '🧬', affects: [2, 5],   flow: null },
  { id: 'decompose',    num: 7,  icon: '🌿', affects: [4, 5, 7], flow: { type: 'fanout', at: 5, label: 'per sub-question' } },
  { id: 'conversation', num: 8,  icon: '💬', affects: [4, 5],   flow: null },
  { id: 'summarize',    num: 9,  icon: '📄', affects: [4, 7, 8], flow: null },
  { id: 'stepback',     num: 10, icon: '↩️', affects: [4, 5],   flow: { type: 'twopass', at: 5, label: 'broad → narrow' } },
  { id: 'routing',      num: 11, icon: '🚦', affects: [4],      flow: null },
  { id: 'agentic',      num: 12, icon: '🤖', affects: [4, 5, 8], flow: { type: 'loop', from: 8, to: 4, label: 'plan · act · observe' } },
  { id: 'selfcorrect',  num: 13, icon: '🔁', affects: [5, 9],   flow: { type: 'loop', from: 9, to: 5, label: 'gap → retrieve again' } },
  { id: 'citation',     num: 14, icon: '🔖', affects: [7, 8, 9], flow: null },
  { id: 'guarded',      num: 15, icon: '🔒', affects: [5, 8],   flow: null },
];

export const PATTERN_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export const DEFAULT_PATTERN = 'basic';
