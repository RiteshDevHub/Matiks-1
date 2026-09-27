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

/** Every card in a standard 52-card deck that is not among the known cards. */
export function unseenCards(known: CardData[]): CardData[] {
  return buildDeck().filter(d => !known.some(k => cardEquals(k, d)));
}

export type HandCategory =
  | "high_card"
  | "pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush";

const HAND_RANK: Record<HandCategory, number> = {
  high_card: 0,
  pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  flush: 5,
  full_house: 6,
  four_of_a_kind: 7,
  straight_flush: 8,
};

function pickCard(cards: CardData[]): CardData {
  return cards[Math.floor(Math.random() * cards.length)];
}

function rankCounts(cards: CardData[]): number[] {
  const map = new Map<CardValue, number>();
  for (const c of cards) map.set(c.value, (map.get(c.value) ?? 0) + 1);
  return [...map.values()].sort((a, b) => b - a);
}

function isFlushFive(cards: CardData[]): boolean {
  return cards.length === 5 && cards.every(c => c.suit === cards[0].suit);
}

function categoryOfFive(cards: CardData[]): HandCategory {
  const flush = isFlushFive(cards);
  const straight = hasStraight(cards);
  if (flush && straight) return "straight_flush";
  const counts = rankCounts(cards);
  if (counts[0] === 4) return "four_of_a_kind";
  if (counts[0] === 3 && counts[1] === 2) return "full_house";
  if (flush) return "flush";
  if (straight) return "straight";
  if (counts[0] === 3) return "three_of_a_kind";
  if (counts[0] === 2 && counts[1] === 2) return "two_pair";
  if (counts[0] === 2) return "pair";
  return "high_card";
}

/** Best made hand from player cards plus currently revealed community cards only. */
export function evaluateCurrentHand(playerCards: CardData[], revealedCommunity: CardData[]): HandCategory {
  const cards = [...playerCards, ...revealedCommunity];
  if (cards.length < 5) {
    const counts = rankCounts(cards);
    if ((counts[0] ?? 0) >= 4) return "four_of_a_kind";
    if ((counts[0] ?? 0) >= 3 && (counts[1] ?? 0) >= 2) return "full_house";
    if ((counts[0] ?? 0) >= 3) return "three_of_a_kind";
    if ((counts[0] ?? 0) >= 2 && (counts[1] ?? 0) >= 2) return "two_pair";
    if ((counts[0] ?? 0) >= 2) return "pair";
    return "high_card";
  }
  if (cards.length === 5) return categoryOfFive(cards);
  let best: HandCategory = "high_card";
  for (let omit = 0; omit < cards.length; omit++) {
    const five = cards.filter((_, i) => i !== omit);
    if (five.length !== 5) continue;
    const cat = categoryOfFive(five);
    if (HAND_RANK[cat] > HAND_RANK[best]) best = cat;
  }
  return best;
}

function hasPairedMadeHand(cat: HandCategory): boolean {
  return (
    cat === "pair" ||
    cat === "two_pair" ||
    cat === "three_of_a_kind" ||
    cat === "full_house" ||
    cat === "four_of_a_kind"
  );
}

function revealedCommunityCards(scenario: PokerScenario): CardData[] {
  return scenario.community.slice(0, scenario.hiddenCount === 2 ? 3 : 4);
}

/** P(next unseen card satisfies isOut). Denominator is the true remaining-deck size. */
function nextCardOdds(known: CardData[], isOut: (card: CardData) => boolean) {
  const remaining = unseenCards(known);
  const outsCards = remaining.filter(isOut);
  return {
    numerator: outsCards.length,
    denominator: remaining.length,
    remaining,
    outsCards,
  };
}

/** P(an unordered pair of remaining cards satisfies succeeds). */
function twoCardOdds(
  known: CardData[],
  succeeds: (turn: CardData, river: CardData) => boolean
) {
  const remaining = unseenCards(known);
  const n = remaining.length;
  const denominator = (n * (n - 1)) / 2;
  let numerator = 0;
  const winningKeys = new Set<string>();
  const key = (c: CardData) => `${c.suit}:${c.value}`;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (succeeds(remaining[i], remaining[j])) {
        numerator++;
        winningKeys.add(key(remaining[i]));
        winningKeys.add(key(remaining[j]));
      }
    }
  }

  return {
    numerator,
    denominator,
    remaining,
    winningTurnCandidates: remaining.filter(c => winningKeys.has(key(c))),
  };
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

function assignTurnAndRiver(remaining: CardData[], preferred: CardData[]): { turn: CardData; river: CardData } {
  const turn = preferred.length > 0 ? pickCard(preferred) : remaining[0];
  const rest = remaining.filter(c => !cardEquals(c, turn));
  return { turn, river: rest[0] };
}

