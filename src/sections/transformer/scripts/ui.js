/* ui.js — renders the transformer walkthrough into a mount node.

   Same contract as src/sections/dsa/scripts/ui.js: mount(root, dict) builds the
   shell, paint(frame) draws one step, and the transport (Back / Auto / Next /
   speed / keyboard) walks the frame list the engine produced. Language comes
   from the page, because switching locale is a navigation, not a re-render. */

import { run, checkInput } from './engine.js';
import { loadModel } from './model.js';
import * as sound from '../../../shared/scripts/audio.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Resolve a { k, p } reference against the dictionary. Keys are namespaced. */
function tr(dict, ref) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (!ref.k) return '';
  const node = ref.k.split('.').reduce((o, seg) => (o == null ? o : o[seg]), dict);
  if (node == null) return ref.k;                      // visible, not silent
  return typeof node === 'function' ? node(...(ref.p || [])) : String(node);
}

/* ── colour scales ───────────────────────────────────────────── */
/** Diverging scale for stream values: negative → cool, positive → warm. */
function divClass(v, scale) {
  if (!Number.isFinite(v)) return 'na';
  const t = Math.max(-1, Math.min(1, v / (scale || 1)));
  const b = Math.round(Math.abs(t) * 4);
  return (t < 0 ? 'n' : 'p') + b;
}
/** Sequential scale for attention weights in 0..1. */
const seqClass = (v) => (Number.isFinite(v) ? 'a' + Math.round(Math.min(1, Math.max(0, v)) * 4) : 'na');

const f2 = (x) => (Object.is(x, -0) ? 0 : x).toFixed(2);

