import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateNumberLineQuestion,
  type NumberLineQuestion,
} from "./numberLineGenerator";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";

const assetPathPrefix = "/assets";
const imgStarIcon  = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon = `${assetPathPrefix}/ed88e.svg`;
const imgUndoArrow = `${assetPathPrefix}/675a8.svg`;
const imgClearIcon = `${assetPathPrefix}/737d9.svg`;

const TOTAL_SECONDS = 120; // 2-minute duel timer
const OPPONENT_THRESHOLDS = [90, 60, 30, 10]; // timeLeft values when opponent gets 1, 2, 3, 4 points

interface HistoryState {
  slots: string[];
  choices: string[];
}

export default function NumberLineRacePage() {
  // Question & difficulty state
  const [difficulty, setDifficulty] = useState(1);
  const [question, setQuestion] = useState<NumberLineQuestion>(() => generateNumberLineQuestion(1));

  // Current arrangement in the 5 top slots (empty string = unfilled slot)
  const [slots, setSlots] = useState<string[]>(["", "", "", "", ""]);
  // Remaining available numbers at bottom
  const [choices, setChoices] = useState<string[]>(() => question.numbers);

  // Selected card tracking: can be from available choices or from an existing slot
  const [selected, setSelected] = useState<{ source: "choice" | "slot"; index: number; value: string } | null>(null);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  // Visual feedback states
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrongFlash, setIsWrongFlash] = useState(false);

  // Scores & timer
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [gameOver, setGameOver] = useState(false);

  // Refs for async callbacks
  const difficultyRef = useRef(1);
  const opponentIdxRef = useRef(0);
  const advancingRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer countdown (2:00 -> 0:00) ──
  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // ── Opponent scoring (4 points across match) ──
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

  // ── Reset Game ──
  const startNewGame = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);

    advancingRef.current = false;
    difficultyRef.current = 1;
    setDifficulty(1);
    setPlayerScore(0);
    opponentIdxRef.current = 0;
    setOpponentScore(0);
    setTimeLeft(TOTAL_SECONDS);
    setGameOver(false);
    setIsCorrect(false);
    setIsWrongFlash(false);
    setSelected(null);
    setUndoStack([]);
    setRedoStack([]);

    const firstQ = generateNumberLineQuestion(1);
    setQuestion(firstQ);
    setSlots(["", "", "", "", ""]);
    setChoices(firstQ.numbers);
  }, []);

  // ── Correct Answer Handling ──
  const handleCorrect = useCallback((currentQuestion: NumberLineQuestion) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    // 1. Turn placed cards green
    setIsCorrect(true);
    setIsWrongFlash(false);

    // 2. Award +1 point immediately
    setPlayerScore(s => s + 1);

    // 3. Keep green state visible briefly, then advance to next question
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      difficultyRef.current += 1;
      setDifficulty(difficultyRef.current);

      const nextQ = generateNumberLineQuestion(difficultyRef.current, currentQuestion.numbers);
      setQuestion(nextQ);
      setSlots(["", "", "", "", ""]);
      setChoices(nextQ.numbers);
      setSelected(null);
      setUndoStack([]);
      setRedoStack([]);
      setIsCorrect(false);
      advancingRef.current = false;
    }, 850);
  }, []);

  // ── Helper to push to undo stack ──
  function pushHistory(currentSlots: string[], currentChoices: string[]) {
    setUndoStack(prev => [...prev, { slots: [...currentSlots], choices: [...currentChoices] }]);
    setRedoStack([]); // New action invalidates redo stack
  }

  // ── Check answer whenever all 5 slots are populated ──
  function verifyArrangement(newSlots: string[], currentQuestion: NumberLineQuestion) {
    if (!newSlots.every(s => s !== "")) return;

    const isMatch = newSlots.every((s, i) => s === currentQuestion.correctOrder[i]);
    if (isMatch) {
      handleCorrect(currentQuestion);
    } else {
      // Subtle incorrect indication without revealing the correct order
      setIsWrongFlash(true);
      if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
      wrongFlashTimerRef.current = setTimeout(() => {
        setIsWrongFlash(false);
      }, 500);
    }
  }

  // ── Tap a choice card at the bottom ──
  function selectChoice(val: string, idx: number) {
    if (gameOver || advancingRef.current) return;

    if (selected && selected.source === "choice" && selected.value === val) {
      // Tapping same selected card deselects it
      setSelected(null);
      return;
    }

    if (selected && selected.source === "slot") {
      // If a slot was selected, and player taps a bottom choice: swap them!
      pushHistory(slots, choices);
      const newSlots = [...slots];
      const newChoices = [...choices];

      newSlots[selected.index] = val;
      newChoices[idx] = selected.value;

      setSlots(newSlots);
      setChoices(newChoices);
      setSelected(null);
      verifyArrangement(newSlots, question);
      return;
    }

    setSelected({ source: "choice", index: idx, value: val });
  }

  // ── Tap a slot card at the top ──
  function handleSlotClick(slotIdx: number) {
    if (gameOver || advancingRef.current) return;

    const currentValInSlot = slots[slotIdx];

    // CASE 1: A bottom choice card is currently selected
    if (selected && selected.source === "choice") {
      pushHistory(slots, choices);
      const newSlots = [...slots];
      let newChoices = [...choices];

      if (currentValInSlot === "") {
        // Place in empty slot
        newSlots[slotIdx] = selected.value;
        newChoices = newChoices.filter((_, i) => i !== selected.index);
      } else {
        // Replace existing card: send old card back to choices, put selected card here
        newSlots[slotIdx] = selected.value;
        newChoices[selected.index] = currentValInSlot;
      }

      setSlots(newSlots);
      setChoices(newChoices);
      setSelected(null);
      verifyArrangement(newSlots, question);
      return;
    }

    // CASE 2: Another slot was previously selected
    if (selected && selected.source === "slot") {
      if (selected.index === slotIdx) {
        // Tapped the same slot again: return this card back to bottom choices!
        pushHistory(slots, choices);
        const newSlots = [...slots];
        newSlots[slotIdx] = "";
        const newChoices = [...choices, currentValInSlot];

        setSlots(newSlots);
        setChoices(newChoices);
        setSelected(null);
        return;
      }

      // Swap between two slots
      pushHistory(slots, choices);
      const newSlots = [...slots];
      newSlots[slotIdx] = selected.value;
      newSlots[selected.index] = currentValInSlot;

      setSlots(newSlots);
      setSelected(null);
      verifyArrangement(newSlots, question);
      return;
    }

    // CASE 3: Nothing is currently selected
    if (currentValInSlot !== "") {
      // Select this slot card to move/swap it
      setSelected({ source: "slot", index: slotIdx, value: currentValInSlot });
    }
  }

  // ── Undo Action ──
  function handleUndo() {
    if (undoStack.length === 0 || gameOver || advancingRef.current) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { slots: [...slots], choices: [...choices] }]);
    setUndoStack(prev => prev.slice(0, -1));

    setSlots([...previousState.slots]);
    setChoices([...previousState.choices]);
    setSelected(null);
    setIsWrongFlash(false);
  }

  // ── Redo Action ──
  function handleRedo() {
    if (redoStack.length === 0 || gameOver || advancingRef.current) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { slots: [...slots], choices: [...choices] }]);
    setRedoStack(prev => prev.slice(0, -1));

    setSlots([...nextState.slots]);
    setChoices([...nextState.choices]);
    setSelected(null);
    setIsWrongFlash(false);
    verifyArrangement(nextState.slots, question);
  }

  // ── Clear Action: return all numbers from slots to bottom ──
  function handleClear() {
    if (slots.every(s => s === "") || gameOver || advancingRef.current) return;

    pushHistory(slots, choices);
    setSlots(["", "", "", "", ""]);
    setChoices([...question.numbers]);
    setSelected(null);
    setIsWrongFlash(false);
  }

  const winner = gameOver
    ? playerScore > opponentScore
      ? "You win! 🎉"
      : playerScore < opponentScore
      ? "Opponent wins!"
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

  return (
    <div
      className="w-full min-h-dvh flex flex-col justify-between items-center pb-6 pt-6 px-4 sm:px-5"
      style={{ background: "rgb(18,19,22)" }}
      data-node-id="9:363"
    >
      <div className="flex flex-1 flex-col justify-between items-center max-w-[420px] w-full">

        {/* TOP: Header HUD */}
        <div className="flex flex-col gap-4 w-full shrink-0" data-node-id="9:364">
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

        {/* MIDDLE: Instructions */}
        <div className="flex flex-col gap-1 items-center px-1 pt-4 pb-2 w-full text-center">
          <p className="font-['Space_Grotesk:Bold'] font-bold text-white text-[18px] sm:text-[20px] leading-[26px]">
            {gameOver ? "Time's up!" : "Arrange numbers from smallest to largest"}
          </p>
          <p className="font-['Plus_Jakarta_Sans:Medium'] font-medium text-[#7a7e89] text-[11px] sm:text-[12px] leading-[16px]">
            Least → Greatest • Tap a card to select, then tap slot to place or swap
          </p>
        </div>

        {/* MAIN GAME AREA: Slots & Controls */}
        {gameOver ? (
          <div className="flex flex-col items-center gap-5 py-8 w-full my-auto">
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
          <div className="flex flex-1 flex-col justify-around items-center w-full py-4 gap-6" data-node-id="9:402">

            {/* 5 Top Slots */}
            <div className="w-full flex flex-col items-center gap-2">
              <div
                className={`flex gap-[6px] sm:gap-2 items-center justify-center w-full transition-transform ${isWrongFlash ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
              >
                {slots.map((val, idx) => {
                  const isFilled = val !== "";
                  const isSlotSelected = selected?.source === "slot" && selected.index === idx;

                  // Slot visual styling
                  let bgStyle = "bg-[#1b3828] border border-[rgba(6,78,59,0.4)]";
                  if (isCorrect && isFilled) {
                    bgStyle = "bg-[#10d070] shadow-[0px_0px_16px_0px_rgba(16,208,112,0.7)] text-black";
                  } else if (isWrongFlash && isFilled) {
                    bgStyle = "bg-[#ff5768] shadow-[0px_0px_14px_0px_rgba(255,87,104,0.6)] text-white";
                  } else if (isFilled) {
                    bgStyle = "bg-[#09b964] drop-shadow-[0px_3px_0px_#06743f] text-[#121316]";
                  }

                  const ringStyle = isSlotSelected
                    ? "ring-2 ring-[#5eead4] ring-offset-2 ring-offset-[#121316] scale-105"
                    : selected && !isFilled
                    ? "ring-1 ring-[rgba(40,227,126,0.6)] ring-offset-1 ring-offset-[#121316]"
                    : "";

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotClick(idx)}
                      className={`relative rounded-[14px] w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] flex items-center justify-center cursor-pointer transition-all ${bgStyle} ${ringStyle}`}
                    >
                      {isFilled ? (
                        <span className={`font-['Space_Grotesk:Bold'] font-bold text-center leading-tight px-1 select-none ${val.length > 4 ? "text-[14px] sm:text-[15px]" : "text-[16px] sm:text-[18px]"}`}>
                          {val}
                        </span>
                      ) : (
                        <span className="font-['Space_Grotesk:Bold'] font-bold text-[#2e5d42] text-[14px] select-none">
                          ?
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Number line arrow indicator */}
              <div className="flex items-center justify-between w-[290px] sm:w-[320px] px-2 text-[#7a7e89] text-[10px] sm:text-[11px] font-['Space_Grotesk:Bold'] font-medium">
                <span>Smallest</span>
                <span>⟶</span>
                <span>Largest</span>
              </div>
            </div>

            {/* Controls: Undo, Clear, Redo */}
            <div className="flex gap-4 items-center justify-center">
              {/* Undo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="bg-[#171717] border border-[#727272] flex items-center justify-center rounded-[12px] size-[46px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default active:scale-95"
                title="Undo"
              >
                <div className="relative size-[18px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgUndoArrow} />
                </div>
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                disabled={slots.every(s => s === "")}
                className="bg-[#171717] border-2 border-[#727272] drop-shadow-[0px_3px_0px_#727272] flex gap-2 items-center justify-center px-[16px] py-[12px] rounded-[12px] cursor-pointer disabled:opacity-40 disabled:cursor-default active:translate-y-[1px] transition-all"
              >
                <div className="relative size-[16px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClearIcon} />
                </div>
                <span className="font-['Space_Grotesk:Medium'] font-medium text-white text-[13px] sm:text-[14px] tracking-[0.55px] uppercase leading-[16px]">
                  CLEAR
                </span>
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="bg-[#171717] border border-[#727272] flex items-center justify-center rounded-[12px] size-[46px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default active:scale-95"
                title="Redo"
              >
                <div className="relative size-[18px] -scale-x-100">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgUndoArrow} />
                </div>
              </button>
            </div>

            {/* BOTTOM: Available Choice Cards Tray */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center w-full min-h-[64px]" data-node-id="9:425">
                {choices.map((val, idx) => {
                  const isChoiceSelected = selected?.source === "choice" && selected.index === idx;
                  return (
                    <button
                      key={`${val}-${idx}`}
                      type="button"
                      onClick={() => selectChoice(val, idx)}
                      className={`bg-[#1a1c20] border-[0.875px] drop-shadow-[0px_4.375px_0px_#1bb967] flex items-center justify-center p-[2px] rounded-[14px] w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] transition-all cursor-pointer ${
                        isChoiceSelected
                          ? "border-[#5eead4] ring-2 ring-[#5eead4] ring-offset-2 ring-offset-[#121316] scale-105"
                          : "border-[#28e37e] hover:border-[#5eead4]"
                      }`}
                    >
                      <span className={`font-['Space_Grotesk:Medium'] font-medium text-white text-center leading-tight px-1 select-none ${val.length > 4 ? "text-[14px] sm:text-[15px]" : "text-[16px] sm:text-[18px]"}`}>
                        {val}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Level indicator */}
              <div className="flex items-center justify-between w-full px-4 text-[#7a7e89] text-[11px] font-['Space_Grotesk:Bold']">
                <span>Level {difficulty}</span>
                <span>{slots.filter(s => s !== "").length} / 5 placed</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
