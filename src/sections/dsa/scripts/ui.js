/* ui.js — renders the visualiser into a mount node. Zero dependencies.
   Language comes from the page (root.dataset.lang) because switching locale is
   a navigation to /en/… or /hi/…, not an in-place re-render. */

import { parseInput, RUN, MAX_N } from './engine.js';
import { META } from './meta.js';
import { petSVG } from './pet.js';
import * as sound from '../../../shared/scripts/audio.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Top-level dictionary namespaces. Anything else ('bubble.compare', 'binary.mid')
   is narration and lives under dict.say. */
const ROOT_NS = new Set(['tag', 'err', 'ui', 'site', 'algo']);

/** Resolve a { k, p } reference against a dictionary. */
function tr(dict, ref) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (!ref.k) return '';
  const parts = ref.k.split('.');
  const base = ROOT_NS.has(parts[0]) ? dict : dict.say;
  const node = parts.reduce((o, seg) => (o == null ? o : o[seg]), base);
  if (node == null) return ref.k;                        // visible, not silent
  return typeof node === 'function' ? node(...(ref.p || [])) : String(node);
}

/* ── shell ────────────────────────────────────────────────────── */
function shell(m, d, homeHref) {
  const isSearch = m.kind === 'searching';
  const a = d.algo[m.slug];
  return `
<div class="wrap">
  <header class="head">
    <a class="back" href="${homeHref}">${esc(d.ui.backAll)}</a>
    <h1><span class="head-emoji">${m.emoji}</span>${esc(a.name)}</h1>
    <p class="tagline">${esc(a.tagline)}</p>
    <ul class="chips">
      <li><b>Best</b><span>${m.best}</span></li>
      <li><b>Average</b><span>${m.avg}</span></li>
      <li><b>Worst</b><span>${m.worst}</span></li>
      <li><b>Space</b><span>${m.space}</span></li>
      <li><b>Order</b><span>${m.stable}</span></li>
    </ul>
  </header>

  <section class="setup">
    <label class="field grow"><span>${esc(d.ui.array)}</span>
      <input id="arr" type="text" spellcheck="false" placeholder="3, 5, 10, 2, 18, 25" value="3, 5, 10, 2, 18, 25"></label>
    ${isSearch ? `<label class="field"><span>${esc(d.ui.target)}</span><input id="tgt" type="text" spellcheck="false" value="18"></label>` : ''}
    <button id="run" class="btn primary">${esc(d.ui.visualise)}</button>
    <button id="dice" class="btn">${esc(d.ui.randomNums)}</button>
    <button id="abc" class="btn">${esc(d.ui.randomLetters)}</button>
    <button id="wrd" class="btn">${esc(d.ui.randomWords)}</button>
    <p id="err" class="err" hidden></p>
  </section>

  <div class="cols">
    <main class="stage" aria-live="polite">
      <div class="saylane"><div id="say" class="say"><span id="saytext"></span><i id="tail" class="tail"></i></div></div>
      <div class="petlane">
        <div id="pet" class="pet">
          <button id="petbtn" class="petbtn" title="${esc(d.ui.pokeHint)}" aria-label="${esc(d.ui.pokeHint)}">
            <i id="petsvg">${petSVG('idle')}</i>
          </button>
          <b id="hold" class="hold" data-label="${esc(d.ui.keyLabel)}" hidden></b>
        </div>
      </div>
      <div id="track" class="track"></div>
      <div id="ptrs" class="ptrs"></div>
      <div id="temp" class="temp" hidden></div>

      <div class="controls">
        <button id="prev" class="btn ctl">${esc(d.ui.prev)}</button>
        <button id="play" class="btn ctl primary">${esc(d.ui.play)}</button>
        <button id="next" class="btn ctl">${esc(d.ui.next)}</button>
        <label class="speed"><span>${esc(d.ui.speed)}</span><input id="spd" type="range" min="1" max="10" value="5"></label>
        <span id="count" class="count">0 / 0</span>
      </div>
      <div class="bar"><i id="fill"></i></div>
      <p class="hint">${esc(d.ui.kbdHint)}</p>
    </main>

    <aside class="side">
      <section class="card">
        <h2>${esc(d.ui.petNote)}</h2>
        <p>${esc(a.idea)}</p>
        <p class="when"><b>${esc(d.ui.whenUse)}</b> ${esc(a.when)}</p>
      </section>
      <section class="card">
        <h2>${esc(d.ui.code)} <span class="tagpill" id="tag">${esc(d.tag.start)}</span></h2>
        <ol class="code" id="code">${a.code.map(l => `<li>${esc(l) || '&nbsp;'}</li>`).join('')}</ol>
      </section>
      <section class="card">
        <h2>${esc(d.ui.counters)}</h2>
        <dl class="stats">
          <div><dt>${esc(d.ui.comparisons)}</dt><dd id="sc">0</dd></div>
          <div><dt>${esc(d.ui.swaps)}</dt><dd id="ss">0</dd></div>
          <div><dt>${esc(d.ui.writes)}</dt><dd id="sw">0</dd></div>
        </dl>
      </section>
      <section class="card">
        <h2>${esc(d.ui.legend)}</h2>
        <ul class="legend">
          <li><i class="k-cmp"></i>${esc(d.ui.legCmp)}</li>
          <li><i class="k-swp"></i>${esc(d.ui.legSwp)}</li>
          <li><i class="k-piv"></i>${esc(d.ui.legPiv)}</li>
          <li><i class="k-lok"></i>${esc(d.ui.legLok)}</li>
        </ul>
      </section>
    </aside>
  </div>
</div>`;
}

