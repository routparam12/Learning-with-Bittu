/* The demo corpus. Small, fixed, shipped as static data — no embedding calls,
   no network. Every game reads from here. */

/* ---- The Cut (stage 2) — exact content contract. Never shown raw, only chunked. ---- */
export const HANDBOOK_PASSAGE =
  'Employees who have completed twelve months of continuous service are eligible ' +
  'for parental leave. The entitlement is 26 weeks at full pay, followed by a ' +
  'further 12 weeks at half pay. Leave must be requested at least eight weeks ' +
  'before the intended start date. Unused parental leave does not carry over ' +
  'into the following year.';

export const CUT = {
  question: 'How much parental leave do I get?',
  FULL: '26 weeks at full pay',
  HALF: '12 weeks at half pay',
  ELIG: 'twelve months of continuous service',
  /* the crude stand-in "retriever": count these five terms, pick the top chunk */
  TERMS: ['parental', 'leave', 'entitlement', 'weeks', 'pay'],
  defaults: { size: 140, overlap: 0, overlapPct: 0.25 },
  range: { min: 70, max: 330, step: 5 },
};

/* ---- Two Badges (stage 6) — one shared policy, two users with different records ---- */
export const POLICY_CHUNK =
  'Parental leave policy: 26 weeks at full pay followed by 12 weeks at half pay, ' +
  'after twelve months of continuous service. Requests are made through the HR portal.';

export const USERS = {
  priya:  { name: 'Priya',  role: 'HR',          balance: '18 days annual leave remaining', owns: 'hr' },
  rahul:  { name: 'Rahul',  role: 'Engineering', balance: '6 days annual leave remaining',  owns: 'eng' },
};

/* a retrieval trace: 5 chunks come back; one belongs to someone else */
export const RETRIEVAL_TRACE = [
  { text: POLICY_CHUNK, owner: 'public', kind: 'policy' },
  { text: "Rahul's leave balance: 6 days annual leave remaining.", owner: 'eng', kind: 'record' },
  { text: 'Parental leave requests are reviewed within five working days.', owner: 'public', kind: 'policy' },
  { text: "Priya's leave balance: 18 days annual leave remaining.", owner: 'hr', kind: 'record' },
  { text: 'Half-pay weeks accrue pension at the full-pay rate.', owner: 'public', kind: 'policy' },
];

/* ---- Two Searches (stage 6, hybrid) ---- */
export const HYBRID = {
  chips: [
    { value: 'concept', label: 'how does chunk overlap help?' },
    { value: 'code',    label: 'PXR-4471' },
    { value: 'phrase',  label: 'parental leave half pay' },
  ],
  results: {
    concept: {
      dense:   ['Overlap repeats a slice of text across chunk boundaries so a fact split by a cut still appears whole in one chunk.', 'Larger chunks keep more context together but dilute the match signal.', 'Sentence-aware splitting avoids mid-sentence cuts.'],
      keyword: ['overlap networking configuration guide', 'help desk overlap ticket #3391', 'window overlap in signal processing'],
      merged: null,
    },
    code: {
      dense:   ['Errors are logged with a severity and a component tag.', 'The incident runbook covers escalation paths.', 'Retry with backoff on transient failures.'],
      keyword: ['PXR-4471: connection pool exhausted — raise max_connections or add a read replica.', 'PXR-4470: slow query on unindexed column.', 'PXR-4472: replica lag exceeded threshold.'],
      merged: null,
    },
    phrase: {
      dense:   ['The entitlement is 26 weeks at full pay, then 12 weeks at half pay.', 'Half-pay weeks still accrue pension at the full rate.'],
      keyword: ['Parental leave: 12 weeks at half pay follow the full-pay period.', 'Half pay is calculated on base salary only.'],
      merged: ['The entitlement is 26 weeks at full pay, then 12 weeks at half pay.', 'Parental leave: 12 weeks at half pay follow the full-pay period.'],
    },
  },
};

