// Number Line Race Dynamic Question Generator
// Generates 5 unique numerical expressions of varying types and calculates their true ascending order.

export interface NumberItem {
  text: string;
  value: number;
}

export interface NumberLineQuestion {
  numbers: string[];       // 5 shuffled expressions to display at bottom
  correctOrder: string[];  // 5 expressions in strict ascending order (least to greatest)
  items: NumberItem[];     // Sorted items with text and evaluated values
  difficulty: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Level 1: Fractions and Decimals ──────────────────────────────────────────
function genLevel1(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "1.25", value: 1.25 },
      { text: "7/5", value: 1.4 },
      { text: "1.6", value: 1.6 },
      { text: "13/10", value: 1.3 },
      { text: "1.45", value: 1.45 },
    ],
    [
      { text: "3/4", value: 0.75 },
      { text: "0.8", value: 0.8 },
      { text: "0.65", value: 0.65 },
      { text: "7/10", value: 0.7 },
      { text: "0.85", value: 0.85 },
    ],
    [
      { text: "1/2", value: 0.5 },
      { text: "0.4", value: 0.4 },
      { text: "3/5", value: 0.6 },
      { text: "0.55", value: 0.55 },
      { text: "7/10", value: 0.7 },
    ],
    [
      { text: "9/4", value: 2.25 },
      { text: "2.3", value: 2.3 },
      { text: "11/5", value: 2.2 },
      { text: "2.4", value: 2.4 },
      { text: "5/2", value: 2.5 },
    ],
    [
      { text: "1.1", value: 1.1 },
      { text: "5/4", value: 1.25 },
      { text: "1.2", value: 1.2 },
      { text: "3/2", value: 1.5 },
      { text: "1.35", value: 1.35 },
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 2: Fractions + Decimals + Square Roots ──────────────────────────────
function genLevel2(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "√2", value: Math.SQRT2 }, // ~1.4142
      { text: "1.4", value: 1.4 },
      { text: "3/2", value: 1.5 },
      { text: "1.73", value: 1.73 },
      { text: "√3", value: Math.sqrt(3) }, // ~1.7321
    ],
    [
      { text: "1.35", value: 1.35 },
      { text: "√2", value: Math.SQRT2 }, // ~1.4142
      { text: "8/5", value: 1.6 },       // 1.6 (not 7/5=1.4 which would clash)
      { text: "1.7", value: 1.7 },
      { text: "√3", value: Math.sqrt(3) }, // ~1.7321
    ],
    [
      { text: "1/2", value: 0.5 },
      { text: "√0.5", value: Math.sqrt(0.5) }, // ~0.7071
      { text: "0.8", value: 0.8 },
      { text: "3/4", value: 0.75 },
      { text: "0.6", value: 0.6 },
    ],
    [
      { text: "√3", value: Math.sqrt(3) }, // ~1.7321
      { text: "9/5", value: 1.8 },
      { text: "2.1", value: 2.1 },
      { text: "√5", value: Math.sqrt(5) }, // ~2.2361
      { text: "7/4", value: 1.75 },
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 3: Surds ────────────────────────────────────────────────────────────
function genLevel3(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "√2", value: Math.SQRT2 },     // ~1.4142
      { text: "√3", value: Math.sqrt(3) },   // ~1.7321
      { text: "7/5", value: 1.4 },           // 1.4
      { text: "1.8", value: 1.8 },           // 1.8
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
    ],
    [
      { text: "√2", value: Math.SQRT2 },     // ~1.4142
      { text: "8/5", value: 1.6 },           // 1.6
      { text: "√3", value: Math.sqrt(3) },   // ~1.7321
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
      { text: "2.1", value: 2.1 },           // 2.1
    ],
    [
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
      { text: "5/2", value: 2.5 },           // 2.5
      { text: "√7", value: Math.sqrt(7) },   // ~2.6458
      { text: "2.4", value: 2.4 },           // 2.4
      { text: "√6", value: Math.sqrt(6) },   // ~2.4495
    ],
    [
      { text: "√3", value: Math.sqrt(3) },   // ~1.7321
      { text: "7/4", value: 1.75 },          // 1.75
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
      { text: "2.3", value: 2.3 },           // 2.3
      { text: "√7", value: Math.sqrt(7) },   // ~2.6458
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 4: Negative Numbers ─────────────────────────────────────────────────
function genLevel4(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "-√2", value: -Math.SQRT2 },   // ~ -1.4142
      { text: "-1.3", value: -1.3 },         // -1.3
      { text: "-7/5", value: -1.4 },         // -1.4
      { text: "0", value: 0 },               // 0
      { text: "√2", value: Math.SQRT2 },     // ~ 1.4142
    ],
    [
      { text: "-√3", value: -Math.sqrt(3) }, // ~ -1.7321
      { text: "-3/2", value: -1.5 },         // -1.5
      { text: "-1.8", value: -1.8 },         // -1.8
      { text: "-0.5", value: -0.5 },         // -0.5
      { text: "1/4", value: 0.25 },          // 0.25
    ],
    [
      { text: "-2.1", value: -2.1 },
      { text: "-√5", value: -Math.sqrt(5) }, // ~ -2.2361
      { text: "-7/4", value: -1.75 },
      { text: "-1", value: -1 },
      { text: "√3", value: Math.sqrt(3) },
    ],
    [
      { text: "-√2", value: -Math.SQRT2 },   // ~ -1.4142
      { text: "-0.9", value: -0.9 },
      { text: "-1/2", value: -0.5 },
      { text: "0.2", value: 0.2 },
      { text: "1/3", value: 1 / 3 },
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 5: Powers ───────────────────────────────────────────────────────────
function genLevel5(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "√7", value: Math.sqrt(7) },   // ~2.6458
      { text: "2³/10", value: 0.8 },         // 0.8
      { text: "1.5²", value: 2.25 },         // 2.25
      { text: "√3", value: Math.sqrt(3) },   // ~1.7321
      { text: "5/4", value: 1.25 },          // 1.25
    ],
    [
      { text: "1.2²", value: 1.44 },         // 1.44
      { text: "√2", value: Math.SQRT2 },     // ~1.4142
      { text: "2²", value: 4 },              // 4
      { text: "3²/4", value: 2.25 },         // 2.25
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
    ],
    [
      { text: "0.5²", value: 0.25 },
      { text: "2⁻¹", value: 0.5 },
      { text: "√0.8", value: Math.sqrt(0.8) }, // ~0.8944
      { text: "3³/30", value: 0.9 },           // 0.9
      { text: "1.1²", value: 1.21 },
    ],
    [
      { text: "1.4²", value: 1.96 },
      { text: "√3", value: Math.sqrt(3) },   // ~1.7321
      { text: "√5", value: Math.sqrt(5) },   // ~2.2361
      { text: "2³", value: 8 },
      { text: "7/3", value: 7 / 3 },         // ~2.3333
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 6: Mixed Expressions ────────────────────────────────────────────────
function genLevel6(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "√2", value: Math.SQRT2 },       // ~1.4142
      { text: "7/5", value: 1.4 },             // 1.4
      { text: "(3/2)²", value: 2.25 },         // 2.25
      { text: "√5", value: Math.sqrt(5) },     // ~2.2361
      { text: "1.73", value: 1.73 },           // 1.73
    ],
    [
      { text: "√3", value: Math.sqrt(3) },     // ~1.7321
      { text: "1.6²", value: 2.56 },           // 2.56
      { text: "√7", value: Math.sqrt(7) },     // ~2.6458
      { text: "8/3", value: 8 / 3 },           // ~2.6667
      { text: "2.4", value: 2.4 },             // 2.4
    ],
    [
      { text: "√10", value: Math.sqrt(10) },   // ~3.1623
      { text: "16/5", value: 3.2 },            // 3.2
      { text: "1.7²", value: 2.89 },           // 2.89
      { text: "√8", value: Math.sqrt(8) },     // ~2.8284
      { text: "3.1", value: 3.1 },             // 3.1
    ],
    [
      { text: "(4/3)²", value: 16 / 9 },       // ~1.7778
      { text: "√3", value: Math.sqrt(3) },     // ~1.7321
      { text: "7/4", value: 1.75 },            // 1.75
      { text: "1.8", value: 1.8 },             // 1.8
      { text: "√2", value: Math.SQRT2 },       // ~1.4142
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 7: Hard Mixed Numbers ───────────────────────────────────────────────
function genLevel7(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "√7", value: Math.sqrt(7) },     // ~2.6458
      { text: "17/6", value: 17 / 6 },         // ~2.8333
      { text: "(√3)²", value: 3 },             // 3
      { text: "1.72", value: 1.72 },           // 1.72
      { text: "-√2", value: -Math.SQRT2 },     // ~ -1.4142
    ],
    [
      { text: "-√3", value: -Math.sqrt(3) },   // ~ -1.7321
      { text: "(-1.2)²", value: 1.44 },        // 1.44
      { text: "√2", value: Math.SQRT2 },       // ~1.4142
      { text: "5/3", value: 5 / 3 },           // ~1.6667
      { text: "√5", value: Math.sqrt(5) },     // ~2.2361
    ],
    [
      { text: "-7/4", value: -1.75 },
      { text: "-√2", value: -Math.SQRT2 },     // ~ -1.4142
      { text: "2⁻²", value: 0.25 },            // 0.25
      { text: "√0.9", value: Math.sqrt(0.9) }, // ~0.9487
      { text: "1.1²", value: 1.21 },           // 1.21
    ],
    [
      { text: "-√5", value: -Math.sqrt(5) },
      { text: "-2.1", value: -2.1 },
      { text: "(1/2)³", value: 0.125 },
      { text: "√2", value: Math.SQRT2 },
      { text: "8/5", value: 1.6 },
    ],
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

