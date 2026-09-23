// Dice Detective Dynamic Question Generator
// Evaluates mathematical conditions across all 36 sample space outcomes of 2 dice.

export interface DiceQuestion {
  text: string;
  difficulty: number;
  correctOutcomes: Array<[number, number]>;
  correctKeys: Set<string>; // "d1-d2"
}

interface QuestionTemplate {
  text: string | ((param: any) => string);
  predicate: (d1: number, d2: number, param?: any) => boolean;
  params?: any[];
}

// ── Level 1: Exact Sum ──────────────────────────────────────────────────────────
const LEVEL_1_TEMPLATES: QuestionTemplate[] = [
  {
    text: target => `Select all outcomes where the sum equals ${target}.`,
    predicate: (d1, d2, target) => d1 + d2 === target,
    params: [5, 6, 7, 8, 9, 10], // Avoid 2 and 12 (too trivial)
  },
];

// ── Level 2: Even / Odd ────────────────────────────────────────────────────────
const LEVEL_2_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where the sum is even.",
    predicate: (d1, d2) => (d1 + d2) % 2 === 0,
  },
  {
    text: "Select all outcomes where the sum is odd.",
    predicate: (d1, d2) => (d1 + d2) % 2 !== 0,
  },
  {
    text: "Select all outcomes where the product is odd.",
    predicate: (d1, d2) => (d1 * d2) % 2 !== 0,
  },
  {
    text: "Select all outcomes where Die 1 is even and Die 2 is odd.",
    predicate: (d1, d2) => d1 % 2 === 0 && d2 % 2 !== 0,
  },
  {
    text: "Select all outcomes where both dice are even.",
    predicate: (d1, d2) => d1 % 2 === 0 && d2 % 2 === 0,
  },
  {
    text: "Select all outcomes where both dice are odd.",
    predicate: (d1, d2) => d1 % 2 !== 0 && d2 % 2 !== 0,
  },
];

// ── Level 3: Comparison ───────────────────────────────────────────────────────
const LEVEL_3_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where Die 1 is greater than Die 2.",
    predicate: (d1, d2) => d1 > d2,
  },
  {
    text: "Select all outcomes where Die 1 is less than Die 2.",
    predicate: (d1, d2) => d1 < d2,
  },
  {
    text: "Select all outcomes where the two dice are equal.",
    predicate: (d1, d2) => d1 === d2,
  },
  {
    text: "Select all outcomes where Die 1 is at least 2 greater than Die 2.",
    predicate: (d1, d2) => d1 >= d2 + 2,
  },
  {
    text: "Select all outcomes where Die 2 is at least 2 greater than Die 1.",
    predicate: (d1, d2) => d2 >= d1 + 2,
  },
];

// ── Level 4: Product ──────────────────────────────────────────────────────────
const LEVEL_4_TEMPLATES: QuestionTemplate[] = [
  {
    text: target => `Select all outcomes where the product of the two dice is ${target}.`,
    predicate: (d1, d2, target) => d1 * d2 === target,
    params: [6, 8, 12, 16, 20, 24],
  },
  {
    text: "Select all outcomes where the product is greater than 15.",
    predicate: (d1, d2) => d1 * d2 > 15,
  },
  {
    text: "Select all outcomes where the product is less than 10.",
    predicate: (d1, d2) => d1 * d2 < 10,
  },
  {
    text: "Select all outcomes where the product is between 10 and 20.",
    predicate: (d1, d2) => d1 * d2 >= 10 && d1 * d2 <= 20,
  },
];