/* ---- The Dial (stage 7) — precomputed answer per k, with and without rerank ---- */
export const KDIAL = {
  fact: '26 weeks at full pay followed by 12 weeks at half pay',
  /* k → { answer, ok } for the no-rerank path */
  raw: {
    1:  { answer: 'Parental leave is available after twelve months of service.', ok: false, why: 'the single chunk that matched best had the eligibility line, not the number' },
    3:  { answer: 'The entitlement is 26 weeks at full pay.', ok: false, why: 'the full-pay chunk is in, the half-pay chunk is still just outside the top 3' },
    5:  { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true,  why: 'both halves of the fact are now in the retrieved set' },
    10: { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true,  why: 'still correct, but the prompt is now carrying five irrelevant chunks' },
    15: { answer: 'Parental leave is 26 weeks, and half-pay weeks accrue pension at the full rate.', ok: false, why: 'the right chunk is buried mid-list; the model latched onto an adjacent pension chunk' },
    20: { answer: 'Parental leave accrues pension at the full-pay rate throughout.', ok: false, why: 'signal fully drowned — the answer is about pension now, not the entitlement' },
  },
  /* reranked path: a cross-encoder pulls the right chunk to the top, so high k stays correct */
  reranked: {
    1:  { answer: 'The entitlement is 26 weeks at full pay.', ok: false, why: 'k=1 still cannot fit both halves of the fact, rerank or not' },
    3:  { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true },
    5:  { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true },
    10: { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true },
    15: { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true, why: 'the reranker moved the entitlement chunk to position 1, so burial no longer matters' },
    20: { answer: '26 weeks at full pay followed by 12 weeks at half pay.', ok: true },
  },
  range: { min: 1, max: 20, step: 1, default: 5 },
  tokensPerChunk: 180,
};

/* ---- Check the Claim (stage 10) ---- */
export const GROUNDEDNESS = [
  {
    claim: 'The parental leave entitlement is 26 weeks at full pay.',
    supported: true,
    source: 'The entitlement is 26 weeks at full pay, followed by a further 12 weeks at half pay.',
  },
  {
    claim: 'Unused parental leave can be carried into the next year.',
    supported: false,
    source: null,
  },
];

/* ---- Drop the Pin (stage 3) — ~40 chunks placed on a 2D map, precomputed offline ----
   coords are in a 0..100 box; clusters: policy (top-left), errors (bottom-right),
   onboarding (top-right), finance (bottom-left). */
