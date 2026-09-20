# MachineLearning-with-Bittu

Several interactive learning sections on one Astro site, switchable from the toggle
in the top-left corner of every page.

| Section | Path | What it is |
| --- | --- | --- |
| **ML with Bittu** *(default)* | `/{lang}/` | A playable board where a pet named Bittu teaches machine learning one mini-game at a time. |
| **Searching & Sorting** | `/{lang}/searching-sorting/` | "Algo Adda" — type in your own array, press *Next*, and Hootie walks a sorting/searching algorithm one move at a time. |
| **RAG, stage by stage** | `/{lang}/rag/` | One question traced through all 11 stages of a retrieval-augmented-generation pipeline. The flow diagram *is* the navigation; each stage has a small game that fails on purpose and never blocks the reading. |
| **Transformer** | `/{lang}/transformer/` | Step through a real transformer's forward pass — tokens, embeddings, attention, feed-forward, softmax — and watch it write the next word, then loop. Two tasks: *continue text*, or *answer a question*, which wraps your question as `<q> … <a>` so that continuing it **is** answering. Two trained models behind a toggle: a tiny one whose numbers you can check by hand, and a bigger one that actually answers. |

Every section is available in **English** (`/en/…`) and **Hinglish** (`/hi/…`), in
light and dark themes. The language choice, theme, and sound on/off state are
shared across every section (`bittu-lang` / `bittu-theme` / `bittu-sfx` / `bittu-music`).

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site → dist/
npm run preview  # serve the built site
```

## Layout — section-first

Everything that belongs to a section lives under `src/sections/<id>/`. `src/shared/`
holds only what more than one section actually uses. `src/pages/` is a thin routing
layer that imports from those.

```
src/
├── sections/
│   ├── index.js                registry: id, url slug, label, icon, accent (add a section here)
│   ├── ml/
│   │   ├── Layout.astro
│   │   ├── components/         Board, Bittu, Chapter, Term, Toolbar, games/*
│   │   ├── scripts/game.js
│   │   ├── i18n/               en.js, hi.js, index.js (getDict)
│   │   └── styles/ml.css
│   ├── dsa/
│   │   ├── Layout.astro
│   │   ├── components/TopBar.astro
│   │   ├── scripts/            engine, ui, chrome, meta, pet, theme
│   │   ├── i18n/               en.ts, hi.ts, index.ts (href() prefixes the section slug)
│   │   └── styles/dsa.css
│   ├── rag/
│   │   ├── Layout.astro
│   │   ├── components/         PipelineRail, QuestionBar, Stage, ModelTiers, Page, games/*
│   │   ├── scripts/            pipeline.js (the one shared question), rail.js, rag.js
│   │   ├── i18n/               en.js, hi.js, index.js (11 stages of prose)
│   │   ├── data/               corpus.js, stages.js, current-models.json  (no network, ever)
│   │   └── styles/rag.css
│   └── transformer/
│       ├── Layout.astro
│       ├── components/TopBar.astro
│       ├── scripts/            engine.js (pure forward pass → frames), ui.js, model.js, chrome.js
│       ├── i18n/               en.ts, hi.ts, index.ts
│       ├── data/               model-simple.json, model-real.json  (trained weights, no network)
│       └── styles/transformer.css
│
├── shared/
│   ├── components/
│   │   ├── AppSwitch.astro            the section switcher (reads sections/index.js)
│   │   ├── Mascot.astro               generic corner character — speaks only after an interaction
│   │   └── game/                      GameShell · Dial · Switch · Chips · Reveal · MascotNote
│   └── scripts/
│       ├── audio.js                   one sound module for the whole site
│       └── mascot.js
│
├── pages/
│   ├── index.astro                    → redirects to /en/
│   └── [lang]/
│       ├── index.astro                → sections/ml   (ML owns the locale root)
│       ├── searching-sorting/…        → sections/dsa
│       ├── rag/                       → sections/rag
│       └── transformer/               → sections/transformer
│
└── env.d.ts
```

Routing is one strategy only: every page is under `src/pages/[lang]/…`. ML is the
default section, so it takes the bare `/{lang}/` index; every other section gets a
slug segment.

### The transformer weights

`src/sections/transformer/data/*.json` are produced by an offline trainer kept in `tools/`.
Nothing trains in the browser, and the section never hits the network.

```bash
node tools/train-transformer.mjs --gradcheck   # verify backprop, train nothing
node tools/train-transformer.mjs               # retrain both models, rewrite the JSON
node tools/check-transformer.mjs               # prove the UI's numbers are the model's
```

Training data is two files, both plain text:

- `tools/corpus-everyday.txt` — 362 short everyday sentences, one per line.
- `tools/corpus-qa.txt` — 192 `question|answer` pairs.

A Q&A pair is encoded as `<bos> <q> …question… <a> …answer… <eos>` and **scored on the answer
only**, which is what instruction tuning does: the model is never asked to predict the
question back. That single wrapper is the entire difference between the two tasks in the UI —
same weights, same loop, different tokens in front of them.

Both models share one vocabulary (276 words, context 24), so the only difference between them
is capacity:

| | simple | real |
| --- | --- | --- |
| params | 1,452 | 35,072 |
| d_model / blocks / heads | 4 / 1 / 1 | 32 / 2 / 4 |
| perplexity (unigram baseline 85.2) | 15.9 | 1.91 |
| `the weather is` → | `very` | `nice today` |
| `how are you` → | `yes i am very in the market` | `i am fine thank you` |
| `what is your name` → | `i am very in the market` | `my name is bittu` |

The small model is worth keeping precisely because it is bad: it has clearly learned the
*shape* of an answer ("yes i am very…") without the content, which is a more useful thing to
look at than a model that just works.

`check-transformer.mjs` cross-checks the browser engine against the trainer's own forward
pass on the shipped weights; they agree exactly, which is what makes the claim "every number
on screen is real" checkable rather than just asserted. It also asserts the causal mask holds,
that attention rows sum to 1, that the answer prompt is wrapped correctly, and that answers
stop on `<eos>` rather than running to the ceiling.

### Adding a section

1. Create `src/sections/<id>/` with `Layout.astro`, `components/`, `scripts/`, `i18n/`, `styles/` (and `data/` if it ships a corpus). Build its games from `src/shared/components/game/`.
2. Add one entry to `SECTIONS` in `src/sections/index.js` — it appears in the switcher automatically, with its own `--section-accent`.
3. Create `src/pages/[lang]/<slug>/…` importing from `src/sections/<id>/`.
4. Add a `redirects` line in `astro.config.mjs` for the bare `/<slug>` path.

### Still not shared

- **Game kit adoption**: `shared/components/game/` exists and the RAG section is built entirely from it. ML's and DSA's older games still hand-roll their controls — migrate them onto the kit when either is next touched.
- **Mascot adoption**: `shared/components/Mascot.astro` + `mascot.js` exist and RAG uses them. ML's `Bittu.astro` and DSA's Hootie are still bespoke, and Transformer has no character at all (just an inline narration line) — fold them onto the shared Mascot when convenient.
- **Chrome**: ML's `Toolbar.astro`, DSA's `TopBar.astro` and now Transformer's `TopBar.astro` all do the same job with near-identical markup, and `dsa/scripts/chrome.js` and `transformer/scripts/chrome.js` are near-copies. RAG has no top-bar chrome at all (just the pipeline rail). The fourth section arrived and duplicated it rather than refactoring mid-feature — this is now the most worthwhile thing to pull into `shared/`.
- **Layout shell**: four `Layout.astro` files now repeat the `<html><head>` boilerplate + theme pre-paint. Worth one `shared/` shell.
- **Content collections**: prose still lives in per-section i18n dicts. RAG's is large (11 stages × 2 langs); migrating all four to Astro content collections / MDX is the eventual move.