// ── Level 5: OR Conditions ────────────────────────────────────────────────────
const LEVEL_5_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where the sum is 7 OR the dice are equal.",
    predicate: (d1, d2) => d1 + d2 === 7 || d1 === d2,
  },
  {
    text: "Select all outcomes where the product is 12 OR the sum is 10.",
    predicate: (d1, d2) => d1 * d2 === 12 || d1 + d2 === 10,
  },
  {
    text: "Select all outcomes where Die 1 is 6 OR Die 2 is 6.",
    predicate: (d1, d2) => d1 === 6 || d2 === 6,
  },
  {
    text: "Select all outcomes where the sum is 5 OR the sum is 9.",
    predicate: (d1, d2) => d1 + d2 === 5 || d1 + d2 === 9,
  },
  {
    text: "Select all outcomes where the product is 6 OR the product is 8.",
    predicate: (d1, d2) => d1 * d2 === 6 || d1 * d2 === 8,
  },
];

// ── Level 6: AND Conditions ───────────────────────────────────────────────────
const LEVEL_6_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where Die 1 is even AND Die 2 is greater than 3.",
    predicate: (d1, d2) => d1 % 2 === 0 && d2 > 3,
  },
  {
    text: "Select all outcomes where the sum is greater than 7 AND Die 1 is odd.",
    predicate: (d1, d2) => d1 + d2 > 7 && d1 % 2 !== 0,
  },
  {
    text: "Select all outcomes where the product is even AND the sum is 8.",
    predicate: (d1, d2) => (d1 * d2) % 2 === 0 && d1 + d2 === 8,
  },
  {
    text: "Select all outcomes where Die 1 < 4 AND Die 2 is even.",
    predicate: (d1, d2) => d1 < 4 && d2 % 2 === 0,
  },
  {
    text: "Select all outcomes where the sum is less than 8 AND Die 2 > Die 1.",
    predicate: (d1, d2) => d1 + d2 < 8 && d2 > d1,
  },
];

// ── Level 7: Compound Conditions ──────────────────────────────────────────────
const LEVEL_7_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where the sum is greater than 8 AND the product is even.",
    predicate: (d1, d2) => d1 + d2 > 8 && (d1 * d2) % 2 === 0,
  },
  {
    text: "Select all outcomes where the sum is less than 6 OR the product is greater than 15.",
    predicate: (d1, d2) => d1 + d2 < 6 || d1 * d2 > 15,
  },
  {
    text: "Select all outcomes where Die 1 + Die 2 is even AND Die 1 ≠ Die 2.",
    predicate: (d1, d2) => (d1 + d2) % 2 === 0 && d1 !== d2,
  },
  {
    text: "Select all outcomes where the product is odd AND the sum is greater than 5.",
    predicate: (d1, d2) => (d1 * d2) % 2 !== 0 && d1 + d2 > 5,
  },
  {
    text: "Select all outcomes where the sum is 6 OR (Die 1 is 4 AND Die 2 is even).",
    predicate: (d1, d2) => d1 + d2 === 6 || (d1 === 4 && d2 % 2 === 0),
  },
];

// ── Level 8: Advanced Relationships ───────────────────────────────────────────
const LEVEL_8_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where the difference between the dice is 2.",
    predicate: (d1, d2) => Math.abs(d1 - d2) === 2,
  },
  {
    text: "Select all outcomes where the difference between the dice is 3.",
    predicate: (d1, d2) => Math.abs(d1 - d2) === 3,
  },
  {
    text: "Select all outcomes where the product is greater than the sum.",
    predicate: (d1, d2) => d1 * d2 > d1 + d2,
  },
  {
    text: "Select all outcomes where the sum is a multiple of 3.",
    predicate: (d1, d2) => (d1 + d2) % 3 === 0,
  },
  {
    text: "Select all outcomes where the product is a multiple of 4.",
    predicate: (d1, d2) => (d1 * d2) % 4 === 0,
  },
  {
    text: "Select all outcomes where the sum is a prime number.",
    predicate: (d1, d2) => [2, 3, 5, 7, 11].includes(d1 + d2),
  },
];

