/* meta.js — language-neutral facts about each algorithm.
   All prose (name, tagline, idea, when, pseudocode) lives in src/i18n/*.ts
   and is looked up by slug. Complexity strings are the same in every locale. */

export const META = {
  bubble: {
    slug: 'bubble', kind: 'sorting', emoji: '🫧',
    best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Stable'
  },
  selection: {
    slug: 'selection', kind: 'sorting', emoji: '🎯',
    best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Unstable'
  },
  insertion: {
    slug: 'insertion', kind: 'sorting', emoji: '🃏',
    best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Stable'
  },
  merge: {
    slug: 'merge', kind: 'sorting', emoji: '🪓',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Stable'
  },
  quick: {
    slug: 'quick', kind: 'sorting', emoji: '⚡',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: 'Unstable'
  },
  heap: {
    slug: 'heap', kind: 'sorting', emoji: '🏔️',
    best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: 'Unstable'
  },
  linear: {
    slug: 'linear', kind: 'searching', emoji: '🔦',
    best: 'O(1)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)', stable: '—'
  },
  binary: {
    slug: 'binary', kind: 'searching', emoji: '✂️',
    best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(1)', stable: '—'
  }
};

export const SORT_SLUGS = ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heap'];
export const SEARCH_SLUGS = ['linear', 'binary'];

export const SORTS = SORT_SLUGS.map(s => META[s]);
export const SEARCHES = SEARCH_SLUGS.map(s => META[s]);
