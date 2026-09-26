// Probability Draw Duels game screen
import { useState, useEffect, useRef, useMemo } from "react";
import PhysicsBalls, { type BallConfig } from "./PhysicsBalls";
import {
  generateQuestion,
  type GeneratedQuestion,
  type BallCounts,
} from "./probabilityQuestionGenerator";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";

const assetPathPrefix  = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;

// ── Color mapping ──
const BALL_COLORS = ["#ef4444", "#3b82f6", "#22c55e"] as const;

// ── Ball generation: 3 colors, 1–8 each, total 10–20 ──
function generateRoundBalls(): BallConfig {
  let counts: number[];
  do {
    counts = BALL_COLORS.map(() => Math.floor(Math.random() * 8) + 1);
  } while (counts.reduce((a, b) => a + b, 0) < 10 || counts.reduce((a, b) => a + b, 0) > 20);
  const config: BallConfig = {};
  BALL_COLORS.forEach((c, i) => (config[c] = counts[i]));
  return config;
}

function toBallCounts(balls: BallConfig): BallCounts {
  return {
    R: balls["#ef4444"] ?? 0,
    B: balls["#3b82f6"] ?? 0,
    G: balls["#22c55e"] ?? 0,
  };
}

// ── Constants ──
const GAME_SECONDS = 60; // 1-minute game timer
const OPPONENT_THRESHOLDS = [45, 30, 15, 5]; // timeLeft values when opponent reaches 1, 2, 3, 4 points

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