// ── Level 9: Advanced Compound Conditions ─────────────────────────────────────
const LEVEL_9_TEMPLATES: QuestionTemplate[] = [
  {
    text: "Select all outcomes where the sum is greater than 7 AND the difference between the dice is odd.",
    predicate: (d1, d2) => d1 + d2 > 7 && Math.abs(d1 - d2) % 2 !== 0,
  },
  {
    text: "Select all outcomes where the product is even AND the sum is greater than 8.",
    predicate: (d1, d2) => (d1 * d2) % 2 === 0 && d1 + d2 > 8,
  },
  {
    text: "Select all outcomes where Die 1 is odd AND the product is greater than 10.",
    predicate: (d1, d2) => d1 % 2 !== 0 && d1 * d2 > 10,
  },
  {
    text: "Select all outcomes where the sum is divisible by 3 OR the dice are equal.",
    predicate: (d1, d2) => (d1 + d2) % 3 === 0 || d1 === d2,
  },
  {
    text: "Select all outcomes where the difference between dice is even AND the product is a multiple of 3.",
    predicate: (d1, d2) => Math.abs(d1 - d2) % 2 === 0 && (d1 * d2) % 3 === 0,
  },
  {
    text: "Select all outcomes where the product is less than 15 AND the sum is odd.",
    predicate: (d1, d2) => d1 * d2 < 15 && (d1 + d2) % 2 !== 0,
  },
];

const LEVEL_MAP: Record<number, QuestionTemplate[]> = {
  1: LEVEL_1_TEMPLATES,
  2: LEVEL_2_TEMPLATES,
  3: LEVEL_3_TEMPLATES,
  4: LEVEL_4_TEMPLATES,
  5: LEVEL_5_TEMPLATES,
  6: LEVEL_6_TEMPLATES,
  7: LEVEL_7_TEMPLATES,
  8: LEVEL_8_TEMPLATES,
  9: LEVEL_9_TEMPLATES,
};

/**
 * Evaluates a condition over all 36 outcomes of 2 dice (1-6)
 */
function evaluateCondition(
  predicate: (d1: number, d2: number, param?: any) => boolean,
  param?: any
): Array<[number, number]> {
  const outcomes: Array<[number, number]> = [];
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (predicate(d1, d2, param)) {
        outcomes.push([d1, d2]);
      }
    }
  }
  return outcomes;
}

/**
 * Generates a dynamic Dice Detective question for the given difficulty (1-9)
 */
export function generateDiceQuestion(difficulty: number, lastQuestionText?: string): DiceQuestion {
  // Clamp difficulty to 1..9 (level 9+ uses level 9 templates)
  const effectiveLevel = Math.min(Math.max(1, difficulty), 9);
  const templates = LEVEL_MAP[effectiveLevel] || LEVEL_9_TEMPLATES;

  // Shuffle and pick a candidate that is not identical to lastQuestionText
  const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5);

  for (const t of shuffledTemplates) {
    let chosenParam: any = undefined;
    if (t.params && t.params.length > 0) {
      const shuffledParams = [...t.params].sort(() => Math.random() - 0.5);
      chosenParam = shuffledParams[0];
    }

    const questionText = typeof t.text === "function" ? t.text(chosenParam) : t.text;

    if (questionText === lastQuestionText && shuffledTemplates.length > 1) {
      continue;
    }

    const correctOutcomes = evaluateCondition(t.predicate, chosenParam);

    // Validate that the question has at least 2 and at most 34 outcomes
    if (correctOutcomes.length < 2 || correctOutcomes.length > 34) {
      continue;
    }

    const correctKeys = new Set(correctOutcomes.map(([d1, d2]) => `${d1}-${d2}`));

    return {
      text: questionText,
      difficulty: effectiveLevel,
      correctOutcomes,
      correctKeys,
    };
  }

  // Fallback to classic sum = 7
  const fallbackOutcomes = evaluateCondition((d1, d2) => d1 + d2 === 7);
  return {
    text: "Select all outcomes where the sum equals 7.",
    difficulty: effectiveLevel,
    correctOutcomes: fallbackOutcomes,
    correctKeys: new Set(fallbackOutcomes.map(([d1, d2]) => `${d1}-${d2}`)),
  };
}
