// Poker Odds Dynamic Question Generator
// Handles standard 52-card deck dealing, diverse poker situations, dynamic out counting,
// mathematically exact probabilities, and deterministic winning revealed cards.

export type CardSuit  = "Heart" | "Diamond" | "Clubs" | "Spades";
export type CardValue = "2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"Jack"|"Queen"|"King"|"Ace";

export interface CardData {
  suit: CardSuit;
  value: CardValue;
}

export interface PokerScenario {
  typeId: string;
  questionText: string;
  numerator: number;
  denominator: number;
  difficulty: number;
  hiddenCount: number; // 1 or 2
  hand: CardData[];      // 2 player cards
  community: CardData[]; // 5 community cards (first 3 flop, 4th turn, 5th river)
}

export interface RecentRoundInfo {
  typeId: string;
  numerator: number;
  denominator: number;
}

export const SUITS: CardSuit[] = ["Heart", "Diamond", "Clubs", "Spades"];
export const VALUES: CardValue[] = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"
];

export const SUIT_SYM: Record<CardSuit, string> = {
  Heart: "♥",
  Diamond: "♦",
  Clubs: "♣",
  Spades: "♠",
};

export const RANK_LBL: Record<CardValue, string> = {
  Ace: "A", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6",
  "7": "7", "8": "8", "9": "9", "10": "10", Jack: "J", Queen: "Q", King: "K",
};

export const RANK_NUM: Record<CardValue, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, Jack: 11, Queen: 12, King: 13, Ace: 14,
};

export function buildDeck(): CardData[] {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardEquals(a: CardData, b: CardData): boolean {
  return a.suit === b.suit && a.value === b.value;
}

export function hasStraight(cards: CardData[]): boolean {
  const rankNums = new Set<number>();
  for (const c of cards) {
    const val = RANK_NUM[c.value];
    rankNums.add(val);
    if (val === 14) rankNums.add(1); // Ace-low in A-2-3-4-5
  }
  for (const r of rankNums) {
    if (
      rankNums.has(r) &&
      rankNums.has(r + 1) &&
      rankNums.has(r + 2) &&
      rankNums.has(r + 3) &&
      rankNums.has(r + 4)
    ) {
      return true;
    }
  }
  return false;
}

function extractCard(deck: CardData[], predicate: (c: CardData) => boolean): { card: CardData; remaining: CardData[] } {
  const idx = deck.findIndex(predicate);
  if (idx === -1) throw new Error("Card not found in deck");
  const card = deck[idx];
  const remaining = [...deck.slice(0, idx), ...deck.slice(idx + 1)];
  return { card, remaining };
}

// ── 1. Pair Any Visible Card (15 Outs) ──
function generatePairAllVisible(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value !== h1.value);
  pool = r1;

  const usedValues = new Set([h1.value, h2.value]);

  const f1 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f1));
  usedValues.add(f1.value);

  const f2 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f2));
  usedValues.add(f2.value);

  const f3 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  const knownRanks = new Set(known.map(c => c.value));
  // Dynamic calculation: filter complete unseen 47-card deck
  const outsCards = pool.filter(c => knownRanks.has(c.value)); // 15 cards

  // Deterministic winning card reveal: pick a card from outs for the turn card
  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "pair_all_visible",
    questionText: "What is the probability that the next card gives you a pair?",
    numerator: outsCards.length, // 15
    denominator: 52 - known.length, // 47
    difficulty: 1,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 2. Three of a Kind from Pocket Pair (2 Outs) ──
