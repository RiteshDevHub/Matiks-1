/**
 * Sequence Generator for the Sequence Builder game.
 *
 * Produces dynamically-generated sequences from mathematical pattern families.
 * Each sequence has at most 6 boxes (5 or 6 terms).
 * Only positive integers are generated (no fractions or decimals).
 *
 * Difficulty progression:
 * - Level 1 (First 2 questions): Moderately easy (clean AP, ×2/×3 GP, basic n², simple Fibonacci)
 * - Level 2: Intermediate (2nd differences, cubes, powers, recursive m*a+c)
 * - Level 3: Challenging (interleaved sequences, polynomial n(n+k), alternating ops)
 * - Level 4-5: Advanced (power + linear combinations, 3rd differences)
 */

// ────────────────────────── public types ──────────────────────────

export interface SequenceQuestion {
  /** The full sequence of values (as integer display strings). */
  fullSequence: string[];
  /** Indices that are hidden (the player must fill these). */
  missingIndices: number[];
  /** The correct answers for those indices (same order as missingIndices). */
  correctAnswers: string[];
  /** A short human-readable description of the pattern. */
  patternLabel: string;
  /** Difficulty tier 1–5. */
  difficulty: number;
  /** Internal key used to prevent exact duplicates in a session. */
  _key: string;
}

// ────────────────────────── helpers ──────────────────────────

function rand(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(n: number): string {
  return String(Math.round(n));
}

// ────────────────────────── generator registry ──────────────────────────

type GenFn = (difficulty: number) => SequenceQuestion | null;

const generators: { fn: GenFn; minDiff: number; maxDiff: number; weight: number }[] = [];

function register(fn: GenFn, minDiff = 1, maxDiff = 5, weight = 1) {
  generators.push({ fn, minDiff, maxDiff, weight });
}

// ────────────────── 1. Arithmetic Progression (AP) ──────────────────

// Level 1: Clean, familiar APs (+3, +4, +5, +6, +7, +8, +10, +12)
register((diff) => {
  const d = pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15]);
  const a0 = rand(2, 30);
  const len = rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => a0 + i * d);
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `AP (+${d})`, diff, `ap_easy_${a0}_${d}_${len}`);
}, 1, 1, 3);

// Level 2+: Larger step APs
register((diff) => {
  const d = diff === 2 ? rand(14, 35) : rand(30, 90);
  const a0 = rand(10, 120);
  const len = rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => a0 + i * d);
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `AP (+${d})`, diff, `ap_hard_${a0}_${d}_${len}`);
}, 2, 5, 2);

// ────────────────── 2. Geometric Progression (GP) ──────────────────

// Level 1: ×2 or ×3 with small starting term
register((diff) => {
  const r = pick([2, 3]);
  const a0 = pick([1, 2, 3, 4, 5]);
  const len = r === 3 ? 5 : rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => a0 * Math.pow(r, i));
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `GP (×${r})`, diff, `gp_easy_${a0}_${r}_${len}`);
}, 1, 1, 2.5);

// Level 2+: Higher ratios
register((diff) => {
  const r = pick([3, 4, 5]);
  const a0 = pick([1, 2, 3, 6]);
  const len = 5;
  const seq = Array.from({ length: len }, (_, i) => a0 * Math.pow(r, i));
  if (seq.some(v => v > 100000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `GP (×${r})`, diff, `gp_med_${a0}_${r}_${len}`);
}, 2, 5, 1.5);

// ────────────────── 3. Squares (n², n²+c) ──────────────────

// Level 1: Basic squares n² or n²+1
register((diff) => {
  const c = pick([0, 1, 2]);
  const startN = rand(1, 3);
  const len = rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => (startN + i) ** 2 + c);
  const missing = chooseMissing(len, diff);
  const label = c === 0 ? "n²" : `n²+${c}`;
  return build(seq.map(fmt), missing, `${label}`, diff, `sq_easy_${c}_${startN}_${len}`);
}, 1, 1, 2);