// ── Level 8+: Close Numerical Values (Ultra Precision) ─────────────────────────
function genLevel8(): NumberItem[] {
  const pools: NumberItem[][] = [
    [
      { text: "7/5", value: 1.4 },             // 1.4000
      { text: "1.414", value: 1.414 },         // 1.4140
      { text: "√2", value: Math.SQRT2 },       // 1.41421356...
      { text: "1.415", value: 1.415 },         // 1.4150
      { text: "17/12", value: 17 / 12 },       // 1.41666667...
    ],
    [
      { text: "12/7", value: 12 / 7 },         // 1.71428571...
      { text: "1.73", value: 1.73 },           // 1.7300
      { text: "1.732", value: 1.732 },         // 1.7320
      { text: "√3", value: Math.sqrt(3) },     // 1.7320508...
      { text: "7/4", value: 1.75 },            // 1.7500
    ],
    [
      { text: "11/5", value: 2.2 },            // 2.2000
      { text: "2.23", value: 2.23 },           // 2.2300
      { text: "√5", value: Math.sqrt(5) },     // 2.23606798...
      { text: "2.24", value: 2.24 },           // 2.2400
      { text: "9/4", value: 2.25 },            // 2.2500
    ],
    [
      { text: "13/9", value: 13 / 9 },         // 1.444444...
      { text: "1.42", value: 1.42 },           // 1.4200
      { text: "√2", value: Math.SQRT2 },       // 1.41421356...
      { text: "√2.03", value: Math.sqrt(2.03) }, // 1.42478068...
      { text: "10/7", value: 10 / 7 },         // 1.42857143...
    ],
    [
      { text: "2.64", value: 2.64 },           // 2.6400
      { text: "√7", value: Math.sqrt(7) },     // 2.6457513...
      { text: "2.65", value: 2.65 },           // 2.6500
      { text: "16/6", value: 16 / 6 },         // 2.666666...
      { text: "8/3", value: 8 / 3 },           // 2.666666... (wait, 16/6 = 8/3! Replace 16/6 with 21/8=2.625)
    ],
  ];

  // Fix 5th pool so every value is strictly unique
  pools[4] = [
    { text: "21/8", value: 2.625 },          // 2.6250
    { text: "2.64", value: 2.64 },           // 2.6400
    { text: "√7", value: Math.sqrt(7) },     // 2.6457513...
    { text: "2.65", value: 2.65 },           // 2.6500
    { text: "8/3", value: 8 / 3 },           // 2.666666...
  ];

  return pools[Math.floor(Math.random() * pools.length)];
}

