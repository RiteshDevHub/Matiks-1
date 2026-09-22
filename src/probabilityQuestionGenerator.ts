// Dynamic Probability Question Generator
// Generates mathematically verified probability questions across 9 difficulty levels
// based strictly on the current ball configuration.

export interface BallCounts {
  R: number; // Red
  B: number; // Blue
  G: number; // Green
}

export interface GeneratedQuestion {
  question: string;
  numerator: number;
  denominator: number;
  difficulty: number; // 1 to 9
  draws: number;      // 1, 2, or 3
}

export type ColorKey = "R" | "B" | "G";
export const COLOR_KEYS: ColorKey[] = ["R", "B", "G"];

const COLOR_NAMES: Record<ColorKey, string> = {
  R: "Red",
  B: "Blue",
  G: "Green",
};

export function colorName(k: ColorKey): string {
  return COLOR_NAMES[k];
}

/**
 * Returns all valid questions for a given difficulty level (1 to 9)
 * based on the exact current ball counts.
 */
export function getValidQuestionsForLevel(c: BallCounts, level: number): GeneratedQuestion[] {
  const total = c.R + c.B + c.G;
  if (total <= 0) return [];

  const questions: GeneratedQuestion[] = [];
  const den2 = total * (total - 1);
  const den3 = total * (total - 1) * (total - 2);

  switch (level) {
    // ── Level 1: Single draw ──
    // P(R) = ?, P(B) = ?, P(G) = ?
    case 1: {
      for (const k of COLOR_KEYS) {
        if (c[k] > 0) {
          questions.push({
            question: `P(${k}) = ?`,
            numerator: c[k],
            denominator: total,
            difficulty: 1,
            draws: 1,
          });
        }
      }
      break;
    }

    // ── Level 2: NOT ──
    // P(not R) = ?, P(not G) = ?, P(not B) = ?
    case 2: {
      for (const k of COLOR_KEYS) {
        if (c[k] > 0 && total - c[k] > 0) {
          questions.push({
            question: `P(not ${k}) = ?`,
            numerator: total - c[k],
            denominator: total,
            difficulty: 2,
            draws: 1,
          });
        }
      }
      break;
    }

    // ── Level 3: OR ──
    // Single draw: P(R or B) = ?, P(G or B) = ?
    case 3: {
      for (let i = 0; i < COLOR_KEYS.length; i++) {
        for (let j = i + 1; j < COLOR_KEYS.length; j++) {
          const ki = COLOR_KEYS[i], kj = COLOR_KEYS[j];
          if (c[ki] > 0 && c[kj] > 0) {
            questions.push({
              question: `P(${ki} or ${kj}) = ?`,
              numerator: c[ki] + c[kj],
              denominator: total,
              difficulty: 3,
              draws: 1,
            });
          }
        }
      }
      break;
    }

    // ── Level 4: AND ──
    // Two draws without replacement, both orders considered: P(R and B) = ?
    case 4: {
      if (total >= 2) {
        for (let i = 0; i < COLOR_KEYS.length; i++) {
          for (let j = i + 1; j < COLOR_KEYS.length; j++) {
            const ki = COLOR_KEYS[i], kj = COLOR_KEYS[j];
            if (c[ki] > 0 && c[kj] > 0) {
              questions.push({
                question: `P(${ki} and ${kj}) = ?`,
                numerator: 2 * c[ki] * c[kj],
                denominator: den2,
                difficulty: 4,
                draws: 2,
              });
            }
          }
        }
      }
      break;
    }

    // ── Level 5: Two draws without replacement ──
    // Specific sequence or same-color: P(2 Red) = ?, P(R then B) = ?
    case 5: {
      if (total >= 2) {
        // Same-color pairs: P(2 Red) = ?
        for (const k of COLOR_KEYS) {
          if (c[k] >= 2) {
            questions.push({
              question: `P(2 ${COLOR_NAMES[k]}) = ?`,
              numerator: c[k] * (c[k] - 1),
              denominator: den2,
              difficulty: 5,
              draws: 2,
            });
          }
        }
        // Ordered sequence: P(R then B) = ?
        for (const ki of COLOR_KEYS) {
          for (const kj of COLOR_KEYS) {
            if (ki !== kj && c[ki] > 0 && c[kj] > 0) {
              questions.push({
                question: `P(${ki} then ${kj}) = ?`,
                numerator: c[ki] * c[kj],
                denominator: den2,
                difficulty: 5,
                draws: 2,
              });
            }
          }
        }
      }
      break;
    }

    // ── Level 6: Exactly one ──
    // Two draws without replacement: P(exactly one Red) = ?
    // Accounts for both orders: R -> non-R, non-R -> R
    case 6: {
      if (total >= 2) {
        for (const k of COLOR_KEYS) {
          const count = c[k];
          const other = total - count;
          if (count > 0 && other > 0) {
            questions.push({
              question: `P(exactly one ${COLOR_NAMES[k]}) = ?`,
              numerator: 2 * count * other,
              denominator: den2,
              difficulty: 6,
              draws: 2,
            });
          }
        }
      }
      break;
    }

    // ── Level 7: At least one ──
    // Two draws without replacement: P(at least one Red) = ?
    // Complement: 1 - P(no R)
    case 7: {
      if (total >= 2) {
        for (const k of COLOR_KEYS) {
          const count = c[k];
          const other = total - count;
          if (count > 0 && other >= 0) {
            const noK = other * (other - 1);
            questions.push({
              question: `P(at least one ${COLOR_NAMES[k]}) = ?`,
              numerator: den2 - noK,
              denominator: den2,
              difficulty: 7,
              draws: 2,
            });
          }
        }
      }
      break;
    }

    // ── Level 8: Same / Different colour ──
    // Two draws without replacement: P(same colour) = ?, P(different colours) = ?
    case 8: {
      if (total >= 2) {
        const samePairs = COLOR_KEYS.reduce((sum, k) => sum + c[k] * (c[k] - 1), 0);
        if (samePairs > 0) {
          questions.push({
            question: "P(same colour) = ?",
            numerator: samePairs,
            denominator: den2,
            difficulty: 8,
            draws: 2,
          });
        }
        if (den2 - samePairs > 0) {
          questions.push({
            question: "P(different colours) = ?",
            numerator: den2 - samePairs,
            denominator: den2,
            difficulty: 8,
            draws: 2,
          });
        }
      }
      break;
    }

    // ── Level 9: Three draws ──
    // Three draws without replacement
    case 9: {
      if (total >= 3) {
        // P(3 Red) = ? (only if count >= 3)
        for (const k of COLOR_KEYS) {
          if (c[k] >= 3) {
            questions.push({
              question: `P(3 ${COLOR_NAMES[k]}) = ?`,
              numerator: c[k] * (c[k] - 1) * (c[k] - 2),
              denominator: den3,
              difficulty: 9,
              draws: 3,
            });
          }
        }

        // P(at least one Red in 3 draws) = ?
        for (const k of COLOR_KEYS) {
          const other = total - c[k];
          if (c[k] > 0 && other >= 0) {
            const noK3 = other >= 3 ? other * (other - 1) * (other - 2) : 0;
            questions.push({
              question: `P(at least one ${COLOR_NAMES[k]} in 3 draws) = ?`,
              numerator: den3 - noK3,
              denominator: den3,
              difficulty: 9,
              draws: 3,
            });
          }
        }

        // P(exactly one Blue in 3 draws) = ?
        // 3 permutations of (1 of k, 2 of others)
        for (const k of COLOR_KEYS) {
          const other = total - c[k];
          if (c[k] > 0 && other >= 2) {
            questions.push({
              question: `P(exactly one ${COLOR_NAMES[k]} in 3 draws) = ?`,
              numerator: 3 * c[k] * other * (other - 1),
              denominator: den3,
              difficulty: 9,
              draws: 3,
            });
          }
        }

        // P(all three balls are different colours) = ?
        if (c.R >= 1 && c.B >= 1 && c.G >= 1) {
          questions.push({
            question: "P(all three balls are different colours) = ?",
            numerator: 6 * c.R * c.B * c.G,
            denominator: den3,
            difficulty: 9,
            draws: 3,
          });
        }
      }
      break;
    }
  }

  return questions;
}

