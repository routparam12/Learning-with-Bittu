/* pattern.js — applies one of the 15 RAG patterns to the walkthrough.

   The 11 stages don't move. Applying a pattern:
     • drops a "With <name>:" note into each stage it changes
     • marks those dots on the rail and, for looping patterns, bends the rail
     • updates the gallery's active state + the reset bar
   Basic RAG clears all of that — it's the baseline the prose already describes. */

import { setPattern, pattern as currentPattern } from './pipeline.js';
import { say } from '../../../shared/scripts/mascot.js';

function readPatterns() {
  const el = document.getElementById('rag-patterns');
  try { return JSON.parse(el.textContent); } catch (e) { return null; }
}

let DATA = null;
let withTpl = 'With {name}:';

function clearNotes() {
  document.querySelectorAll('[data-stage-note]').forEach((n) => { n.hidden = true; n.innerHTML = ''; });
  document.querySelectorAll('.pgal__item[data-on]').forEach((el) => el.removeAttribute('data-on'));
  document.querySelectorAll('[data-applied-badge]').forEach((b) => { b.hidden = true; });
}

export function applyPattern(id) {
  if (!DATA) return;
  const p = DATA.patterns[id];
  const gallery = document.querySelector('[data-pattern-gallery]');
  const resetBar = document.querySelector('[data-pattern-reset]');
  const currentEl = document.querySelector('[data-pattern-current]');

  clearNotes();
  if (gallery) gallery.dataset.active = id;

  if (!p || id === 'basic' || !p.affects || p.affects.length === 0) {
    if (resetBar) resetBar.hidden = true;
    window.dispatchEvent(new CustomEvent('rag:pattern', { detail: { affects: [], flow: null } }));
    setPattern('basic');
    return;
  }

  p.affects.forEach((si) => {
    const sec = document.querySelector('section[data-stage="' + si + '"]');
    if (!sec) return;
    const slot = sec.querySelector('[data-stage-note]');
    if (!slot) return;
    const tag = withTpl.replace('{name}', p.name);
    slot.innerHTML = '<span class="stage-note__tag">' + tag + '</span> ' + (p.notes[si] || '');
    slot.hidden = false;
  });

  const item = document.querySelector('.pgal__item[data-pattern-item="' + id + '"]');
  if (item) {
    item.setAttribute('data-on', '');
    const badge = item.querySelector('[data-applied-badge]');
    if (badge) badge.hidden = false;
  }
  if (resetBar && currentEl) {
    currentEl.textContent = DATA.ui.currentPattern + ' ' + p.name;
    resetBar.hidden = false;
  }

  window.dispatchEvent(new CustomEvent('rag:pattern', { detail: { affects: p.affects, flow: p.flow || null } }));
  setPattern(id);
  say(p.name + ' — changing stages ' + p.affects.map((s) => s + 1).join(', ') + '. The eleven stages are the same; the procedure at those isn\'t.', { hold: 6000 });
}

export function initPatterns() {
  DATA = readPatterns();
  if (!DATA) return;
  withTpl = (DATA.ui && DATA.ui.withPattern) || withTpl;

  document.querySelectorAll('[data-apply-pattern]').forEach((btn) => {
    btn.addEventListener('click', () => applyPattern(btn.dataset.applyPattern));
  });
  const resetBtn = document.querySelector('[data-reset-pattern]');
  if (resetBtn) resetBtn.addEventListener('click', () => applyPattern('basic'));

  // restore a remembered pattern
  const saved = currentPattern();
  if (saved && saved !== 'basic') applyPattern(saved);
}
