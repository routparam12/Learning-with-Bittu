/* audio.js — the whole site's sound, synthesised with WebAudio (no asset files).

   Two independent switches, both remembered in localStorage under one pair of
   keys so the toggle state is shared across every section of the site:
     • sfx   — short cues on clicks / wins / mistakes / algorithm steps  (default ON)
     • music — a slow ambient pad in the background                      (default OFF)

   Nothing plays until the first real user gesture — browsers block audio
   before that and warn in the console if you try. */

const SFX_KEY = 'bittu-sfx';
const MUSIC_KEY = 'bittu-music';

const read = (k, dflt) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? dflt : v === '1';
  } catch (e) { return dflt; }
};
const write = (k, on) => { try { localStorage.setItem(k, on ? '1' : '0'); } catch (e) {} };

/** Shared switch state. Read by the DSA top bar; kept in sync by the setters below. */
export const state = { sfx: read(SFX_KEY, true), music: read(MUSIC_KEY, false) };

let gestured = false;
const markGesture = () => { gestured = true; };
if (typeof window !== 'undefined') {
  addEventListener('pointerdown', markGesture, { once: true });
  addEventListener('keydown', markGesture, { once: true });
}

let ctx = null;
let master = null;
let musicGain = null;
let musicTimer = null;
let step = 0;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** One shaped tone. */
function tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, glide = 0, dest = null } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq + glide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest || master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

/* ── one-shot cues ── */
const CUES = {
  compare: () => tone(660, 0.07, { type: 'triangle', vol: 0.07 }),
  swap: () => tone(300, 0.13, { type: 'square', vol: 0.09, glide: 140 }),
  write: () => tone(430, 0.09, { type: 'triangle', vol: 0.08 }),
  lock: () => { tone(880, 0.16, { vol: 0.11 }); tone(1320, 0.14, { vol: 0.06, at: 0.05 }); },
  found: () => [0, 0.09, 0.18, 0.3].forEach((at, i) => tone([660, 880, 1100, 1320][i], 0.3, { vol: 0.11, at })),
  sad: () => { tone(400, 0.22, { type: 'triangle', vol: 0.1 }); tone(300, 0.3, { type: 'triangle', vol: 0.1, at: 0.16 }); },
  hoot: () => { tone(520, 0.17, { type: 'sine', vol: 0.16, glide: -90 }); tone(430, 0.26, { type: 'sine', vol: 0.14, at: 0.2, glide: -60 }); },
  pop: () => tone(520, 0.09, { type: 'triangle', vol: 0.16 }),
  click: () => tone(760, 0.05, { type: 'triangle', vol: 0.06 }),
};

/** Play a named cue. Silent unless sfx is on and the user has interacted. */
export function play(cue) {
  if (!state.sfx || !gestured) return;
  if (!ensure()) return;
  (CUES[cue] || CUES.click)();
}

/** Map a visualiser frame to the cue it deserves; null when the frame is quiet. */
export function cueForFrame(f) {
  if (!f) return null;
  if (f.found !== null && f.found !== undefined) return 'found';
  if (f.mood === 'sad') return 'sad';
  if (f.swap) return 'swap';
  if (f.write) return 'write';
  if (f.mood === 'happy') return 'lock';
  if (f.compare) return 'compare';
  return null;
}

/* ── ambient music: a slow A-minor pentatonic wander ── */
const SCALE = [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3];
const PATTERN = [0, 2, 4, 2, 5, 4, 2, 0, 3, 5, 7, 5];

function musicTick() {
  if (!ctx) return;
  const n = SCALE[PATTERN[step % PATTERN.length]];
  tone(n, 1.5, { type: 'sine', vol: 0.16, dest: musicGain });
  if (step % 4 === 0) tone(n * 1.5, 1.9, { type: 'sine', vol: 0.07, at: 0.06, dest: musicGain });
  if (step % 8 === 0) tone(SCALE[0] / 2, 2.6, { type: 'triangle', vol: 0.09, dest: musicGain });
  step++;
}

function startMusic() {
  if (!ensure() || musicTimer) return;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);
  musicTick();
  musicTimer = setInterval(musicTick, 900);
}

function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (ctx && musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
}

/* ── gesture unlock ── */
/** Call from a pointerdown / keydown handler to unlock audio and resume music if remembered. */
export function resumeAudio() {
  markGesture();
  ensure();
  if (state.music && !musicTimer) startMusic();
}
/** DSA alias. */
export const resumeIfEnabled = () => { if (gestured) resumeAudio(); };

/* ── switches ── */
export const sfxEnabled = () => state.sfx;
export const musicEnabled = () => state.music;

export function setSfxEnabled(on) {
  state.sfx = !!on;
  write(SFX_KEY, state.sfx);
}

export function setMusicEnabled(on) {
  state.music = !!on;
  write(MUSIC_KEY, state.music);
  if (state.music) startMusic();
  else stopMusic();
}

export function toggleSfx() {
  markGesture();
  setSfxEnabled(!state.sfx);
  if (state.sfx) play('click');
  return state.sfx;
}

export function toggleMusic() {
  markGesture();
  setMusicEnabled(!state.music);
  return state.music;
}

/* ── named cues used by the ML board ── */
export const playClick = () => play('click');
export const playPop = () => play('pop');
export const playSuccess = () => play('found');
export const playError = () => play('sad');
