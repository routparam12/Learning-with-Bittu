/* rail.js — the vertical pipeline rail. A chain down the side of the page: one
   dot per stage, lined up with that stage's heading. The pet turtle rides the
   chain and settles on whichever stage you're reading, saying its one line.

   It also reacts to a chosen RAG pattern (rag:pattern event): the stages that
   pattern changes get a marked dot, and looping patterns bend the rail. */

import { say } from '../../../shared/scripts/mascot.js';

export function initRail(stages) {
  const railv = document.querySelector('[data-railv]');
  const list = document.getElementById('rail');
  const spine = document.querySelector('[data-railv-spine]');
  const fill = document.querySelector('[data-railv-fill]');
  const turtle = document.querySelector('[data-railv-turtle]');
  const flowPath = document.querySelector('[data-railv-flow-path]');
  const flowLabel = document.querySelector('[data-railv-flow-label]');
  const page = document.querySelector('.rag-page');
  if (!railv || !list || !page) return;

  let current = -1;
  let armed = false;
  window.addEventListener('scroll', () => { armed = true; }, { once: true, passive: true });
  const dotYs = [];
  let affected = [];
  let flow = null;

  stages.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'railv__stage pending' + (s.isNew ? ' is-new' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('data-i', String(i));
    btn.innerHTML =
      '<span class="railv__dot"></span>' +
      '<span class="railv__label"><span class="railv__num">' + (i + 1) + '</span>' + s.short + '</span>';
    btn.addEventListener('click', () => {
      const target = document.querySelector('[data-stage="' + i + '"]');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrent(i, true);
    });
    list.appendChild(btn);
  });
  const btns = [...list.querySelectorAll('.railv__stage')];

  function layout() {
    const pageTop = page.getBoundingClientRect().top + window.scrollY;
    stages.forEach((s, i) => {
      const sec = document.querySelector('section[data-stage="' + i + '"]');
      const anchor = sec ? (sec.querySelector('h2') || sec) : null;
      if (!anchor) { dotYs[i] = 0; return; }
      dotYs[i] = anchor.getBoundingClientRect().top + window.scrollY - pageTop + anchor.offsetHeight / 2;
      btns[i].style.top = dotYs[i] + 'px';
    });
    const first = dotYs[0] || 0;
    const last = dotYs[dotYs.length - 1] || first;
    spine.style.top = first + 'px';
    spine.style.height = (last - first) + 'px';
    paintFill();
    if (current >= 0) turtle.style.top = dotYs[current] + 'px';
    drawFlow();
  }

  function paintFill() {
    fill.style.height = current < 0 ? '0px'
      : Math.max(0, (dotYs[current] || 0) - (dotYs[0] || 0)) + 'px';
  }

  function setCurrent(i, fromClick) {
    const changed = i !== current;
    current = i;
    btns.forEach((el, idx) => {
      el.classList.toggle('done', idx < i);
      el.classList.toggle('current', idx === i);
      el.classList.toggle('pending', idx > i);
    });
    paintFill();
    if (dotYs[i] != null) turtle.style.top = dotYs[i] + 'px';
    if (changed && (armed || fromClick)) say(stages[i].preview, { hold: 4500 });
  }

  function markAffected(list2) {
    affected = list2 || [];
    btns.forEach((el, i) => el.classList.toggle('affected', affected.includes(i)));
  }

  function drawFlow() {
    if (!flowPath) return;
    if (!flow || dotYs.length === 0) { flowPath.setAttribute('d', ''); if (flowLabel) flowLabel.textContent = ''; return; }
    const X = 7; // spine x within .railv
    let d = '';
    if (flow.type === 'loop') {
      const y0 = dotYs[flow.from], y1 = dotYs[flow.to];
      const bulge = -34;
      d = `M ${X} ${y0} C ${bulge} ${y0}, ${bulge} ${y1}, ${X} ${y1}`;
      // arrowhead at (X, y1) pointing toward the dot
      d += ` M ${X - 6} ${y1 - 6} L ${X} ${y1} L ${X - 6} ${y1 + 6}`;
      if (flowLabel) {
        flowLabel.setAttribute('x', String(bulge + 4));
        flowLabel.setAttribute('y', String((y0 + y1) / 2));
        flowLabel.textContent = flow.label || '';
      }
    } else if (flow.type === 'fanout') {
      const y = dotYs[flow.at];
      d = `M ${X} ${y} L ${X + 20} ${y - 12} M ${X} ${y} L ${X + 20} ${y} M ${X} ${y} L ${X + 20} ${y + 12}`;
      if (flowLabel) { flowLabel.setAttribute('x', String(X + 24)); flowLabel.setAttribute('y', String(y + 22)); flowLabel.textContent = flow.label || ''; }
    } else if (flow.type === 'twopass') {
      const y = dotYs[flow.at];
      d = `M ${X} ${y - 9} C ${-22} ${y - 16}, ${-22} ${y + 16}, ${X} ${y + 9}`;
      d += ` M ${X - 5} ${y + 4} L ${X} ${y + 9} L ${X + 3} ${y + 3}`;
      if (flowLabel) { flowLabel.setAttribute('x', '-26'); flowLabel.setAttribute('y', String(y - 20)); flowLabel.textContent = flow.label || ''; }
    }
    flowPath.setAttribute('d', d);
  }

  window.addEventListener('rag:pattern', (e) => {
    markAffected(e.detail.affects);
    flow = e.detail.flow;
    drawFlow();
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const key = Number(en.target.getAttribute('data-stage'));
        if (!Number.isNaN(key)) setCurrent(key, false);
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('section[data-stage]').forEach((s) => io.observe(s));

  layout();
  requestAnimationFrame(layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });

  setCurrent(0, false);
}
