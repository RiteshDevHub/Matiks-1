import { useState, useEffect } from "react";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";

const assetPathPrefix = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;

// Sequence: 10, 17, 26, ?, ?
// Differences: +7, +9, +11, +13 → answers: 37, 50
const GIVEN   = ["10", "17", "26"];
const ANSWERS = ["37", "50"];
const TOTAL_SECONDS = 23;

type SlotState = "idle" | "correct" | "wrong";

export default function SequenceBuilderPage() {
  const [input, setInput]           = useState("");
  const [filled, setFilled]         = useState<string[]>([]);   // submitted answers
  const [slotStates, setSlotStates] = useState<SlotState[]>([]); // per-answer result
  const [done, setDone]             = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) {
      setDone(true);
      return;
    }
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, done]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const currentSlot = filled.length; // index of the slot being answered (0 or 1)
  const isAllDone   = filled.length >= ANSWERS.length;

  function pressKey(key: string) {
    if (done || isAllDone) return;
    if (key === "⌫") {
      setInput(p => p.slice(0, -1));
    } else if (input.length < 6) {
      setInput(p => p + key);
    }
  }

  function submitAnswer() {
    if (!input || isAllDone) return;
    const isCorrect = input.trim() === ANSWERS[currentSlot];
    const newStates = [...slotStates, isCorrect ? "correct" as SlotState : "wrong" as SlotState];
    const newFilled = [...filled, input.trim()];
    setSlotStates(newStates);
    setFilled(newFilled);
    setInput("");
    if (isCorrect) setPlayerScore(s => s + 1);
    if (newFilled.length >= ANSWERS.length) setDone(true);
  }

  function startNewGame() {
    setInput("");
    setFilled([]);
    setSlotStates([]);
    setDone(false);
    setPlayerScore(0);
    setTimeLeft(TOTAL_SECONDS);
  }

  if (done) {
    if (playerScore >= 1) {
      return (
        <VictoryScreen
          playerScore={playerScore}
          opponentScore={0}
          onRematch={startNewGame}
          flows={2}
          grinds={playerScore}
          chokes={0}
        />
      );
    } else {
      return (
        <LossScreen
          playerScore={playerScore}
          opponentScore={1}
          onRematch={startNewGame}
          flows={0}
          grinds={0}
          chokes={2}
        />
      );
    }
  }

  // Build the 5 display tiles
  const tiles = [
    ...GIVEN.map(v => ({ value: v, state: "given" as const })),
    ...Array.from({ length: 2 }, (_, i) => {
      if (i < filled.length) return { value: filled[i], state: slotStates[i] };
      if (i === currentSlot && !isAllDone) return { value: "", state: "active" as const };
      return { value: "", state: "empty" as const };
    }),
  ];

  const KEYS = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    [".","0","⌫"],
  ];

  return (
    <div
      className="w-full min-h-dvh flex flex-col gap-[17px] items-center pt-8 px-5"
      style={{ background: "rgb(18,19,22)" }}
      data-node-id="9:445"
    >
      {/* TOP: Header HUD */}
      <div className="flex flex-col gap-4 h-[84px] items-start pt-1 w-full" data-node-id="9:446">
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
            <span className="font-['Space_Grotesk:Bold'] font-bold text-[#5eead4] text-[12px] tracking-[0.6px] leading-[16px]">
              {mins}:{secs}
            </span>
          </div>
          <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[12px] leading-[16px]">0</span>
          </div>
        </div>
      </div>

      {/* MAIN: Sequence tiles */}
      <div className="flex flex-1 flex-col items-center justify-center w-full" data-node-id="9:484">
        <div className="flex gap-2 items-center justify-center w-full">
          {tiles.map((tile, i) => {
            let bg = "bg-[#09b964]";
            let textColor = "text-[#121316]";
            let border = "";
            if (tile.state === "empty" || tile.state === "active") {
              bg = "bg-[#1b3828]";
              textColor = "text-white";
              border = "border border-[rgba(6,78,59,0.4)]";
            }
            if (tile.state === "correct") { bg = "bg-[#09b964]"; textColor = "text-[#121316]"; }
            if (tile.state === "wrong")   { bg = "bg-[#ff5768]"; textColor = "text-[#121316]"; }
            return (
              <div
                key={i}
                className={`relative rounded-[12px] size-[52px] flex items-center justify-center ${bg} ${border} ${
                  tile.state === "active" ? "ring-2 ring-[#09b964]" : ""
                }`}
              >
                {tile.value && (
                  <span className={`font-['Space_Grotesk:Bold'] font-bold ${textColor} text-[20px] text-center leading-normal`}>
                    {tile.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM: Answer field + keypad */}
      <div className="flex flex-col items-center w-full pb-2" data-node-id="9:494">

        {/* Label */}
        <div className="pb-[10px]">
          <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#a1a1aa] text-[11px] tracking-[1.1px] uppercase leading-[16.5px]">
            TYPE OUT YOUR ANSWER
          </span>
        </div>

        {/* Answer display box */}
        <div className="pb-6 w-full max-w-[257px]">
          <div className="border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex h-[54px] items-center justify-center rounded-[16px] w-full shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <span className={`font-['Plus_Jakarta_Sans:Medium'] font-medium text-[18px] leading-[28px] ${input ? "text-white" : "text-[#a1a1aa]"}`}>
              {input || (isAllDone ? (playerScore === 2 ? "All correct! 🎉" : "Done!") : "Enter answer")}
            </span>
          </div>
        </div>

        {/* Numeric keypad */}
        <div
          className="grid gap-[6px] pb-2 px-2 w-full"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridTemplateRows: "repeat(4, 60px)" }}
          data-node-id="9:501"
        >
          {KEYS.flat().map((key) => (
            <button
              key={key}
              onClick={() => key === "⌫" ? pressKey("⌫") : pressKey(key)}
              disabled={isAllDone}
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

        {/* Submit button */}
        {!isAllDone && (
          <button
            onClick={submitAnswer}
            disabled={!input}
            className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-1 cursor-pointer disabled:opacity-40 disabled:cursor-default transition-opacity"
          >
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              SUBMIT
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
