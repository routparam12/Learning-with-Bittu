/* Structural metadata for the 11 pipeline stages. Prose (eyebrow, title, body)
   and the short rail labels live in i18n/*.js and are merged in by index.
   `game` names the component slotted into that stage's section, or null. */

export const STAGES = [
  { id: 'ingest',      isNew: false, game: null },
  { id: 'chunk',       isNew: false, game: 'TheCut' },
  { id: 'embed',       isNew: false, game: 'DropThePin' },
  { id: 'store',       isNew: false, game: null },
  { id: 'route',       isNew: true,  game: 'PickThePipe' },
  { id: 'retrieve',    isNew: false, game: 'TwoBadges' },
  { id: 'rerank',      isNew: false, game: 'TheDial' },
  { id: 'assemble',    isNew: false, game: 'BuildTheAsk' },
  { id: 'generate',    isNew: false, game: 'WhatBroke' },
  { id: 'ground',      isNew: true,  game: 'CheckTheClaim' },
  { id: 'personalize', isNew: false, game: null },
];

/* Chapter 3 in the games spec == pipeline stage 2 (chunking). "Two Searches" is
   folded into the retrieve stage alongside "Two Badges"; only one game renders
   per stage section, so Two Searches ships as an option inside TwoBadges' stage
   if you want both — kept as a component for that. */