function generateThreeOfAKind(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value === h1.value);
  pool = r1;

  const usedValues = new Set([h1.value]);

  const f1 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f1));
  usedValues.add(f1.value);

  const f2 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f2));
  usedValues.add(f2.value);

  const f3 = pool.find(c => !usedValues.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Dynamic calculation: remaining cards matching the pocket pair rank
  const outsCards = pool.filter(c => c.value === h1.value); // exactly 2 remaining

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "three_of_a_kind",
    questionText: "What is the probability that the next card gives you three of a kind?",
    numerator: outsCards.length, // 2
    denominator: 52 - known.length, // 47
    difficulty: 2,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 3. Open-Ended Straight Draw (8 Outs) ──
function generateOpenEndedStraight(deck: CardData[]): PokerScenario {
  const baseStarts = [3, 4, 5, 6, 7, 8, 9];
  const startRank = baseStarts[Math.floor(Math.random() * baseStarts.length)];
  const straightRanks = [startRank, startRank + 1, startRank + 2, startRank + 3];

  let pool = [...deck];
  const drawCards: CardData[] = [];

  for (const r of straightRanks) {
    const val = VALUES.find(v => RANK_NUM[v] === r)!;
    const { card, remaining } = extractCard(pool, c => c.value === val);
    drawCards.push(card);
    pool = remaining;
  }

  const shuffledDraw = shuffle(drawCards);
  const h1 = shuffledDraw[0];
  const h2 = shuffledDraw[1];
  const f1 = shuffledDraw[2];
  const f2 = shuffledDraw[3];

  // 3rd flop card separated from straight
  const f3 = pool.find(c => {
    const testHand = [h1, h2, f1, f2, c];
    const rank = RANK_NUM[c.value];
    const isSeparated = straightRanks.every(sr => Math.abs(sr - rank) >= 2);
    return !hasStraight(testHand) && isSeparated;
  }) ?? pool.find(c => !hasStraight([h1, h2, f1, f2, c]))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Dynamic calculation: any unseen card that completes a straight
  const outsCards = pool.filter(c => hasStraight([...known, c])); // 8 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "open_ended_straight",
    questionText: "What is the probability that the next card completes a straight?",
    numerator: outsCards.length, // 8
    denominator: 52 - known.length, // 47
    difficulty: 3,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 4. Complete a Flush (9 Outs) ──
function generateFlushDraw(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const targetSuit = SUITS[Math.floor(Math.random() * SUITS.length)];

  const flushCards: CardData[] = [];
  for (let i = 0; i < 4; i++) {
    const { card, remaining } = extractCard(pool, c => c.suit === targetSuit);
    flushCards.push(card);
    pool = remaining;
  }

  const { card: offSuitCard, remaining: rOff } = extractCard(pool, c => c.suit !== targetSuit);
  pool = rOff;

  const shuffledFlush = shuffle(flushCards);
  const h1 = shuffledFlush[0];
  const h2 = shuffledFlush[1];
  const f1 = shuffledFlush[2];
  const f2 = shuffledFlush[3];
  const f3 = offSuitCard;

  const known = [h1, h2, f1, f2, f3];
  // Dynamic calculation: remaining unseen cards of targetSuit
  const outsCards = pool.filter(c => c.suit === targetSuit); // 9 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "flush",
    questionText: "What is the probability that the next card completes a flush?",
    numerator: outsCards.length, // 9
    denominator: 52 - known.length, // 47
    difficulty: 4,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 5. Two Pair or Three of a Kind (11 Outs) ──
function generatePairOrTrips(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  // Player holds a pocket pair
  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value === h1.value);
  pool = r1;

  const used = new Set([h1.value]);
  const f1 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f1));
  used.add(f1.value);

  const f2 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f2));
  used.add(f2.value);

  const f3 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // 2 remaining of pocket pair rank (gives 3 of a kind) + 3*3 remaining of board ranks (gives 2 pair)
  const outsCards = pool.filter(
    c => c.value === h1.value || c.value === f1.value || c.value === f2.value || c.value === f3.value
  ); // 2 + 9 = 11 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "pair_or_trips",
    questionText: "What is the probability that the next card gives you two pair or three of a kind?",
    numerator: outsCards.length, // 11
    denominator: 52 - known.length, // 47
    difficulty: 3,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 6. Inside / Gutshot Straight Draw (4 Outs) ──