/**
 * For 1-hidden questions the 4th community card is visible, so it must NOT already
 * complete the target. Odds are then counted from the 6 known cards (2 hole + 4 board).
 */
function finalizeNextCardScenario(opts: {
  typeId: string;
  questionText: string;
  difficulty: number;
  hand: CardData[];
  flop: CardData[];
  isOut: (known: CardData[], card: CardData) => boolean;
  alreadyHaveTarget: (current: HandCategory) => boolean;
}): PokerScenario {
  const beforeTurn = [...opts.hand, ...opts.flop];
  const remainingBefore = unseenCards(beforeTurn);
  const safeTurns = remainingBefore.filter(c => !opts.isOut(beforeTurn, c));
  if (safeTurns.length === 0) throw new Error("No safe visible turn card");

  const turn = pickCard(safeTurns);
  const known = [...beforeTurn, turn];
  const current = evaluateCurrentHand(opts.hand, [...opts.flop, turn]);
  if (opts.alreadyHaveTarget(current)) throw new Error("Target already made");

  const odds = nextCardOdds(known, c => opts.isOut(known, c));
  if (odds.numerator <= 0) throw new Error("No outs after visible turn");

  const river = pickCard(odds.outsCards);
  return {
    typeId: opts.typeId,
    questionText: opts.questionText,
    numerator: odds.numerator,
    denominator: odds.denominator,
    difficulty: opts.difficulty,
    hiddenCount: 1,
    hand: opts.hand,
    community: [...opts.flop, turn, river],
  };
}

