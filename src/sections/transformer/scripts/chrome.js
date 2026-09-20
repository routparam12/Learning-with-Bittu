/* chrome.js — wires this section's top bar (theme, sound, music).
   The language switcher is a plain link, so it needs no JS.

   NOTE: this duplicates src/sections/dsa/scripts/chrome.js almost exactly. The
   README already flags unifying section chrome as pending work; folding both
   onto one shared bar is the right fix once a third section wants one. */

import * as sound from '../../../shared/scripts/audio.js';

const THEME_KEY = 'bittu-theme';
const LANG_KEY = 'bittu-lang';

const getTheme = () =>
  document.documentElement.dataset.theme ||
  (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

function setTheme(next) {
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
}

export function initChrome() {
  const bar = document.querySelector('[data-chrome]');
  if (!bar) return;
  const labels = JSON.parse(bar.dataset.labels || '{}');

  try { localStorage.setItem(LANG_KEY, document.documentElement.lang.startsWith('hi') ? 'hi' : 'en'); } catch { /* ignore */ }

  const themeBtn = bar.querySelector('[data-theme-toggle]');
  const sfxBtn = bar.querySelector('[data-sfx-toggle]');
  const musicBtn = bar.querySelector('[data-music-toggle]');

  const paintTheme = () => {
    const dark = getTheme() === 'dark';
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.title = dark ? labels.themeToLight : labels.themeToDark;
    themeBtn.setAttribute('aria-label', themeBtn.title);
  };
  const paintSfx = () => {
    sfxBtn.textContent = sound.state.sfx ? '🔊' : '🔇';
    sfxBtn.setAttribute('aria-pressed', String(sound.state.sfx));
    sfxBtn.setAttribute('aria-label', sound.state.sfx ? labels.sfxOn : labels.sfxOff);
  };
  const paintMusic = () => {
    musicBtn.textContent = sound.state.music ? '🎵' : '🎬';
    musicBtn.setAttribute('aria-pressed', String(sound.state.music));
    musicBtn.setAttribute('aria-label', sound.state.music ? labels.musicOn : labels.musicOff);
  };

  themeBtn.addEventListener('click', () => { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); paintTheme(); sound.play('click'); });
  sfxBtn.addEventListener('click', () => { sound.toggleSfx(); paintSfx(); });
  musicBtn.addEventListener('click', () => { sound.toggleMusic(); paintMusic(); });

  paintTheme(); paintSfx(); paintMusic();

  // a remembered music:on can only start after the first gesture
  const kick = () => { sound.resumeIfEnabled(); };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
}
