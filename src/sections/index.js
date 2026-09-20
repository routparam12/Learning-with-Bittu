/* The site's sections, in nav order. Adding a section is one entry here plus a
   page tree under src/pages/[lang]/<slug>/ (and a redirects line in astro.config
   for the bare, unprefixed path).

   - id      folder name under src/sections/ and the [section] route param
   - slug    URL segment after /{lang}/ — '' means this section owns the locale root
   - accent  the section's colour, exposed to CSS as --section-accent
*/
export const SECTIONS = [
  { id: 'ml',  slug: '',                 label: 'ML with Bittu',       icon: '🧠', accent: '#6ee787' },
  { id: 'dsa', slug: 'searching-sorting', label: 'Searching & Sorting', icon: '🔀', accent: '#9d7bff' },
  { id: 'rag', slug: 'rag',               label: 'RAG, stage by stage', icon: '🔎', accent: '#63c7cd' },
  { id: 'transformer', slug: 'transformer', label: 'Transformer',       icon: '🧠', accent: '#ff9e64' },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** Locale-prefixed href into a section: sectionHref('dsa','en','sorting/bubble'). */
export function sectionHref(id, lang, path = '') {
  const { slug } = SECTION_BY_ID[id];
  const clean = String(path).replace(/^\/+|\/+$/g, '');
  const parts = [lang, slug, clean].filter(Boolean);
  return '/' + parts.join('/') + '/';
}