export const EMBED_MAP = {
  points: [
    // policy cluster
    { x: 20, y: 22, t: 'Parental leave: 26 weeks full pay then 12 at half pay.', c: 'policy' },
    { x: 26, y: 18, t: 'Annual leave accrues at 2.5 days per month.', c: 'policy' },
    { x: 18, y: 30, t: 'Sick leave requires a certificate after three days.', c: 'policy' },
    { x: 30, y: 26, t: 'Leave requests go through the HR portal.', c: 'policy' },
    { x: 23, y: 12, t: 'Public holidays are listed in the staff handbook.', c: 'policy' },
    { x: 15, y: 20, t: 'Carer’s leave is separate from annual leave.', c: 'policy' },
    { x: 33, y: 20, t: 'Notice period for leave is eight weeks.', c: 'policy' },
    { x: 21, y: 34, t: 'Unused parental leave does not carry over.', c: 'policy' },
    // onboarding cluster
    { x: 74, y: 20, t: 'New starters complete IT setup on day one.', c: 'onboard' },
    { x: 80, y: 26, t: 'The buddy programme pairs each hire with a mentor.', c: 'onboard' },
    { x: 70, y: 28, t: 'Probation reviews happen at three and six months.', c: 'onboard' },
    { x: 78, y: 16, t: 'Laptops are issued by the facilities desk.', c: 'onboard' },
    { x: 84, y: 22, t: 'Payroll enrolment must be done in the first week.', c: 'onboard' },
    { x: 72, y: 14, t: 'Building access cards are collected from reception.', c: 'onboard' },
    // errors cluster
    { x: 76, y: 74, t: 'PXR-4471: connection pool exhausted.', c: 'error' },
    { x: 82, y: 80, t: 'PXR-4470: slow query on an unindexed column.', c: 'error' },
    { x: 70, y: 78, t: 'PXR-4472: replica lag exceeded threshold.', c: 'error' },
    { x: 84, y: 70, t: 'Retry transient failures with exponential backoff.', c: 'error' },
    { x: 72, y: 84, t: 'The incident runbook lists escalation paths.', c: 'error' },
    { x: 79, y: 66, t: 'Errors are tagged with severity and component.', c: 'error' },
    { x: 66, y: 72, t: 'Rate-limit responses return HTTP 429.', c: 'error' },
    // finance cluster
    { x: 22, y: 74, t: 'Invoices are issued net-30.', c: 'finance' },
    { x: 28, y: 80, t: 'Expense claims over £50 need a receipt.', c: 'finance' },
    { x: 18, y: 78, t: 'The finance close runs on the last working day.', c: 'finance' },
    { x: 30, y: 70, t: 'Purchase orders require two approvers.', c: 'finance' },
    { x: 24, y: 66, t: 'Mileage is reimbursed at the standard rate.', c: 'finance' },
    { x: 16, y: 70, t: 'Corporate cards are reconciled monthly.', c: 'finance' },
    { x: 32, y: 84, t: 'VAT is recorded per line item.', c: 'finance' },
  ],
  chips: [
    { value: 'good',  label: 'how long is parental leave?', pin: { x: 24, y: 24 }, note: 'The pin lands right in the policy cluster — its nearest five chunks are all about leave. This is what a clean match looks like.' },
    { value: 'error', label: 'what is error PXR-4471?',      pin: { x: 77, y: 76 }, note: 'Straight into the error cluster. Retrieval is easy when the question and the answer live in the same neighbourhood.' },
    { value: 'gap',   label: 'what is our refund policy?',   pin: { x: 50, y: 50 }, note: 'The pin lands in empty space between clusters. The five nearest chunks are a grab-bag from four different topics — none of them answer the question. That is what "no good match" looks like as geometry.' },
  ],
};

/* ---- What Broke? (stage 9) — the failure gallery ---- */
export const FAILURES = [
  {
    answer: '“Parental leave is 26 weeks at full pay.” (the handbook also grants 12 further weeks at half pay)',
    causes: ['The model made it up', 'A chunk boundary cut the fact in half', 'The wrong document was retrieved'],
    truth: 1,
    fix: 'Split on document structure before applying a size cap, and add overlap. Covered in stage 2 — Chunking.',
  },
  {
    answer: '“I don’t have information about that.” — but the fact is definitely in the corpus.',
    causes: ['top-k was too small', 'The embedding model was wrong for the language', 'The vector index was stale'],
    truth: 0,
    fix: 'Raise k, or add a reranker so the right chunk survives a larger k. Stage 7 — Reranking.',
  },
  {
    answer: '“Your remaining balance is 18 days.” — shown to a user whose balance is 6 days.',
    causes: ['The LLM hallucinated a number', 'A record for another user was in the prompt', 'The database returned the wrong row'],
    truth: 1,
    fix: 'Push the access filter into the search call, not after it. Stage 6 — Retrieval + Access Filter.',
  },
  {
    answer: '“As of 2023, the policy is…” — the policy changed in 2025.',
    causes: ['The corpus was never re-indexed after the policy update', 'The model’s training cutoff', 'The reranker down-weighted the new version'],
    truth: 0,
    fix: 'The write path matters: deletions and updates have to reach the index. Closing note on maintenance.',
  },
  {
    answer: '“According to [Handbook, p.5]…” — page 5 says nothing of the sort.',
    causes: ['The citation was generated, not retrieved', 'The PDF page numbers were off by one', 'The chunk metadata was missing'],
    truth: 0,
    fix: 'Run a groundedness check: verify each claim traces to a retrieved chunk before showing it. Stage 10.',
  },
  {
    answer: '“The three main points are…” for a question that asked for a count across 40,000 rows.',
    causes: ['top-k retrieval on a question that needed SQL', 'The summary prompt was too short', 'The model ran out of context'],
    truth: 0,
    fix: 'Route aggregation questions to SQL, not similarity search. Stage 5 — Query Understanding & Routing.',
  },
];