const LEVEL_GENERATORS: Record<number, () => NumberItem[]> = {
  1: genLevel1,
  2: genLevel2,
  3: genLevel3,
  4: genLevel4,
  5: genLevel5,
  6: genLevel6,
  7: genLevel7,
  8: genLevel8,
};

/**
 * Generates a Number Line Race round with 5 numbers
 * and calculates the mathematically exact ascending order.
 */
export function generateNumberLineQuestion(difficulty: number, lastKeys?: string[]): NumberLineQuestion {
  const effectiveLevel = Math.min(Math.max(1, difficulty), 8);
  const generator = LEVEL_GENERATORS[effectiveLevel] || genLevel8;

  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    const items = generator();

    // Verify all 5 values are strictly distinct
    const valueSet = new Set(items.map(it => it.value));
    if (valueSet.size !== 5) continue;

    // Check anti-repetition: don't generate identical set as lastKeys
    const itemTexts = items.map(it => it.text).sort().join(",");
    if (lastKeys && lastKeys.sort().join(",") === itemTexts && attempts < 9) {
      continue;
    }

    // Sort ascending by true numerical value
    const sorted = [...items].sort((a, b) => a.value - b.value);
    const correctOrder = sorted.map(it => it.text);

    // Shuffled choices to display at bottom
    // Make sure initial shuffled display is NOT already in correct ascending order
    let shuffledTexts = shuffle(items.map(it => it.text));
    if (shuffledTexts.every((t, i) => t === correctOrder[i])) {
      shuffledTexts = [shuffledTexts[1], shuffledTexts[0], ...shuffledTexts.slice(2)];
    }

    return {
      numbers: shuffledTexts,
      correctOrder,
      items: sorted,
      difficulty: effectiveLevel,
    };
  }

  // Fallback
  const fallback = genLevel1();
  const sorted = [...fallback].sort((a, b) => a.value - b.value);
  return {
    numbers: shuffle(fallback.map(f => f.text)),
    correctOrder: sorted.map(s => s.text),
    items: sorted,
    difficulty: effectiveLevel,
  };
}
