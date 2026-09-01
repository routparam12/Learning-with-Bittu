/* mascot.js — drives the shared <Mascot>. It never speaks on its own.

   say(text)      show one line in the corner bubble (called after an interaction)
   hush()         hide the bubble
   pokeReply(fn)  optional: what the mascot says if the reader clicks it

   The RAG page also mirrors every MascotNote into say(), so the character and
   the inline note stay in sync without the games knowing about the corner. */

let hideTimer = null;

function els() {
  return {
    root: document.querySelector('[data-mascot]'),
    bubble: document.querySelector('[data-mascot-bubble]'),
    poke: document.querySelector('[data-mascot-poke]'),
  };
}

export function say(text, { hold = 6000 } = {}) {
  const { bubble } = els();
  if (!bubble || !text) return;
  bubble.textContent = text;
  bubble.hidden = false;
  clearTimeout(hideTimer);
  if (hold) hideTimer = setTimeout(() => { bubble.hidden = true; }, hold);
}

export function hush() {
  const { bubble } = els();
  if (bubble) bubble.hidden = true;
  clearTimeout(hideTimer);
}

export function pokeReply(fn) {
  const { poke } = els();
  if (poke) poke.addEventListener('click', () => say(fn()));
}

/* Watch every MascotNote on the page; when a game reveals or updates one,
   echo it to the corner. Purely reactive — no note, no sound. */
export function mirrorNotes() {
  const notes = document.querySelectorAll('[data-mascot-note]');
  if (!notes.length) return;
  const report = (note) => {
    if (note.hidden) return;
    const t = note.querySelector('[data-mascot-note-text]');
    if (t && t.textContent.trim()) say(t.textContent.trim());
  };
  notes.forEach((note) => {
    const mo = new MutationObserver(() => report(note));
    mo.observe(note, { attributes: true, attributeFilter: ['hidden'], subtree: true, childList: true, characterData: true });
  });
}
