import { defineConfig } from 'astro/config';

// Honour a PORT from the environment (useful for hosted previews), else Astro's default.
const port = Number(process.env.PORT) || 4321;

export default defineConfig({
  site: 'https://learning-with-bittu.routparamjeet.workers.dev',
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
    // Keep the localized routes, but let src/pages/index.astro render the
    // production landing page directly instead of redirecting visitors to /en/.
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },

  // Bare, unprefixed entry points for each non-default section.
  redirects: {
    '/searching-sorting': '/en/searching-sorting/',
    '/rag': '/en/rag/',
    '/transformer': '/en/transformer/',
  },
});
