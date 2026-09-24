/* en.ts — English dictionary for the Transformer section.
   SOURCE OF TRUTH for the `Dict` type: hi.ts must match this shape exactly.

   Every key the engine emits is namespaced (tag. / say. / panel. / work. / err.)
   and resolved straight off this object. */

export type V = string | number;

export const en = {
  code: 'en',
  label: 'English',
  short: 'EN',
  htmlLang: 'en',

  site: {
    brand: 'Bittu the Transformer',
    title: 'Transformer, step by step — with Bittu',
    desc: 'Type a sentence — or ask a question — and watch a real transformer work out what comes next, one step at a time.',
    kicker: 'One step. One reason. Every time.',
    heroA: 'Watch a transformer',
    heroEm: 'actually think',
    heroSub: 'Type a sentence, press Next, and every step of the forward pass plays out in order — tokens, embeddings, attention, the feed-forward net, and finally the next word. Then it loops and writes the word after that. Switch the task to "answer a question" and the same loop becomes a reply — the only thing that changes is the tokens you put in front of it.',
    foot: 'Every number on this page was computed here, from your sentence, by the weights in this repo. Nothing is canned.',
  },

  ui: {
    backHome: '← all sections',
    sentence: 'Your sentence',
    question: 'Your question',
    mode: 'Task',
    modeContinue: 'Continue text',
    modeAnswer: 'Answer a question',
    modeHintContinue: 'The model carries your sentence on, word by word.',
    modeHintAnswer: 'Your question is wrapped as <q> … <a>. Continuing that wrapper is what makes it an answer — same weights, same loop.',
    answerLabel: 'answer so far',
    legTmpl: 'Prompt template',
    run: 'Run it',
    examples: '💬 Example',
    prev: '◀ Back',
    play: '▶ Auto',
    pause: '❚❚ Pause',
    next: 'Next ▶',
    skipWord: 'Next word ⏭',
    speed: 'Speed',
    model: 'Model',
    simple: 'Simple',
    real: 'Real',
    modelHint: 'Simple is small enough to read every number. Real is the same machine, bigger.',
    temperature: 'Randomness',
    greedy: 'off · always the top word',
    note: "Bittu's note",
    learningPaths: 'Transformer learning paths',
    productionKicker: 'Production inference',
    workingTitle: 'Transformer working',
    workingDesc: 'Trace the complete production journey: text enters, one token leaves, and the loop begins again.',
    showFlow: 'Trace the full production flow',
    hideFlow: 'Hide the production flow',
    readProduction: 'Read the end-to-end production guide',
    layerKicker: 'Layers + code',
    architectureTitle: 'Transformer architecture',
    architectureDesc: 'Step through the live model: hidden states, causal attention, feed-forward layers, residuals, logits, and code.',
    openLab: 'Open the interactive layer lab',
    exploreReference: 'Explore the architecture reference',
    transformerBlocks: 'TRANSFORMER BLOCKS',
    transformerBlocksHint: 'causal self-attention + feed-forward',
    transyName: 'Transy — tap me to explain this step',
    codeTitle: 'What the code is doing',
    streamTitle: 'The residual stream',
    streamHint: 'one row per token · one column per dimension',
    attentionTitle: 'Attention',
    attentionHint: 'row = the token looking · column = the token it looks at',
    distTitle: 'Next word',
    tokensTitle: 'Tokens',
    generated: 'generated',
    params: 'params',
    perplexity: 'perplexity',
    vocab: 'vocab',
    blocks: 'blocks',
    heads: 'heads',
    dims: 'width',
    head: 'head',
    kbdHint: 'Keyboard: ← → to step, Space to auto-play, W for the next word',
    unkNote: 'Words outside the vocabulary become 那些 — that really is what happens.',
    repeatNote: 'A real LLM repeats this block 32–96 times with billions of parameters. Same shape, more of it.',
    legend: 'What the colours mean',
    legNew: 'Word the model wrote',
    legFocus: 'Position being computed',
    legHigh: 'High value',
    legLow: 'Low value',
    masked: 'masked — a token cannot look ahead',
  },

  err: {
    empty: 'Type a sentence first — a few everyday words work best.',
    emptyQ: 'Ask a question first — try "how are you" or "where do you live".',
    tooLong: (n: V) => `That is too long. Keep it to about ${n} words so every step stays on screen.`,
  },

  tag: {
    tokenize: 'Tokenise',
    template: 'Prompt template',
    embed: 'Embedding',
    pos: 'Position',
    ln: (l: V) => `Block ${l} · norm`,
    qkv: (l: V) => `Block ${l} · Q K V`,
    scores: (l: V) => `Block ${l} · scores`,
    mask: (l: V) => `Block ${l} · mask`,
    softmax: (l: V) => `Block ${l} · softmax`,
    weighted: (l: V) => `Block ${l} · gather`,
    proj: (l: V) => `Block ${l} · project`,
    res: (l: V) => `Block ${l} · residual`,
    mlp: (l: V) => `Block ${l} · feed-forward`,
    lnf: 'Final norm',
    logits: 'Logits',
    probs: 'Softmax',
    sample: 'Pick',
    append: 'Append',
    done: 'Done',
  },

  panel: {
    embed: 'token embeddings',
    pos: 'embedding + position',
    ln1: 'normalised, going into attention',
    qkv: 'normalised (Q, K and V are read off this)',
    weighted: 'what each token gathered',
    proj: 'attention output, projected',
    res1: 'stream after attention',
    ln2: 'normalised, going into the feed-forward net',
    mlpup: (f: V) => `hidden layer · ${f} wide`,
    res2: 'stream after the feed-forward net',
    lnf: 'final normalised stream',
  },

  work: {
    tokenize: (ids: V) => `ids = [${ids}]`,
    template: (seq: V) => `prompt = ${seq}`,
    embed: (w: V, id: V, v: V) => `tok_emb[${id}]  ("${w}")  =  ${v}`,
    pos: (t: V, p: V, s: V) => `x[${t}]  +  pos[${t}] ${p}  =  ${s}`,
    ln: (m: V, s: V, o: V) => `mean ${m}, sd ${s}  →  ${o}`,
    qkv: (q: V, k: V, v: V) => `Q ${q}\nK ${k}\nV ${v}`,
    score: (i: V, j: V, qk: V, dh: V, sc: V) => `score[${i}][${j}] = Q·K / √${dh} = ${qk} / √${dh} = ${sc}`,
    mask: (n: V) => `${n} cells blanked — nothing may look at a word that comes later`,
    attnsoftmax: (w: V, row: V) => `attention from "${w}" = [${row}]  (sums to 1)`,
    weighted: (o: V) => `Σ attention × V  =  ${o}`,
    proj: (o: V) => `concat(heads) @ W_proj  =  ${o}`,
    res: (a: V, b: V, s: V) => `${a}\n+ ${b}\n= ${s}`,
    mlpup: (u: V, a: V) => `h @ W_fc = ${u}\ngelu(...) = ${a}`,
    lnfin: (o: V) => `final vector  =  ${o}`,
    logits: (w1: V, l1: V, w2: V, l2: V) => `top logits:  "${w1}" ${l1}   ·   "${w2}" ${l2}`,
    probs: (pct: V, w: V) => `softmax → "${w}" at ${pct}%`,
    sample: (w: V, pct: V) => `picked "${w}"  (${pct}%)`,
    eos: 'picked <eos> — the model thinks the sentence is finished',
    append: (n: V) => `sequence is now ${n} tokens — back to the top`,
    done: (text: V) => `"${text}"`,
    doneAnswer: (text: V) => `answer = "${text}"`,
  },

  say: {
    overviewBefore:
      'Before the Transformer blocks:\n' +
      'TOKENIZER\n' +
      '  ↓\n' +
      'TOKEN IDs\n' +
      '  ↓\n' +
      'TOKEN EMBEDDINGS\n' +
      '  ↓\n' +
      'POSITION INFORMATION\n' +
      '  ↓\n' +
      'INITIAL HIDDEN STATES X₀',
    overviewAfter:
      'After the Transformer blocks:\n' +
      'FINAL HIDDEN STATES\n' +
      '  ↓\n' +
      'LAST-POSITION REPRESENTATION\n' +
      '  ↓\n' +
      'LM HEAD\n' +
      '  ↓\n' +
      'LOGITS\n' +
      '  ↓\n' +
      'SOFTMAX\n' +
      '  ↓\n' +
      'PROBABILITY DISTRIBUTION\n' +
      '  ↓\n' +
      'DECODING / SAMPLING\n' +
      '  ↓\n' +
      'NEXT TOKEN\n' +
      '  ↓\n' +
      'APPEND TOKEN\n' +
      '  ↓\n' +
      'REPEAT\n' +
      '  ↓\n' +
      'EOS / STOP\n' +
      '  ↓\n' +
      'DETOKENIZATION\n' +
      '  ↓\n' +
      'FINAL TEXT',
    inferenceLoop:
      'GPT-3 looks complicated because the system contains billions of learned parameters and many Transformer layers.\n\n' +
      'But the fundamental inference loop is surprisingly clean:\n\n' +
      '1. Convert text into tokens.\n' +
      '2. Convert tokens into vectors.\n' +
      '3. Pass those vectors through Transformer blocks.\n' +
      '4. Use causal self-attention to incorporate previous context.\n' +
      '5. Produce logits over the vocabulary.\n' +
      '6. Convert logits into probabilities.\n' +
      '7. Select the next token.\n' +
      '8. Append it to the sequence.\n' +
      '9. Repeat until generation stops.',
    tokenize: (n: V, unk: V) =>
      `First the sentence is chopped into tokens and each one is looked up in the vocabulary. ${n} tokens.` +
      (Number(unk) > 0 ? ` ${unk} of them are not in my vocabulary, so they become 那些 — I genuinely do not know those words.` : ''),
    embed: (d: V) =>
      `Every token id becomes a vector of ${d} numbers. This is the token's whole meaning as far as the model is concerned — think of it as a student walking in with an opinion.`,
    pos: 'Now I add a position vector. The same word in slot 1 and slot 5 must not look identical, because word order matters.',
    template:
      'Here is the whole trick. Your question gets wrapped: <q> in front of it, <a> after it. Nothing else changes — same weights, same loop. The model was trained so that whatever follows <a> is an answer, so "carry this text on" and "answer this question" become the same job. Without this wrapper the model would just continue your question as if it were a sentence.',
    prefill: (n: V, d: V) =>
      `The whole prompt goes in at once — all ${n} tokens become vectors of ${d} numbers together. This first pass is called prefill.`,
    decode: (w: V, d: V) =>
      `Round ${w}. The sequence is one token longer now, so the whole thing runs again. This is the decode loop: one word per full pass. (A real system caches the earlier work instead of redoing it; here it is recomputed so you can watch it.)`,
    ln1: (l: V) =>
      `Block ${l} starts. First a layer norm: recentre each token's vector so no single number can shout over the others.`,
    qkv: (h: V, dh: V) =>
      `Each token now writes three things: a Query (what am I looking for?), a Key (what am I?) and a Value (what will I hand over?). Split across ${h} head${Number(h) > 1 ? 's' : ''} of ${dh} numbers each.`,
    scores: 'Every Query is dot-producted with every Key. A big number means "this token is relevant to me". This is the students turning to look at each other.',
    mask: 'Then half the grid is thrown away. A token may only look at itself and the words before it — it cannot read ahead, because at generation time the future does not exist yet.',
    attnsoftmax: 'Softmax turns each surviving row into a set of weights that add up to 1. Now every token has decided how much of its attention goes where.',
    weighted: 'Each token collects the Values of the tokens it attended to, in those proportions. This is the actual conversation: information moving sideways between tokens.',
    proj: 'The heads are stitched back together and passed through one more matrix, so what they learned separately gets mixed.',
    res1: 'The result is added back onto the stream rather than replacing it. The token keeps what it was and gains what it just heard.',
    ln2: 'Another layer norm, and now the second half of the block.',
    mlpup: (d: V, f: V) =>
      `The feed-forward net: each token on its own, no talking. Widen from ${d} to ${f}, bend it through GELU. This is the teacher walking round and coaching each student individually.`,
    mlpdown: (l: V, total: V) =>
      `Squeeze back down and add onto the stream again. Block ${l} of ${total} done.` +
      (Number(l) < Number(total) ? ' The tokens have not changed — only what they are carrying.' : ' Notice: the tokens never changed. Only their vectors did.'),
    lnf: 'All blocks done. One last layer norm before we ask the question.',
    logits: (v: V) =>
      `Now take the very last token's vector and score it against all ${v} words in the vocabulary. One number per word — how much the model likes it.`,
    probs: 'Softmax turns those scores into probabilities. This is the model\'s honest opinion about what comes next.',
    sampleGreedy: 'Randomness is off, so I simply take the highest one.',
    sampleSkip: (w: V) =>
      `The top slot is "${w}", which is a special token, not a word — 那些 means "a word nobody taught me". I leave it in the chart because it is my honest opinion, but I write out the best real word instead.`,
    sampleTemp: (t: V) => `Randomness is at ${t}, so I roll a weighted die instead of always taking the top word.`,
    eos: 'The model picked <eos> — its way of saying the sentence is finished. Stopping here.',
    eosAnswer: 'The model picked <eos>. That is how an answer ends: nobody tells it how long to be — it decides it is finished and the loop stops.',
    append: (w: V, n: V) =>
      `"${w}" gets stuck on the end of the sequence, and the whole thing runs again from the top. That is word ${n}. This loop is all "generation" ever means.`,
    doneAnswer: (n: V, l: V) =>
      `That is the answer, ${n} word${Number(n) === 1 ? '' : 's'} of it, each one a full pass through ${l} block${Number(l) > 1 ? 's' : ''}. The model never "looked up" an answer — it predicted the next word over and over until it decided to stop.`,
    done: (n: V, l: V) =>
      `That is the whole machine: ${n} word${Number(n) === 1 ? '' : 's'} written, each one a full pass through ${l} block${Number(l) > 1 ? 's' : ''}. Real models do the identical thing, just much wider and far more often.`,
  },

  transyTips: [
    'I am Transy, your tiny transformer terminal. Tap me while stepping through the model and I will explain the current operation.',
    'The tokens never change inside the network. Their hidden-state vectors do.',
    'Causal attention only allows a token to read itself and earlier tokens — never the future.',
  ],

  transyExamples: {
    default: 'x = transformer(x)',
    tokenize: 'ids = tokenizer("the weather is")',
    embed: 'x = tokenEmbedding[ids]',
    pos: 'x0 = tokenEmbedding[ids] + positionEmbedding[position]',
    qkv: 'q, k, v = x @ Wq, x @ Wk, x @ Wv',
    scores: 'scores = q @ k.T / Math.sqrt(headSize)',
    mask: 'scores[futurePositions] = -Infinity',
    attnsoftmax: 'weights = softmax(scores)',
    weighted: 'context = weights @ v',
    proj: 'attentionOut = context @ Wo',
    res1: 'x = x + attentionOut',
    mlpup: 'hidden = gelu(x @ Wfc + bfc)',
    res2: 'x = x + hidden @ Wproj + bproj',
    logits: 'logits = x[lastPosition] @ Wvocab',
    probs: 'probabilities = softmax(logits)',
    sample: 'nextId = sample(probabilities, temperature)',
    append: 'ids = [...ids, nextId]',
    eos: 'if (nextId === EOS) stop()',
    done: 'text = detokenize(ids)',
  },

  models: {
    simple: 'Small enough to read. Every number on screen fits, so you can check the arithmetic by hand.',
    real: 'The same machine with more capacity. Vectors are too wide to print, so they show as colour — hover for the value.',
  },

  examples: [
    'the weather is',
    'i would like some',
    'good morning how are',
    'the cat sat on the',
    'she goes to school by',
  ],

  questions: [
    'how are you',
    'what is your name',
    'where do you live',
    'what is the weather today',
    'how do you go to school',
    'are you hungry',
  ],

  /* the pseudocode panel; frame.line indexes into this */
  codeLines: [
    'ids = tokenize(text)',
    'x = tok_emb[ids] + pos_emb[:T]',
    'for block in blocks:',
    '    h = layer_norm(x)',
    '    q, k, v = h @ W_qkv + b_qkv',
    '    scores = q @ k.T / sqrt(d_head)',
    '    scores = causal_mask(scores)',
    '    attn = softmax(scores)',
    '    o = attn @ v',
    '    o = concat(heads) @ W_proj',
    '    x = x + o',
    '    h = layer_norm(x)',
    '    u = gelu(h @ W_fc + b_fc)',
    '    x = x + u @ W_out + b_out',
    'x = layer_norm(x)',
    'logits = x[-1] @ tok_emb.T',
    'probs = softmax(logits)',
    'next_id = pick(probs)',
    'ids.append(next_id)   # and repeat',
  ],

  tips: [
    'The tokens never change. Only the numbers they carry do — that is the whole trick.',
    'Attention is the only place tokens talk to each other. Everywhere else they are alone.',
    'The mask is why a model writes left to right: it is not allowed to read the future.',
    'The residual stream is a running total, not a replacement. Every block adds to it.',
    'Softmax is just "turn scores into shares that add up to 1".',
    'A bigger model is not a different machine. It is this one, wider and repeated more.',
  ],
};

export type Dict = typeof en;