/**
 * Dynamically generates a question for the requested difficulty level (1..9+).
 * Avoids repeating already asked questions if alternatives exist.
 * If questions at the current level are exhausted, gracefully picks an unasked or new question.
 */
export function generateQuestion(
  c: BallCounts,
  requestedLevel: number,
  askedQuestions?: Set<string>
): GeneratedQuestion {
  const targetLevel = Math.max(1, Math.min(requestedLevel, 9));

  // Try the target level
  const levelQuestions = getValidQuestionsForLevel(c, targetLevel);
  const unasked = askedQuestions
    ? levelQuestions.filter(q => !askedQuestions.has(q.question))
    : levelQuestions;

  if (unasked.length > 0) {
    return unasked[Math.floor(Math.random() * unasked.length)];
  }

  // If all questions at this level were already asked, return any valid question from this level
  if (levelQuestions.length > 0) {
    return levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
  }

  // Fallback to closest available level if current level had no valid questions
  for (let offset = 1; offset <= 8; offset++) {
    for (const lvl of [targetLevel - offset, targetLevel + offset]) {
      if (lvl >= 1 && lvl <= 9) {
        const fallbackList = getValidQuestionsForLevel(c, lvl);
        if (fallbackList.length > 0) {
          return fallbackList[Math.floor(Math.random() * fallbackList.length)];
        }
      }
    }
  }

  // Absolute fallback: Level 1 with first existing color
  const total = c.R + c.B + c.G;
  for (const k of COLOR_KEYS) {
    if (c[k] > 0) {
      return {
        question: `P(${k}) = ?`,
        numerator: c[k],
        denominator: total,
        difficulty: 1,
        draws: 1,
      };
    }
  }

  return {
    question: "P(R) = ?",
    numerator: 1,
    denominator: 1,
    difficulty: 1,
    draws: 1,
  };
}
