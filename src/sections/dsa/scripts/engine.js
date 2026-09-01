/* engine.js — pure logic. No DOM, no language.
   Every algorithm returns an array of "frames"; a frame is one press of Next.

   Narration is NOT a string here. It is { k, p } — a dictionary key plus its
   parameters — so the renderer can paint the same frames in any language
   without re-running the algorithm. See src/i18n/. */

export const MAX_N = 14;

/** Narration/tag helper: S('bubble.compare', 3, 5) → { k, p }. */
const S = (k, ...p) => ({ k, p });

export function parseInput(raw) {
  const tokens = String(raw).split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return { error: S('err.empty') };
  if (tokens.length > MAX_N) return { error: S('err.tooMany', MAX_N) };
  const allNum = tokens.every(t => /^-?\d+(\.\d+)?$/.test(t));
  // Text keeps the case the user typed — "Banana" reads better than "BANANA".
  // Ordering is case-insensitive (see cmp), so display case never affects the sort.
  const values = allNum ? tokens.map(Number) : tokens;
  return { values, numeric: allNum };
}

/** Three-way compare. Numbers numerically, text case-insensitively with a
    stable tie-break on the raw string so "Apple" vs "apple" is deterministic. */
export function cmp(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  const x = String(a).toLowerCase(), y = String(b).toLowerCase();
  if (x < y) return -1;
  if (x > y) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

const rng = (lo, hi) => { const o = []; for (let i = lo; i <= hi; i++) o.push(i); return o; };

function newState(a0) {
  return { a: [...a0], sorted: [], steps: [], tag: S('tag.start'), c: 0, s: 0, w: 0 };
}
function pusher(st) {
  return (o = {}) => st.steps.push({
    array: [...st.a], sorted: [...st.sorted],
    compare: null, swap: null, write: null, active: [], groupA: [], groupB: [],
    pivot: null, cursor: null, pointers: null, found: null,
    hole: null, hold: null, temp: null, stale: [],
    mood: 'idle', tag: st.tag, line: 0, say: S(''),
    stats: { c: st.c, s: st.s, w: st.w }, ...o
  });
}

/* ─────────────────────────── 1. BUBBLE ─────────────────────────── */
export function bubbleSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  push({ say: S('bubble.intro'), line: 0, cursor: 0 });
  for (let i = 0; i < n - 1; i++) {
    st.tag = S('tag.pass', i + 1); let swapped = false;
    push({ say: S('bubble.passStart', i + 1, n - i - 2, i), line: 1, cursor: 0 });
    for (let j = 0; j < n - i - 1; j++) {
      st.c++;
      push({ compare: [j, j + 1], cursor: j, say: S('bubble.compare', a[j], a[j + 1]), line: 2, mood: 'think' });
      if (cmp(a[j], a[j + 1]) > 0) {
        push({ compare: [j, j + 1], cursor: j, say: S('bubble.swapNeeded', a[j], a[j + 1]), line: 3, mood: 'alert' });
        [a[j], a[j + 1]] = [a[j + 1], a[j]]; st.s++; swapped = true;
        push({ swap: [j, j + 1], cursor: j + 1, say: S('bubble.swapDone'), line: 4, mood: 'swap' });
      } else {
        push({ compare: [j, j + 1], cursor: j, say: S('bubble.inOrder', a[j], a[j + 1]), line: 2, mood: 'ok' });
      }
    }
    st.sorted.push(n - 1 - i);
    push({ cursor: n - 1 - i, say: S('bubble.passEnd', i + 1, a[n - 1 - i]), line: 5, mood: 'happy' });
    if (!swapped) {
      for (let k = 0; k < n - 1 - i; k++) st.sorted.push(k);
      push({ say: S('bubble.noSwaps'), line: 6, mood: 'happy' });
      break;
    }
  }
  for (let k = 0; k < n; k++) if (!st.sorted.includes(k)) st.sorted.push(k);
  st.tag = S('tag.done');
  push({ say: S('bubble.done', st.c, st.s), line: 6, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 2. SELECTION ─────────────────────────── */
export function selectionSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  push({ say: S('selection.intro'), line: 0, cursor: 0 });
  for (let i = 0; i < n - 1; i++) {
    st.tag = S('tag.round', i + 1); let min = i;
    push({ active: rng(i, n - 1), pivot: min, cursor: i, say: S('selection.roundStart', i + 1, i, a[i]), line: 1, mood: 'think' });
    for (let j = i + 1; j < n; j++) {
      st.c++;
      push({ active: rng(i, n - 1), compare: [j, min], pivot: min, cursor: j, say: S('selection.compare', a[j], a[min]), line: 2, mood: 'think' });
      if (cmp(a[j], a[min]) < 0) {
        min = j;
        push({ active: rng(i, n - 1), pivot: min, cursor: j, say: S('selection.newMin', a[j], j), line: 3, mood: 'alert' });
      }
    }
    if (min !== i) {
      push({ swap: [i, min], cursor: i, say: S('selection.swap', a[min], i, a[i]), line: 4, mood: 'swap' });
      [a[i], a[min]] = [a[min], a[i]]; st.s++;
    } else {
      push({ cursor: i, say: S('selection.alreadyMin', a[i]), line: 4, mood: 'ok' });
    }
    st.sorted.push(i);
    push({ cursor: i, say: S('selection.lock', a[i]), line: 5, mood: 'happy' });
  }
  st.sorted.push(n - 1); st.tag = S('tag.done');
  push({ say: S('selection.done', st.c, st.s), line: 5, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 3. INSERTION ─────────────────────────── */
export function insertionSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  st.sorted.push(0);
  push({ say: S('insertion.intro'), line: 0, cursor: 0 });
  for (let i = 1; i < n; i++) {
    st.tag = S('tag.insert', i);
    const key = a[i]; let j = i - 1;
    push({ active: rng(0, i - 1), cursor: i, compare: [i], say: S('insertion.pick', key, a.slice(0, i).join(', ')), line: 1, mood: 'think' });
    push({ active: rng(0, i - 1), cursor: i, hole: i, hold: key, say: S('insertion.lift', key, i), line: 1, mood: 'think' });
    while (j >= 0 && cmp(a[j], key) > 0) {
      st.c++;
      push({ active: rng(0, i), cursor: j, hole: j + 1, hold: key, compare: [j], say: S('insertion.shift', a[j], key), line: 2, mood: 'alert' });
      a[j + 1] = a[j]; st.w++;
      push({ active: rng(0, i), cursor: j, hole: j, hold: key, write: [j + 1], say: S('insertion.shifted', j), line: 3, mood: 'swap' });
      j--;
    }
    if (j >= 0) { st.c++; push({ active: rng(0, i), cursor: j, hole: j + 1, hold: key, compare: [j], say: S('insertion.stop', a[j], key), line: 2, mood: 'ok' }); }
    else push({ active: rng(0, i), cursor: 0, hole: 0, hold: key, say: S('insertion.leftEdge', key), line: 2, mood: 'ok' });
    a[j + 1] = key; st.w++; st.sorted.push(i);
    push({ write: [j + 1], cursor: j + 1, say: S('insertion.place', key, j + 1), line: 4, mood: 'happy' });
  }
  st.tag = S('tag.done');
  push({ say: S('insertion.done'), line: 5, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 4. MERGE ─────────────────────────── */
export function mergeSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  push({ say: S('merge.intro'), line: 0, cursor: 0 });
  function ms(lo, hi, depth) {
    st.tag = S('tag.level', depth);
    if (lo >= hi) { push({ active: [lo], cursor: lo, say: S('merge.single', a[lo]), line: 1, mood: 'ok' }); return; }
    const mid = (lo + hi) >> 1;
    push({ active: rng(lo, hi), groupA: rng(lo, mid), groupB: rng(mid + 1, hi), cursor: mid, say: S('merge.split', lo, hi, mid), line: 2, mood: 'think' });
    ms(lo, mid, depth + 1); ms(mid + 1, hi, depth + 1);
    merge(lo, mid, hi);
  }
  function merge(lo, mid, hi) {
    const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1), out = [];
    let i = 0, j = 0;
    push({ active: rng(lo, hi), groupA: rng(lo, mid), groupB: rng(mid + 1, hi), cursor: lo, say: S('merge.mergeStart', L.join(', '), R.join(', ')), line: 3, mood: 'think' });
    const buf = () => ({ items: [...out], phase: 'build' });
    while (i < L.length && j < R.length) {
      st.c++;
      push({ active: rng(lo, hi), compare: [lo + i, mid + 1 + j], cursor: lo + i, temp: buf(), say: S('merge.compare', L[i], R[j]), line: 4, mood: 'think' });
      if (cmp(L[i], R[j]) <= 0) { out.push(L[i]); push({ active: rng(lo, hi), compare: [lo + i], cursor: lo + i, temp: buf(), say: S('merge.take', L[i]), line: 4, mood: 'ok' }); i++; }
      else { out.push(R[j]); push({ active: rng(lo, hi), compare: [mid + 1 + j], cursor: mid + 1 + j, temp: buf(), say: S('merge.take', R[j]), line: 4, mood: 'ok' }); j++; }
    }
    while (i < L.length) out.push(L[i++]);
    while (j < R.length) out.push(R[j++]);
    push({ active: rng(lo, hi), cursor: lo, temp: buf(), say: S('merge.drain', out.join(', ')), line: 5, mood: 'ok' });
    for (let k = 0; k < out.length; k++) {
      a[lo + k] = out[k]; st.w++;
      push({
        active: rng(lo, hi), write: [lo + k], cursor: lo + k, stale: rng(lo + k + 1, hi),
        temp: { items: [...out], phase: 'copy', at: k }, say: S('merge.copy', out[k], lo + k), line: 6, mood: 'swap'
      });
    }
    push({ active: rng(lo, hi), cursor: lo, say: S('merge.rangeDone', lo, hi), line: 6, mood: 'happy' });
  }
  ms(0, n - 1, 1);
  for (let k = 0; k < n; k++) st.sorted.push(k);
  st.tag = S('tag.done');
  push({ say: S('merge.done'), line: 6, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 5. QUICK ─────────────────────────── */
export function quickSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  push({ say: S('quick.intro'), line: 0, cursor: 0 });
  function part(lo, hi) {
    const pivot = a[hi]; let i = lo - 1;
    push({ active: rng(lo, hi), pivot: hi, cursor: hi, say: S('quick.pivotPick', lo, hi, pivot), line: 1, mood: 'think' });
    for (let j = lo; j < hi; j++) {
      st.c++;
      push({ active: rng(lo, hi), pivot: hi, compare: [j, hi], cursor: j, say: S('quick.compare', a[j], pivot), line: 3, mood: 'think' });
      if (cmp(a[j], pivot) <= 0) {
        i++;
        if (i !== j) {
          push({ active: rng(lo, hi), pivot: hi, swap: [i, j], cursor: j, say: S('quick.swapLeft', a[j], pivot, a[i]), line: 4, mood: 'swap' });
          [a[i], a[j]] = [a[j], a[i]]; st.s++;
        } else {
          push({ active: rng(lo, hi), pivot: hi, compare: [i], cursor: i, say: S('quick.alreadyLeft', a[j], pivot), line: 4, mood: 'ok' });
        }
      } else {
        push({ active: rng(lo, hi), pivot: hi, compare: [j], cursor: j, say: S('quick.stayRight', a[j], pivot), line: 3, mood: 'ok' });
      }
    }
    push({ active: rng(lo, hi), pivot: hi, swap: [i + 1, hi], cursor: i + 1, say: S('quick.placePivot', pivot, i + 1), line: 5, mood: 'swap' });
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; st.s++;
    st.sorted.push(i + 1);
    push({ cursor: i + 1, say: S('quick.pivotLocked', pivot, i + 1), line: 5, mood: 'happy' });
    return i + 1;
  }
  function qs(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { st.sorted.push(lo); push({ cursor: lo, say: S('quick.single', a[lo]), line: 6, mood: 'ok' }); return; }
    st.tag = S('tag.range', lo, hi);
    const p = part(lo, hi);
    qs(lo, p - 1); qs(p + 1, hi);
  }
  qs(0, n - 1);
  for (let k = 0; k < n; k++) if (!st.sorted.includes(k)) st.sorted.push(k);
  st.tag = S('tag.done');
  push({ say: S('quick.done'), line: 6, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 6. HEAP ─────────────────────────── */
export function heapSort(a0) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  push({ say: S('heap.intro'), line: 0, cursor: 0 });
  function heapify(size, i) {
    let largest = i; const l = 2 * i + 1, r = 2 * i + 2;
    const kids = [l, r].filter(x => x < size);
    push({
      active: [i, ...kids], cursor: i,
      say: kids.length ? S('heap.children', i, a[i], kids.join(' + ')) : S('heap.leaf', i),
      line: 1, mood: 'think'
    });
    if (l < size) { st.c++; push({ active: [i, ...kids], compare: [l, largest], cursor: l, say: S('heap.cmpLeft', a[l], a[largest]), line: 2, mood: 'think' }); if (cmp(a[l], a[largest]) > 0) largest = l; }
    if (r < size) { st.c++; push({ active: [i, ...kids], compare: [r, largest], cursor: r, say: S('heap.cmpRight', a[r], a[largest]), line: 2, mood: 'think' }); if (cmp(a[r], a[largest]) > 0) largest = r; }
    if (largest !== i) {
      push({ active: [i, ...kids], swap: [i, largest], cursor: i, say: S('heap.swapChild', a[largest], a[i]), line: 3, mood: 'swap' });
      [a[i], a[largest]] = [a[largest], a[i]]; st.s++;
      push({ active: [i, largest], cursor: largest, say: S('heap.reheapify'), line: 3, mood: 'alert' });
      heapify(size, largest);
    } else {
      push({ active: [i, ...kids], cursor: i, say: S('heap.parentOk', a[i]), line: 3, mood: 'ok' });
    }
  }
  st.tag = S('tag.buildHeap');
  for (let i = (n >> 1) - 1; i >= 0; i--) heapify(n, i);
  push({ say: S('heap.built', a[0]), line: 0, mood: 'happy', cursor: 0 });
  for (let end = n - 1; end > 0; end--) {
    st.tag = S('tag.extract', n - end);
    push({ swap: [0, end], cursor: 0, say: S('heap.extract', a[0], end), line: 5, mood: 'swap' });
    [a[0], a[end]] = [a[end], a[0]]; st.s++; st.sorted.push(end);
    push({ cursor: end, say: S('heap.locked', a[end], end), line: 6, mood: 'happy' });
    heapify(end, 0);
  }
  st.sorted.push(0); st.tag = S('tag.done');
  push({ say: S('heap.done'), line: 6, mood: 'happy' });
  return st.steps;
}

/* ─────────────────────────── 7. LINEAR SEARCH ─────────────────────────── */
export function linearSearch(a0, target) {
  const st = newState(a0), push = pusher(st), a = st.a, n = a.length;
  st.tag = S('tag.scan');
  push({ say: S('linear.intro', target), line: 0, cursor: 0 });
  for (let i = 0; i < n; i++) {
    st.c++;
    push({ compare: [i], cursor: i, say: S('linear.check', i, a[i], target), line: 1, mood: 'think' });
    if (cmp(a[i], target) === 0) {
      st.tag = S('tag.found');
      push({ found: i, cursor: i, say: S('linear.found', target, i, st.c), line: 1, mood: 'happy' });
      return st.steps;
    }
    push({ cursor: i, say: S('linear.next'), line: 1, mood: 'ok' });
  }
  st.tag = S('tag.notFound');
  push({ say: S('linear.notFound', target), line: 2, mood: 'sad' });
  return st.steps;
}

/* ─────────────────────────── 8. BINARY SEARCH ─────────────────────────── */
export function binarySearch(a0, target) {
  const wasSorted = a0.every((v, i) => i === 0 || cmp(a0[i - 1], v) <= 0);
  const st = newState([...a0].sort(cmp)), push = pusher(st), a = st.a, n = a.length;
  st.tag = S('tag.setup');
  push({
    say: wasSorted ? S('binary.introSorted') : S('binary.introUnsorted'),
    line: 0, mood: wasSorted ? 'ok' : 'alert', cursor: 0
  });
  let low = 0, high = n - 1;
  st.tag = S('tag.search');
  while (low <= high) {
    const mid = (low + high) >> 1;
    push({ active: rng(low, high), pointers: { low, high, mid: null }, cursor: low, say: S('binary.range', low, high), line: 1, mood: 'think' });
    push({ active: rng(low, high), pointers: { low, high, mid }, compare: [mid], cursor: mid, say: S('binary.mid', low, high, mid, a[mid]), line: 3, mood: 'think' });
    st.c++;
    if (cmp(a[mid], target) === 0) {
      st.tag = S('tag.found');
      push({ found: mid, pointers: { low, high, mid }, cursor: mid, say: S('binary.found', target, mid, st.c), line: 4, mood: 'happy' });
      return st.steps;
    }
    if (cmp(a[mid], target) < 0) {
      push({ active: rng(low, high), pointers: { low, high, mid }, cursor: mid, say: S('binary.goRight', a[mid], target, mid + 1), line: 5, mood: 'alert' });
      low = mid + 1;
    } else {
      push({ active: rng(low, high), pointers: { low, high, mid }, cursor: mid, say: S('binary.goLeft', a[mid], target, mid - 1), line: 6, mood: 'alert' });
      high = mid - 1;
    }
  }
  st.tag = S('tag.notFound');
  push({ say: S('binary.notFound', target), line: 2, mood: 'sad' });
  return st.steps;
}

export const RUN = {
  bubble: bubbleSort, selection: selectionSort, insertion: insertionSort,
  merge: mergeSort, quick: quickSort, heap: heapSort,
  linear: linearSearch, binary: binarySearch
};
