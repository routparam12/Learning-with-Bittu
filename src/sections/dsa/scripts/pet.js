/* pet.js — Hootie, the bespectacled owl who narrates the array.
   One exported function returns an SVG string for a given mood. All colours
   come from CSS custom properties so the owl re-themes with the page. */

/* Per-mood face. `pupil` is drawn inside each lens, `brow` above the specs,
   `beak` swaps between calm / open / frown. */
const FACES = {
  idle: {
    pupil: '<circle cx="0" cy="0" r="5" fill="var(--owl-pupil)"/><circle cx="1.8" cy="-1.8" r="1.7" fill="#fff" opacity=".9"/>',
    brow: '',
    beak: 'M-5 0h10l-5 8z',
    tilt: 0
  },
  think: {
    // looking up and to the side, one brow cocked
    pupil: '<circle cx="2.4" cy="-2.4" r="4.6" fill="var(--owl-pupil)"/><circle cx="4" cy="-4" r="1.5" fill="#fff" opacity=".9"/>',
    brow: '<path d="M-31 -15q5 -4 11 -2" /><path d="M20 -18q6 -1 11 3" />',
    beak: 'M-4 0h8l-4 7z',
    tilt: -5
  },
  ok: {
    // relaxed upward arcs
    pupil: '<path d="M-6 2q6 -8 12 0" stroke="var(--owl-pupil)" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
    brow: '',
    beak: 'M-5 0h10l-5 8z',
    tilt: 0
  },
  alert: {
    // pinprick pupils, brows driven down
    pupil: '<circle cx="0" cy="0" r="7" fill="var(--owl-pupil)" opacity=".18"/><circle cx="0" cy="0" r="3" fill="var(--owl-pupil)"/>',
    brow: '<path d="M-32 -18l12 6" /><path d="M32 -18l-12 6" />',
    beak: 'M-5 0h10l-5 10z',
    tilt: 0
  },
  swap: {
    pupil: '<ellipse cx="0" cy="0" rx="6" ry="4" fill="var(--owl-pupil)"/><circle cx="2" cy="-1.4" r="1.5" fill="#fff" opacity=".9"/>',
    brow: '',
    beak: 'M-5 0h10l-5 9z',
    tilt: 4
  },
  happy: {
    // big joyful arcs
    pupil: '<path d="M-7 3q7 -10 14 0" stroke="var(--owl-pupil)" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    brow: '',
    beak: 'M-6 0h12l-6 9z',
    tilt: 0
  },
  sad: {
    pupil: '<circle cx="0" cy="2.6" r="4.4" fill="var(--owl-pupil)"/><circle cx="1.4" cy="1" r="1.3" fill="#fff" opacity=".85"/>',
    brow: '<path d="M-32 -12l12 -5" /><path d="M32 -12l-12 -5" />',
    beak: 'M-5 2h10l-5 -8z',
    tilt: 0
  }
};

export const MOODS = Object.keys(FACES);

/**
 * @param {string} mood  one of MOODS
 * @param {number} size  rendered width in px (height scales to 1.15x)
 */
export function petSVG(mood, size = 64) {
  const f = FACES[mood] || FACES.idle;
  const h = Math.round(size * 1.15);
  return `<svg class="owl" viewBox="0 0 80 92" width="${size}" height="${h}" aria-hidden="true">
  <g class="owl-tilt" style="--tilt:${f.tilt}deg">

    <!-- ear tufts -->
    <path class="owl-tuft owl-tuft-l" d="M20 30 L13 7 L34 20 Z" fill="var(--owl-dark)"/>
    <path class="owl-tuft owl-tuft-r" d="M60 30 L67 7 L46 20 Z" fill="var(--owl-dark)"/>

    <!-- body -->
    <ellipse cx="40" cy="50" rx="30" ry="34" fill="var(--owl-body)"/>
    <ellipse cx="40" cy="50" rx="30" ry="34" fill="none" stroke="var(--owl-dark)" stroke-width="1.5" opacity=".55"/>

    <!-- belly patch -->
    <ellipse cx="40" cy="66" rx="19" ry="17" fill="var(--owl-belly)" opacity=".55"/>

    <!-- wings -->
    <path class="owl-wing owl-wing-l" d="M12 44q-5 16 3 28q7 4 8 -4q-4 -12 -3 -24z" fill="var(--owl-dark)"/>
    <path class="owl-wing owl-wing-r" d="M68 44q5 16 -3 28q-7 4 -8 -4q4 -12 3 -24z" fill="var(--owl-dark)"/>

    <!-- spectacles: lenses first, then the eyes on top -->
    <g class="owl-specs">
      <circle cx="27" cy="40" r="12.5" fill="var(--owl-lens)"/>
      <circle cx="53" cy="40" r="12.5" fill="var(--owl-lens)"/>
      <circle cx="27" cy="40" r="12.5" fill="none" stroke="var(--owl-frame)" stroke-width="3"/>
      <circle cx="53" cy="40" r="12.5" fill="none" stroke="var(--owl-frame)" stroke-width="3"/>
      <path d="M39.5 40h1" stroke="var(--owl-frame)" stroke-width="3" stroke-linecap="round"/>
      <path d="M14.5 38l-6 -3M65.5 38l6 -3" stroke="var(--owl-frame)" stroke-width="2.4" stroke-linecap="round"/>
      <!-- lens glare -->
      <path d="M20 33a10 10 0 0 1 7 -5" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M46 33a10 10 0 0 1 7 -5" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>
    </g>

    <g class="owl-eyes">
      <g transform="translate(27,40)">${f.pupil}</g>
      <g transform="translate(53,40)">${f.pupil}</g>
    </g>

    ${f.brow ? `<g class="owl-brow" transform="translate(40,40)" stroke="var(--owl-dark)" stroke-width="3" stroke-linecap="round" fill="none">${f.brow}</g>` : ''}

    <!-- beak -->
    <g transform="translate(40,54)"><path d="${f.beak}" fill="var(--owl-beak)" stroke="var(--owl-dark)" stroke-width="1" stroke-linejoin="round"/></g>

    <!-- feet -->
    <path d="M30 82v6M26 88h8M50 82v6M46 88h8" stroke="var(--owl-beak)" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;
}
