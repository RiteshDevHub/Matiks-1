// Probability Draw Duels game screen
import { useState, useEffect, useRef, useMemo } from "react";
import PhysicsBalls, { type BallConfig } from "./PhysicsBalls";

const assetPathPrefix  = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;

const BALL_COLORS = ["#ef4444", "#3b82f6", "#22c55e"] as const;
const COLOR_LABELS = ["R", "B", "G"] as const;

/** Generate random ball counts: 3 colors, 1–8 each, total 10–20 */
function generateRoundBalls(): BallConfig {
  let counts: number[];
  do {
    counts = BALL_COLORS.map(() => Math.floor(Math.random() * 8) + 1);
  } while (counts.reduce((a, b) => a + b, 0) < 10 || counts.reduce((a, b) => a + b, 0) > 20);
  const config: BallConfig = {};
  BALL_COLORS.forEach((c, i) => (config[c] = counts[i]));
  return config;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Pick 1 or 2 colors at random for the question */
function generateQuestion(balls: BallConfig) {
  const askCount = Math.random() < 0.5 ? 1 : 2;
  const indices = [...Array(BALL_COLORS.length).keys()];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const chosen = indices.slice(0, askCount).sort();
  const labels = chosen.map((i) => COLOR_LABELS[i]);
  const questionText = askCount === 1 ? `P(${labels[0]}) = ?` : `P(${labels[0]} or ${labels[1]}) = ?`;
  const total = Object.values(balls).reduce((a, b) => a + b, 0);
  const favorable = chosen.reduce((sum, i) => sum + (balls[BALL_COLORS[i]] ?? 0), 0);
  const g = gcd(favorable, total);
  return {
    questionText,
    correctPairs: [
      { n: String(favorable), d: String(total) },
      ...(g > 1 ? [{ n: String(favorable / g), d: String(total / g) }] : []),
    ],
    favorable,
    total,
  };
}

const TOTAL_SECONDS = 23;
const KEYS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  [".",  "0","⌫"],
];

function isCorrect(n: string, d: string, pairs: { n: string; d: string }[]) {
  return pairs.some(p => p.n === n.trim() && p.d === d.trim());
}

export default function ProbabilityDrawPage() {
  // "numerator" | "denominator" — which box is active
  const ballsContainerRef = useRef<HTMLDivElement>(null);
  const [ballsDims, setBallsDims] = useState({ w: 0, h: 0 });

  // Generate random balls and question once per mount
  const roundBalls = useMemo(() => generateRoundBalls(), []);
  const round = useMemo(() => generateQuestion(roundBalls), [roundBalls]);

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

  const [active, setActive]       = useState<"n" | "d">("n");
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenom]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect]     = useState(false);
  const [playerScore, setScore]   = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  function pressKey(key: string) {
    if (submitted) return;
    const setter = active === "n" ? setNumerator : setDenom;
    const val    = active === "n" ? numerator    : denominator;
    if (key === "⌫") {
      setter(val.slice(0, -1));
    } else if (val.length < 4) {
      setter(val + key);
    }
  }

  function submit() {
    if (!numerator || !denominator || submitted) return;
    const ok = isCorrect(numerator, denominator, round.correctPairs);
    setSubmitted(true);
    setCorrect(ok);
    if (ok) setScore(1);
  }

  const canSubmit = numerator.length > 0 && denominator.length > 0;

  function boxStyle(field: "n" | "d") {
    if (!submitted) return active === field ? "ring-2 ring-[#5eead4]" : "";
    return correct ? "ring-2 ring-[#09b964]" : "ring-2 ring-[#ff5768]";
  }

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
            <PhysicsBalls width={ballsDims.w} height={ballsDims.h} balls={roundBalls} />
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
                <span className="font-['Space_Grotesk:Bold'] font-bold text-[#5eead4] text-[12px] tracking-[0.6px] leading-[16px]">
                  {mins}:{secs}
                </span>
              </div>
              <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
                <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[12px] leading-[16px]">0</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="flex flex-col items-center pt-6 w-full" data-node-id="11:591">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[28px] text-center leading-normal whitespace-nowrap">
              {round.questionText}
            </span>
          </div>
        </div>
      </div>

      {/* Answer + Keypad */}
      <div className="flex flex-col items-center w-full" data-node-id="11:596">

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
            onClick={() => !submitted && setActive("n")}
            className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all ${boxStyle("n")}`}
          >
            <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${submitted ? (correct ? "text-[#09b964]" : "text-[#ff5768]") : "text-white"}`}>
              {numerator}
            </span>
          </button>

          <span className="font-['Space_Grotesk:Medium'] font-medium text-white text-[18px] leading-[28px]">/</span>

          {/* Denominator box */}
          <button
            onClick={() => !submitted && setActive("d")}
            className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all ${boxStyle("d")}`}
          >
            <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${submitted ? (correct ? "text-[#09b964]" : "text-[#ff5768]") : "text-white"}`}>
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
              disabled={submitted}
              className="bg-[#3b3d42] flex h-[60px] items-center justify-center rounded-[8px] cursor-pointer active:bg-[#4e5057] transition-colors disabled:opacity-40"
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

        {/* Submit */}
        {!submitted && (
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-1 cursor-pointer disabled:opacity-40 disabled:cursor-default transition-opacity"
          >
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              SUBMIT
            </span>
          </button>
        )}

        {submitted && (
          <div className={`flex items-center justify-center w-full mt-1 rounded-[12px] h-14 ${correct ? "bg-[#10d070]" : "bg-[#ff5768]"}`}>
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              {correct ? "CORRECT! 🎉" : `Wrong — answer is ${round.favorable}/${round.total}`}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
