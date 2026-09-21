/* rag.js — boots the RAG page: the rail, the shared question, the mascot mirror.
   Individual games boot themselves (each is its own <script> island). */

import { initRail } from './rail.js';
import { initPatterns } from './pattern.js';
import { initTurtle } from './turtle.js';
import { subscribe, setQuestion, question, DEFAULT_QUESTION } from './pipeline.js';
import { mirrorNotes, say } from '../../../shared/scripts/mascot.js';

function readData() {
  const el = document.getElementById('rag-data');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch (e) { return null; }
}

export function boot() {
  const data = readData();
  if (data && Array.isArray(data.rail)) initRail(data.rail);

  initPatterns();

  // Torty's shy reflex: she ducks into her shell when the cursor closes in.
  initTurtle();

  // the question bar → pipeline store
  const form = document.querySelector('[data-qbar]');
  const input = document.querySelector('[data-qbar-input]');
  if (form && input) {
    input.value = question();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setQuestion(input.value);
    });
  }

  // reflect the current question in the rail header and anywhere marked
  subscribe((state) => {
    document.querySelectorAll('[data-q-echo]').forEach((n) => {
      n.textContent = '"' + state.question + '"';
    });
    if (input && document.activeElement !== input) input.value = state.question;
  });

  // the corner mascot mirrors whatever the last inline MascotNote said
  mirrorNotes();

  // a gentle reset affordance: clicking the mascot restores the sample question
  const poke = document.querySelector('[data-mascot-poke]');
  if (poke) {
    poke.addEventListener('click', () => {
      if (question() !== DEFAULT_QUESTION) {
        setQuestion(DEFAULT_QUESTION);
        say('Back to the sample question — every game on the page follows whatever you type up top.');
      }
    });
  }
}