function generateGutshotStraight(deck: CardData[]): PokerScenario {
  // Pattern: ranks r, r+1, r+3, r+4 (missing r+2)
  const baseStarts = [3, 4, 5, 6, 7, 8, 9];
  const startRank = baseStarts[Math.floor(Math.random() * baseStarts.length)];
  const neededRank = startRank + 2;
  const straightRanks = [startRank, startRank + 1, startRank + 3, startRank + 4];

  let pool = [...deck];
  const drawCards: CardData[] = [];

  for (const r of straightRanks) {
    const val = VALUES.find(v => RANK_NUM[v] === r)!;
    const { card, remaining } = extractCard(pool, c => c.value === val);
    drawCards.push(card);
    pool = remaining;
  }

  const shuffledDraw = shuffle(drawCards);
  const h1 = shuffledDraw[0];
  const h2 = shuffledDraw[1];
  const f1 = shuffledDraw[2];
  const f2 = shuffledDraw[3];

  const neededVal = VALUES.find(v => RANK_NUM[v] === neededRank)!;

  // 3rd flop card separated
  const f3 = pool.find(c => {
    const testHand = [h1, h2, f1, f2, c];
    const rank = RANK_NUM[c.value];
    const isSeparated = Math.abs(rank - neededRank) >= 2 && straightRanks.every(sr => Math.abs(sr - rank) >= 2);
    return !hasStraight(testHand) && isSeparated;
  }) ?? pool.find(c => !hasStraight([h1, h2, f1, f2, c]))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Dynamic calculation: cards completing the straight
  const outsCards = pool.filter(c => c.value === neededVal); // 4 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "gutshot_straight",
    questionText: "What is the probability that the next card completes a straight?",
    numerator: outsCards.length, // 4
    denominator: 52 - known.length, // 47
    difficulty: 4,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 7. Multiple Hidden Cards: Flush by River (378 / 1081) ──
function generateFlushByRiver(deck: CardData[]): PokerScenario {
  const base = generateFlushDraw(deck);
  return {
    ...base,
    typeId: "flush_river",
    questionText: "What is the probability of completing a flush by the river?",
    numerator: 378,
    denominator: 1081,
    difficulty: 5,
    hiddenCount: 2,
  };
}

// ── 8. Pair One of Your Hole Cards Only (6 Outs) ──
function generatePairHoleCardsOnly(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value !== h1.value);
  pool = r1;

  const holeRanks = new Set([h1.value, h2.value]);

  const f1 = pool.find(c => !holeRanks.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f1));
  holeRanks.add(f1.value);

  const f2 = pool.find(c => !holeRanks.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f2));
  holeRanks.add(f2.value);

  const f3 = pool.find(c => !holeRanks.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Dynamic calculation: cards matching either hole card
  const outsCards = pool.filter(c => c.value === h1.value || c.value === h2.value); // 6 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "pair_hole_cards",
    questionText: "What is the probability that the next card pairs one of your hole cards?",
    numerator: outsCards.length, // 6
    denominator: 52 - known.length, // 47
    difficulty: 3,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 9. Multiple Hidden Cards: Straight by River (340 / 1081) ──
function generateStraightByRiver(deck: CardData[]): PokerScenario {
  const base = generateOpenEndedStraight(deck);
  return {
    ...base,
    typeId: "straight_river",
    questionText: "What is the probability of completing a straight by the river?",
    numerator: 340,
    denominator: 1081,
    difficulty: 5,
    hiddenCount: 2,
  };
}

// ── 10. Pair a Specific Hole Card (3 Outs) ──
function generatePairSpecificHoleCard(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value !== h1.value);
  pool = r1;

  const used = new Set([h1.value, h2.value]);

  const f1 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f1));
  used.add(f1.value);

  const f2 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f2));
  used.add(f2.value);

  const f3 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Target rank is h1.value
  const targetRankLbl = RANK_LBL[h1.value];
  const outsCards = pool.filter(c => c.value === h1.value); // 3 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "pair_specific",
    questionText: `What is the probability that the next card pairs your ${targetRankLbl}?`,
    numerator: outsCards.length, // 3
    denominator: 52 - known.length, // 47
    difficulty: 2,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

// ── 11. Multiple Hidden Cards: Three of a Kind by River (91 / 1081) ──
function generateSetByRiver(deck: CardData[]): PokerScenario {
  const base = generateThreeOfAKind(deck);
  return {
    ...base,
    typeId: "set_river",
    questionText: "What is the probability of making three of a kind by the river?",
    numerator: 91,
    denominator: 1081,
    difficulty: 5,
    hiddenCount: 2,
  };
}