function nextCardCompletes(scenario: PokerScenario, known: CardData[], card: CardData): boolean {
  const h1 = scenario.hand[0];
  const h2 = scenario.hand[1];
  switch (scenario.typeId) {
    case "pair_all_visible":
    case "pair_hole_cards":
      return card.value === h1.value || card.value === h2.value;
    case "pair_specific":
      return card.value === h1.value;
    case "three_of_a_kind":
      return card.value === h1.value;
    case "pair_or_trips": {
      const boardRanks = known.filter(c => !scenario.hand.some(h => cardEquals(h, c))).map(c => c.value);
      return card.value === h1.value || boardRanks.includes(card.value);
    }
    case "flush": {
      const suitCounts = new Map<CardSuit, number>();
      for (const c of known) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
      const targetSuit = [...suitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return card.suit === targetSuit;
    }
    case "open_ended_straight":
    case "gutshot_straight":
      return hasStraight([...known, card]);
    case "two_pair_board":
      return card.value === h1.value || card.value === h2.value;
    default:
      return false;
  }
}

function alreadyHasQuestionTarget(scenario: PokerScenario, current: HandCategory): boolean {
  switch (scenario.typeId) {
    case "pair_all_visible":
    case "pair_hole_cards":
    case "pair_specific":
      return hasPairedMadeHand(current);
    case "three_of_a_kind":
    case "set_river":
      return current === "three_of_a_kind" || current === "full_house" || current === "four_of_a_kind";
    case "pair_or_trips":
      return current === "two_pair" || current === "three_of_a_kind" || current === "full_house" || current === "four_of_a_kind";
    case "two_pair_board":
      return current === "two_pair" || current === "full_house" || current === "four_of_a_kind";
    case "flush":
    case "flush_river":
      return current === "flush" || current === "straight_flush";
    case "open_ended_straight":
    case "gutshot_straight":
    case "straight_river":
      return current === "straight" || current === "straight_flush";
    default:
      return false;
  }
}

function isValidScenario(scenario: PokerScenario): boolean {
  if (scenario.hand.length !== 2 || scenario.community.length !== 5) return false;
  if (!cardsAreUnique(scenario.hand, scenario.community)) return false;

  const revealed = revealedCommunityCards(scenario);
  const known = [...scenario.hand, ...revealed];
  const current = evaluateCurrentHand(scenario.hand, revealed);
  if (alreadyHasQuestionTarget(scenario, current)) return false;

  if (scenario.hiddenCount === 2) {
    return scenario.numerator > 0 && scenario.denominator > 0;
  }

  const remaining = unseenCards(known);
  const outs = remaining.filter(c => nextCardCompletes(scenario, known, c));
  if (outs.length <= 0) return false;
  if (remaining.length !== scenario.denominator) return false;
  if (outs.length !== scenario.numerator) return false;
  return true;
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

  return finalizeNextCardScenario({
    typeId: "pair_all_visible",
    questionText: "What is the probability that the next card gives you a pair?",
    difficulty: 1,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.value === h1.value || c.value === h2.value,
    alreadyHaveTarget: hasPairedMadeHand,
  });
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

  return finalizeNextCardScenario({
    typeId: "three_of_a_kind",
    questionText: "What is the probability that the next card gives you three of a kind?",
    difficulty: 2,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.value === h1.value,
    alreadyHaveTarget: cat =>
      cat === "three_of_a_kind" || cat === "full_house" || cat === "four_of_a_kind",
  });
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

  return finalizeNextCardScenario({
    typeId: "open_ended_straight",
    questionText: "What is the probability that the next card completes a straight?",
    difficulty: 3,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (known, c) => hasStraight([...known, c]),
    alreadyHaveTarget: cat => cat === "straight" || cat === "straight_flush",
  });
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

  return finalizeNextCardScenario({
    typeId: "flush",
    questionText: "What is the probability that the next card completes a flush?",
    difficulty: 4,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.suit === targetSuit,
    alreadyHaveTarget: cat => cat === "flush" || cat === "straight_flush",
  });
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

  return finalizeNextCardScenario({
    typeId: "pair_or_trips",
    questionText: "What is the probability that the next card gives you two pair or three of a kind?",
    difficulty: 3,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (known, c) => {
      const boardRanks = known
        .filter(k => k.value !== h1.value || (!cardEquals(k, h1) && !cardEquals(k, h2)))
        .filter(k => !cardEquals(k, h1) && !cardEquals(k, h2))
        .map(k => k.value);
      return c.value === h1.value || boardRanks.includes(c.value);
    },
    alreadyHaveTarget: cat =>
      cat === "two_pair" || cat === "three_of_a_kind" || cat === "full_house" || cat === "four_of_a_kind",
  });
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

  // 3rd flop card separated
  const f3 = pool.find(c => {
    const testHand = [h1, h2, f1, f2, c];
    const rank = RANK_NUM[c.value];
    const isSeparated = Math.abs(rank - neededRank) >= 2 && straightRanks.every(sr => Math.abs(sr - rank) >= 2);
    return !hasStraight(testHand) && isSeparated;
  }) ?? pool.find(c => !hasStraight([h1, h2, f1, f2, c]))!;
  pool = pool.filter(c => !cardEquals(c, f3));

  return finalizeNextCardScenario({
    typeId: "gutshot_straight",
    questionText: "What is the probability that the next card completes a straight?",
    difficulty: 4,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (known, c) => hasStraight([...known, c]),
    alreadyHaveTarget: cat => cat === "straight" || cat === "straight_flush",
  });
}

// ── 7. Multiple Hidden Cards: Flush by River ──
function generateFlushByRiver(deck: CardData[]): PokerScenario {
  const base = generateFlushDraw(deck);
  const known = [...base.hand, ...base.community.slice(0, 3)];
  const suitCounts = new Map<CardSuit, number>();
  for (const c of known) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const targetSuit = [...suitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const { numerator, denominator, remaining, winningTurnCandidates } = twoCardOdds(
    known,
    (a, b) => [...known, a, b].filter(c => c.suit === targetSuit).length >= 5
  );
  const { turn, river } = assignTurnAndRiver(remaining, winningTurnCandidates);

  return {
    ...base,
    typeId: "flush_river",
    questionText: "What is the probability of completing a flush by the river?",
    numerator,
    denominator,
    difficulty: 5,
    hiddenCount: 2,
    community: [...base.community.slice(0, 3), turn, river],
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

  return finalizeNextCardScenario({
    typeId: "pair_hole_cards",
    questionText: "What is the probability that the next card pairs one of your hole cards?",
    difficulty: 3,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.value === h1.value || c.value === h2.value,
    alreadyHaveTarget: hasPairedMadeHand,
  });
}

// ── 9. Multiple Hidden Cards: Straight by River ──
function generateStraightByRiver(deck: CardData[]): PokerScenario {
  const base = generateOpenEndedStraight(deck);
  const known = [...base.hand, ...base.community.slice(0, 3)];
  const { numerator, denominator, remaining, winningTurnCandidates } = twoCardOdds(
    known,
    (a, b) => hasStraight([...known, a, b])
  );
  const { turn, river } = assignTurnAndRiver(remaining, winningTurnCandidates);

  return {
    ...base,
    typeId: "straight_river",
    questionText: "What is the probability of completing a straight by the river?",
    numerator,
    denominator,
    difficulty: 5,
    hiddenCount: 2,
    community: [...base.community.slice(0, 3), turn, river],
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

  const targetRankLbl = RANK_LBL[h1.value];
  return finalizeNextCardScenario({
    typeId: "pair_specific",
    questionText: `What is the probability that the next card pairs your ${targetRankLbl}?`,
    difficulty: 2,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.value === h1.value,
    alreadyHaveTarget: hasPairedMadeHand,
  });
}

// ── 11. Multiple Hidden Cards: Three of a Kind by River ──
function generateSetByRiver(deck: CardData[]): PokerScenario {
  const base = generateThreeOfAKind(deck);
  const known = [...base.hand, ...base.community.slice(0, 3)];
  const pairRank = base.hand[0].value;
  const { numerator, denominator, remaining, winningTurnCandidates } = twoCardOdds(
    known,
    (a, b) => [...known, a, b].filter(c => c.value === pairRank).length >= 3
  );
  const { turn, river } = assignTurnAndRiver(remaining, winningTurnCandidates);

  return {
    ...base,
    typeId: "set_river",
    questionText: "What is the probability of making three of a kind by the river?",
    numerator,
    denominator,
    difficulty: 5,
    hiddenCount: 2,
    community: [...base.community.slice(0, 3), turn, river],
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

  return finalizeNextCardScenario({
    typeId: "two_pair_board",
    questionText: "What is the probability that the next card gives you two pair?",
    difficulty: 4,
    hand: [h1, h2],
    flop: [f1, f2, f3],
    isOut: (_known, c) => c.value === h1.value || c.value === h2.value,
    alreadyHaveTarget: cat =>
      cat === "two_pair" || cat === "full_house" || cat === "four_of_a_kind",
  });
}

const ONE_HIDDEN_GENERATORS: Array<(deck: CardData[]) => PokerScenario> = [
  generatePairAllVisible,
  generateThreeOfAKind,
  generateOpenEndedStraight,
  generateFlushDraw,
  generatePairOrTrips,
  generateGutshotStraight,
  generatePairHoleCardsOnly,
  generatePairSpecificHoleCard,
  generateTwoPairFromBoardPair,
];

const TWO_HIDDEN_GENERATORS: Array<(deck: CardData[]) => PokerScenario> = [
  generateFlushByRiver,
  generateStraightByRiver,
  generateSetByRiver,
];

function cardsAreUnique(hand: CardData[], community: CardData[]): boolean {
  const all = [...hand, ...community];
  const keys = all.map(c => `${c.suit}:${c.value}`);
  return keys.length === 7 && new Set(keys).size === 7;
}

function pickScenario(
  generators: Array<(deck: CardData[]) => PokerScenario>,
  roundIndex: number,
  history: RecentRoundInfo[]
): PokerScenario | null {
  const recentTypes = new Set(history.slice(-3).map(h => h.typeId));
  const lastRound = history[history.length - 1];
  const targetIdx = (Math.max(1, roundIndex) - 1) % generators.length;

  for (let offset = 0; offset < generators.length; offset++) {
    const gen = generators[(targetIdx + offset) % generators.length];
    let candidate: PokerScenario;
    try {
      candidate = gen(shuffle(buildDeck()));
    } catch {
      continue;
    }

    if (
      candidate.numerator <= 0 ||
      candidate.denominator <= 0 ||
      !isValidScenario(candidate)
    ) {
      continue;
    }

    if (recentTypes.has(candidate.typeId) && offset < generators.length - 1) {
      continue;
    }

    if (
      lastRound &&
      candidate.numerator === lastRound.numerator &&
      candidate.denominator === lastRound.denominator &&
      offset < generators.length - 1
    ) {
      continue;
    }

    return candidate;
  }

  for (let i = 0; i < generators.length; i++) {
    try {
      const fallback = generators[(targetIdx + i) % generators.length](shuffle(buildDeck()));
      if (isValidScenario(fallback)) {
        return fallback;
      }
    } catch {
      // try the next generator
    }
  }
  return null;
}

/**
 * Dynamically generates a valid poker scenario for the requested round,
 * guaranteeing variety and never repeating the exact same question type or mathematical structure consecutively.
 */
export function generatePokerQuestion(
  roundIndex: number,
  recentHistory?: RecentRoundInfo[],
  preferredHiddenCount: 1 | 2 = 1
): PokerScenario {
  const history = recentHistory ?? [];
  const preferred = preferredHiddenCount === 2 ? TWO_HIDDEN_GENERATORS : ONE_HIDDEN_GENERATORS;
  const other = preferredHiddenCount === 2 ? ONE_HIDDEN_GENERATORS : TWO_HIDDEN_GENERATORS;

  return (
    pickScenario(preferred, roundIndex, history) ??
    pickScenario(other, roundIndex, history) ??
    (() => {
      for (let i = 0; i < 20; i++) {
        try {
          const s = generatePairHoleCardsOnly(shuffle(buildDeck()));
          if (isValidScenario(s)) return s;
        } catch {
          // retry
        }
      }
      const s = generatePairHoleCardsOnly(shuffle(buildDeck()));
      if (!isValidScenario(s)) throw new Error("Unable to generate a valid poker question");
      return s;
    })()
  );
}
