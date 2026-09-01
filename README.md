# MachineLearning-with-Bittu

Several interactive learning sections on one Astro site, switchable from the toggle
in the top-left corner of every page.

| Section | Path | What it is |
| --- | --- | --- |
| **ML with Bittu** *(default)* | `/{lang}/` | A playable board where a pet named Bittu teaches machine learning one mini-game at a time. |
| **Searching & Sorting** | `/{lang}/searching-sorting/` | "Algo Adda" — type in your own array, press *Next*, and Hootie walks a sorting/searching algorithm one move at a time. |
| **RAG, stage by stage** | `/{lang}/rag/` | One question traced through all 11 stages of a retrieval-augmented-generation pipeline. The flow diagram *is* the navigation; each stage has a small game that fails on purpose and never blocks the reading. |

Both sections are available in **English** (`/en/…`) and **Hinglish** (`/hi/…`), in
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
│   └── rag/
│       ├── Layout.astro
│       ├── components/         PipelineRail, QuestionBar, Stage, ModelTiers, Page, games/*
│       ├── scripts/            pipeline.js (the one shared question), rail.js, rag.js
│       ├── i18n/               en.js, hi.js, index.js (11 stages of prose)
│       ├── data/               corpus.js, stages.js, current-models.json  (no network, ever)
│       └── styles/rag.css
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
│       └── searching-sorting/…        → sections/dsa
│
└── env.d.ts
```

Routing is one strategy only: every page is under `src/pages/[lang]/…`. ML is the
default section, so it takes the bare `/{lang}/` index; every other section gets a
slug segment.

### Adding a section

1. Create `src/sections/<id>/` with `Layout.astro`, `components/`, `scripts/`, `i18n/`, `styles/` (and `data/` if it ships a corpus). Build its games from `src/shared/components/game/`.
2. Add one entry to `SECTIONS` in `src/sections/index.js` — it appears in the switcher automatically, with its own `--section-accent`.
3. Create `src/pages/[lang]/<slug>/…` importing from `src/sections/<id>/`.
4. Add a `redirects` line in `astro.config.mjs` for the bare `/<slug>` path.

### Still not shared

- **Game kit adoption**: `shared/components/game/` exists and the RAG section is built entirely from it. ML's and DSA's older games still hand-roll their controls — migrate them onto the kit when either is next touched.
- **Mascot adoption**: `shared/components/Mascot.astro` + `mascot.js` exist and RAG uses them. ML's `Bittu.astro` and DSA's Hootie are still bespoke — fold them onto the shared Mascot when convenient.
- **Chrome**: ML's `Toolbar.astro` and DSA's `TopBar.astro` still do the same job with different markup. RAG has no top-bar chrome at all (just the pipeline rail). Unify if a fourth section wants one.
- **Layout shell**: three `Layout.astro` files now repeat the `<html><head>` boilerplate + theme pre-paint. Worth one `shared/` shell.
- **Content collections**: prose still lives in per-section i18n JS dicts. RAG's is large (11 stages × 2 langs); migrating all three to Astro content collections / MDX is the eventual move.