// ── 12. Board Pair — Make Two Pair (6 Outs) ──
function generateTwoPairFromBoardPair(deck: CardData[]): PokerScenario {
  let pool = [...deck];
  const h1 = pool[0];
  pool = pool.slice(1);

  const { card: h2, remaining: r1 } = extractCard(pool, c => c.value !== h1.value);
  pool = r1;

  // Board has a pair of rank != h1 and != h2
  const boardPairRank = VALUES.find(v => v !== h1.value && v !== h2.value)!;
  const { card: f1, remaining: r2 } = extractCard(pool, c => c.value === boardPairRank);
  pool = r2;
  const { card: f2, remaining: r3 } = extractCard(pool, c => c.value === boardPairRank);
  pool = r3;

  const used = new Set([h1.value, h2.value, boardPairRank]);
  const f3 = pool.find(c => !used.has(c.value))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  const known = [h1, h2, f1, f2, f3];
  // Hitting either hole card gives Two Pair
  const outsCards = pool.filter(c => c.value === h1.value || c.value === h2.value); // 6 cards

  const winningTurn = outsCards[Math.floor(Math.random() * outsCards.length)];
  pool = pool.filter(c => !cardEquals(c, winningTurn));
  const river = pool[0];

  return {
    typeId: "two_pair_board",
    questionText: "What is the probability that the next card gives you two pair?",
    numerator: outsCards.length, // 6
    denominator: 52 - known.length, // 47
    difficulty: 4,
    hiddenCount: 1,
    hand: [h1, h2],
    community: [f1, f2, f3, winningTurn, river],
  };
}

/**
 * Ordered list of distinct generators ensuring variety across difficulty levels.
 */
const SCENARIO_GENERATORS: Array<(deck: CardData[]) => PokerScenario> = [
  generatePairAllVisible,         // 1: 15/47 (Pair any visible)
  generateThreeOfAKind,           // 2: 2/47  (Three of a Kind)
  generateOpenEndedStraight,      // 3: 8/47  (Straight)
  generateFlushDraw,              // 4: 9/47  (Flush)
  generatePairOrTrips,            // 5: 11/47 (Two pair or three of a kind)
  generateGutshotStraight,        // 6: 4/47  (Gutshot Straight)
  generateFlushByRiver,           // 7: 378/1081 (River Flush)
  generatePairHoleCardsOnly,      // 8: 6/47  (Pair Hole Cards)
  generateStraightByRiver,        // 9: 340/1081 (River Straight)
  generatePairSpecificHoleCard,   // 10: 3/47 (Pair Specific Hole Card)
  generateSetByRiver,             // 11: 91/1081 (River Set)
  generateTwoPairFromBoardPair,   // 12: 6/47 (Two Pair from Board Pair)
];

/**
 * Dynamically generates a valid poker scenario for the requested round,
 * guaranteeing variety and never repeating the exact same question type or mathematical structure consecutively.
 */
export function generatePokerQuestion(
  roundIndex: number,
  recentHistory?: RecentRoundInfo[]
): PokerScenario {
  const history = recentHistory ?? [];
  const recentTypes = new Set(history.slice(-3).map(h => h.typeId));
  const lastRound = history[history.length - 1];

  let targetIdx = (roundIndex - 1) % SCENARIO_GENERATORS.length;

  // Search for the best generator that doesn't repeat recent types or recent math
  for (let offset = 0; offset < SCENARIO_GENERATORS.length; offset++) {
    const candidateIdx = (targetIdx + offset) % SCENARIO_GENERATORS.length;
    const gen = SCENARIO_GENERATORS[candidateIdx];
    const candidate = gen(shuffle(buildDeck()));

    // Check if type was recently used
    if (recentTypes.has(candidate.typeId) && offset < SCENARIO_GENERATORS.length - 1) {
      continue;
    }

    // Check if exact mathematical structure (same numerator & denominator) matches previous round
    if (
      lastRound &&
      candidate.numerator === lastRound.numerator &&
      candidate.denominator === lastRound.denominator &&
      offset < SCENARIO_GENERATORS.length - 1
    ) {
      continue;
    }

    return candidate;
  }

  // Fallback
  return SCENARIO_GENERATORS[targetIdx](shuffle(buildDeck()));
}
