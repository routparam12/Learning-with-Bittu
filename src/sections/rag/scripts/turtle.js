/* turtle.js — Torty's shy reflex.

   Bring the cursor near her and she snaps head, legs and tail into the shell.
   A few seconds later she eases back out, legs first, then the head — slow,
   because coming out is the cautious part.

   The distance test is deliberate: reacting to `mouseenter` alone would only
   fire once the cursor is already on top of a ~32px target, which reads as a
   click response rather than a flinch. Watching proximity means she reacts to
   you *approaching*, which is what makes her feel alive.

   She will not re-hide while the cursor is parked on her — otherwise she would
   flap in and out forever. The cursor has to leave and come back. */

const REACH = 58;         // px of clear space around her that counts as "too close"
const STAY_IN = 2400;     // ms she waits inside before venturing out
const OUT_AGAIN = 1200;   // ms for the emerge animation to finish

export function initTurtle() {
  const svg = document.querySelector('[data-turtle]');
  if (!svg) return;

  // Honour reduced-motion: she still hides (it is information, not decoration)
  // but without the drawn-out easing.
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  let state = 'out';        // 'out' | 'in'
  let leftSince = true;     // has the cursor left her radius since she came out?
  let cooling = false;      // mid-emerge: ignore proximity until she is fully out
  let inTimer = null;
  let outTimer = null;
  let queued = false;

  // Measured live rather than cached: she is sized in vw, so the radius has to
  // track her actual rendered size across breakpoints.
  const zone = () => {
    const r = svg.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      radius: Math.max(r.width, r.height) / 2 + REACH,
    };
  };

  function hide() {
    if (state === 'in') return;
    state = 'in';
    leftSince = false;
    svg.dataset.shy = 'in';
    clearTimeout(inTimer);
    clearTimeout(outTimer);
    inTimer = setTimeout(show, calm.matches ? 900 : STAY_IN);
  }

  function show() {
    if (state === 'out') return;
    state = 'out';
    svg.dataset.shy = 'out';
    // Ignore proximity until the emerge animation has finished, so a cursor
    // that wandered off and back cannot yank her in again mid-stretch.
    cooling = true;
    clearTimeout(outTimer);
    outTimer = setTimeout(() => { cooling = false; }, calm.matches ? 0 : OUT_AGAIN);
  }

  function consider(x, y) {
    const z = zone();
    const near = Math.hypot(x - z.x, y - z.y) < z.radius;
    if (!near) { leftSince = true; return; }
    if (state === 'out' && leftSince && !cooling) hide();
  }

  // rAF-throttled: pointermove fires far more often than we need.
  let lastX = 0, lastY = 0;
  window.addEventListener('pointermove', (e) => {
    lastX = e.clientX; lastY = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; consider(lastX, lastY); });
  }, { passive: true });

  // Touch has no hover, so a tap nearby counts as the approach.
  window.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (t) consider(t.clientX, t.clientY);
  }, { passive: true });

  // Scrolling moves her under a stationary cursor — re-test against the last
  // known pointer position so she reacts to the page moving too.
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; if (lastX || lastY) consider(lastX, lastY); });
  }, { passive: true });

  // If the tab goes away mid-hide, come back out rather than staying stuck in.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === 'in') {
      clearTimeout(inTimer);
      inTimer = setTimeout(show, 600);
    }
  });
}
