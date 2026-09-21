/* Hinglish copy for the RAG page. Same keys as en.js. Roman-script Hindi,
   technical terms kept in English. The sample handbook passage stays English
   (it is sample document data, not UI) so the games' character positions match. */

export default {
  meta: {
    title: 'RAG, stage dar stage',
    description: 'Ek sawaal ko retrieval-augmented generation pipeline ke gyaarah stages se guzaarte hue dekho, har stage par ek chhota game jo jaan-boojh kar fail hota hai.',
  },

  ui: {
    pipeline: 'Pipeline',
    yourQuestion: 'Aapka sawaal:',
    askLabel: 'Ek sawaal likho — page ke saare games isi ko follow karte hain',
    askBtn: 'Pipeline mein bhejo',
    askHint: 'Sample handbook sirf leave, onboarding, kuchh error codes aur finance ke baare mein jaanta hai. Inhi ke baare mein poochho to games ke paas kaam karne ko kuchh hoga.',
    skipToPoint: 'seedhe point par jao ↓',
    verifiedAs: 'Verified',
    stageOf: (n, total) => `Stage ${n} · ${total}`,
    newSince: '— pichhle draft ke baad joda gaya',
    patternsHeading: '15 patterns jo aap sach mein use karoge',
    patternsSub: 'Gyaarah stages wahi rehte hain. Ek pattern un mein se do-teen par procedure badalta hai. Ek chuno aur walkthrough re-frame ho jaata hai; rail un stages ko mark karti hai jinhe woh chhoota hai.',
    changesStages: 'badalta hai stages',
    applyPattern: 'walkthrough par lagao →',
    appliedLabel: 'laga hua',
    resetPattern: 'wapas Basic RAG par',
    currentPattern: 'Pattern:',
    withPattern: '{name} ke saath:',
    petLabel: 'Torty kachhua — is stage ka recap sunne ke liye poke karo',
  },

  hero: {
    title: 'RAG, stage dar stage',
    body: [
      'Retrieval-augmented generation ek line mein gyaarah steps hain, aur har step ka output agle step ka input hota hai. Yeh page ek sawaal ko gyaarah ke gyaarah stages se le jaata hai. Upar wali rail map hai; yeh scroll ke saath bharti hai aur kabhi lock nahi karti — padhna asli baat hai, games sirf saboot hain.',
      'Har widget pehle se hi interesting case dikha raha hota hai, aksar toota hua wala. Bina chhue scroll kar jao to bhi aapne use dekh liya. Har game ke baad wala paragraph wahi baat shabdon mein keh deta hai.',
    ],
  },

  rail: [
    { short: 'Ingest',            preview: 'Documents text aur metadata mein parse hote hain, kisi sawaal se pehle.' },
    { short: 'Chunk & clean',     preview: 'Document tukdon mein kata jaata hai. Cut kahan girti hai, yeh ek fact ko aadha kaat sakti hai — neeche try karo.' },
    { short: 'Embed',             preview: 'Har chunk vector space mein ek point ban jaata hai. Similarity search bas distance hai.' },
    { short: 'Store',             preview: 'Vectors index mein jaate hain, pehle din se owner, tenant aur permission fields ke saath.' },
    { short: 'Route',             preview: 'Naya stage. Sawaal classify hota hai — lookup, aggregate, summarize, compare — embed hone se pehle hi.' },
    { short: 'Retrieve + filter', preview: 'Search access filter ke saath chalti hai, baad mein nahi. Yahi stage tay karta hai kaun kya dekh sakta hai.' },
    { short: 'Rerank',            preview: 'Ek cross-encoder candidates ko dobara order karta hai taaki sahi chunk list ke beech mein dabe na.' },
    { short: 'Assemble',          preview: 'Chunks dedupe hote hain, order hote hain, aur token budget ke andar ek context block mein pack hote hain.' },
    { short: 'Generate',          preview: 'Model sirf assembled context se jawaab deta hai — banane ke bajaye mana karne ke instruction ke saath.' },
    { short: 'Check',             preview: 'Naya stage. Jawaab ke har claim ko dikhane se pehle ek retrieved chunk se check kiya jaata hai.' },
    { short: 'Personalize',       preview: 'Yahan sirf user ki apni live-fetch ki gayi details — access control do stage pehle ho chuka.' },
  ],

  stages: [
    {
      title: 'Document ingestion',
      body: [
        'Ek PDF, ek Word file, ek YouTube transcript — har ek plain text mein parse hota hai, aur uska metadata (author, source, timestamp) saath aata hai. Is stage mein aapke sawaal ko koi nahi dekhta; yeh sab tab hota hai jab koi kuchh poochhta bhi nahi.',
        'Alag formats ko alag loaders chahiye, aur mushkil wale hain audio, video aur scanned pages: unhe pehle transcription ya OCR pass chahiye, aur transcript ki quality aage har cheez ki ceiling ban jaati hai. Meeting recordings mein speaker labels bhi rakhne padte hain, kyunki "number kisne bola" aksar asli sawaal hota hai.',
      ],
    },
    {
      title: 'Chunking & cleaning',
      body: [
        'Document ko itne chhote tukdon mein kaat diya jaata hai ki har ek ko alag se embed aur search kiya ja sake. Cut kahan girti hai yeh pipeline ki lagbhag har cheez se zyada maayne rakhta hai — neeche wala game aapko ek khud kheenchne deta hai.',
        'Koi ek sahi chunk size nahi hota. Ek dense policy chhote chunks chahti hai headings par kate hue; ek narrative book bade wale sections par kate hue; ek table poora rehna chahti hai ya pehle sentences mein badla jaaye. Do niyam har content type par tikte hain: size cap lagane se <em>pehle</em> document ke apne structure par kaato, aur embed karne se pehle har chunk ke aage uska heading path lagao — sirf "the entitlement is 26 weeks" kehne wala chunk akela bekaar hai aur "Leave &rsaquo; Parental" ke saath sateek.',
      ],
      game: 'TheCut',
      after: [
        'Game jo failure dikhata hai — ek fluent, sahi cite kiya gaya jawaab jismein aadha fact gayab hai — wahi hai jo log production mein sach mein hit karte hain, aur woh koi nishaan nahi chhodta. Jawaab poora dikhta hai. Overlap buri boundaries ko jhelne-yogya banata hai; structure-aware splitting unhe durlabh.',
      ],
    },
    {
      title: 'Embedding generation',
      body: [
        'Har chunk ek vector mein badla jaata hai — kuchh sau se kuchh hazaar numbers ki list jo use space mein ek point ki tarah rakhti hai, milte-julte chunks ke paas aur asambandhit se door. Aage "similarity search" bas points ke beech distance naapna hai, isse zyada kuchh nahi.',
        'Query aur documents dono ko <b>ek hi</b> embedding model se guzarna hoga. Do models text ko do alag, be-align spaces mein rakhte hain, isliye model A ke query aur model B ke chunk ke beech distance bekaar hai — retrieval chupke se lagbhag random results deta hai. Embedding model badla to poora corpus dobara embed karna padta hai.',
      ],
      tiers: 'embedding',
      game: 'DropThePin',
      after: [
        'Game ka teesra query sikhane wala hai: woh clusters ke beech khaali jagah mein girta hai, aur uske paanch nazdeek chunks sab mediocre hain. Yeh geometry — "koi dot sach mein paas nahi" — wahi hai jo "hamare paas jawaab dene ko kuchh achha nahi" jaisa dikhta hai, aur yahi woh pal hai jab system ko mana karne par sochna chahiye.',
      ],
    },
    {
      title: 'Vector storage',
      body: [
        'Vectors ek aise index mein jaate hain jo tez nearest-neighbour search ke liye bana hai — HNSW aur IVF aam structures hain — har chunk ke metadata ke saath: document id, chunk id, source, page ya timestamp.',
        'Ek faisla jo baad mein badalna mehnga hai: access-control fields pehle din metadata schema mein daalo. <code>owner_id</code>, <code>tenant_id</code>, un groups ki list jo chunk padh sakte hain. Index bhar jaane ke baad permissions jodna matlab poora corpus dobara index karna, aur jab tak aap karte nahi, har retrieval ek sambhaavit leak hai.',
      ],
      callout: 'User ke <em>documents</em> yahan aate hain, vector store mein, apne ACL ke saath. User ke <em>records</em> — unka plan, balance, order history — nahi. Woh stage 11 par id se live fetch hote hain. Ek record embed karna matlab ek purani copy se jawaab dena aur deletion ko dard bhara banana.',
    },
    {
      isNew: true,
      title: 'Query understanding & routing',
      body: [
        'Har sawaal ko similarity search nahi chahiye. "March mein humne kitne invoices bheje" ko SQL chahiye. "Poori handbook summarize karo" ko poore document par map-reduce chahiye, paanch retrieved chunks ko nahi jo summary hone ka natak karein. Yeh stage tay karta hai ki aapke sawaal ko sach mein kaun sa pipe chahiye, kuchh embed hone se pehle.',
        'Yeh woh rewriting bhi karta hai jo follow-ups ko chahiye. "Aur doosre wale ka kya?" ko akele theek se embed nahi kiya ja sakta — router pehle conversation history milaakar ek standalone sawaal banata hai. Classification aur rewrite dono ke liye ek chhota, tez model kaafi hai; yeh aapke sabse capable model ka kaam nahi.',
      ],
      game: 'PickThePipe',
      after: [
        'Route karne layak classes: lookup (retrieve), aggregate (SQL), summarize (map-reduce), compare (multi-retrieve), aur chit-chat (seedha jawaab, kuchh retrieve nahi). Ek aggregate sawaal ko retrieval pipe mein bhejna is galti ka sabse aam roop hai — woh paanch rows deta hai aur poore vishwaas se "paanch" jawaab de deta hai.',
      ],
    },
    {
      title: 'Retrieval + access filter',
      body: [
        'Rewritten sawaal embed hota hai aur index mein nazdeek chunks ke liye search hoti hai — aur permission filter us search call ka hissa hai, baad mein chalne wala step nahi. <code>WHERE owner_id = :me OR :my_group IN groups</code> query ke <em>andar</em> jaata hai. Results wapas aane ke baad unhe filter karna wahi leak hai jo neeche wala game dikhata hai: disallowed chunk user ki dikhne wali list se hata diya jaata hai par woh pehle hi padha, cache, ya model ko de diya gaya.',
        'Yahi wahan hai jahan hybrid search rehti hai: dense (vector) retrieval matlab ke liye, plus keyword (BM25) retrieval error codes aur product names jaise exact strings ke liye, merge kiya hua. Bilingual site ke liye ek baat — BM25 languages ke beech bilkul cross nahi karta, isliye English documents ke against Hindi query ke liye aapki hybrid search chupke se dense-only par gir jaati hai.',
      ],
      game: 'TwoBadges',
      after: [
        'Game mein switch palto aur Rahul ke jawaab mein Priya ka balance aa jaata hai, ek aise rang mein jo galat lagta hai. Retrieval trace theek se dikhata hai kaise: paanch chunks aaye, ek doosre ka tha, aur woh dikhne wali list se hataya gaya par prompt se nahi. Filter ki position hi "private" aur "leaks" ke beech ka poora farq hai.',
      ],
    },
    {
      title: 'Reranking',
      body: [
        'Vector search tez hai par bhondi: "mote taur par is baare mein" mein achhi, top bees ko asli relevance se order karne mein buri. Ek reranker — ek cross-encoder jo sawaal aur har candidate chunk ko saath padhta hai — un bees ko dobara score karke order theek kar deta hai, taaki jawaab wala ek chunk position gyaarah par dabe hone ke bajaye position ek ya do par ho.',
        'Vyavhaarik faayda yeh ki reranking aapko <em>zyada</em> retrieve karne deti hai bina jawaab bigde. Uske bina, ek had ke baad k badhaane se jawaab <em>kam</em> sahi ho jaate hain, kyunki sahi chunk shor mein kho jaata hai aur model kisi paas wali cheez ko pakad leta hai.',
      ],
      game: 'TheDial',
      after: [
        'Game ka non-monotonic curve — k=5 par sahi, k=15 par phir galat — asli aur chaunkane wala hai, aur rerank toggle daayen hisse ko chapta kar deta hai. Reranker yahi khareedta hai: k ke saath udaar hone ki ijaazat.',
      ],
    },
    {
      title: 'Context assembly',
      body: [
        'Bache hue chunks ek text block mein pack hote hain jo model ko jaata hai. Yahan teen cheezein hoti hain: lagbhag ek jaise chunks dedupe hote hain (overlapping chunks se retrieval aksar wahi paragraph do baar deta hai), block model ke token budget mein fit hone ke liye trim hota hai, aur chunks best-first order hote hain kyunki models lambe context ke shuru aur ant ko beech se zyada weight dete hain.',
        'Har chunk apni citation le jaata hai — source, page, timestamp — taaki jawaab wapas ishaara kar sake ki claim kahan se aaya. Nateeja ek literal string hai, aur neeche wala game aapko woh string dikhata hai.',
      ],
      game: 'BuildTheAsk',
      after: [
        'Assembled prompt ko plain text mein dekhna wahi cheez hai jo RAG ko rahasyamay hona band kar deti hai. Context block hatao aur model fluently hallucinate karta hai; "I don’t know" line hatao aur corpus se bahar ka sawaal ek confident invention paata hai.',
      ],
    },
    {
      title: 'LLM response generation',
      body: [
        'Model sirf assembled context se jawaab likhta hai, is instruction ke tahat ki jab context mein jawaab na ho to banane ke bajaye mana kare. Woh refusal instruction optional nahi hai — wahi "mujhe yeh in documents mein nahi mila" aur ek fluent fabrication ke beech ka farq hai.',
        'Kaun sa model? Ek tier, ek naam nahi. Zyadatar RAG answer-generation "teen se paanch chunks padho, imaandaari se jawaab do, cite karo" hai — ek kaam jo mid tier achha karta hai aur top tier ke liye zyada hai. Model chunaav per-call faisla hai: stage 5 ka router ek tez saste model par chal sakta hai bhale hi final synthesis ek majboot model use kare.',
      ],
      tiers: 'llm',
      game: 'WhatBroke',
      after: [
        'Gallery toote jawaabon ka ek set hai, har ek ke saath uska asli kaaran aur us stage ka link jo use rokta hai. Ek par tap karke aage badhna bhi ek failure mode sikha deta hai.',
      ],
    },
    {
      isNew: true,
      title: 'Groundedness check',
      body: [
        'Jawaab user tak pahunchne se pehle, usmein har claim ko un chunks se check kiya jaata hai jo sach mein retrieve hue the. Jis claim ke peeche koi supporting chunk nahi, use naram ya hedge nahi kiya jaata — system "in documents mein nahi" keh deta hai, andaaza lagane ke bajaye.',
        'Check claim par chalta hai, model ke vishwaas par nahi — kyunki vishwaas aisi cheez nahi jo interface naap sake, aur ek banaayi gayi citation ek asli jaisi hi padhti hai jab tak aap jaakar dekh na lo.',
      ],
      game: 'CheckTheClaim',
      after: [
        'Jab claim sach ho to yeh check boring aur tez hai: supporting chunk jal uthta hai aur baaki kuchh nahi badalta. Jab woh jhoothi ho to jawaab poori tarah refusal par palat jaata hai — koi "mujhe lagta hai" nahi, koi partial credit nahi.',
      ],
    },
    {
      title: 'Personalization + evaluation',
      body: [
        'Is stage par sirf user ki apni details andar aati hain — naam, role, preferences, aur koi live-fetch kiya record jaise unka current balance ya plan. Access control yahan nahi hai; woh stage 6 par ho chuka. Records har request par id se taaza fetch hote hain, kabhi embed nahi, isliye jawaab kabhi purani copy par nahi banta aur ek user ko delete karna sach mein unka data delete karta hai.',
        'Evaluation loop band karti hai: faithfulness naapo (kya jawaab context se nikalta hai) aur ek tay sawaal set ke against answer relevance, aur users ko jawaab rate karne do taaki regressions dikhein. Aur is page ne jo write path chhoda uspar ek baat: documents khud se sahi indexed nahi rehte — embedding model badalna, ek document delete karna, ya ek policy update karna sab ko index tak pahunchna hoga, warna stage 6 chupke se pichhle saal ka jawaab deta rahega.',
      ],
      callout: 'RAG kab galat tool hai? Jab jawaab ko structured data par computation chahiye (SQL par route karo), jab use tukdon ke bajaye <em>poora</em> document chahiye (seedha summarize karo), jab gyaan ek system prompt mein aa jaaye (bas wahin daal do), ya jab sawaal aisi cheez ke baare mein ho jo pal-pal badalti hai (live API call karo). Retrieval bade, dheere badalne wale unstructured text ke liye hai — uske bahar, yeh machinery hai jiski aapko zaroorat nahi.',
    },
  ],

  tiers: {
    heading: 'Naam se nahi, tier se chuno',
    why: 'Har model-naam wali table baasi ho jaati hai — typo se nahi, balki isliye ki naam wale models supersede ho jaate hain. Batao ki ek model ko kis par aankna hai, har tier ke liye ek dated example rakho, aur sirf example update karna padta hai.',
    embeddingHeading: 'Embedding models',
    llmHeading: 'Generation models',
    labels: {
      tier1e: 'General-purpose default',
      tier2e: 'Sabse achhi retrieval accuracy',
      tier3e: 'Long-context, poora document',
      tier4e: 'Open-weights, self-hosted',
      tier5e: 'Multilingual',
      tier1: 'Adhiktam capability',
      tier2: 'Balanced — production default',
      tier3: 'Tez aur sasta, high volume',
      tier4: 'Open-weights, self-hosted',
    },
    router: 'Model tier ek per-call faisla hai, per-application nahi. Ek hi pipeline aksar apne steps mein do-teen tiers use karti hai — route karne ko ek tez model, synthesise karne ko ek majboot.',
    axis: 'Ek mehenge embedding model ki taraf haath badhaane se pehle poochho ki asal mein kya fail ho raha hai. Ek buri chunk boundary (stage 2) ya missing hybrid search (stage 6) wahi lakshan muft mein theek kar deti hai. "Behtar embedding model use karo" asli RAG mein sabse aam paisa-barbaad karne wali chaal hai.',
    fixedFactLabel: 'Ek number jo sthir raha hai:',
  },

  games: {
    theCut: {
      title: 'The Cut · stage 2',
      question: 'How much parental leave do I get?',
      sizeLabel: 'chunk size (characters)',
      overlapLabel: 'overlap 25%',
      retrieved: 'Retriever ne kya nikaala',
      said: 'Model ne phir kya kaha',
      leadElig: 'After twelve months of continuous service you’re entitled to ',
      leadPlain: 'You’re entitled to ',
      verdicts: {
        complete: { badge: 'Complete', note: 'Entitlement ke dono hisse ek hi chunk ke andar bach gaye. Isi wajah se yeh jawaab sahi hai.' },
        fullOnly: { badge: 'Sounds complete. Isn’t.', note: 'Cut entitlement ke do hisson ke beech gir gayi. Chaudah hafte gayab ho gaye aur jawaab koi ishaara nahi deta ki kuchh chhoot raha hai.' },
        halfOnly: { badge: 'Confidently wrong', note: 'Sirf entitlement ki poonchh chunk mein aayi, isliye model ne follow-on period ko poora samajh kar bata diya.' },
        neither:  { badge: 'Refused — honest', note: 'Sabse achha match wala chunk woh tha jo "parental leave" sabse zyada baar kehta hai, number wala nahi. Yahan mana karna sahi nateeja hai, aur ek andaaze se kaafi surakshit.' },
      },
      refusal: 'I couldn’t find the entitlement in this document.',
    },
    dropThePin: {
      title: 'Drop the Pin · stage 3',
      pick: 'Ek query chuno',
      nearest: 'Nazdeek paanch chunks',
    },
    pickThePipe: {
      title: 'Pick the Pipe · stage 5',
      pipes: { vector: 'Vector search', sql: 'SQL', fetch: 'Direct fetch' },
      corpusNote: 'corpus: 40,000 invoices',
      questions: [
        { q: 'March mein humne kitne invoices bheje?', right: 'sql',
          vector: '40,000 mein se 5 invoices deta hai. Jawaab: "March mein humne 5 invoices bheje." — poore vishwaas se.',
          sql: 'SELECT count(*) … WHERE month = 3 → 1,284.',
          fetch: 'Koi ek record count ka jawaab nahi deta. Kuchh kaam ka nahi milta.' },
        { q: 'Leave policy kya kehti hai?', right: 'vector',
          vector: 'Parental-leave chunks deta hai. Jawaab: 26 weeks full pay phir 12 at half pay.',
          sql: 'Prose policy ke liye koi table nahi. Query fail.',
          fetch: 'Tabhi chalta jab aapko exact document id pehle se pata ho.' },
      ],
    },
    twoBadges: {
      title: 'Two Badges · stage 6',
      question: 'Parental leave policy kya hai, aur mere kitne din bache hain?',
      filterAfter: 'filter after search',
      trace: 'Retrieval trace',
      asUser: 'Jawaab de rahe',
      answerFor: 'Policy: 26 weeks at full pay phir 12 weeks at half pay. {name}, aapke paas {balance}.',
      leak: ' (aur {name} ke paas {balance})',
      okNote: 'Filter search call ke andar hai. Doosre user ka record kabhi prompt mein nahi aaya.',
      leakNote: 'Filter search ke baad chala gaya. Doosre user ka balance dikhne wali list se hata par prompt se nahi — isliye model ne usi se jawaab diya.',
    },
    theDial: {
      title: 'The Dial · stage 7',
      kLabel: 'model ko bheje gaye chunks (k)',
      rerankLabel: 'reranker on',
      chunksIn: 'chunks in',
      tokens: 'tokens sent',
      correct: 'jawaab sahi?',
      yes: 'haan', no: 'nahi',
    },
    buildTheAsk: {
      title: 'Build the Ask · stage 8',
      ctx: 'retrieved context shaamil karo',
      user: 'user details shaamil karo',
      refuse: '"say I don’t know" instruction shaamil karo',
      answerCap: 'Nateeje ka jawaab',
      answers: {
        full: 'After twelve months of service you’re entitled to 26 weeks at full pay, then 12 weeks at half pay. (Priya, HR)',
        noCtx: 'Parental leave zyadatar companies mein aam taur par 12 hafte hoti hai. — fluent, aur banaayi hui.',
        noRefuse: 'Refund window delivery se 30 din hai. — poore vishwaas se banaayi hui; corpus mein aisa kuchh nahi.',
        noUser: '26 weeks at full pay, then 12 weeks at half pay.',
      },
    },
    whatBroke: {
      title: 'What Broke? · stage 9',
      prompt: 'Kuchh galat hua. Kaun sa kaaran?',
      next: 'agla →',
      fixLabel: 'Fix:',
    },
    checkTheClaim: {
      title: 'Check the Claim · stage 10',
      toggle: 'check against context',
      supportedNote: 'Claim ek retrieved chunk se trace hota hai. Jab jawaab imaandaar ho to yeh check boring hona chahiye.',
      unsupportedNote: 'Koi retrieved chunk is claim ko support nahi karta. Jawaab refusal par palat jaata hai — hedge nahi.',
      refusal: 'I couldn’t find that in these documents.',
      source: 'Supporting chunk',
    },
  },

  patterns: {
    basic: {
      name: 'Basic RAG', tagline: 'Top-k retrieve karo, phir generate. Har doosra pattern isi neev par bana hai.',
      bullets: ['Simple, tez, hairaan karne wale kitne hi cases ke liye kaafi', 'Sahi shuruaat — pattern tabhi jodo jab koi metric maange', 'Ek dense index par saada cosine-similarity search'],
      notes: {},
    },
    metadata: {
      name: 'Metadata Filtering', tagline: 'Similarity naapne se pehle structured fields se search ko sankuchit karo.',
      bullets: ['Source, date, author, tenant, tags se filter', 'Shor ghatata hai, precision badhata hai', 'Filter ko vector DB query mein daalo — baad mein mat lagao'],
      notes: {
        3: 'Jin fields par aap filter karoge — source, date, owner, tags — woh ab metadata schema mein hone chahiye, vector ke saath.',
        5: 'Search un rows ke <em>andar</em> nearest-neighbour chalati hai jo pehle se <code>source = … AND date &gt; … AND tenant = …</code> se match karti hain.',
      },
    },
    rewrite: {
      name: 'Query Rewriting', tagline: 'Ek LLM kachche sawaal ko aise roop mein likhta hai jise retriever sach mein match kar sake.',
      bullets: ['Acronyms kholta hai, synonyms jodta hai, context spell karta hai', 'Chhote ya ambiguous sawaalon ke liye bada recall lift', 'Ek tez, saste model par chalta hai'],
      notes: {
        4: 'Routing se pehle ek chhota model sawaal dobara likhta hai — “PTO?” banta hai “paid time off / annual leave policy” — taaki stages 5–6 ko asli terms milein.',
      },
    },
    hybrid: {
      name: 'Hybrid Search', tagline: 'Dense aur keyword search saath chalao aur dono rankings ko fuse karo.',
      bullets: ['Rare terms, error codes, product names, exact phrases bachata hai', 'Dense recall plus keyword precision', 'Reciprocal Rank Fusion (RRF) se merge karo'],
      notes: {
        2: 'Dense index ke saath aap unhi chunks par ek sparse / BM25 index banate ho.',
        5: 'Dense aur keyword results alag retrieve hote hain aur rerank se pehle fuse (RRF) hote hain. EN/HI ke liye: BM25 languages cross nahi karta, isliye English docs par Hindi query chupke se dense-only par gir jaati hai.',
      },
    },
    rerank: {
      name: 'Reranking', tagline: 'Ek cross-encoder shortlist ko dobara score karta hai taaki sabse achha chunk upar aaye.',
      bullets: ['bge-reranker, Cohere Rerank, aur aise', 'Sabse kam code mein sabse bada answer-quality lift', 'Bina jawaab bigde ek chauda jaal daalne deta hai'],
      notes: {
        6: 'Yeh pattern hi stage 7 hai. Vector search ~20 mote taur par relevant chunks deta hai; reranker sawaal ko har ek ke against padhkar unhe dobara order karta hai taaki jawaab wala chunk position 11 par na atke.',
      },
    },
    multivec: {
      name: 'Multi-Vector Retrieval', tagline: 'Har document ke kai embeddings rakho taaki alag sawaal-aakaar match kar sakein.',
      bullets: ['Ek summary vector, per-chunk vectors, ek title vector', 'Coverage aur recall badhata hai', 'Document ke kisi bhi vector par hit use surface kar deta hai'],
      notes: {
        2: 'Har document ek se zyada baar embed hota hai — poore-doc ka summary vector, har chunk ka ek, kabhi title ya hypothetical-question vector.',
        5: 'Document ke kisi bhi vector par match use andar kheench leta hai, isliye chaude sawaal ko summary vector milta hai aur sateek ko ek chunk.',
      },
    },
    decompose: {
      name: 'Query Decomposition', tagline: 'Kai-hisson wale sawaal ko sub-questions mein baanto, har ek ke liye retrieve karo, phir merge.',
      bullets: ['Har sub-question ka apna retrieval', 'Results merge aur de-duplicate', 'Multi-faceted “aur” sawaalon ke liye'],
      notes: {
        4: '“Hamari leave policy ki statutory minimum se tulna karo aur gap batao” yahan do-teen standalone sub-questions mein bat jaata hai.',
        5: 'Retrieval fan out hota hai — har sub-question apni search parallel chalata hai.',
        7: 'Per-sub-question results jodkar, de-duplicate karke, ek context block mein order hote hain.',
      },
    },
    conversation: {
      name: 'Conversation RAG', tagline: 'Chat history ko retrieval mein le jao taaki follow-ups theek se resolve hon.',
      bullets: ['“Doosre wale ka kya?” ko standalone query mein badalta hai', 'Chalti conversation ko context ke roop mein retrieve karta hai', 'Multi-turn threads ko coherent rakhta hai'],
      notes: {
        4: 'Yahan rewrite history-aware hai: kuchh embed hone se pehle pichhle turns ke against pronouns aur ellipsis resolve karta hai.',
        5: 'Haal ke turns retrieval context mein mila diye jaate hain taaki search current thread ki taraf jhuke.',
      },
    },
    summarize: {
      name: 'Retrieval-Augmented Summarization', tagline: '“Kya hua” sawaalon ke liye poora set retrieve karke summarize karo.',
      bullets: ['Digest, recap, overview tasks ke liye behtareen', 'Paanch chunks nahi, kai documents summarize karo', 'Length aur detail explicit set hote hain'],
      notes: {
        4: '“Summarize” / “kya badla” sawaal yahan top-k path chhod dete hain — paanch chunks poore document ko nahi dikha sakte.',
        7: 'Ek single top-k block ke bajaye aap kai chunks (ya poore documents) ko batches mein assemble karte ho.',
        8: 'Map-reduce: har batch summarize karo, phir summaries ko summarize karo, ek target length tak.',
      },
    },
    stepback: {
      name: 'Step-Back RAG', tagline: 'Pehle ek chauda sawaal poochho, phir specifics mein utro.',
      bullets: ['High-level context retrieve karo, phir details', 'Vague ya under-specified sawaalon mein madad', 'Do passes: chauda, phir sankeeran'],
      notes: {
        4: '“Mera invoice galat kyun hai?” ko pehle ek step-back abstraction milta hai — “invoice generation kaise kaam karta hai?”',
        5: 'Do retrieval passes: abstract sawaal background laata hai, phir asli sawaal us background ke against specifics laata hai.',
      },
    },
    routing: {
      name: 'Routing RAG', tagline: 'Sawaal classify karo aur use us retriever, tool, ya API par bhejo jo fit ho.',
      bullets: ['Ek LLM ya rules pipe chunte hain', 'Alag indexes, SQL, live APIs, ya kuchh nahi', 'Har cheez ko vector-search na karke laagat bachata hai'],
      notes: {
        4: 'Yeh pattern hi stage 5 hai. Aggregate → SQL, chit-chat → seedha jawaab, lookup → vector store, taaza data → live API.',
      },
    },
    agentic: {
      name: 'Agentic RAG (iterative)', tagline: 'Model ko tay karne do ki aage kya retrieve karna hai, ek loop mein.',
      bullets: ['Plan → act → observe → repeat', 'Deep-research aur multi-hop sawaalon ke liye achha', 'Tool-calling aur short-term memory par bana'],
      notes: {
        4: 'Koi tay route nahi — model ab tak jo seekha uss se har retrieval chunta hai.',
        5: 'Har loop ek naya retrieval chalata hai jiski query pichhle result par nirbhar hai.',
        8: 'Model laaye chunks padhta hai, tay karta hai ki jawaab de sakta hai ya nahi, aur nahi to retrieve karne wapas loop karta hai.',
      },
    },
    selfcorrect: {
      name: 'Self-Correcting RAG', tagline: 'Jab groundedness check gap paaye, mana karne ke bajaye dobara retrieve karo.',
      bullets: ['Low confidence ya missing support pakadta hai', 'Badli query ya alag source se retry karta hai', 'Bina seedhe “mujhe nahi pata” ke faithfulness badhata hai'],
      notes: {
        9: 'Agar kisi claim ke peeche koi supporting chunk nahi, yeh pattern refusal par nahi rukta — query dobara likhkar retrieval par wapas loop karta hai.',
        5: 'Retry retrieval ek chaudi ya reformulated query, ya alag index use karta hai, phir regenerate karta hai.',
      },
    },
    citation: {
      name: 'Citation-Aware RAG', tagline: 'Jawaab ke har vaakya ke saath ek check-yogya source.',
      bullets: ['Document ids, links, aur snippets jodta hai', 'Vishwaas banata hai aur review sambhav karta hai', 'Production ke liye non-negotiable'],
      notes: {
        7: 'Har chunk apna document id, URL, aur character offset assembly ke aakhir tak rakhta hai.',
        8: 'Model ko har vaakya ke saath citation jodne ka instruction milta hai, sirf poore jawaab ke saath nahi.',
        9: 'Stage 10 phir verify karta hai ki har citation ek aise chunk par ishaara karta hai jo uske vaakya ko sach mein support karta hai.',
      },
    },
    guarded: {
      name: 'Guarded RAG', tagline: 'Dono siron par policies — kya retrieve ho sakta hai, aur kya kaha ja sakta hai.',
      bullets: ['Retrieval par sensitive documents filter karo', 'Output par allow/deny aur PII rules laagu karo', 'App ko compliant aur surakshit rakhta hai'],
      notes: {
        5: 'Allow/deny rules sensitive ya out-of-scope documents ko search call ke andar filter karte hain — wahi jagah jahan ACL check hota hai (yahi Two Badges dikhata hai).',
        8: 'Output guardrails — PII redaction, banned topics, zaroori disclaimers, refusal triggers — generated jawaab par user ke dekhne se pehle chalte hain.',
      },
    },
  },
};
