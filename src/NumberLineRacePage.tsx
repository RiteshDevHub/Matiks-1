import { useState, useEffect } from "react";

const assetPathPrefix = "/assets";
const imgStarIcon    = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon   = `${assetPathPrefix}/ed88e.svg`;
const imgUndoArrow   = `${assetPathPrefix}/675a8.svg`;
const imgClearIcon   = `${assetPathPrefix}/737d9.svg`;

// Number line puzzle: order 5 values from least → greatest.
// Pre-filled: slot index 2 = "1.42", slot index 4 = "10/7"
// Choices to place: "17/12" (≈1.4167), "√2" (≈1.4142), "√2.03" (≈1.4248)
// Correct order: √2, 17/12, 1.42, √2.03, 10/7

type Slot = { value: string; locked: boolean };

const INITIAL_SLOTS: Slot[] = [
  { value: "", locked: false },
  { value: "", locked: false },
  { value: "1.42", locked: true },
  { value: "", locked: false },
  { value: "10/7", locked: true },
];

const CHOICES = ["17/12", "√2.03", "√2"];
const CORRECT_ORDER = ["√2", "17/12", "1.42", "√2.03", "10/7"];
const TOTAL_SECONDS = 23;

export default function NumberLineRacePage() {
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS.map(s => ({ ...s })));
  const [choices, setChoices] = useState<string[]>([...CHOICES]);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<{ slots: Slot[]; choices: string[] }[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [playerScore, setPlayerScore] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0 || checked) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, checked]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const allFilled = slots.every(s => s.value !== "");

  function selectChoice(val: string) {
    if (checked) return;
    setSelected(prev => prev === val ? null : val);
  }

  function placeInSlot(idx: number) {
    if (!selected || slots[idx].locked || slots[idx].value !== "" || checked) return;
    setHistory(h => [...h, { slots: slots.map(s => ({ ...s })), choices: [...choices] }]);
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, value: selected } : s));
    setChoices(prev => prev.filter(c => c !== selected));
    setSelected(null);
  }

  function undo() {
    if (history.length === 0 || checked) return;
    const prev = history[history.length - 1];
    setSlots(prev.slots.map(s => ({ ...s })));
    setChoices([...prev.choices]);
    setHistory(h => h.slice(0, -1));
    setSelected(null);
  }

  function clear() {
    if (checked) return;
    setSlots(INITIAL_SLOTS.map(s => ({ ...s })));
    setChoices([...CHOICES]);
    setHistory([]);
    setSelected(null);
  }

  function checkAnswer() {
    if (!allFilled || checked) return;
    const isCorrect = slots.every((s, i) => s.value === CORRECT_ORDER[i]);
    setChecked(true);
    setCorrect(isCorrect);
    if (isCorrect) setPlayerScore(1);
  }

  function slotColor(s: Slot, idx: number): string {
    if (!s.locked && s.value === "") return "bg-[#1b3828] border border-[rgba(6,78,59,0.4)]";
    if (checked) {
      const ok = s.value === CORRECT_ORDER[idx];
      if (s.locked) return ok ? "bg-[#09b964]" : "bg-[#09b964]";
      return ok ? "bg-[#09b964]" : "bg-[#ff5768]";
    }
    if (s.locked) return "bg-[#09b964]";
    return "bg-[#09b964]"; // user-placed, pre-check
  }

  return (
    <div
      className="w-full min-h-dvh flex flex-col gap-[17px] items-center pb-[88px] pt-8 px-5"
      style={{ background: "rgb(18,19,22)" }}
      data-node-id="9:363"
    >
      {/* TOP: Header HUD */}
      <div className="flex flex-col gap-4 h-[84px] items-start pt-1 w-full" data-node-id="9:364">
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

      {/* MAIN: Number line slots + controls */}
      <div className="flex flex-1 flex-col gap-[120px] items-center pt-[200px] w-full" data-node-id="9:402">

        {/* Number line slots */}
        <div className="flex flex-wrap gap-2 items-center justify-center w-full">
          {slots.map((s, i) => (
            <button
              key={i}
              onClick={() => placeInSlot(i)}
              disabled={s.locked || s.value !== "" || !selected || checked}
              className={`relative rounded-[12px] size-[56px] flex items-center justify-center cursor-pointer transition-all ${slotColor(s, i)} ${
                !s.locked && s.value === "" && selected && !checked
                  ? "ring-2 ring-[#28e37e] ring-offset-1 ring-offset-[#121316]"
                  : ""
              }`}
            >
              {s.value && (
                <span className="font-['Space_Grotesk:Bold'] font-bold text-[#121316] text-[20px] text-center leading-normal">
                  {s.value}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Controls: undo, clear, redo */}
        <div className="flex gap-4 items-start">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={history.length === 0 || checked}
            className="bg-[#171717] border border-[#727272] flex gap-1 items-center justify-center p-[13px] rounded-[12px] size-[44px] transition-opacity disabled:opacity-30"
          >
            <div className="relative size-[16px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgUndoArrow} />
            </div>
          </button>

          {/* Clear */}
          <button
            onClick={clear}
            disabled={checked}
            className="bg-[#171717] border-2 border-[#727272] drop-shadow-[0px_3px_0px_#727272] flex gap-2 items-center justify-center px-[14px] py-[14px] rounded-[12px] disabled:opacity-50"
          >
            <div className="relative size-[16px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClearIcon} />
            </div>
            <span className="font-['Space_Grotesk:Medium'] font-medium text-white text-[14px] tracking-[0.55px] uppercase leading-[16px]">
              CLEAR
            </span>
          </button>

          {/* Redo (visual only — mirror of undo) */}
          <button
            disabled
            className="bg-[#171717] border border-[#727272] flex gap-1 items-center justify-center p-[13px] rounded-[12px] size-[44px] opacity-30"
          >
            <div className="relative size-[16px] -scale-x-100">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgUndoArrow} />
            </div>
          </button>
        </div>
      </div>

      {/* BOTTOM: Choice buttons */}
      <div className="flex flex-wrap gap-5 items-center justify-center w-full" data-node-id="9:425">
        {choices.map(val => (
          <button
            key={val}
            onClick={() => selectChoice(val)}
            className={`bg-[#1a1c20] border-[0.875px] drop-shadow-[0px_4.375px_0px_#1bb967] flex items-center justify-center p-[0.875px] rounded-[12.25px] size-[56px] transition-all cursor-pointer ${
              selected === val
                ? "border-[#28e37e] ring-2 ring-[#28e37e] ring-offset-1 ring-offset-[#121316] scale-105"
                : "border-[#28e37e]"
            }`}
          >
            <span className="font-['Space_Grotesk:Medium'] font-medium text-white text-[16px] text-center leading-[24px]">
              {val}
            </span>
          </button>
        ))}

        {/* Check answer button appears when all slots filled */}
        {allFilled && !checked && (
          <button
            onClick={checkAnswer}
            className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-2 cursor-pointer"
          >
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              CHECK ANSWER
            </span>
          </button>
        )}

        {checked && (
          <div className={`flex items-center justify-center w-full mt-2 rounded-[12px] h-14 ${correct ? "bg-[#10d070]" : "bg-[#ff5768]"}`}>
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              {correct ? "CORRECT! 🎉" : "WRONG ORDER"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
