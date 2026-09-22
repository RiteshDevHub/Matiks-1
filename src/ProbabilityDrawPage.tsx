// Probability Draw Duels game screen
import { useState, useEffect, useRef, useMemo } from "react";
import PhysicsBalls, { type BallConfig } from "./PhysicsBalls";

const assetPathPrefix  = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;

// ── Color mapping ──
const BALL_COLORS = ["#ef4444", "#3b82f6", "#22c55e"] as const;
type ColorKey = "R" | "B" | "G";
const COLOR_KEYS: ColorKey[] = ["R", "B", "G"];
type BallCounts = Record<ColorKey, number>;

// ── Fraction helpers ──
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFrac(n: number, d: number): string {
  if (d === 0) return "0/0";
  const g = gcd(n, d);
  return `${n / g}/${d / g}`;
}

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

// ── Question type ──
type Q = { text: string; num: number; den: number };

// ── Question pool builder (7 levels) ──
function buildQuestionPool(c: BallCounts, total: number): Q[][] {
  const pool: Q[][] = [[], [], [], [], [], [], []];
  const den2 = total * (total - 1); // denominator for 2-draw problems

  // Level 1 — Single ball: P(X), P(not X)
  for (const k of COLOR_KEYS) {
    if (c[k] > 0) {
      pool[0].push({ text: `P(${k}) = ?`, num: c[k], den: total });
      pool[0].push({ text: `P(not ${k}) = ?`, num: total - c[k], den: total });
    }
  }

  // Level 2 — OR / NOT: P(X or Y)
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    for (let j = i + 1; j < COLOR_KEYS.length; j++) {
      const ki = COLOR_KEYS[i], kj = COLOR_KEYS[j];
      if (c[ki] > 0 && c[kj] > 0) {
        pool[1].push({ text: `P(${ki} or ${kj}) = ?`, num: c[ki] + c[kj], den: total });
      }
    }
  }

  // Level 3 — Two same-color draws: P(2X) = X*(X-1) / (T*(T-1))
  for (const k of COLOR_KEYS) {
    if (c[k] >= 2) {
      pool[2].push({ text: `P(2${k}) = ?`, num: c[k] * (c[k] - 1), den: den2 });
    }
  }

  // Level 4 — AND (two different colors): P(X and Y) = 2*X*Y / (T*(T-1))
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    for (let j = i + 1; j < COLOR_KEYS.length; j++) {
      const ki = COLOR_KEYS[i], kj = COLOR_KEYS[j];
      if (c[ki] > 0 && c[kj] > 0) {
        pool[3].push({ text: `P(${ki} and ${kj}) = ?`, num: 2 * c[ki] * c[kj], den: den2 });
      }
    }
  }

  // Level 5 — Compound OR: P(2X or 2Y)
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    for (let j = i + 1; j < COLOR_KEYS.length; j++) {
      const ki = COLOR_KEYS[i], kj = COLOR_KEYS[j];
      if (c[ki] >= 2 && c[kj] >= 2) {
        pool[4].push({
          text: `P(2${ki} or 2${kj}) = ?`,
          num: c[ki] * (c[ki] - 1) + c[kj] * (c[kj] - 1),
          den: den2,
        });
      }
    }
  }
  // Fallback for Level 5 if not enough colors have count >= 2
  if (pool[4].length === 0) {
    for (const k of COLOR_KEYS) {
      if (c[k] >= 2) {
        const others = COLOR_KEYS.filter(x => x !== k);
        const ki = others[0], kj = others[1];
        if (c[ki] > 0 && c[kj] > 0) {
          pool[4].push({
            text: `P(2${k} or (${ki} and ${kj})) = ?`,
            num: c[k] * (c[k] - 1) + 2 * c[ki] * c[kj],
            den: den2,
          });
        }
      }
    }
  }

  // Level 6 — At least / exactly (2 draws)
  for (const k of COLOR_KEYS) {
    if (c[k] > 0) {
      // P(at least 1X) = 1 - P(no X in 2 draws)
      pool[5].push({
        text: `P(at least 1${k}) = ?`,
        num: den2 - (total - c[k]) * (total - c[k] - 1),
        den: den2,
      });
      // P(exactly 1X) = 2 * X * (T-X) / (T*(T-1))
      if (total - c[k] > 0) {
        pool[5].push({
          text: `P(exactly 1${k}) = ?`,
          num: 2 * c[k] * (total - c[k]),
          den: den2,
        });
      }
    }
  }

  // Level 7 — Hard
  for (const k of COLOR_KEYS) {
    if (total - c[k] >= 2) {
      pool[6].push({
        text: `P(no ${k} in 2 draws) = ?`,
        num: (total - c[k]) * (total - c[k] - 1),
        den: den2,
      });
    }
  }
  const sameNum = COLOR_KEYS.reduce((s, k) => s + c[k] * (c[k] - 1), 0);
  pool[6].push({ text: "P(2 same color) = ?", num: sameNum, den: den2 });
  pool[6].push({ text: "P(2 diff colors) = ?", num: den2 - sameNum, den: den2 });

  return pool;
}

