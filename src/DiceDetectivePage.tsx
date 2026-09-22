import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const assetPathPrefix = "/assets";
const imgStarIcon = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon = `${assetPathPrefix}/ed88e.svg`;
const imgArrow = `${assetPathPrefix}/7b676.svg`;

// Correct answers: cells where die1 + die2 = 7
// Grid is [row=die1][col=die2], 1-indexed
const CORRECT: Set<string> = new Set(
  [1,2,3,4,5,6].flatMap(d1 =>
    [1,2,3,4,5,6].filter(d2 => d1 + d2 === 7).map(d2 => `${d1}-${d2}`)
  )
);

const TOTAL_SECONDS = 23;

export default function DiceDetectivePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [playerScore, setPlayerScore] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  function toggleCell(key: string) {
    if (checked) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function checkAnswer() {
    if (checked) return;
    setChecked(true);
    // score = number of correct cells selected
    let correct = 0;
    selected.forEach(k => { if (CORRECT.has(k)) correct++; });
    setPlayerScore(correct);
  }

  function cellStyle(row: number, col: number) {
    const key = `${row}-${col}`;
    const isSelected = selected.has(key);
    const isCorrect = CORRECT.has(key);
    if (checked) {
      if (isCorrect) return "selected"; // always show correct in green after check
      if (isSelected && !isCorrect) return "wrong";
    }
    if (isSelected) return "selected";
    return "idle";
  }

  return (
    <div className="bg-[#121316] w-full min-h-dvh flex flex-col" data-node-id="6:165">
      <div className="flex flex-1 flex-col justify-between px-5 py-8">

        {/* TOP: Players + Scores */}
        <div className="flex flex-col gap-4">
          {/* Players row */}
          <div className="flex items-center justify-between" data-node-id="6:168">
            {/* You */}
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
            {/* Opponent */}
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

          {/* Score pills + timer */}
          <div className="flex items-center justify-between px-1" data-node-id="6:192">
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

        {/* MIDDLE: Question */}
        <div className="flex flex-col gap-[3px] items-center px-1 pt-10" data-node-id="6:206">
          <div className="max-w-[320px] text-center">
            <p className="font-['Space_Grotesk:Bold'] font-bold text-white text-[16px] leading-[22px]">
              Two dice are rolled. Select all outcomes where the sum equals 7.
            </p>
          </div>
          <p className="font-['Plus_Jakarta_Sans:Medium'] font-medium text-[#7a7e89] text-[11px] text-center leading-[16.5px]">
            6×6 Sample Space • Tap cards to flip & select
          </p>
        </div>

        {/* MAIN: 6×6 Grid */}
        <div className="flex items-center justify-center flex-1 py-4" data-node-id="6:211">
          <div className="relative" style={{ width: 270 }}>
            {/* Column labels */}
            <div className="flex items-center justify-between pl-7 pb-1">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="w-[40px] text-center">
                  <span className="font-['Space_Grotesk:Bold'] font-semibold text-[#71717a] text-[11px] leading-[16.5px]">{n}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {/* Row labels */}
              <div className="flex flex-col justify-between py-[14px]" style={{ width: 28 }}>
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="h-[40px] flex items-center justify-center">
                    <span className="font-['Space_Grotesk:Bold'] font-semibold text-[#71717a] text-[11px] leading-[16px]">{n}</span>
                  </div>
                ))}
              </div>
              {/* Grid */}
              <div
                className="inline-grid gap-[6px]"
                style={{ gridTemplateColumns: "repeat(6, 40px)", gridTemplateRows: "repeat(6, 40px)" }}
              >
                {[1,2,3,4,5,6].flatMap(row =>
                  [1,2,3,4,5,6].map(col => {
                    const key = `${row}-${col}`;
                    const state = cellStyle(row, col);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCell(key)}
                        className="relative rounded-[12px] size-[40px] cursor-pointer"
                      >
                        {/* Back face (selected/correct: cyan glow) */}
                        {state === "selected" && (
                          <div className="absolute inset-0 rounded-[12px] bg-[#5eead4] shadow-[0px_0px_12px_0px_rgba(94,234,212,0.6)]" />
                        )}
                        {state === "wrong" && (
                          <div className="absolute inset-0 rounded-[12px] bg-[#ff5768] shadow-[0px_0px_12px_0px_rgba(255,87,104,0.5)]" />
                        )}
                        {/* Front face */}
                        <div
                          className={`absolute inset-[0_0.33px_0.33px_0] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-opacity duration-150 ${
                            state === "idle" ? "bg-[#22252a] border border-[#2c3038]" : "opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Check Answer */}
        <button
          onClick={checkAnswer}
          disabled={checked}
          className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex gap-2 h-14 items-center justify-center rounded-[12px] w-full cursor-pointer disabled:opacity-60"
          data-node-id="6:161"
        >
          <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] text-center tracking-[0.4px] leading-[24px] whitespace-nowrap">
            CHECK ANSWER
          </span>
          {!checked && (
            <div className="relative size-[13.333px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
            </div>
          )}
        </button>

      </div>
    </div>
  );
}
