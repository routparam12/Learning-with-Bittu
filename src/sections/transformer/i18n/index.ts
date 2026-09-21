/* index.ts — locale registry for the Transformer section, same contract as the
   DSA section's i18n/index.ts. Keep this the only place that knows locale codes. */

import { en, type Dict, type V } from './en';
import { hi } from './hi';

export type { Dict, V };
export type Lang = 'en' | 'hi';

export const DEFAULT_LANG: Lang = 'en';
export const LANGS: Lang[] = ['en', 'hi'];
export const DICTS: Record<Lang, Dict> = { en, hi };

export const isLang = (x: unknown): x is Lang =>
  typeof x === 'string' && (LANGS as string[]).includes(x);

export const dict = (lang: string | undefined): Dict => DICTS[isLang(lang) ? lang : DEFAULT_LANG];

/** This section's segment under /{lang}/. */
export const BASE = 'transformer';

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

export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));
