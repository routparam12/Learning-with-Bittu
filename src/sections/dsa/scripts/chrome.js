/* chrome.js — wires the top bar (theme, sound, music). Runs on every page.
   The language switcher is a plain link, so it needs no JS. */

import { getTheme, toggleTheme, rememberLang } from './theme.js';
import * as sound from '../../../shared/scripts/audio.js';

export function initChrome() {
  const bar = document.querySelector('[data-chrome]');
  if (!bar) return;
  const labels = JSON.parse(bar.dataset.labels || '{}');

  rememberLang(document.documentElement.lang.startsWith('hi') ? 'hi' : 'en');

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
    sfxBtn.title = sound.state.sfx ? labels.sfxOn : labels.sfxOff;
    sfxBtn.setAttribute('aria-pressed', String(sound.state.sfx));
    sfxBtn.setAttribute('aria-label', sfxBtn.title);
  };
  const paintMusic = () => {
    musicBtn.textContent = sound.state.music ? '🎵' : '🎬';
    musicBtn.title = sound.state.music ? labels.musicOn : labels.musicOff;
    musicBtn.setAttribute('aria-pressed', String(sound.state.music));
    musicBtn.setAttribute('aria-label', musicBtn.title);
  };

  themeBtn.addEventListener('click', () => { toggleTheme(); paintTheme(); sound.play('click'); });
  sfxBtn.addEventListener('click', () => { sound.toggleSfx(); paintSfx(); });
  musicBtn.addEventListener('click', () => { sound.toggleMusic(); paintMusic(); });

  paintTheme(); paintSfx(); paintMusic();

  // A remembered music:on can only start after the first gesture.
  const kick = () => { sound.resumeIfEnabled(); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  window.addEventListener('pointerdown', kick, { once: false });
  window.addEventListener('keydown', kick, { once: false });
}