// Pick a random question from the pool at the given level, avoiding repeats
function pickQuestion(pool: Q[][], level: number, asked: Set<string>): Q {
  const lvl = Math.min(Math.max(0, level - 1), 6);

  // Try current level
  let avail = pool[lvl]?.filter(q => !asked.has(q.text)) ?? [];
  if (avail.length > 0) return avail[Math.floor(Math.random() * avail.length)];

  // Try higher levels
  for (let i = lvl + 1; i < 7; i++) {
    avail = pool[i]?.filter(q => !asked.has(q.text)) ?? [];
    if (avail.length > 0) return avail[Math.floor(Math.random() * avail.length)];
  }
  // Try lower levels
  for (let i = lvl - 1; i >= 0; i--) {
    avail = pool[i]?.filter(q => !asked.has(q.text)) ?? [];
    if (avail.length > 0) return avail[Math.floor(Math.random() * avail.length)];
  }

  // All exhausted — reset and pick from any non-empty level
  asked.clear();
  for (let i = lvl; i < 7; i++) {
    if (pool[i]?.length > 0) return pool[i][Math.floor(Math.random() * pool[i].length)];
  }
  for (let i = lvl - 1; i >= 0; i--) {
    if (pool[i]?.length > 0) return pool[i][Math.floor(Math.random() * pool[i].length)];
  }
  return pool[0][0];
}

// ── Constants ──
const GAME_SECONDS = 180;
const OPPONENT_THRESHOLDS = [140, 100, 60, 20]; // timeLeft values when opponent scores

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

  // Generate balls & question pool once per game
  const roundBalls = useMemo(() => generateRoundBalls(), [gameKey]);
  const questionPool = useMemo(() => {
    const counts = toBallCounts(roundBalls);
    const total = Object.values(roundBalls).reduce((a, b) => a + b, 0);
    return buildQuestionPool(counts, total);
  }, [roundBalls]);

  // Game state
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [question, setQuestion] = useState<Q | null>(null);
  const [active, setActive] = useState<"n" | "d">("n");
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenom] = useState("");
  const [flash, setFlash] = useState(false); // brief green flash on correct

  // Mutable refs for callback-safe access
  const scoreRef = useRef(0);
  const askedRef = useRef<Set<string>>(new Set());
  const opponentIdxRef = useRef(0);
  const flashingRef = useRef(false); // prevents key input during flash
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize first question when a new game starts ──
  useEffect(() => {
    askedRef.current = new Set();
    scoreRef.current = 0;
    opponentIdxRef.current = 0;
    const q = pickQuestion(questionPool, 1, askedRef.current);
    askedRef.current.add(q.text);
    setQuestion(q);
  }, [questionPool]);

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

  // ── Timer countdown ──
  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) { setGameOver(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver]);

  // ── Opponent scoring (4 points over 3 minutes) ──
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

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlash(false);
      flashingRef.current = false;

      // Advance difficulty: level = floor(score / 2) + 1, capped at 7
      const newLevel = Math.min(7, Math.floor(scoreRef.current / 2) + 1);
      const nextQ = pickQuestion(questionPool, newLevel, askedRef.current);
      askedRef.current.add(nextQ.text);
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

    // Auto-check: if both fields have valid numbers, test the fraction
    const curNum = isNum ? newVal : numerator;
    const curDen = isNum ? denominator : newVal;

    if (curNum !== "" && curDen !== "") {
      const n = parseInt(curNum, 10);
      const d = parseInt(curDen, 10);
      if (!isNaN(n) && !isNaN(d) && d > 0 && n >= 0) {
        // Cross-multiply to check fraction equality (accepts equivalent fractions)
        if (n * question.den === d * question.num) {
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

  // ── New game ──
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
              {gameOver ? "Time's up!" : (question?.text ?? "")}
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

            {/* Hint: shows simplified correct answer below keypad for reference during development — remove in production */}
            {question && (
              <div className="pb-2 opacity-0 pointer-events-none select-none">
                <span className="text-[10px] text-[#333]">{simplifyFrac(question.num, question.den)}</span>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
