import { defineConfig } from 'astro/config';

// Honour a PORT from the environment (useful for hosted previews), else Astro's default.
const port = Number(process.env.PORT) || 4321;

export default defineConfig({
  site: 'https://example.com',
  // Set `base` if you deploy to a subfolder, e.g. GitHub Pages:
  // base: '/MachineLearning-with-Bittu',
  server: { port },

  // Two apps share this site:
  //   /{lang}/                      → "Learn ML with Bittu"   (default)
  //   /{lang}/searching-sorting/…   → "Algo Adda" sorting/searching visualiser
  // Add the next section (e.g. /{lang}/rag/…) as its own page tree under src/pages/[lang]/.
  i18n: {
    locales: ['en', 'hi'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
  },

  // Bare, unprefixed entry points for each non-default section.
  redirects: {
    '/searching-sorting': '/en/searching-sorting/',
    '/rag': '/en/rag/',
    '/transformer': '/en/transformer/',
  },
});