/* ── shell ───────────────────────────────────────────────────── */
function shell(d, homeHref) {
  return `
<div class="wrap">
  <header class="head">
    <a class="back" href="${homeHref}">${esc(d.ui.backHome)}</a>
    <h1><span class="head-emoji">🧠</span>${esc(d.site.heroA)} <em>${esc(d.site.heroEm)}</em></h1>
    <p class="tagline">${esc(d.site.heroSub)}</p>
    <ul class="chips" id="badge"></ul>
  </header>

  <section class="learning-cards" aria-label="${esc(d.ui.learningPaths)}">
    <article class="learning-card working-card" id="working-card">
      <p class="card-kicker">01 · ${esc(d.ui.productionKicker)}</p>
      <h2>${esc(d.ui.workingTitle)}</h2>
      <p>${esc(d.ui.workingDesc)}</p>
      <button class="path-action" id="showflow" type="button" aria-expanded="false">${esc(d.ui.showFlow)}</button>
      <div class="production-flow" id="production-flow" hidden>
        <pre>${esc(d.say.overviewBefore)}</pre>
        <div class="block-divider">${esc(d.ui.transformerBlocks)}<br><small>${esc(d.ui.transformerBlocksHint)}</small></div>
        <pre>${esc(d.say.overviewAfter)}</pre>
        <p class="loop-copy">${esc(d.say.inferenceLoop)}</p>
        <a class="reference-link" href="https://paramjeetrout.substack.com/p/gpt-3-end-to-end-what-actually-happens" target="_blank" rel="noreferrer">${esc(d.ui.readProduction)} ↗</a>
      </div>
    </article>
    <article class="learning-card model-card">
      <p class="card-kicker">02 · ${esc(d.ui.layerKicker)}</p>
      <h2>${esc(d.ui.architectureTitle)}</h2>
      <p>${esc(d.ui.architectureDesc)}</p>
      <div class="layer-mini-diagram" aria-hidden="true">
        <span>X₀</span><i>→</i><span>ATTN</span><i>→</i><span>FFN</span><i>→</i><span>LOGITS</span>
      </div>
      <button class="path-action" id="openlab" type="button">${esc(d.ui.openLab)}</button>
      <a class="reference-link" href="https://bbycroft.net/llm" target="_blank" rel="noreferrer">${esc(d.ui.exploreReference)} ↗</a>
    </article>
  </section>

  <section class="setup" id="architecture-lab">
    <div class="field wide">
      <span>${esc(d.ui.mode)}</span>
      <div class="seg" id="modesw" role="group">
        <button type="button" data-mode="continue" class="on">${esc(d.ui.modeContinue)}</button>
        <button type="button" data-mode="answer">${esc(d.ui.modeAnswer)}</button>
      </div>
    </div>
    <label class="field grow"><span id="sentlab">${esc(d.ui.sentence)}</span>
      <input id="sent" type="text" spellcheck="false" autocomplete="off" value="the weather is"></label>
    <button id="run" class="btn primary">${esc(d.ui.run)}</button>
    <button id="ex" class="btn">${esc(d.ui.examples)}</button>
    <div class="field">
      <span>${esc(d.ui.model)}</span>
      <div class="seg" id="modelsw" role="group">
        <button type="button" data-m="simple" class="on">${esc(d.ui.simple)}</button>
        <button type="button" data-m="real">${esc(d.ui.real)}</button>
      </div>
    </div>
    <label class="field"><span>${esc(d.ui.temperature)}</span>
      <input id="temp" type="range" min="0" max="12" step="1" value="0"></label>
    <p id="err" class="err" hidden></p>
    <p class="modelhint" id="modelhint"></p>
  </section>

  <div class="cols">
    <main class="stage" aria-live="polite">
      <div class="saylane"><p id="say" class="say"></p></div>

      <section class="pan">
        <h3>${esc(d.ui.tokensTitle)} <small id="tokhint"></small></h3>
        <div id="toks" class="toks"></div>
      </section>

      <section class="pan" id="streampan">
        <h3>${esc(d.ui.streamTitle)} <small id="streamlab">${esc(d.ui.streamHint)}</small></h3>
        <div id="stream" class="streamwrap"></div>
      </section>

      <section class="pan" id="attnpan" hidden>
        <h3>${esc(d.ui.attentionTitle)} <small>${esc(d.ui.attentionHint)}</small></h3>
        <div id="attn" class="heads"></div>
      </section>

      <section class="pan" id="distpan" hidden>
        <h3>${esc(d.ui.distTitle)}</h3>
        <div id="dist" class="bars"></div>
      </section>

      <pre id="work" class="work"></pre>

      <div class="controls">
        <button id="prev" class="btn ctl">${esc(d.ui.prev)}</button>
        <button id="play" class="btn ctl primary">${esc(d.ui.play)}</button>
        <button id="next" class="btn ctl">${esc(d.ui.next)}</button>
        <button id="word" class="btn ctl">${esc(d.ui.skipWord)}</button>
        <label class="speed"><span>${esc(d.ui.speed)}</span><input id="spd" type="range" min="1" max="10" value="6"></label>
        <span id="count" class="count">0 / 0</span>
      </div>
      <div class="bar"><i id="fill"></i></div>
      <p class="hint">${esc(d.ui.kbdHint)}</p>
    </main>

    <aside class="side">
      <section class="card">
        <h2>${esc(d.ui.note)}</h2>
        <p id="note"></p>
      </section>
      <section class="card">
        <h2>${esc(d.ui.codeTitle)} <span class="tagpill" id="tag"></span></h2>
        <ol class="code" id="code">${d.codeLines.map((l) => `<li>${esc(l) || '&nbsp;'}</li>`).join('')}</ol>
      </section>
      <section class="card">
        <h2>${esc(d.ui.legend)}</h2>
        <ul class="legend">
          <li><i class="k-new"></i>${esc(d.ui.legNew)}</li>
          <li><i class="k-tmpl"></i>${esc(d.ui.legTmpl)}</li>
          <li><i class="k-focus"></i>${esc(d.ui.legFocus)}</li>
          <li><i class="k-hi"></i>${esc(d.ui.legHigh)}</li>
          <li><i class="k-lo"></i>${esc(d.ui.legLow)}</li>
        </ul>
        <p class="fine">${esc(d.ui.unkNote)}</p>
        <p class="fine">${esc(d.ui.repeatNote)}</p>
      </section>
    </aside>
  </div>
</div>`;
}

