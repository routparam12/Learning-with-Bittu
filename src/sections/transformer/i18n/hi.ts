/* hi.ts — Hinglish dictionary. Shape must match en.ts exactly (TypeScript checks).

   The classroom analogy here is the one from the note this section is built on:
   tokens are students in a row, attention is the teacher making them talk to each
   other, the feed-forward net is the teacher coaching each one alone, and the
   punchline is that the students never change — only what is in their heads does. */

import type { Dict, V } from './en';

export const hi: Dict = {
  code: 'hi',
  label: 'Hinglish',
  short: 'HI',
  htmlLang: 'hi-Latn',

  site: {
    brand: 'Bittu the Transformer',
    title: 'Transformer, step dar step — Bittu ke saath',
    desc: 'Ek sentence likho — ya sawaal poochho — aur dekho ek asli transformer aage kya aayega yeh kaise nikaalta hai, ek-ek step karke.',
    kicker: 'Ek step. Ek wajah. Har baar.',
    heroA: 'Dekho transformer',
    heroEm: 'sach mein sochta hua',
    heroSub: 'Apna sentence likho, Next dabao, aur forward pass ka har step kramsh chalega — tokens, embeddings, attention, feed-forward net, aur aakhir mein agla shabd. Phir loop chalta hai aur uske baad wala shabd banta hai. Kaam badal kar “sawaal ka jawaab” karo aur wahi loop jawaab ban jaata hai — badalta sirf itna hai ki aage kaun se tokens rakhe gaye.',
    foot: 'Is page ka har number yahin, aapke sentence se, is repo ke weights ne nikaala hai. Kuch bhi pehle se likha hua nahi hai.',
  },

  ui: {
    backHome: '← saare sections',
    sentence: 'Aapka sentence',
    question: 'Aapka sawaal',
    mode: 'Kaam',
    modeContinue: 'Text aage badhao',
    modeAnswer: 'Sawaal ka jawaab',
    modeHintContinue: 'Model aapke sentence ko shabd-dar-shabd aage badhata hai.',
    modeHintAnswer: 'Aapka sawaal <q> … <a> mein lapeta jaata hai. Usi lapet ko aage badhana hi jawaab ban jaata hai — wahi weights, wahi loop.',
    answerLabel: 'ab tak ka jawaab',
    legTmpl: 'Prompt template',
    run: 'Chalao',
    examples: '💬 Udaharan',
    prev: '◀ Peeche',
    play: '▶ Auto',
    pause: '❚❚ Ruko',
    next: 'Aage ▶',
    skipWord: 'Agla shabd ⏭',
    speed: 'Raftaar',
    model: 'Model',
    simple: 'Saral',
    real: 'Asli',
    modelHint: 'Saral itna chhota hai ki har number padh sakte ho. Asli wahi machine hai, bas badi.',
    temperature: 'Randomness',
    greedy: 'band · hamesha sabse upar wala shabd',
    note: 'Bittu ka note',
    learningPaths: 'Transformer seekhne ke raaste',
    productionKicker: 'Production inference',
    workingTitle: 'Transformer working',
    workingDesc: 'Pura production safar dekho: text andar jaata hai, ek token baahar aata hai, aur loop phir shuru hota hai.',
    showFlow: 'Pura production flow dekho',
    hideFlow: 'Production flow chhupao',
    readProduction: 'End-to-end production guide padho',
    layerKicker: 'Layers + code',
    architectureTitle: 'Transformer architecture',
    architectureDesc: 'Live model ko step by step dekho: hidden states, causal attention, feed-forward layers, residuals, logits aur code.',
    openLab: 'Interactive layer lab kholo',
    exploreReference: 'Architecture reference dekho',
    transformerBlocks: 'TRANSFORMER BLOCKS',
    transformerBlocksHint: 'causal self-attention + feed-forward',
    transyName: 'Transy — is step ki explanation ke liye tap karo',
    codeTitle: 'Code kya kar raha hai',
    streamTitle: 'Residual stream',
    streamHint: 'har token ki ek row · har dimension ka ek column',
    attentionTitle: 'Attention',
    attentionHint: 'row = dekhne wala token · column = jise dekh raha hai',
    distTitle: 'Agla shabd',
    tokensTitle: 'Tokens',
    generated: 'banaya gaya',
    params: 'params',
    perplexity: 'perplexity',
    vocab: 'vocab',
    blocks: 'blocks',
    heads: 'heads',
    dims: 'chaudai',
    head: 'head',
    kbdHint: 'Keyboard: ← → step ke liye, Space auto-play, W agle shabd ke liye',
    unkNote: 'Vocabulary se bahar ke shabd <unk> ban jaate hain — sach mein aisa hi hota hai.',
    repeatNote: 'Asli LLM is block ko 32–96 baar dohraata hai, arbon parameters ke saath. Shakl wahi, bas zyada.',
    legend: 'Rangon ka matlab',
    legNew: 'Model ka likha shabd',
    legFocus: 'Jis jagah ka hisaab ho raha hai',
    legHigh: 'Badi value',
    legLow: 'Chhoti value',
    masked: 'masked — token aage nahi dekh sakta',
  },

  err: {
    empty: 'Pehle ek sentence likho — roz-marra ke thode shabd sabse achhe chalte hain.',
    emptyQ: 'Pehle ek sawaal poochho — "how are you" ya "where do you live" try karo.',
    tooLong: (n: V) => `Yeh bahut lamba hai. Lagbhag ${n} shabd tak rakho taaki har step screen par aa sake.`,
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
    lnf: 'Aakhri norm',
    logits: 'Logits',
    probs: 'Softmax',
    sample: 'Chuno',
    append: 'Jodo',
    done: 'Ho gaya',
  },

  panel: {
    embed: 'token embeddings',
    pos: 'embedding + position',
    ln1: 'normalise karke attention mein ja raha hai',
    qkv: 'normalised (Q, K aur V isi se bante hain)',
    weighted: 'har token ne kya samet liya',
    proj: 'attention ka output, project kiya hua',
    res1: 'attention ke baad ka stream',
    ln2: 'normalise karke feed-forward net mein ja raha hai',
    mlpup: (f: V) => `hidden layer · ${f} chaudi`,
    res2: 'feed-forward ke baad ka stream',
    lnf: 'aakhri normalised stream',
  },

  work: {
    tokenize: (ids: V) => `ids = [${ids}]`,
    template: (seq: V) => `prompt = ${seq}`,
    embed: (w: V, id: V, v: V) => `tok_emb[${id}]  ("${w}")  =  ${v}`,
    pos: (t: V, p: V, s: V) => `x[${t}]  +  pos[${t}] ${p}  =  ${s}`,
    ln: (m: V, s: V, o: V) => `mean ${m}, sd ${s}  →  ${o}`,
    qkv: (q: V, k: V, v: V) => `Q ${q}\nK ${k}\nV ${v}`,
    score: (i: V, j: V, qk: V, dh: V, sc: V) => `score[${i}][${j}] = Q·K / √${dh} = ${qk} / √${dh} = ${sc}`,
    mask: (n: V) => `${n} khaane mita diye — koi baad wale shabd ko nahi dekh sakta`,
    attnsoftmax: (w: V, row: V) => `"${w}" ka attention = [${row}]  (jod 1 hota hai)`,
    weighted: (o: V) => `Σ attention × V  =  ${o}`,
    proj: (o: V) => `concat(heads) @ W_proj  =  ${o}`,
    res: (a: V, b: V, s: V) => `${a}\n+ ${b}\n= ${s}`,
    mlpup: (u: V, a: V) => `h @ W_fc = ${u}\ngelu(...) = ${a}`,
    lnfin: (o: V) => `aakhri vector  =  ${o}`,
    logits: (w1: V, l1: V, w2: V, l2: V) => `top logits:  "${w1}" ${l1}   ·   "${w2}" ${l2}`,
    probs: (pct: V, w: V) => `softmax → "${w}" ${pct}% par`,
    sample: (w: V, pct: V) => `chuna "${w}"  (${pct}%)`,
    eos: 'chuna <eos> — model ko lagta hai sentence khatm ho gaya',
    append: (n: V) => `sequence ab ${n} tokens ka hai — wapas upar se`,
    done: (text: V) => `"${text}"`,
    doneAnswer: (text: V) => `jawaab = "${text}"`,
  },

  say: {
    overviewBefore:
      'Transformer blocks se pehle:\n' +
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
      'Transformer blocks ke baad:\n' +
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
      'GPT-3 complicated lagta hai kyunki usmein billions of learned parameters aur bahut Transformer layers hoti hain.\n\n' +
      'Lekin fundamental inference loop bahut saaf hai:\n\n' +
      '1. Text ko tokens mein badlo.\n' +
      '2. Tokens ko vectors mein badlo.\n' +
      '3. Vectors ko Transformer blocks se guzaro.\n' +
      '4. Previous context ke liye causal self-attention istemaal karo.\n' +
      '5. Vocabulary ke logits banao.\n' +
      '6. Logits ko probabilities mein badlo.\n' +
      '7. Agla token chuno.\n' +
      '8. Use sequence mein jodo.\n' +
      '9. Generation rukne tak dohrao.',
    tokenize: (n: V, unk: V) =>
      `Pehle sentence ko tokens mein kaata jaata hai aur har ek ko vocabulary mein dhoonda jaata hai. ${n} tokens.` +
      (Number(unk) > 0 ? ` Inme se ${unk} meri vocabulary mein nahi hain, to woh <unk> ban gaye — woh shabd main sach mein nahi jaanta.` : ''),
    embed: (d: V) =>
      `Har token id ${d} numbers ka ek vector ban jaati hai. Model ke liye yahi us shabd ka poora matlab hai — samjho ek student apni raay lekar class mein aaya.`,
    pos: 'Ab main position vector jodta hoon. Slot 1 aur slot 5 ka wahi shabd ek jaisa nahi dikhna chahiye, kyunki kram maayne rakhta hai.',
    template:
      'Poora khel yahi hai. Aapke sawaal ko lapet diya jaata hai: aage <q>, peeche <a>. Aur kuch nahi badla — wahi weights, wahi loop. Model ko aise sikhaya gaya hai ki <a> ke baad jo aata hai woh jawaab hota hai, is liye "text aage badhao" aur "sawaal ka jawaab do" ek hi kaam ban jaate hain. Is lapet ke bina model aapke sawaal ko hi ek sentence maan kar aage badha deta.',
    prefill: (n: V, d: V) =>
      `Poora prompt ek saath andar jaata hai — saare ${n} tokens ek saath ${d} numbers ke vector ban jaate hain. Is pehle pass ko prefill kehte hain.`,
    decode: (w: V, d: V) =>
      `Round ${w}. Sequence ab ek token lambi hai, to poora khel dobara chalta hai. Yahi decode loop hai: ek shabd, ek poora pass. (Asli system pichhla kaam cache kar leta hai; yahan dobara ginte hain taaki aap dekh sako.)`,
    ln1: (l: V) =>
      `Block ${l} shuru. Pehle layer norm: har token ke vector ko beech mein le aao taaki koi ek number baaki sab par chilla na sake.`,
    qkv: (h: V, dh: V) =>
      `Ab har token teen cheezein likhta hai: Query (main kya dhoondh raha hoon?), Key (main hoon kya?) aur Value (main kya doonga?). ${h} head${Number(h) > 1 ? 's' : ''} mein bata hua, har ek ${dh} numbers ka.`,
    scores: 'Har Query ka har Key ke saath dot product hota hai. Bada number matlab "yeh token mere kaam ka hai". Yahi woh pal hai jab students ek doosre ki taraf dekhte hain.',
    mask: 'Phir aadha grid phenk diya jaata hai. Token sirf khud ko aur apne se pehle wale shabdon ko dekh sakta hai — aage nahi, kyunki likhte waqt aage kuch hai hi nahi.',
    attnsoftmax: 'Softmax har bachi hui row ko aise weights mein badal deta hai jinka jod 1 hota hai. Ab har token ne tay kar liya ki uska kitna dhyaan kidhar jayega.',
    weighted: 'Har token jin par dhyaan diya tha unki Values usi anupaat mein samet leta hai. Yahi asli baat-cheet hai: jaankari tokens ke beech aage-peeche behti hai.',
    proj: 'Saare heads wapas jod diye jaate hain aur ek aur matrix se guzarte hain, taaki jo unhone alag-alag seekha woh aapas mein mil jaaye.',
    res1: 'Nateeja stream par jod diya jaata hai, badla nahi jaata. Token jo tha woh rehta hai, aur jo abhi suna woh mil jaata hai.',
    ln2: 'Ek aur layer norm, aur ab block ka doosra hissa.',
    mlpup: (d: V, f: V) =>
      `Feed-forward net: har token akela, koi baat-cheet nahi. ${d} se ${f} tak chauda karo, GELU se moado. Yeh teacher ka har student ko alag se samjhaana hai.`,
    mlpdown: (l: V, total: V) =>
      `Wapas nichod kar stream par phir se jod do. Block ${l} of ${total} ho gaya.` +
      (Number(l) < Number(total) ? ' Tokens nahi badle — sirf unke andar ka saamaan badla.' : ' Dhyaan do: tokens kabhi nahi badle. Sirf unke vectors badle.'),
    lnf: 'Saare blocks ho gaye. Sawaal poochhne se pehle ek aakhri layer norm.',
    logits: (v: V) =>
      `Ab sabse aakhri token ka vector lo aur use vocabulary ke saare ${v} shabdon ke against score karo. Har shabd ka ek number — model use kitna pasand karta hai.`,
    probs: 'Softmax un scores ko probabilities bana deta hai. Yeh model ki imaandaar raay hai ki aage kya aayega.',
    sampleGreedy: 'Randomness band hai, to main sidhe sabse upar wala utha leta hoon.',
    sampleSkip: (w: V) =>
      `Sabse upar "${w}" hai, jo ek special token hai, shabd nahi — <unk> ka matlab hai "aisa shabd jo mujhe kisi ne sikhaya hi nahi". Chart mein main use rehne deta hoon kyunki wahi meri asli raay hai, par likhta sabse achha asli shabd hoon.`,
    sampleTemp: (t: V) => `Randomness ${t} par hai, to main hamesha top shabd lene ke bajaye weighted pansa phenkta hoon.`,
    eos: 'Model ne <eos> chuna — uska tareeka yeh kehne ka ki sentence poora ho gaya. Yahin ruk rahe hain.',
    eosAnswer: 'Model ne <eos> chuna. Jawaab aise hi khatm hota hai: kisi ne nahi bataya kitna lamba ho — usne khud tay kiya ki baat poori ho gayi aur loop ruk gaya.',
    append: (w: V, n: V) =>
      `"${w}" sequence ke aakhir mein chipka diya gaya, aur poora khel phir upar se chalta hai. Yeh shabd number ${n} tha. Bas yahi loop "generation" kehlata hai.`,
    doneAnswer: (n: V, l: V) =>
      `Yahi jawaab hai, ${n} shabd ka, har ek ${l} block${Number(l) > 1 ? 's' : ''} ka poora chakkar. Model ne kahin se jawaab "dhoonda" nahi — bas baar baar agla shabd predict kiya jab tak usne rukne ka faisla nahi kiya.`,
    done: (n: V, l: V) =>
      `Yahi poori machine hai: ${n} shabd likhe, har ek ${l} block${Number(l) > 1 ? 's' : ''} ka poora chakkar. Asli models bilkul yahi karte hain, bas kahin zyada chaude aur kahin zyada baar.`,
  },

  transyTips: [
    'Main Transy hoon, aapka chhota transformer terminal. Model ko step karte waqt mujhe tap karo aur main current operation samjhaunga.',
    'Network ke andar tokens nahi badalte. Unke hidden-state vectors badalte hain.',
    'Causal attention token ko sirf khud aur pehle ke tokens dekhne deta hai — future ko kabhi nahi.',
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
    simple: 'Itna chhota ki padha ja sake. Har number screen par aata hai, to hisaab haath se jaanch sakte ho.',
    real: 'Wahi machine, zyada capacity ke saath. Vectors itne chaude hain ki chhap nahi sakte, to rang mein dikhte hain — value ke liye hover karo.',
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
    'ids.append(next_id)   # aur phir se',
  ],

  tips: [
    'Tokens kabhi nahi badalte. Sirf unke andar ke numbers badalte hain — bas yahi poora khel hai.',
    'Attention hi ek jagah hai jahan tokens aapas mein baat karte hain. Baaki har jagah woh akele hain.',
    'Mask hi wajah hai ki model baayein se dayein likhta hai: use aage padhne ki ijazat nahi hai.',
    'Residual stream ek chalta hua jod hai, badla nahi jaata. Har block usme kuch aur daalta hai.',
    'Softmax ka matlab bas itna hai — "scores ko aise hisson mein badlo jinka jod 1 ho".',
    'Bada model koi alag machine nahi hai. Yahi hai, bas zyada chaudi aur zyada baar dohraayi gayi.',
  ],
};