// ══════════════════════════════════════════════════════
// ── Component ──
// ══════════════════════════════════════════════════════
export default function ProbabilityDrawPage() {
  const ballsContainerRef = useRef<HTMLDivElement>(null);
  const [ballsDims, setBallsDims] = useState({ w: 0, h: 0 });

  // Game identity — increment to start a new game
  const [gameKey, setGameKey] = useState(0);

  // Generate balls once per game; stays constant throughout the 2 minutes
  const roundBalls = useMemo(() => generateRoundBalls(), [gameKey]);
  const ballCounts = useMemo(() => toBallCounts(roundBalls), [roundBalls]);

  // Game state
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [active, setActive] = useState<"n" | "d">("n");
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenom] = useState("");
  const [flash, setFlash] = useState(false); // brief green flash on correct answer

  // Mutable refs for stable callbacks
  const scoreRef = useRef(0);
  const difficultyRef = useRef(1);
  const askedRef = useRef<Set<string>>(new Set());
  const opponentIdxRef = useRef(0);
  const flashingRef = useRef(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize first question (Level 1) when a new game starts ──
  useEffect(() => {
    askedRef.current = new Set();
    scoreRef.current = 0;
    difficultyRef.current = 1;
    opponentIdxRef.current = 0;
    setDifficulty(1);

    const firstQ = generateQuestion(ballCounts, 1, askedRef.current);
    askedRef.current.add(firstQ.question);
    setQuestion(firstQ);
  }, [ballCounts]);

  // ── Observe physics container size ──
  useEffect(() => {
    const el = ballsContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setBallsDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Timer countdown (2:00 -> 0:00) ──
  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver]);

  // ── Opponent scoring (exactly 4 points over 2 minutes) ──
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
  function handleCorrect() {
    flashingRef.current = true;
    setFlash(true);

    scoreRef.current += 1;
    setPlayerScore(scoreRef.current);

    // Difficulty increases by one after each correct answer
    difficultyRef.current += 1;
    setDifficulty(difficultyRef.current);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlash(false);
      flashingRef.current = false;

      // Generate next question at the new difficulty level using the same ball counts
      const nextQ = generateQuestion(ballCounts, difficultyRef.current, askedRef.current);
      askedRef.current.add(nextQ.question);
      setQuestion(nextQ);

      setNumerator("");
      setDenom("");
      setActive("n");
    }, 400);
  }

  // ── Key press handler with auto-check ──
  function pressKey(key: string) {
    if (gameOver || !question || flashingRef.current) return;

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
    } else if (val.length < 4) {
      newVal = val + key;
    } else {
      return;
    }

    if (isNum) setNumerator(newVal);
    else setDenom(newVal);

    // Auto-check: if both fields have valid numbers, mathematically test fraction equivalence
    const curNum = isNum ? newVal : numerator;
    const curDen = isNum ? denominator : newVal;

    if (curNum !== "" && curDen !== "") {
      const n = parseInt(curNum, 10);
      const d = parseInt(curDen, 10);
      if (!isNaN(n) && !isNaN(d) && d > 0 && n >= 0) {
        // Cross-multiply to check fraction equality (accepts all equivalent fractions)
        if (n * question.denominator === d * question.numerator) {
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

  // ── Start a completely new game ──
  function startNewGame() {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setGameKey(k => k + 1);
    setTimeLeft(GAME_SECONDS);
    setPlayerScore(0);
    setOpponentScore(0);
    setGameOver(false);
    setNumerator("");
    setDenom("");
    setActive("n");
    setFlash(false);
    flashingRef.current = false;
  }

  // ── Input box styling ──
  function boxStyle(field: "n" | "d") {
    if (flash) return "ring-2 ring-[#09b964]";
    if (gameOver) return "";
    return active === field ? "ring-2 ring-[#5eead4]" : "";
  }

  const winner = gameOver
    ? playerScore > opponentScore ? "You win! 🎉"
    : playerScore < opponentScore ? "Opponent wins!"
    : "It's a tie!"
    : "";

  if (gameOver) {
    if (playerScore >= opponentScore) {
      return (
        <VictoryScreen
          playerScore={playerScore}
          opponentScore={opponentScore}
          onRematch={startNewGame}
          flows={Math.max(1, Math.floor(playerScore / 2))}
          grinds={playerScore}
          chokes={Math.max(0, 4 - playerScore)}
        />
      );
    } else {
      return (
        <LossScreen
          playerScore={playerScore}
          opponentScore={opponentScore}
          onRematch={startNewGame}
          flows={Math.max(0, Math.floor(playerScore / 2))}
          grinds={playerScore}
          chokes={Math.max(1, 4 - playerScore)}
        />
      );
    }
  }

  // ══════════════════════════════════════════════════════
  // ── Render ──
  // ══════════════════════════════════════════════════════
  return (
    <div
      className="w-full min-h-dvh flex flex-col items-center"
      style={{ background: "rgb(18,19,22)" }}
      data-node-id="11:554"
    >
      {/* Top area: physics canvas as background, HUD + question overlaid */}
      <div className="relative w-full flex-1 min-h-[200px]">
        {/* Physics canvas — fills entire top area */}
        <div
          ref={ballsContainerRef}
          className="absolute inset-0 overflow-hidden"
          data-node-id="11:594"
        >
          {ballsDims.w > 0 && ballsDims.h > 0 && (
            <PhysicsBalls key={gameKey} width={ballsDims.w} height={ballsDims.h} balls={roundBalls} />
          )}
        </div>

        {/* Overlaid HUD + Question (pointer-events-none so swipes pass through to canvas) */}
        <div className="relative z-10 flex flex-col gap-[6px] items-center pt-8 px-5 pointer-events-none">
          {/* TOP: Header HUD */}
          <div className="flex flex-col gap-4 h-[84px] items-start pt-1 w-full pointer-events-auto">
            {/* Players row */}
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

            {/* Score + Timer */}
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

          {/* Question */}
          <div className="flex flex-col items-center pt-6 w-full" data-node-id="11:591">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[24px] sm:text-[28px] text-center leading-normal max-w-full px-2">
              {gameOver ? "Time's up!" : (question?.question ?? "")}
            </span>
          </div>
        </div>
      </div>

      {/* Answer + Keypad */}
      <div className="flex flex-col items-center w-full px-5" data-node-id="11:596">

        {gameOver ? (
          /* ── Game Over panel ── */
          <div className="flex flex-col items-center gap-4 py-6 w-full">
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
              onClick={startNewGame}
              className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-2 cursor-pointer transition-opacity active:opacity-80"
            >
              <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
                NEW GAME
              </span>
            </button>
          </div>
        ) : (
          /* ── Active game: answer input + keypad ── */
          <>
            {/* Label */}
            <div className="pb-[10px]">
              <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#a1a1aa] text-[11px] tracking-[1.1px] uppercase leading-[16.5px]">
                TYPE OUT YOUR ANSWER
              </span>
            </div>

            {/* Fraction input: [ numerator ] / [ denominator ] */}
            <div className="flex gap-3 items-center justify-center pb-6" data-node-id="11:599">
              {/* Numerator box */}
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

              {/* Denominator box */}
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
              style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridTemplateRows: "repeat(4, 60px)" }}
            >
              {KEYS.flat().map((key) => (
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
