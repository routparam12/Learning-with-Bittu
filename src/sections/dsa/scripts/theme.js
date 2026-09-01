/* theme.js — light/dark preference. The *initial* paint is handled by a tiny
   inline script in BaseLayout.astro (so there is no flash of the wrong theme);
   this module only handles toggling afterwards. */

const KEY = 'bittu-theme';

export const getTheme = () =>
  document.documentElement.dataset.theme ||
  (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

export function setTheme(next) {
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  return next;
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

/* Remember the last language the user chose, so "/" can send them back there. */
const LKEY = 'bittu-lang';
export const rememberLang = (l) => { try { localStorage.setItem(LKEY, l); } catch { /* ignore */ } };
