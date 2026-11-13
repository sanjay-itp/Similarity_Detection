// Simple word n-gram comparison used by the demo backend (mock.js).
// The real backend will use its own algorithm; this only exists so the
// highlight view has something realistic to show in demo mode.

function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-z0-9']+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

function shingles(tokens, n) {
  const list = [];
  for (let i = 0; i + n <= tokens.length; i += 1) {
    list.push(tokens.slice(i, i + n).map((t) => t.word).join(' '));
  }
  return list;
}

function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((x, y) => x[0] - y[0]);
  const out = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = out[out.length - 1];
    if (sorted[i][0] <= last[1] + 1) last[1] = Math.max(last[1], sorted[i][1]);
    else out.push(sorted[i].slice());
  }
  return out;
}

function markedRanges(tokens, grams, other, n) {
  const ranges = [];
  grams.forEach((g, i) => {
    if (other.has(g)) ranges.push([tokens[i].start, tokens[i + n - 1].end]);
  });
  return mergeRanges(ranges);
}

/**
 * Returns { score: 0-100, matches: { a: [[start, end]], b: [[start, end]] } }
 * where start/end are character offsets into each text.
 */
export function compareTexts(textA = '', textB = '', n = 5) {
  const ta = tokenize(textA);
  const tb = tokenize(textB);
  const ga = shingles(ta, n);
  const gb = shingles(tb, n);
  const setA = new Set(ga);
  const setB = new Set(gb);
  if (!setA.size || !setB.size) return { score: 0, matches: { a: [], b: [] } };
  let shared = 0;
  setA.forEach((g) => {
    if (setB.has(g)) shared += 1;
  });
  const score = Math.round((shared / Math.min(setA.size, setB.size)) * 100);
  return {
    score,
    matches: {
      a: markedRanges(ta, ga, setB, n),
      b: markedRanges(tb, gb, setA, n),
    },
  };
}
