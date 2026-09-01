/* index.ts — locale registry + lookup helpers, shared by Astro pages and the
   client-side visualiser. Keep this the only place that knows locale codes. */

import { en, type Dict, type V } from './en';
import { hi } from './hi';

export type { Dict, V };
export type Lang = 'en' | 'hi';

export const DEFAULT_LANG: Lang = 'en';
export const LANGS: Lang[] = ['en', 'hi'];

export const DICTS: Record<Lang, Dict> = { en, hi };

export const isLang = (x: unknown): x is Lang => typeof x === 'string' && (LANGS as string[]).includes(x);

/** Dictionary for a locale, falling back to the default. */
export const dict = (lang: string | undefined): Dict => DICTS[(isLang(lang) ? lang : DEFAULT_LANG)];

/** Pull the locale out of a URL like /hi/sorting/bubble → 'hi'. */
export function langFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return isLang(seg) ? seg : DEFAULT_LANG;
}

/* The DSA app is mounted under this segment of the merged site. Every in-app
   link goes through href(), so this is the only place that needs to know. */
export const BASE = 'searching-sorting';

/** Build a locale-prefixed path: href('hi', 'sorting/bubble') → '/hi/searching-sorting/sorting/bubble'. */
export function href(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${lang}/${BASE}/${clean}` : `/${lang}/${BASE}/`;
}

/** Same page, other locale — used by the language switcher. */
export function swapLang(url: URL, to: Lang): string {
  const parts = url.pathname.split('/').filter(Boolean);
  if (isLang(parts[0])) parts[0] = to;
  else parts.unshift(to);
  return '/' + parts.join('/') + (parts.length === 1 ? '/' : '');
}

/** Every locale for getStaticPaths(). */
export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));