// Level 2+: Scaled squares
register((diff) => {
  const a = pick([1, 2, 3]);
  const c = rand(2, 25);
  const startN = rand(2, 5);
  const len = rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => a * (startN + i) ** 2 + c);
  const missing = chooseMissing(len, diff);
  const label = a === 1 ? `n²+${c}` : `${a}n²+${c}`;
  return build(seq.map(fmt), missing, `${label}`, diff, `sq_hard_${a}_${c}_${startN}_${len}`);
}, 2, 5, 2);

// ────────────────── 4. Fibonacci-type (a+b) ──────────────────

// Level 1: Classic Fibonacci
register((diff) => {
  const a = pick([1, 2]);
  const b = pick([1, 2, 3]);
  const len = rand(5, 6);
  const seq = [a, b];
  for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2]);
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `Fibonacci-type`, diff, `fib_easy_${a}_${b}_${len}`);
}, 1, 1, 2);

// Level 2+: Higher seed Fibonacci
register((diff) => {
  const a = rand(3, 10);
  const b = rand(4, 12);
  const len = rand(5, 6);
  const seq = [a, b];
  for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2]);
  if (seq.some(v => v > 50000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `Fibonacci-type`, diff, `fib_hard_${a}_${b}_${len}`);
}, 2, 4, 1.5);

// ────────────────── 5. Cubes (n³+c) ──────────────────

register((diff) => {
  const c = pick([0, 1, 2, 5]);
  const startN = rand(1, 3);
  const len = 5;
  const seq = Array.from({ length: len }, (_, i) => (startN + i) ** 3 + c);
  if (seq.some(v => v > 50000)) return null;
  const missing = chooseMissing(len, diff);
  const label = c === 0 ? "n³" : `n³+${c}`;
  return build(seq.map(fmt), missing, label, diff, `cu_${c}_${startN}_${len}`);
}, 2, 4, 1.5);

// ────────────────── 6. Increasing differences (2nd difference constant) ──────────────────