const SAMPLE_WORDS = [
  'mango', 'apple', 'kiwi', 'peach', 'guava', 'plum', 'fig', 'lychee',
  'banana', 'cherry', 'papaya', 'melon', 'grape', 'lemon'
];
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/* ── mount ────────────────────────────────────────────────────── */
export function mount(root, dict) {
  const m = META[root.dataset.algo];
  const d = dict || window.__ALGO_DICT__;
  if (!m || !d) { root.textContent = 'Unknown algorithm'; return; }

  const homeHref = root.dataset.home || '/';
  root.innerHTML = shell(m, d, homeHref);
  const $ = id => root.querySelector('#' + id);
  const isSearch = m.kind === 'searching';

  let steps = [], i = 0, timer = null, heights = new Map(), lastCue = -1;

  const fail = ref => { const e = $('err'); e.textContent = tr(d, ref); e.hidden = false; };

  const build = () => {
    const parsed = parseInput($('arr').value);
    if (parsed.error) return fail(parsed.error);
    let target = null;
    if (isSearch) {
      const t = parseInput($('tgt').value);
      if (t.error || t.values.length !== 1) return fail({ k: 'err.targetOne' });
      if (t.numeric !== parsed.numeric) return fail({ k: 'err.typeMismatch' });
      target = t.values[0];
    }
    $('err').hidden = true;

    // Bar heights come from rank, not value, so letters and words work too.
    const uniq = [...new Set(parsed.values)].sort((a, b) =>
      (String(a).toLowerCase() < String(b).toLowerCase() ? -1 : String(a).toLowerCase() > String(b).toLowerCase() ? 1 : 0));
    heights = new Map(uniq.map((v, k) => [v, 30 + (uniq.length < 2 ? 60 : (k / (uniq.length - 1)) * 96)]));

    // Widen the columns when the values are words rather than digits.
    const longest = Math.max(...parsed.values.map(v => String(v).length));
    const w = longest <= 3 ? 68 : longest <= 6 ? 84 : 104;
    root.querySelector('.stage').style.setProperty('--tilew', w + 'px');
    root.querySelector('.stage').classList.toggle('words', longest > 4);

    steps = isSearch ? RUN[m.slug](parsed.values, target) : RUN[m.slug](parsed.values);
    i = 0; lastCue = -1; stop(); paint();
  };

  /* rendering one frame */
  function paint() {
    const f = steps[i]; if (!f) return;
    const inList = (arr, k) => arr && arr.indexOf(k) > -1;
    const dim = f.active.length > 0;

    $('track').innerHTML = f.array.map((v, k) => {
      const cls = ['tile'];
      if (dim && !inList(f.active, k)) cls.push('faded');
      if (inList(f.groupA, k)) cls.push('gA');
      if (inList(f.groupB, k)) cls.push('gB');
      if (inList(f.stale, k)) cls.push('stale');
      if (f.hole === k) cls.push('hole');
      if (inList(f.compare, k)) cls.push('cmp');
      if (inList(f.swap, k)) cls.push('swp');
      if (inList(f.write, k)) cls.push('wrt');
      if (f.pivot === k) cls.push('piv');
      if (inList(f.sorted, k)) cls.push('lok');
      if (f.found === k) cls.push('found');
      const h = f.hole === k ? 42 : (heights.get(v) || 60);
      return `<div class="${cls.join(' ')}" style="--h:${h.toFixed(0)}px">
        <b class="val" title="${esc(v)}">${f.hole === k ? '' : esc(v)}</b><i class="bar"></i><u class="idx">${k}</u></div>`;
    }).join('');

    // binary-search pointers
    const p = f.pointers;
    $('ptrs').innerHTML = f.array.map((_, k) => {
      if (!p) return '<span></span>';
      const t = [];
      if (p.low === k) t.push('low');
      if (p.high === k) t.push('high');
      if (p.mid === k) t.push('mid');
      return `<span class="ptr">${t.map(x => `<b class="p-${x}">${x}</b>`).join('')}</span>`;
    }).join('');

    const hold = $('hold');
    hold.hidden = f.hold === null; hold.textContent = f.hold === null ? '' : f.hold;

    const tp = $('temp');
    tp.hidden = !f.temp;
    if (f.temp) tp.innerHTML = `<span class="tlabel">${esc(d.ui.tempBuffer)}</span>` + f.temp.items
      .map((v, k) => `<b class="${f.temp.phase === 'copy' && k === f.temp.at ? 'tcell on' : k < (f.temp.at ?? -1) ? 'tcell done' : 'tcell'}">${esc(v)}</b>`).join('');

    $('saytext').textContent = tr(d, f.say);
    $('petsvg').innerHTML = petSVG(f.mood);
    $('pet').dataset.mood = f.mood;
    $('tag').textContent = tr(d, f.tag);
    $('sc').textContent = f.stats.c; $('ss').textContent = f.stats.s; $('sw').textContent = f.stats.w;
    [...$('code').children].forEach((li, n) => li.classList.toggle('on', n === f.line));
    $('count').textContent = `${i + 1} / ${steps.length}`;
    $('fill').style.width = ((i + 1) / steps.length * 100) + '%';
    $('prev').disabled = i === 0;
    $('next').disabled = i === steps.length - 1;
    movePet(f.cursor);

    // one cue per frame, and never twice for the same frame
    if (i !== lastCue) { lastCue = i; const cue = sound.cueForFrame(f); if (cue) sound.play(cue); }
  }

  function movePet(idx) {
    const tiles = $('track').children;
    const t = tiles[idx == null ? 0 : Math.min(idx, tiles.length - 1)];
    if (!t) return;
    const x = t.offsetLeft + t.offsetWidth / 2;
    $('pet').style.transform = `translateX(${x}px) translateX(-50%)`;
    const say = $('say'), lane = say.parentElement;
    const max = lane.clientWidth - say.offsetWidth;
    const sx = Math.max(0, Math.min(x - say.offsetWidth / 2, max));
    say.style.transform = `translateX(${sx}px)`;
    $('tail').style.left = Math.max(14, Math.min(x - sx, say.offsetWidth - 14)) + 'px';
  }

  /* transport */
  const go = d2 => { const n = i + d2; if (n < 0 || n >= steps.length) { if (d2 > 0) stop(); return; } i = n; paint(); };
  const stop = () => { clearInterval(timer); timer = null; $('play').textContent = d.ui.play; $('play').classList.add('primary'); };
  const play = () => {
    sound.resumeIfEnabled();
    if (timer) return stop();
    if (i === steps.length - 1) { i = 0; paint(); }
    $('play').textContent = d.ui.pause; $('play').classList.remove('primary');
    timer = setInterval(() => go(1), 1100 - $('spd').value * 100);
  };

  /* poke the owl → hoot + a random tip */
  let pokeTimer = null;
  const poke = () => {
    sound.play('hoot');
    const petEl = $('pet');
    petEl.classList.remove('poked');
    void petEl.offsetWidth;               // restart the animation
    petEl.classList.add('poked');
    $('saytext').textContent = d.petTips[Math.floor(Math.random() * d.petTips.length)];
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => { const f = steps[i]; if (f) $('saytext').textContent = tr(d, f.say); }, 3600);
  };

  $('run').onclick = build;
  $('dice').onclick = () => {
    const nums = Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 60));
    $('arr').value = nums.join(', ');
    if (isSearch) $('tgt').value = String(nums[3]);
    build();
  };
  $('abc').onclick = () => {
    const p = pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), 7);
    $('arr').value = p.join(', ');
    if (isSearch) $('tgt').value = p[3];
    build();
  };
  $('wrd').onclick = () => {
    const p = pick(SAMPLE_WORDS, 6);
    $('arr').value = p.join(', ');
    if (isSearch) $('tgt').value = p[3];
    build();
  };
  $('prev').onclick = () => { stop(); go(-1); };
  $('next').onclick = () => { sound.resumeIfEnabled(); stop(); go(1); };
  $('play').onclick = play;
  $('petbtn').onclick = () => { sound.resumeIfEnabled(); poke(); };
  $('spd').oninput = () => { if (timer) { clearInterval(timer); timer = setInterval(() => go(1), 1100 - $('spd').value * 100); } };
  $('arr').onkeydown = e => { if (e.key === 'Enter') build(); };
  if (isSearch) $('tgt').onkeydown = e => { if (e.key === 'Enter') build(); };

  document.addEventListener('keydown', e => {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { stop(); go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { stop(); go(-1); e.preventDefault(); }
    if (e.key === ' ') { play(); e.preventDefault(); }
    if (e.key === 'p' || e.key === 'P') { sound.resumeIfEnabled(); poke(); }
  });
  window.addEventListener('resize', () => { const f = steps[i]; if (f) movePet(f.cursor); });

  build();
}

export { tr, MAX_N };
