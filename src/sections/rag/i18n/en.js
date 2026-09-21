/* English copy for the RAG page. Stage prose is written to the design's register
   (a concept is introduced as something that breaks at a stage, then fixed live).
   Stages 1, 2, 5 and 10 use the wording from the pipeline-rail prototype verbatim. */

export default {
  meta: {
    title: 'RAG, stage by stage',
    description: 'One question traced through all eleven stages of a retrieval-augmented generation pipeline, with a small game at each stage that fails on purpose.',
  },

  ui: {
    pipeline: 'The pipeline',
    yourQuestion: 'Your question:',
    askLabel: 'Type a question — every game on the page follows it',
    askBtn: 'Send it down the pipeline',
    askHint: 'The sample handbook only knows about leave, onboarding, a few error codes and finance. Ask about those and the games have something to work with.',
    skipToPoint: 'skip to the point ↓',
    verifiedAs: 'Verified',
    stageOf: (n, total) => `Stage ${n} · ${total}`,
    newSince: '— new since the last draft',
    patternsHeading: '15 patterns you’ll actually use',
    patternsSub: 'The 11 stages stay the same. A pattern changes the procedure at two or three of them. Pick one and the walkthrough re-frames; the rail marks the stages it touches.',
    changesStages: 'changes stages',
    applyPattern: 'apply to the walkthrough →',
    appliedLabel: 'applied',
    resetPattern: 'back to Basic RAG',
    currentPattern: 'Pattern:',
    withPattern: 'With {name}:',
    petLabel: 'Torty the turtle — poke her for a recap of this stage',
  },

  hero: {
    title: 'RAG, stage by stage',
    body: [
      'Retrieval-augmented generation is eleven steps in a line, and each step’s output is the next step’s input. This page walks one question through all eleven. The rail above is the map; it fills in as you scroll and it never locks — the reading is the point, the games are just evidence.',
      'Every widget opens already showing the interesting case, usually the broken one. Scroll past without touching anything and you have still seen it. The paragraph after each game makes the same argument in words.',
    ],
  },

  /* short label + one-line preview per stage, shown in the rail */
  rail: [
    { short: 'Ingest',            preview: 'Documents get parsed into text and metadata, before any question exists.' },
    { short: 'Chunk & clean',     preview: 'The document is cut into pieces. Where the cut lands can sever a fact in half — try it below.' },
    { short: 'Embed',             preview: 'Each chunk becomes a point in vector space. Similarity search is just distance.' },
    { short: 'Store',             preview: 'Vectors go into the index with owner, tenant, and permission fields attached from day one.' },
    { short: 'Route',             preview: 'New stage. The question is classified — lookup, aggregate, summarize, compare — before it’s embedded at all.' },
    { short: 'Retrieve + filter', preview: 'Search runs with the access filter pushed in, not applied afterward. This is the stage that decides who can see what.' },
    { short: 'Rerank',            preview: 'A cross-encoder reorders the candidates so the right chunk isn’t buried in the middle of the list.' },
    { short: 'Assemble',          preview: 'Chunks are deduplicated, ordered, and packed into a context block within the token budget.' },
    { short: 'Generate',          preview: 'The model answers using only the assembled context — instructed to refuse rather than invent.' },
    { short: 'Check',             preview: 'New stage. Every claim in the answer is checked against a retrieved chunk before it’s shown.' },
    { short: 'Personalize',       preview: 'Only the user’s own live-fetched details go here — access control already happened two stages back.' },
  ],

  stages: [
    {
      title: 'Document ingestion',
      body: [
        'A PDF, a Word file, a YouTube transcript — each one gets parsed into plain text, and its metadata (author, source, timestamp) comes along for the ride. Nothing in this stage looks at your question yet; this is what happens long before anyone asks anything.',
        'Different formats need different loaders, and the awkward ones are audio, video and scanned pages: those need a transcription or OCR pass first, and the transcript quality becomes a ceiling on everything downstream. Meeting recordings usually also need speaker labels kept, because "who said the number" is often the actual question.',
      ],
    },
    {
      title: 'Chunking & cleaning',
      body: [
        'The document gets cut into pieces small enough to embed and search individually. Where the cut lands decides more than almost anything else in the pipeline — the game below lets you drag one.',
        'There is no single right chunk size. A dense policy wants small chunks split on headings; a narrative book wants larger ones split on sections; a table wants to stay whole or be turned into sentences first. Two rules survive every content type: split on the document’s own structure <em>before</em> you apply any size cap, and prefix each chunk with its heading path before embedding — a chunk that just says "the entitlement is 26 weeks" is useless alone and precise with "Leave &rsaquo; Parental" attached.',
      ],
      game: 'TheCut',
      after: [
        'The failure the game shows — a fluent, correctly-cited answer that is missing half the fact — is the one people actually hit in production, and it leaves no trace. The answer looks finished. Overlap makes the bad boundaries survivable; structure-aware splitting makes them rare.',
      ],
    },
    {
      title: 'Embedding generation',
      body: [
        'Each chunk is turned into a vector — a list of a few hundred to a few thousand numbers that places it as a point in space, near chunks about similar things and far from unrelated ones. "Similarity search" later is nothing more exotic than measuring distance between points.',
        'The query and the documents <b>must</b> go through the same embedding model. Two models put text in two different, unaligned spaces, so distances between a query from model A and a chunk from model B are meaningless — retrieval quietly returns near-random results. If you change embedding models, you re-embed the whole corpus.',
      ],
      tiers: 'embedding',
      game: 'DropThePin',
      after: [
        'The third query in the game is the teaching one: it lands in empty space between clusters, and its five nearest chunks are all mediocre. That geometry — "no dot is actually close" — is what "we have nothing good to answer with" looks like, and it is the moment a system should consider refusing.',
      ],
    },
    {
      title: 'Vector storage',
      body: [
        'The vectors go into an index built for fast nearest-neighbour search — HNSW and IVF are the common structures — alongside each chunk’s metadata: document id, chunk id, source, page or timestamp.',
        'The one decision that is expensive to change later: put the access-control fields in the metadata schema on day one. <code>owner_id</code>, <code>tenant_id</code>, a list of groups that may read the chunk. Bolting permissions on after the index is populated means re-indexing the whole corpus, and until you do, every retrieval is a potential leak.',
      ],
      callout: 'A user’s <em>documents</em> belong here, in the vector store, with their ACL in the metadata. A user’s <em>records</em> — their plan, balance, order history — do not. Those get fetched live by id at stage 11. Embedding a record means answering from a stale copy and makes deletion painful.',
    },
    {
      isNew: true,
      title: 'Query understanding & routing',
      body: [
        'Not every question wants a similarity search. "How many invoices did we send in March" wants SQL. "Summarize the whole handbook" wants map-reduce over the whole document, not five retrieved chunks pretending to be a summary. This stage decides which pipe your question actually needs before anything gets embedded.',
        'It also does the rewriting that follow-ups need. "What about the second one?" cannot be embedded usefully on its own — the router folds in the conversation history to produce a standalone question first. A small, fast model is enough for both the classification and the rewrite; this is not a job for your most capable model.',
      ],
      game: 'PickThePipe',
      after: [
        'The classes worth routing on: lookup (retrieve), aggregate (SQL), summarize (map-reduce), compare (multi-retrieve), and chit-chat (answer directly, retrieve nothing). Sending an aggregate question down the retrieval pipe is the most common version of this mistake — it returns five rows and answers "five" with total confidence.',
      ],
    },
    {
      title: 'Retrieval + access filter',
      body: [
        'The rewritten question is embedded and the index is searched for the nearest chunks — and the permission filter is part of that search call, not a step that runs afterward. <code>WHERE owner_id = :me OR :my_group IN groups</code> goes <em>into</em> the query. Filtering the results after they come back is the leak the game below demonstrates: the disallowed chunk is dropped from the list the user sees but has already been read, cached, or passed to the model.',
        'This is also where hybrid search lives: dense (vector) retrieval for meaning, plus keyword (BM25) retrieval for exact strings like error codes and product names, merged. One caveat for a bilingual site — BM25 does not cross languages at all, so for a Hindi query against English documents your hybrid search silently degrades to dense-only.',
      ],
      game: 'TwoBadges',
      after: [
        'Flip the switch in the game and Rahul’s answer picks up Priya’s balance, rendered in a colour that reads as wrong. The retrieval trace shows exactly how: five chunks came back, one belonged to someone else, and it was removed from the displayed list but not from the prompt. Filter position is the whole difference between "private" and "leaks".',
      ],
    },
    {
      title: 'Reranking',
      body: [
        'Vector search is fast but blunt: it is good at "roughly about this" and bad at ordering the top twenty by actual relevance. A reranker — a cross-encoder that reads the question and each candidate chunk together — rescoring those twenty fixes the ordering, so the one chunk that holds the answer is at position one or two instead of buried at position eleven.',
        'The practical payoff is that reranking lets you retrieve <em>more</em> without the answer getting worse. Without it, raising k past a point makes answers <em>less</em> accurate, because the right chunk gets lost in noise and the model latches onto something adjacent.',
      ],
      game: 'TheDial',
      after: [
        'The non-monotonic curve in the game — right at k=5, wrong again at k=15 — is real and surprising, and the rerank toggle flattens the right-hand side. That is exactly what a reranker buys: permission to be generous with k.',
      ],
    },
    {
      title: 'Context assembly',
      body: [
        'The surviving chunks are packed into one block of text that goes to the model. Three things happen here: near-identical chunks are de-duplicated (retrieval often returns the same paragraph twice from overlapping chunks), the block is trimmed to fit the model’s token budget, and the chunks are ordered best-first because models weight the start and end of a long context more than the middle.',
        'Each chunk carries its citation — source, page, timestamp — so the answer can point back to where a claim came from. The result is a literal string, and the game below shows you that string.',
      ],
      game: 'BuildTheAsk',
      after: [
        'Seeing the assembled prompt as plain text is the thing that makes RAG stop being mysterious. Drop the context block and the model hallucinates fluently; drop the "say I don’t know" line and an out-of-corpus question gets a confident invention.',
      ],
    },
    {
      title: 'LLM response generation',
      body: [
        'The model writes the answer using only the assembled context, under an instruction to refuse rather than invent when the context does not contain the answer. That refusal instruction is not optional — it is the difference between "I couldn’t find that in these documents" and a fluent fabrication.',
        'Which model? A tier, not a name. Most RAG answer-generation is "read three to five chunks, answer faithfully, cite" — a job the mid tier does well and the top tier is overkill for. Model choice is a per-call decision: the router at stage 5 can run on a fast cheap model even if the final synthesis uses a stronger one.',
      ],
      tiers: 'llm',
      game: 'WhatBroke',
      after: [
        'The gallery is a set of broken answers, each with its real cause and a link back to the stage that prevents it. Tapping one and moving on has still taught one failure mode.',
      ],
    },
    {
      isNew: true,
      title: 'Groundedness check',
      body: [
        'Before an answer reaches the user, every claim in it gets checked against the chunks that were actually retrieved. A claim with no supporting chunk doesn’t get softened or hedged — the system says "not in these documents" instead of guessing.',
        'The check runs on the claim, not on the model’s confidence — because confidence is not something the interface can measure, and a fabricated citation reads exactly like a real one until you go and look.',
      ],
      game: 'CheckTheClaim',
      after: [
        'When the claim is true this check is boring and quick: the supporting chunk lights up and nothing else changes. When it is false the answer flips all the way to a refusal — no "I believe", no partial credit.',
      ],
    },
    {
      title: 'Personalization + evaluation',
      body: [
        'Only the user’s own details go in at this stage — name, role, preferences, and any live-fetched records like their current balance or plan. Access control is not here; it already happened at stage 6. Records are fetched fresh by id every request, never embedded, so the answer is never built on a stale copy and deleting a user actually deletes their data.',
        'Evaluation closes the loop: measure faithfulness (does the answer follow from the context) and answer relevance against a fixed question set, and let users rate answers so regressions are visible. And a note on the write path this page has skipped: documents do not stay correctly indexed by themselves — changing the embedding model, deleting a document, or updating a policy all have to reach the index, or stage 6 quietly serves last year’s answer.',
      ],
      callout: 'When is RAG the wrong tool? When the answer needs a computation over structured data (route to SQL), when it needs the <em>whole</em> document rather than pieces of it (summarize directly), when the knowledge fits in a system prompt (just put it there), or when the question is about something that changes second-to-second (call the live API). Retrieval is for large, slow-changing bodies of unstructured text — outside that, it is machinery you do not need.',
    },
  ],

  tiers: {
    heading: 'Pick by tier, not by name',
    why: 'Every model-name table goes stale — not from a typo, but because named models get superseded. Name what to evaluate a model on, keep one dated example per tier, and only the example needs updating.',
    embeddingHeading: 'Embedding models',
    llmHeading: 'Generation models',
    labels: {
      tier1e: 'General-purpose default',
      tier2e: 'Best retrieval accuracy',
      tier3e: 'Long-context, whole-document',
      tier4e: 'Open-weights, self-hosted',
      tier5e: 'Multilingual',
      tier1: 'Maximum capability',
      tier2: 'Balanced — the production default',
      tier3: 'Fast and cheap, high volume',
      tier4: 'Open-weights, self-hosted',
    },
    router: 'The model tier is a per-call decision, not a per-application one. A single pipeline commonly uses two or three tiers across its own steps — a fast model to route, a stronger one to synthesise.',
    axis: 'Before reaching for a pricier embedding model, ask what is actually failing. A bad chunk boundary (stage 2) or missing hybrid search (stage 6) fixes the same symptom for free. "Use a better embedding model" is the most common wasted-money move in real RAG.',
    fixedFactLabel: 'One number that has stayed still:',
  },

  games: {
    theCut: {
      title: 'The Cut · stage 2',
      question: 'How much parental leave do I get?',
      sizeLabel: 'chunk size (characters)',
      overlapLabel: 'overlap 25%',
      retrieved: 'What the retriever pulled',
      said: 'What the model then said',
      leadElig: 'After twelve months of continuous service you’re entitled to ',
      leadPlain: 'You’re entitled to ',
      verdicts: {
        complete: { badge: 'Complete', note: 'Both halves of the entitlement survived inside one chunk. That’s the only reason this answer is right.' },
        fullOnly: { badge: 'Sounds complete. Isn’t.', note: 'The cut landed between the two halves of the entitlement. Fourteen weeks vanished and the answer gives no hint that anything is missing.' },
        halfOnly: { badge: 'Confidently wrong', note: 'Only the tail of the entitlement made it into the chunk, so the model reported the follow-on period as if it were the whole thing.' },
        neither:  { badge: 'Refused — honest', note: 'The best-matching chunk was the one that says “parental leave” most often, not the one holding the number. A refusal is the right outcome here, and far safer than a guess.' },
      },
      refusal: 'I couldn’t find the entitlement in this document.',
    },
    dropThePin: {
      title: 'Drop the Pin · stage 3',
      pick: 'Pick a query',
      nearest: 'Nearest five chunks',
    },
    pickThePipe: {
      title: 'Pick the Pipe · stage 5',
      pipes: { vector: 'Vector search', sql: 'SQL', fetch: 'Direct fetch' },
      corpusNote: 'corpus: 40,000 invoices',
      questions: [
        { q: 'How many invoices did we send in March?', right: 'sql',
          vector: 'Returns 5 invoices out of 40,000. Answer: "We sent 5 invoices in March." — stated with total confidence.',
          sql: 'SELECT count(*) … WHERE month = 3 → 1,284.',
          fetch: 'No single record answers a count. Returns nothing useful.' },
        { q: 'What does the leave policy say?', right: 'vector',
          vector: 'Returns the parental-leave chunks. Answer: 26 weeks full pay then 12 at half pay.',
          sql: 'There is no table for prose policy. Query fails.',
          fetch: 'Would work only if you already knew the exact document id.' },
      ],
    },
    twoBadges: {
      title: 'Two Badges · stage 6',
      question: 'What’s the parental leave policy, and how many days do I have left?',
      filterAfter: 'filter after search',
      trace: 'Retrieval trace',
      asUser: 'Answering as',
      answerFor: 'Policy: 26 weeks at full pay then 12 weeks at half pay. {name}, you have {balance}.',
      leak: ' (and {name} has {balance})',
      okNote: 'Filter is inside the search call. The other user’s record never entered the prompt.',
      leakNote: 'The filter moved after the search. The other user’s balance was dropped from the visible list but not from the prompt — so the model answered with it.',
    },
    theDial: {
      title: 'The Dial · stage 7',
      kLabel: 'chunks sent to the model (k)',
      rerankLabel: 'reranker on',
      chunksIn: 'chunks in',
      tokens: 'tokens sent',
      correct: 'answer correct?',
      yes: 'yes', no: 'no',
    },
    buildTheAsk: {
      title: 'Build the Ask · stage 8',
      ctx: 'include retrieved context',
      user: 'include user details',
      refuse: 'include the "say I don’t know" instruction',
      answerCap: 'Resulting answer',
      answers: {
        full: 'After twelve months of service you’re entitled to 26 weeks at full pay, then 12 weeks at half pay. (Priya, HR)',
        noCtx: 'Parental leave is typically around 12 weeks in most companies. — fluent, and made up.',
        noRefuse: 'The refund window is 30 days from delivery. — confidently invented; nothing in the corpus says this.',
        noUser: '26 weeks at full pay, then 12 weeks at half pay.',
      },
    },
    whatBroke: {
      title: 'What Broke? · stage 9',
      prompt: 'Something went wrong. Which cause?',
      next: 'next →',
      fixLabel: 'Fix:',
    },
    checkTheClaim: {
      title: 'Check the Claim · stage 10',
      toggle: 'check against context',
      supportedNote: 'The claim traces to a retrieved chunk. This check is meant to be boring when the answer is honest.',
      unsupportedNote: 'No retrieved chunk supports this claim. The answer flips to a refusal — not a hedge.',
      refusal: 'I couldn’t find that in these documents.',
      source: 'Supporting chunk',
    },
  },

  patterns: {
    basic: {
      name: 'Basic RAG', tagline: 'Retrieve top-k, then generate. The foundation every other pattern builds on.',
      bullets: ['Simple, fast, effective for a surprising number of cases', 'The right starting point — add a pattern only when a metric asks for it', 'Plain cosine-similarity search over one dense index'],
      notes: {},
    },
    metadata: {
      name: 'Metadata Filtering', tagline: 'Narrow the search with structured fields before similarity is even measured.',
      bullets: ['Filter by source, date, author, tenant, tags', 'Cuts noise, raises precision', 'Push the filter into the vector DB query — never apply it after'],
      notes: {
        3: 'The fields you will filter on — source, date, owner, tags — have to be in the metadata schema now, stored next to the vector.',
        5: 'The search runs nearest-neighbour <em>within</em> the rows that already match <code>source = … AND date &gt; … AND tenant = …</code>.',
      },
    },
    rewrite: {
      name: 'Query Rewriting', tagline: 'An LLM rewrites the raw question into something a retriever can actually match.',
      bullets: ['Expands acronyms, adds synonyms, spells out context', 'Big recall lift for short or ambiguous questions', 'Runs on a fast, cheap model'],
      notes: {
        4: "Before routing, a small model rewrites the question — “PTO?” becomes “paid time off / annual leave policy” — so stages 5–6 have real terms to match.",
      },
    },
    hybrid: {
      name: 'Hybrid Search', tagline: 'Run dense and keyword search together and fuse the two rankings.',
      bullets: ['Rescues rare terms, error codes, product names, exact phrases', 'Dense recall plus keyword precision', 'Merge with Reciprocal Rank Fusion (RRF)'],
      notes: {
        2: 'Alongside the dense index you build a sparse / BM25 index over the same chunks.',
        5: 'Dense and keyword results are retrieved separately and fused (RRF) before rerank. For EN/HI: BM25 does not cross languages, so a Hindi query on English docs quietly falls back to dense-only.',
      },
    },
    rerank: {
      name: 'Reranking', tagline: 'A cross-encoder rescores the shortlist so the best chunk lands on top.',
      bullets: ['bge-reranker, Cohere Rerank, and similar', 'The biggest answer-quality lift for the least code', 'Lets you cast a wider net without the answer degrading'],
      notes: {
        6: 'This pattern <em>is</em> stage 7. Vector search returns ~20 roughly-relevant chunks; the reranker reads the question against each and reorders them so the answer-bearing chunk is not stuck at position 11.',
      },
    },
    multivec: {
      name: 'Multi-Vector Retrieval', tagline: 'Store several embeddings per document so different question shapes can match.',
      bullets: ['A summary vector, per-chunk vectors, a title vector', 'Improves coverage and recall', 'A hit on any of a document’s vectors surfaces it'],
      notes: {
        2: 'Each document is embedded more than once — a whole-doc summary vector, one per chunk, sometimes a title or hypothetical-question vector.',
        5: 'A match on any of a document’s vectors pulls it in, so a broad question hits the summary vector and a specific one hits a chunk.',
      },
    },
    decompose: {
      name: 'Query Decomposition', tagline: 'Split a many-part question into sub-questions, retrieve for each, then merge.',
      bullets: ['One retrieval per sub-question', 'Results merged and de-duplicated', 'Made for multi-faceted “and” questions'],
      notes: {
        4: '“Compare our leave policy with the statutory minimum and tell me the gap” is split into two or three standalone sub-questions here.',
        5: 'Retrieval fans out — each sub-question runs its own search in parallel.',
        7: 'The per-sub-question results are concatenated, de-duplicated, and ordered into one context block.',
      },
    },
    conversation: {
      name: 'Conversation RAG', tagline: 'Carry the chat history into retrieval so follow-ups resolve correctly.',
      bullets: ['Reformulates “what about the second one?” into a standalone query', 'Retrieves with the running conversation as context', 'Keeps multi-turn threads coherent'],
      notes: {
        4: 'The rewrite here is history-aware: it resolves pronouns and ellipsis against the last few turns before anything is embedded.',
        5: 'Recent turns are mixed into the retrieval context so the search leans toward the current thread.',
      },
    },
    summarize: {
      name: 'Retrieval-Augmented Summarization', tagline: 'For “what happened” questions, retrieve a whole set and summarise it.',
      bullets: ['Best for digest, recap, and overview tasks', 'Summarise many documents, not five chunks', 'Length and detail are set explicitly'],
      notes: {
        4: '“Summarise” / “what changed” questions leave the top-k path here — five chunks cannot represent a whole document.',
        7: 'You assemble many chunks (or full documents) in batches instead of a single top-k block.',
        8: 'Map-reduce: summarise each batch, then summarise the summaries, to a target length.',
      },
    },
    stepback: {
      name: 'Step-Back RAG', tagline: 'Ask a broader question first, then drill into specifics.',
      bullets: ['Retrieve high-level context, then the details', 'Helps with vague or under-specified questions', 'Two passes: broad, then narrow'],
      notes: {
        4: '“Why is my invoice wrong?” gets a step-back abstraction — “how does invoice generation work?” — asked first.',
        5: 'Two retrieval passes: the abstract question fetches background, then the original fetches specifics against that background.',
      },
    },
    routing: {
      name: 'Routing RAG', tagline: 'Classify the question and send it to the retriever, tool, or API that fits.',
      bullets: ['An LLM or rules pick the pipe', 'Different indexes, SQL, live APIs, or nothing', 'Saves cost by not vector-searching everything'],
      notes: {
        4: 'This pattern <em>is</em> stage 5. Aggregate → SQL, chit-chat → answer directly, lookup → vector store, fresh data → live API.',
      },
    },
    agentic: {
      name: 'Agentic RAG (iterative)', tagline: 'Let the model decide what to retrieve next, in a loop.',
      bullets: ['Plan → act → observe → repeat', 'Good for deep-research and multi-hop questions', 'Built on tool-calling and short-term memory'],
      notes: {
        4: 'There is no fixed route — the model chooses each retrieval from what it has learned so far.',
        5: 'Each loop issues a fresh retrieval whose query depends on the previous result.',
        8: 'The model reads the returned chunks, decides whether it can answer, and if not, loops back to retrieve again.',
      },
    },
    selfcorrect: {
      name: 'Self-Correcting RAG', tagline: 'When the groundedness check finds a gap, retrieve again instead of refusing.',
      bullets: ['Detects low confidence or missing support', 'Retries with a changed query or a different source', 'Improves faithfulness without a flat “I don’t know”'],
      notes: {
        9: 'If a claim has no supporting chunk, this pattern does not stop at a refusal — it rewrites the query and loops back to retrieval.',
        5: 'The retry retrieval uses a broadened or reformulated query, or a different index, then regenerates.',
      },
    },
    citation: {
      name: 'Citation-Aware RAG', tagline: 'Every sentence in the answer carries a checkable source.',
      bullets: ['Attach document ids, links, and snippets', 'Builds trust and makes review possible', 'Non-negotiable for production'],
      notes: {
        7: 'Each chunk keeps its document id, URL, and character offset all the way through assembly.',
        8: 'The model is instructed to attach a citation to every sentence, not just to the answer as a whole.',
        9: 'Stage 10 then verifies each citation points at a chunk that actually supports its sentence.',
      },
    },
    guarded: {
      name: 'Guarded RAG', tagline: 'Policies on both ends — what may be retrieved, and what may be said.',
      bullets: ['Filter sensitive documents at retrieval', 'Enforce allow/deny and PII rules on the output', 'Keeps the app compliant and safe'],
      notes: {
        5: 'Allow/deny rules filter sensitive or out-of-scope documents inside the search call — the same place the ACL check belongs (this is what Two Badges shows).',
        8: 'Output guardrails — PII redaction, banned topics, mandatory disclaimers, refusal triggers — run on the generated answer before the user sees it.',
      },
    },
  },
};
