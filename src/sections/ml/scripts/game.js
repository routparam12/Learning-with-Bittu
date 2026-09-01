// Shared brain for the whole board: progress, unlocking, and Bittu's mouth.
import { resumeAudio, playSuccess, playError } from '../../../shared/scripts/audio.js';

const KEY = 'bittu-ml-v1';
const TOTAL = 6; // number of playable chapters

const blank = { solved: [], treats: 0 };
let state = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.solved)) return raw;
  } catch (e) { /* first visit */ }
  return { ...blank, solved: [] };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

export function isSolved(n) { return state.solved.includes(n); }

/* ---------- Bittu ---------- */
let queue = [];
let talking = false;

export function say(text, mood = 'happy', hold = 0) {
  if (mood === 'party') playSuccess();
  else if (mood === 'oops') playError();
  queue.push({ text, mood, hold });
  if (!talking) drain();
}

function drain() {
  const bubble = document.querySelector('[data-bittu-bubble]');
  const pet = document.querySelector('[data-bittu]');
  const next = queue.shift();
  if (!next || !bubble) { talking = false; return; }
  talking = true;
  if (pet) pet.dataset.mood = next.mood;
  bubble.hidden = false;
  bubble.textContent = '';
  const chars = [...next.text];
  let i = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    bubble.textContent = next.text;
    setTimeout(drain, 1200 + next.hold);
    return;
  }
  const tick = setInterval(() => {
    bubble.textContent += chars[i++];
    if (i >= chars.length) {
      clearInterval(tick);
      setTimeout(drain, Math.min(1000 + chars.length * 28, 6500) + next.hold);
    }
  }, 16);
}

/* ---------- winning a chapter ---------- */
export function win(chapter, msg, treats = 1) {
  const first = !isSolved(chapter);
  if (first) {
    state.solved.push(chapter);
    state.treats += treats;
    save();
  }
  markSolved(chapter);
  say(msg, 'party');
  paintHud();
}

function markSolved(n) {
  const sec = document.querySelector(`[data-chapter="${n}"]`);
  if (sec) sec.dataset.solved = 'true';
  const nxt = document.querySelector(`[data-chapter="${n + 1}"]`);
  if (nxt) delete nxt.dataset.locked;
  const dot = document.querySelector(`[data-dot="${n}"]`);
  if (dot) dot.classList.add('done');
}

function paintHud() {
  const fill = document.querySelector('[data-hud-fill]');
  const num = document.querySelector('[data-hud-num]');
  const treats = document.querySelector('[data-hud-treats]');
  const pct = Math.round((state.solved.length / TOTAL) * 100);
  if (fill) fill.style.width = pct + '%';
  if (num) num.textContent = `${state.solved.length}/${TOTAL}`;
  if (treats) treats.textContent = '🦴 ' + state.treats;
}

export function reset() {
  state = { ...blank, solved: [] };
  save();
  location.reload();
}

/* ---------- boot ---------- */
export function boot() {
  // restore progress
  state.solved.forEach(markSolved);
  paintHud();

  // audio needs a real user gesture before it can play anything
  document.addEventListener('pointerdown', resumeAudio, { once: true });
  document.addEventListener('keydown', resumeAudio, { once: true });

  // glossary: any .term explains itself through Bittu
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.term');
    if (t) say(t.dataset.def, 'think', 600);
  });

  // next buttons
  document.querySelectorAll('[data-next]').forEach((b) => {
    b.addEventListener('click', () => {
      const target = document.querySelector(`[data-chapter="${b.dataset.next}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-reset]').forEach((r) =>
    r.addEventListener('click', () => { if (confirm('Wipe progress and start over?')) reset(); }));

  // eyes follow the cursor
  const pupils = document.querySelectorAll('[data-pupil]');
  window.addEventListener('pointermove', (e) => {
    pupils.forEach((p) => {
      const r = p.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(d / 60, 1) * 3.2;
      p.style.transform = `translate(${(dx / d) * m}px, ${(dy / d) * m}px)`;
    });
  }, { passive: true });
}

/* ---------- tiny canvas helpers shared by the mini-games ---------- */
/** Read a CSS custom property (e.g. cssVar('--chalk')) so canvases follow the theme. */
export function cssVar(name, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function fitCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 560;
  const h = +cv.dataset.h || 320;
  cv.width = w * dpr;
  cv.height = h * dpr;
  cv.style.height = h + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export function axes(ctx, w, h, xLabel, yLabel, pad = 34) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = cssVar('--canvas-axis') || 'rgba(110,231,135,.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, 8); ctx.lineTo(pad, h - pad); ctx.lineTo(w - 8, h - pad);
  ctx.stroke();
  ctx.fillStyle = cssVar('--canvas-axis-label') || 'rgba(110,231,135,.6)';
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillText(xLabel, w - 8 - ctx.measureText(xLabel).width, h - pad + 18);
  ctx.save();
  ctx.translate(12, 14); ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, -ctx.measureText(yLabel).width, 0);
  ctx.restore();
  return pad;
}

export function dot(ctx, x, y, color, r = 5, filled = true) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (filled) { ctx.fillStyle = color; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); }
}
