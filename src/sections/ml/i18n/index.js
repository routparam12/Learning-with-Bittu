import en from './en.js';
import hi from './hi.js';

export const LOCALES = ['en', 'hi'];
export const DEFAULT_LOCALE = 'en';
export const LOCALE_LABELS = { en: 'EN', hi: 'HI' };

const DICTS = { en, hi };

export function getDict(locale) {
  return DICTS[locale] || DICTS[DEFAULT_LOCALE];
}