register((diff) => {
  const d2 = pick([2, 3, 4, 5]);
  const d1start = rand(2, 8);
  const a0 = rand(5, 30);
  const len = rand(5, 6);
  const seq = [a0];
  let d = d1start;
  for (let i = 1; i < len; i++) {
    seq.push(seq[i - 1] + d);
    d += d2;
  }
  if (seq.some(v => v > 50000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `Diffs increase by +${d2}`, diff, `d2_${d2}_${d1start}_${a0}_${len}`);
}, 2, 5, 2);

// ────────────────── 7. Multiply + add recursive ──────────────────

register((diff) => {
  const m = pick([2, 3]);
  const c = pick([1, 2, 3, 5]);
  const a0 = rand(2, 7);
  const len = 5;
  const seq = [a0];
  for (let i = 1; i < len; i++) seq.push(m * seq[i - 1] + c);
  if (seq.some(v => v > 80000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `×${m} + ${c}`, diff, `rec_${m}_${c}_${a0}_${len}`);
}, 2, 4, 2);

// ────────────────── 8. Polynomial n(n+k) ──────────────────

register((diff) => {
  const k = rand(1, 4);
  const startN = rand(2, 5);
  const len = rand(5, 6);
  const seq = Array.from({ length: len }, (_, i) => {
    const n = startN + i;
    return n * (n + k);
  });
  if (seq.some(v => v > 50000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `n(n+${k})`, diff, `poly_${k}_${startN}_${len}`);
}, 3, 5, 1.5);

// ────────────────── 9. Interleaved sequences (exactly 6 terms) ──────────────────

register((diff) => {
  const aA = rand(2, 15); const dA = pick([3, 4, 5]);
  const subA = Array.from({ length: 3 }, (_, i) => aA + i * dA);

  const aB = rand(2, 15); const dB = pick([6, 7, 8]);
  const subB = Array.from({ length: 3 }, (_, i) => aB + i * dB);

  const seq = [subA[0], subB[0], subA[1], subB[1], subA[2], subB[2]];
  const missing = chooseMissing(6, diff);
  return build(seq.map(fmt), missing, `Two alternating APs`, diff, `interl_${aA}_${dA}_${aB}_${dB}`);
}, 3, 5, 1.5);

// ────────────────── 10. Alternating operations (integers) ──────────────────

register((diff) => {
  type Op = { label: string; fn: (x: number) => number };
  const pool: Op[] = [
    { label: "×2", fn: x => x * 2 },
    { label: "+3", fn: x => x + 3 },
    { label: "+5", fn: x => x + 5 },
    { label: "×3", fn: x => x * 3 },
  ];
  const op1 = pick(pool);
  let op2 = pick(pool);
  let tries = 0;
  while (op2.label === op1.label && tries++ < 20) op2 = pick(pool);
  const ops = [op1, op2];

  const a0 = rand(2, 6);
  const len = 6;
  const seq = [a0];
  for (let i = 1; i < len; i++) seq.push(ops[(i - 1) % ops.length].fn(seq[i - 1]));
  if (seq.some(v => v > 80000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `Alternating ${ops.map(o => o.label).join(", ")}`, diff, `alt_${ops[0].label}_${ops[1].label}_${a0}`);
}, 3, 5, 1.5);

// ────────────────── 11. Constant third differences ──────────────────

register((diff) => {
  const d3 = pick([1, 2, 3]);
  let d2 = rand(1, 3);
  let d1 = rand(2, 5);
  const a0 = rand(1, 8);
  const len = 6;
  const seq = [a0];
  for (let i = 1; i < len; i++) {
    seq.push(seq[i - 1] + d1);
    d1 += d2;
    d2 += d3;
  }
  if (seq.some(v => v > 80000)) return null;
  const missing = chooseMissing(len, diff);
  return build(seq.map(fmt), missing, `Constant 3rd diff = ${d3}`, diff, `d3_${d3}_${a0}_${len}`);
}, 4, 5, 1.5);

// ────────────────── missing-position chooser ──────────────────

function chooseMissing(len: number, difficulty: number): number[] {
  if (difficulty === 1) {
    // Moderately easy: 1 or 2 blanks with lots of surrounding context
    const count = pick([1, 2]);
    if (count === 1) {
      return [pick([len - 2, len - 1, 2])];
    }
    return pick([
      [len - 2, len - 1],
      [2, len - 1],
      [1, len - 2],
    ]);
  }

  // Difficulty 2+: 2 missing blanks
  const candidates = Array.from({ length: len }, (_, i) => i);
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, 2).sort((a, b) => a - b);
}

// ────────────────── builder ──────────────────

function build(
  display: string[],
  missingIndices: number[],
  patternLabel: string,
  difficulty: number,
  key: string,
): SequenceQuestion {
  return {
    fullSequence: display,
    missingIndices,
    correctAnswers: missingIndices.map(i => display[i]),
    patternLabel,
    difficulty,
    _key: key,
  };
}

// ────────────────── public API ──────────────────

export function generateSequence(
  difficulty: number,
  usedKeys: Set<string>,
  maxRetries = 80,
): SequenceQuestion {
  difficulty = Math.max(1, Math.min(5, difficulty));
  const eligible = generators.filter(
    g => difficulty >= g.minDiff && difficulty <= g.maxDiff
  );

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const totalWeight = eligible.reduce((s, g) => s + g.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = eligible[0];
    for (const g of eligible) {
      r -= g.weight;
      if (r <= 0) { chosen = g; break; }
    }

    const q = chosen.fn(difficulty);
    if (!q) continue;

    // ensure no sequence has more than 6 boxes
    if (q.fullSequence.length > 6) continue;

    // reject duplicates
    if (usedKeys.has(q._key)) continue;

    usedKeys.add(q._key);
    return q;
  }

  // fallback: simple AP with exactly 5 terms
  const a0 = rand(5, 20);
  const d = rand(4, 10);
  const len = 5;
  const seq = Array.from({ length: len }, (_, i) => fmt(a0 + i * d));
  const missing = [3, 4];
  return build(seq, missing, `AP (+${d})`, 1, `fallback_${Date.now()}`);
}

/**
 * Check if user answers match the expected answers (integer match).
 */
export function checkAnswers(
  userAnswers: string[],
  correctAnswers: string[],
): boolean[] {
  return userAnswers.map((ua, i) => {
    const ca = correctAnswers[i];
    if (!ua || !ca) return false;
    return ua.trim() === ca.trim();
  });
}

/**
 * Compute a score for a correctly answered question.
 */
export function computeScore(q: SequenceQuestion, _solveTimeMs: number): number {
  return 1;
}
