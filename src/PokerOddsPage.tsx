// Poker Odds Duels game screen
import { useState, useEffect, useCallback, useRef } from "react";
import {
  generatePokerQuestion,
  type PokerScenario,
  type RecentRoundInfo,
  type CardData,
  RANK_LBL,
  SUIT_SYM,
} from "./pokerOddsGenerator";

const assetPathPrefix  = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;
const imgCardBack      = `${assetPathPrefix}/b17e4.png`;

const TOTAL_SECONDS = 120; // 2-minute duel timer
const OPPONENT_THRESHOLDS = [90, 60, 30, 10]; // timeLeft values when opponent reaches 1, 2, 3, 4 points

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

type Suit = "♥" | "♣" | "♦" | "♠";

// ── Card visual components (exact design preserved) ──────────────────────────

interface FaceCardProps {
  rank: string;
  suit: Suit;
  width: number;
  height: number;
  rotate?: number;
}

function FaceCard({ rank, suit, width, height, rotate = 0 }: FaceCardProps) {
  const color  = suit === "♥" || suit === "♦" ? "#ea384d" : "#1e2024";
  const scale  = width / 100;
  const rankSz   = Math.round(19.737 * scale * 10) / 10;
  const suitSmSz = Math.round(13.158 * scale * 10) / 10;
  const suitLgSz = Math.round(42.105 * scale * 10) / 10;
  const px       = Math.round(10.527 * scale * 10) / 10;
  const py       = Math.round(9.211  * scale * 10) / 10;
  const r        = Math.round(9.375  * scale * 10) / 10;

  const corner = (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
      <span style={{ fontFamily:"'Space Grotesk:Bold','Space Grotesk',sans-serif", fontWeight:800, fontSize:rankSz, lineHeight:`${rankSz}px`, letterSpacing:"-0.04em", color, whiteSpace:"nowrap" }}>{rank}</span>
      <span style={{ fontFamily:"Arial,sans-serif", fontSize:suitSmSz, lineHeight:`${suitSmSz}px`, color, whiteSpace:"nowrap" }}>{suit}</span>
    </div>
  );

  return (
    <div style={{ width, height, rotate:rotate?`${rotate}deg`:undefined, borderRadius:r, background:"white", border:"1.316px solid rgba(255,255,255,0.2)", boxShadow:"0px 10.526px 11.842px rgba(0,0,0,0.45),0px 2.632px 2.632px rgba(0,0,0,0.3),inset 0px 1.316px 0px rgba(255,255,255,0.9)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:`${py}px ${px}px`, position:"relative", flexShrink:0 }}>
      {corner}
      <span style={{ fontFamily:"Arial,sans-serif", fontSize:suitLgSz, lineHeight:`${suitLgSz}px`, color, position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", userSelect:"none" }}>{suit}</span>
      <div style={{ alignSelf:"flex-end", transform:"rotate(180deg)" }}>{corner}</div>
    </div>
  );
}

function CardBack({ width, height, rotate = 0 }: { width:number; height:number; rotate?:number }) {
  return (
    <div style={{ width, height, borderRadius:6, overflow:"hidden", flexShrink:0, transform:rotate?`rotate(${rotate}deg)`:undefined, boxShadow:"0px 6.737px 7.579px rgba(0,0,0,0.45),0px 1.684px 1.684px rgba(0,0,0,0.3)" }}>
      <img alt="card back" src={imgCardBack} style={{ width:"108%", height:"105.85%", marginLeft:"-4.2%", marginTop:"-2.72%", display:"block" }} />
    </div>
  );
}

// ── FlipCard: CardBack → FaceCard (flips only on correct answer, no manual tap) ──

function FlipCard({ card, revealed, width, height }: {
  card: CardData; revealed: boolean; width: number; height: number;
}) {
  const rank = RANK_LBL[card.value];
  const suit = SUIT_SYM[card.suit] as Suit;
  return (
    <div style={{ width, height, perspective:700, cursor:"default", flexShrink:0 }}>
      <div style={{
        width:"100%", height:"100%", position:"relative", transformStyle:"preserve-3d",
        transition:"transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        transform:revealed ? "rotateY(180deg)" : "rotateY(0deg)"
      }}>
        {/* Card back */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden" }}>
          <CardBack width={width} height={height} />
        </div>
        {/* Face front */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", transform:"rotateY(180deg)" }}>
          <FaceCard rank={rank} suit={suit} width={width} height={height} />
        </div>
      </div>
    </div>
  );
}

// ── Deal animation ─────────────────────────────────────────────────────────────

function dealAnim(dealIdx: number, dealtCount: number): React.CSSProperties {
  const show = dealIdx < dealtCount;
  return {
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.85)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Screen Component ──
// ══════════════════════════════════════════════════════════════════════════════

export default function PokerOddsPage() {
  // Scenario state
  const [scenario, setScenario]   = useState<PokerScenario | null>(null);
  const [hand, setHand]           = useState<CardData[]>([]);
  const [community, setCommunity] = useState<CardData[]>([]);
  const [revealed, setRevealed]   = useState<boolean[]>([true, true, true, false, false]);
  const [dealtCount, setDealtCount] = useState(7);

  // Difficulty & scores
  const [difficulty, setDifficulty] = useState(1);
  const [playerScore, setScore]   = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS);
  const [gameOver, setGameOver]   = useState(false);

  // Answer state
  const [active, setActive]       = useState<"n" | "d">("n");
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenom]   = useState("");
  const [flash, setFlash]         = useState(false); // green highlight on correct

  // Refs for callbacks & timers
  const difficultyRef = useRef(1);
  const scoreRef = useRef(0);
  const opponentIdxRef = useRef(0);
  const advancingRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentHistoryRef = useRef<RecentRoundInfo[]>([]);

  // ── New Round / Deal sequence ──
  const startNewRound = useCallback((resetProgression = false) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (subTimerRef.current) clearTimeout(subTimerRef.current);
    advancingRef.current = false;
    setFlash(false);

    if (resetProgression) {
      difficultyRef.current = 1;
      setDifficulty(1);
      scoreRef.current = 0;
      setScore(0);
      opponentIdxRef.current = 0;
      setOpponentScore(0);
      setTimeLeft(TOTAL_SECONDS);
      setGameOver(false);
      recentHistoryRef.current = [];
    }

    const nextScen = generatePokerQuestion(difficultyRef.current, recentHistoryRef.current);
    recentHistoryRef.current.push({
      typeId: nextScen.typeId,
      numerator: nextScen.numerator,
      denominator: nextScen.denominator,
    });
    setScenario(nextScen);
    setHand(nextScen.hand);
    setCommunity(nextScen.community);
    setRevealed([true, true, true, false, false]);

    setActive("n");
    setNumerator("");
    setDenom("");

    // Deal animation: community first, then hole cards
    setDealtCount(0);
    const totalToDeal = nextScen.hiddenCount === 2 ? 7 : 6;
    for (let i = 1; i <= totalToDeal; i++) {
      setTimeout(() => setDealtCount(i), i * 110);
    }
  }, []);

  // Initial deal on mount
  useEffect(() => {
    startNewRound(false);
  }, [startNewRound]);

  // ── Timer countdown (2:00 -> 0:00) ──
  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // ── Opponent scoring (4 points across 2 minutes) ──
  useEffect(() => {
    if (gameOver) return;
    while (
      opponentIdxRef.current < OPPONENT_THRESHOLDS.length &&
      timeLeft <= OPPONENT_THRESHOLDS[opponentIdxRef.current]
    ) {
      opponentIdxRef.current++;
      setOpponentScore(opponentIdxRef.current);
    }
  }, [timeLeft, gameOver]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  // ── Handle correct answer ──
  const handleCorrect = useCallback(() => {
    if (advancingRef.current || !scenario) return;
    advancingRef.current = true;
    setFlash(true);

    // 1. Add 1 point to player's score
    scoreRef.current += 1;
    setScore(scoreRef.current);

    // 2. Immediately clear both input fields
    setNumerator("");
    setDenom("");
    setActive("n");

    // 3. Reveal the hidden community card(s) that satisfy the question
    if (subTimerRef.current) clearTimeout(subTimerRef.current);
    if (scenario.hiddenCount === 2) {
      // Reveal turn card first
      setRevealed([true, true, true, true, false]);
      // Sequentially reveal river card after 350ms
      subTimerRef.current = setTimeout(() => {
        setRevealed([true, true, true, true, true]);
      }, 350);
    } else {
      setRevealed([true, true, true, true, false]);
    }

    // 4. Briefly show the winning revealed card(s), then automatically advance to the next challenge
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    const waitTime = scenario.hiddenCount === 2 ? 1600 : 1300;
    transitionTimerRef.current = setTimeout(() => {
      setFlash(false);
      advancingRef.current = false;

      // Advance difficulty level
      difficultyRef.current += 1;
      setDifficulty(difficultyRef.current);

      // Generate a brand new poker situation from a freshly shuffled 52-card deck
      const nextScen = generatePokerQuestion(difficultyRef.current, recentHistoryRef.current);
      recentHistoryRef.current.push({
        typeId: nextScen.typeId,
        numerator: nextScen.numerator,
        denominator: nextScen.denominator,
      });
      setScenario(nextScen);
      setHand(nextScen.hand);
      setCommunity(nextScen.community);
      setRevealed([true, true, true, false, false]);

      // Deal animation for the new round
      setDealtCount(0);
      const totalToDeal = nextScen.hiddenCount === 2 ? 7 : 6;
      for (let i = 1; i <= totalToDeal; i++) {
        setTimeout(() => setDealtCount(i), i * 110);
      }
    }, waitTime);
  }, [scenario]);

  // ── Key press handler with auto-check ──
  function pressKey(key: string) {
    if (gameOver || advancingRef.current || !scenario) return;

    if (key === "." || key === "/") {
      setActive(a => (a === "n" ? "d" : "n"));
      return;
    }

    const isNum = active === "n";
    const val = isNum ? numerator : denominator;

    let newVal: string;
    if (key === "⌫") {
      if (val === "" && !isNum) {
        // Backspacing on empty denominator moves focus back to numerator
        setActive("n");
        return;
      }
      newVal = val.slice(0, -1);
    } else if (val.length < 5) {
      newVal = val + key;
    } else {
      return;
    }

    if (isNum) setNumerator(newVal);
    else setDenom(newVal);

    // Auto-check: if both fields have valid positive numbers, test fraction equivalence
    const curNum = isNum ? newVal : numerator;
    const curDen = isNum ? denominator : newVal;

    if (curNum !== "" && curDen !== "") {
      const n = parseInt(curNum, 10);
      const d = parseInt(curDen, 10);
      if (!isNaN(n) && !isNaN(d) && d > 0 && n >= 0) {
        // Cross-multiplication accepts all mathematically equivalent fractions
        if (n * scenario.denominator === d * scenario.numerator) {
          handleCorrect();
        }
      }
    }
  }

  // ── Physical keyboard support ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= "0" && e.key <= "9") {
        pressKey(e.key);
      } else if (e.key === "Backspace") {
        pressKey("⌫");
      } else if (e.key === "/" || e.key === "." || e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        setActive(a => (a === "n" ? "d" : "n"));
      } else if (e.key === "ArrowLeft") {
        setActive("n");
      } else if (e.key === "ArrowRight") {
        setActive("d");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function boxStyle(field: "n" | "d") {
    if (flash) return "ring-2 ring-[#09b964]";
    if (gameOver) return "";
    return active === field ? "ring-2 ring-[#5eead4]" : "";
  }

  if (hand.length < 2 || community.length < 5) return null;

  // Map card data → FaceCard props
  function cardProps(c: CardData) {
    return { rank: RANK_LBL[c.value], suit: SUIT_SYM[c.suit] as Suit };
  }

  // Display either 4 community cards (1 hidden) or 5 community cards (2 hidden)
  const visibleCommunity = community.slice(0, scenario?.hiddenCount === 2 ? 5 : 4);

  const winner = gameOver
    ? playerScore > opponentScore ? "You win! 🎉"
    : playerScore < opponentScore ? "Opponent wins!"
    : "It's a tie!"
    : "";

  return (
    <div className="w-full min-h-dvh flex flex-col gap-0 items-center pt-8 px-5"
      style={{ background:"rgb(18,19,22)" }} data-node-id="22:32">

      {/* ── HUD ── */}
      <div className="flex flex-col gap-4 h-[84px] items-start pt-1 w-full shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2 items-center">
            <div className="bg-[rgba(34,211,238,0.8)] flex items-center justify-center p-[2px] rounded-[12px] shadow-[0px_0px_10px_0px_rgba(56,232,222,0.25)] size-[36px]">
              <div className="bg-[#ff4f8b] flex flex-1 flex-col h-full items-center justify-center overflow-clip rounded-[9px]">
                <div className="flex gap-[2px] items-center">
                  <div className="bg-[#121316] rounded-full size-[4px]" />
                  <div className="bg-[#121316] rounded-full size-[4px]" />
                </div>
                <div className="h-[4px] flex flex-col items-start pt-[2px] w-[8px]">
                  <div className="bg-[#121316] h-[2px] rounded-full w-[8px]" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[12px] leading-[15px]">You</span>
              <span className="font-['Space_Grotesk:Bold'] font-normal text-[#7a7e89] text-[10px] leading-[12.5px]">1016</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end">
              <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[12px] leading-[15px]">guest3...</span>
              <span className="font-['Space_Grotesk:Bold'] font-normal text-[#7a7e89] text-[10px] leading-[12.5px]">971</span>
            </div>
            <div className="bg-[rgba(255,87,104,0.2)] flex items-center justify-center rounded-[12px] size-[36px]">
              <div className="bg-[#ff5768] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-center rounded-[9px] size-[32px]">
                <div className="relative size-[16px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStarIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 w-full">
          <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[12px] leading-[16px]">{playerScore}</span>
          </div>
          <div className="border border-[#272a32] bg-[#181a1f] flex gap-[6px] items-center px-[13px] py-[5px] rounded-full">
            <div className="h-[12.25px] relative w-[10.5px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTimerIcon} />
            </div>
            <span className={`font-['Space_Grotesk:Bold'] font-bold text-[12px] tracking-[0.6px] leading-[16px] ${timeLeft <= 10 ? "text-[#ff5768]" : "text-[#5eead4]"}`}>
              {mins}:{secs}
            </span>
          </div>
          <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[12px] leading-[16px]">{opponentScore}</span>
          </div>
        </div>
      </div>

      {/* ── Dynamic Question Text ── */}
      <div className="flex flex-col items-center pt-6 pb-4 w-full shrink-0" data-node-id="22:101">
        <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[20px] sm:text-[23px] text-center leading-normal w-full px-1 min-h-[58px] flex items-center justify-center">
          {gameOver ? "Time's up!" : (scenario?.questionText ?? "What is the probability that the next card gives you a pair?")}
        </span>
      </div>

      {/* ── Community cards (face-up flop + hidden card back that flips on correct) ── */}
      <div className="flex items-center justify-center gap-[6px] w-full shrink-0 pb-4" data-node-id="22:104">
        {visibleCommunity.map((card, i) => {
          const { rank, suit } = cardProps(card);
          if (i < 3) {
            return (
              <div key={i} style={dealAnim(i, dealtCount)}>
                <FaceCard rank={rank} suit={suit} width={66} height={94} />
              </div>
            );
          }
          return (
            <div key={i} style={dealAnim(i, dealtCount)}>
              <FlipCard card={card} revealed={revealed[i]} width={66} height={94} />
            </div>
          );
        })}
      </div>

      {/* ── Hole cards (two player cards) ── */}
      <div className="relative w-full shrink-0 overflow-hidden mb-2" style={{ height:115 }} data-node-id="22:33">
        <div style={{ position:"absolute", left:"50%", top:8, transform:"translateX(-85px) rotate(-5deg)", transformOrigin:"top center", zIndex:1 }}>
          <div style={dealAnim(visibleCommunity.length, dealtCount)}>
            <FaceCard {...cardProps(hand[0])} width={100} height={142} />
          </div>
        </div>
        <div style={{ position:"absolute", left:"50%", top:8, transform:"translateX(-15px) rotate(5deg)", transformOrigin:"top center", zIndex:2 }}>
          <div style={dealAnim(visibleCommunity.length + 1, dealtCount)}>
            <FaceCard {...cardProps(hand[1])} width={100} height={142} />
          </div>
        </div>
      </div>

      {/* ── Answer + Keypad or Game Over panel (Auto-check, No Submit button) ── */}
      <div className="flex flex-col items-center w-full" data-node-id="22:155">
        {gameOver ? (
          <div className="flex flex-col items-center gap-4 py-4 w-full">
            <div className="flex items-center justify-center gap-8 w-full">
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk:Bold'] font-bold text-[#5eead4] text-[36px]">{playerScore}</span>
                <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[14px]">You</span>
              </div>
              <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[20px]">vs</span>
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk:Bold'] font-bold text-[#ff5768] text-[36px]">{opponentScore}</span>
                <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[14px]">Opponent</span>
              </div>
            </div>
            <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[22px]">{winner}</span>
            <button
              type="button"
              onClick={() => startNewRound(true)}
              className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-2 cursor-pointer transition-opacity active:opacity-80"
            >
              <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
                NEW GAME
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="pb-[10px]">
              <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#a1a1aa] text-[11px] tracking-[1.1px] uppercase leading-[16.5px]">
                TYPE OUT YOUR ANSWER
              </span>
            </div>

            {/* Fraction input: [ numerator ] / [ denominator ] */}
            <div className="flex gap-3 items-center justify-center pb-6" data-node-id="22:158">
              <button
                type="button"
                onClick={() => setActive("n")}
                className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${boxStyle("n")}`}
              >
                <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${flash ? "text-[#09b964]" : "text-white"}`}>
                  {numerator}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActive(active === "n" ? "d" : "n")}
                className="font-['Space_Grotesk:Medium'] font-medium text-white text-[18px] leading-[28px] px-1 cursor-pointer select-none"
              >
                /
              </button>

              <button
                type="button"
                onClick={() => setActive("d")}
                className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${boxStyle("d")}`}
              >
                <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${flash ? "text-[#09b964]" : "text-white"}`}>
                  {denominator}
                </span>
              </button>
            </div>

            {/* Keypad */}
            <div
              className="grid gap-[6px] pb-2 px-2 w-full"
              style={{ gridTemplateColumns:"repeat(3,minmax(0,1fr))", gridTemplateRows:"repeat(4,60px)" }}
              data-node-id="22:164"
            >
              {KEYS.flat().map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressKey(key)}
                  className="bg-[#3b3d42] flex h-[60px] items-center justify-center rounded-[8px] cursor-pointer active:bg-[#4e5057] transition-colors"
                >
                  {key === "⌫" ? (
                    <div className="relative size-[24px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBackspaceIcon} />
                    </div>
                  ) : (
                    <span className="font-['Plus_Jakarta_Sans:Medium'] font-medium text-white text-[24px] text-center leading-[32px]">
                      {key}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