/* ── mount ───────────────────────────────────────────────────── */
export function mount(root, dict, loaders) {
  const d = dict;
  const homeHref = root.dataset.home || '/';
  root.innerHTML = shell(d, homeHref);
  const $ = (id) => root.querySelector('#' + id);

  let model = null, modelId = 'simple', mode = 'continue';
  let frames = [], i = 0, timer = null;
  const cache = new Map();

  const fail = (ref) => { const e = $('err'); e.textContent = tr(d, ref); e.hidden = false; };

  /* ── model badge ── */
  function paintBadge() {
    const c = model.cfg;
    const rows = [
      [d.ui.params, model.params.toLocaleString()],
      [d.ui.dims, c.D],
      [d.ui.blocks, c.L],
      [d.ui.heads, c.H],
      [d.ui.vocab, c.V],
      [d.ui.perplexity, c.perplexity],
    ];
    $('badge').innerHTML = rows.map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join('');
    paintHint();
  }

  function paintHint() {
    $('modelhint').textContent =
      (mode === 'answer' ? d.ui.modeHintAnswer : d.ui.modeHintContinue) + ' ' + d.models[modelId];
    $('sentlab').textContent = mode === 'answer' ? d.ui.question : d.ui.sentence;
  }

  async function useModel(id) {
    if (!cache.has(id)) cache.set(id, loadModel(await loaders[id]()));
    model = cache.get(id);
    modelId = id;
    paintBadge();
  }

  /* ── build a run ── */
  function build() {
    if (!model) return;
    const text = $('sent').value;
    const pre = checkInput(model, text, mode);
    if (pre.error) { frames = []; return fail(pre.error); }
    $('err').hidden = true;
    const temp = +$('temp').value / 10;
    const res = run(model, text, { temperature: temp, mode });
    if (res.error) { frames = []; return fail(res.error); }
    frames = res.frames;
    i = 0; stop(); paint();
  }

  /* ── panels ── */
  function paintTokens(f) {
    $('toks').innerHTML = f.tokens.map((t, k) => {
      const cls = ['tok'];
      if (t.isNew) cls.push('new');
      if (k === f.focus) cls.push('focus');
      if (t.special) cls.push('special');
      if (t.tmpl) cls.push('tmpl');
      if (!t.known) cls.push('unk');
      return `<div class="${cls.join(' ')}"><b>${esc(t.word)}</b><u>${k}</u><i>${t.id}</i></div>`;
    }).join('');
    const made = f.tokens.filter((t) => t.isNew);
    $('tokhint').textContent = made.length
      ? (mode === 'answer' ? `${d.ui.answerLabel}: “${made.map((t) => t.word).join(' ')}”` : `${made.length} ${d.ui.generated}`)
      : '';
  }

  function paintStream(f) {
    const pan = $('streampan');
    if (!f.stream) { pan.hidden = true; return; }
    pan.hidden = false;
    const W = f.width || f.D;
    // trust the stream's own length, not the token count: they differ on any
    // frame where a token has been added but not yet embedded
    const T = Math.min(f.tokens.length, Math.floor(f.stream.length / W));
    // scale from the frame's own values so colour always uses the full range
    let mx = 0;
    for (let k = 0; k < f.stream.length; k++) mx = Math.max(mx, Math.abs(f.stream[k]));
    const showNums = W <= 8;
    $('streamlab').textContent = f.streamLabel ? tr(d, f.streamLabel) : d.ui.streamHint;

    let html = `<div class="stream ${showNums ? 'nums' : 'heat'}" style="--cols:${W}">`;
    for (let t = 0; t < T; t++) {
      const lab = f.tokens[t] ? f.tokens[t].word : '';
      html += `<div class="srow${t === f.focus ? ' focus' : ''}"><span class="slab" title="${esc(lab)}">${esc(lab)}</span><div class="scells">`;
      for (let j = 0; j < W; j++) {
        const v = f.stream[t * W + j];
        const prev = f.prevStream ? f.prevStream[t * W + j] : null;
        const changed = prev !== null && Math.abs(v - prev) > 1e-9;
        html += `<i class="c ${divClass(v, mx)}${changed ? ' chg' : ''}" title="${f2(v)}">${showNums ? f2(v) : ''}</i>`;
      }
      html += '</div></div>';
    }
    $('stream').innerHTML = html + '</div>';
  }

  function paintAttn(f) {
    const pan = $('attnpan');
    if (!f.attn) { pan.hidden = true; return; }
    pan.hidden = false;
    const T = f.tokens.length;
    const isProb = f.attnMode === 'probs';
    // scores can be any magnitude; normalise for colour
    let mx = 0;
    if (!isProb) for (const m of f.attn) for (const v of m) if (Number.isFinite(v)) mx = Math.max(mx, Math.abs(v));
    const showNums = T <= 9;

    $('attn').innerHTML = f.attn.map((m, h) => {
      let g = `<div class="headbox"><p class="headlab">${esc(d.ui.head)} ${h + 1}</p><div class="amat ${showNums ? 'nums' : ''}" style="--n:${T}">`;
      for (let r = 0; r < T; r++)
        for (let c = 0; c < T; c++) {
          const v = m[r * T + c];
          const cls = !Number.isFinite(v) ? 'na' : isProb ? seqClass(v) : divClass(v, mx);
          const title = Number.isFinite(v) ? f2(v) : d.ui.masked;
          g += `<i class="c ${cls}${r === f.focus ? ' rowfocus' : ''}" title="${esc(title)}">${showNums && Number.isFinite(v) ? f2(v) : ''}</i>`;
        }
      return g + '</div></div>';
    }).join('');
  }

  function paintDist(f) {
    const pan = $('distpan');
    if (!f.dist) { pan.hidden = true; return; }
    pan.hidden = false;
    const top = f.dist[0].p || 1;
    $('dist').innerHTML = f.dist.map((x) => {
      const on = f.picked && f.picked.id === x.id;
      return `<div class="barrow${on ? ' picked' : ''}">
        <span class="bw">${esc(x.word)}</span>
        <span class="bt"><i style="width:${Math.max(1, (x.p / top) * 100)}%"></i></span>
        <span class="bp">${(x.p * 100).toFixed(1)}%</span></div>`;
    }).join('');
  }

  /* ── one frame ── */
  function paint() {
    const f = frames[i];
    if (!f) return;
    paintTokens(f);
    paintStream(f);
    paintAttn(f);
    paintDist(f);
    $('say').textContent = tr(d, f.say);
    $('note').textContent = tr(d, f.say);
    $('work').textContent = f.work ? tr(d, f.work) : '';
    $('tag').textContent = tr(d, f.tag);
    [...$('code').children].forEach((li, n) => li.classList.toggle('on', n === f.line));
    $('count').textContent = `${i + 1} / ${frames.length}`;
    $('fill').style.width = ((i + 1) / frames.length) * 100 + '%';
    $('prev').disabled = i === 0;
    $('next').disabled = i === frames.length - 1;
    $('word').disabled = i === frames.length - 1;
    const transyMood = f.stage === 'done' ? 'done' : f.stage === 'sample' || f.stage === 'append' ? 'pick' : 'think';
    const transyExample = d.transyExamples[f.stage] || d.transyExamples.default;
    window.dispatchEvent(new CustomEvent('transy:context', { detail: { text: tr(d, f.say), example: transyExample, mood: transyMood } }));
    const cue = f.picked ? 'lock' : f.stage === 'attnsoftmax' ? 'pop' : f.stage === 'append' ? 'write' : 'compare';
    sound.play(cue);
  }

  /* ── transport ── */
  const go = (delta) => {
    const n = i + delta;
    if (n < 0 || n >= frames.length) { if (delta > 0) stop(); return; }
    i = n; paint();
  };
  const stop = () => {
    clearInterval(timer); timer = null;
    $('play').textContent = d.ui.play; $('play').classList.add('primary');
  };
  const play = () => {
    sound.resumeIfEnabled();
    if (timer) return stop();
    if (i === frames.length - 1) { i = 0; paint(); }
    $('play').textContent = d.ui.pause; $('play').classList.remove('primary');
    timer = setInterval(() => go(1), 1400 - $('spd').value * 120);
  };
  /** Jump to the start of the next generated word. */
  const nextWord = () => {
    stop();
    const cur = frames[i];
    if (!cur) return;
    for (let k = i + 1; k < frames.length; k++)
      if (frames[k].gen > cur.gen || frames[k].stage === 'done') { i = k; paint(); return; }
    i = frames.length - 1; paint();
  };

  /* ── wiring ── */
  $('run').onclick = () => { sound.resumeIfEnabled(); build(); };
  $('showflow').onclick = () => {
    const flow = $('production-flow');
    const open = flow.hidden;
    flow.hidden = !open;
    $('showflow').setAttribute('aria-expanded', String(open));
    $('showflow').textContent = open ? d.ui.hideFlow : d.ui.showFlow;
  };
  $('openlab').onclick = () => $('architecture-lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('sent').onkeydown = (e) => { if (e.key === 'Enter') build(); };
  let exIdx = 0;
  $('ex').onclick = () => {
    const pool = mode === 'answer' ? d.questions : d.examples;
    $('sent').value = pool[exIdx++ % pool.length];
    build();
  };
  $('modesw').onclick = (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === mode) return;
    $('modesw').querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
    mode = b.dataset.mode;
    exIdx = 0;
    $('sent').value = (mode === 'answer' ? d.questions : d.examples)[0];
    paintHint();
    build();
  };
  $('prev').onclick = () => { stop(); go(-1); };
  $('next').onclick = () => { sound.resumeIfEnabled(); stop(); go(1); };
  $('play').onclick = play;
  $('word').onclick = () => { sound.resumeIfEnabled(); nextWord(); };
  $('spd').oninput = () => { if (timer) { clearInterval(timer); timer = setInterval(() => go(1), 1400 - $('spd').value * 120); } };
  $('temp').oninput = build;
  $('modelsw').onclick = async (e) => {
    const b = e.target.closest('[data-m]');
    if (!b || b.dataset.m === modelId) return;
    $('modelsw').querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
    b.disabled = true;
    await useModel(b.dataset.m);
    b.disabled = false;
    build();
  };

  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { stop(); go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { stop(); go(-1); e.preventDefault(); }
    if (e.key === ' ') { play(); e.preventDefault(); }
    if (e.key === 'w' || e.key === 'W') { nextWord(); }
  });

  /* first paint */
  useModel('simple').then(build);
}

export { tr };
