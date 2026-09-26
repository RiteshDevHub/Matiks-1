import { useState, useEffect, useRef, useCallback } from "react";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";
import {
  generateSequence,
  checkAnswers,
  type SequenceQuestion,
} from "./sequenceGenerator";

const assetPathPrefix = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;

const TOTAL_SECONDS = 60; // 1-minute game

// ────────────────────────── Component ──────────────────────────

export default function SequenceBuilderPage() {
  // ── Round state ──
  const usedKeysRef = useRef(new Set<string>());
  const [question, setQuestion] = useState<SequenceQuestion>(() =>
    generateSequence(1, usedKeysRef.current)
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    new Array(question.missingIndices.length).fill("")
  );
  const [activeBlankIdx, setActiveBlankIdx] = useState(0); // which blank is selected
  const [slotResults, setSlotResults] = useState<("idle" | "correct" | "wrong")[]>([]);
  const [roundPhase, setRoundPhase] = useState<"playing" | "correct" | "wrong">("playing");
  const roundStartRef = useRef(Date.now());

  // ── Game state ──
  const [playerScore, setPlayerScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [roundCount, setRoundCount] = useState(0);

  // ── Refs for timers ──
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer countdown ──
  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) { setGameOver(true); return; }
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, gameOver]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
    };
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  // ── Start new round ──
  const startNewRound = useCallback((currentScore?: number) => {
    const score = currentScore !== undefined ? currentScore : playerScore;
    // First 2 questions (score 0, 1): Level 1 (moderately easy)
    // As player keeps giving right answers: Level 2 (2-3), Level 3 (4-5), Level 4 (6-7), Level 5 (8+)
    const nextDiff = Math.min(5, Math.floor(score / 2) + 1);
    setDifficulty(nextDiff);

    const q = generateSequence(nextDiff, usedKeysRef.current);
    setQuestion(q);
    setAnswers(new Array(q.missingIndices.length).fill(""));
    setActiveBlankIdx(0);
    setSlotResults([]);
    setRoundPhase("playing");
    setRoundCount(c => c + 1);
    roundStartRef.current = Date.now();
  }, [playerScore]);

  // ── Auto-check when all blanks have reached their expected digit count ──
  useEffect(() => {
    if (roundPhase !== "playing") return;
    if (gameOver) return;

    // Check if every blank has reached its expected digit count
    const allComplete =
      answers.length > 0 &&
      answers.every((a, i) => a.length === question.correctAnswers[i]?.length);
    if (!allComplete) return;

    // Small delay so the player sees their last keystroke
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      const results = checkAnswers(answers, question.correctAnswers);
      const allCorrect = results.every(Boolean);
      const resultStates = results.map(r => r ? "correct" as const : "wrong" as const);
      setSlotResults(resultStates);

      if (allCorrect) {
        const nextScore = playerScore + 1;
        setPlayerScore(nextScore);
        setStreak(s => s + 1);
        setRoundPhase("correct");

        // Auto advance after brief display
        if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
        wrongFlashTimerRef.current = setTimeout(() => {
          if (!gameOver) startNewRound(nextScore);
        }, 800);
      } else {
        setStreak(0);
        setRoundPhase("wrong");

        // Flash red, then make boxes blank again so player can retry
        if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
        wrongFlashTimerRef.current = setTimeout(() => {
          setAnswers(new Array(question.missingIndices.length).fill(""));
          setSlotResults([]);
          setActiveBlankIdx(0);
          setRoundPhase("playing");
        }, 700);
      }
    }, 200);

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, roundPhase, gameOver, playerScore, question]);

  // ── Keypad handler ──
  function pressKey(key: string) {
    if (gameOver || roundPhase !== "playing" || !question) return;
    if (key === ".") return; // decimals avoided

    const targetLen = question.correctAnswers[activeBlankIdx]?.length ?? 2;
    const cur = answers[activeBlankIdx] ?? "";

    if (key === "⌫") {
      if (cur.length > 0) {
        setAnswers(prev => {
          const next = [...prev];
          next[activeBlankIdx] = cur.slice(0, -1);
          return next;
        });
      } else if (activeBlankIdx > 0) {
        // Move to previous blank and remove its last digit
        const prevIdx = activeBlankIdx - 1;
        setActiveBlankIdx(prevIdx);
        setAnswers(prev => {
          const next = [...prev];
          next[prevIdx] = (next[prevIdx] ?? "").slice(0, -1);
          return next;
        });
      }
      return;
    }

    // Digit pressed: only append if under target digit count
    if (cur.length < targetLen) {
      const nextVal = cur + key;
      setAnswers(prev => {
        const next = [...prev];
        next[activeBlankIdx] = nextVal;
        return next;
      });

      // If this blank is now full, automatically jump to next unfilled blank
      if (nextVal.length === targetLen) {
        const nextBlankIdx = answers.findIndex(
          (ans, idx) => idx !== activeBlankIdx && ans.length < (question.correctAnswers[idx]?.length ?? 2)
        );
        if (nextBlankIdx !== -1) {
          setActiveBlankIdx(nextBlankIdx);
        }
      }
    }
  }

  // ── Tap on a blank slot ──
  function tapBlank(blankIndex: number) {
    if (roundPhase !== "playing") return;
    setActiveBlankIdx(blankIndex);
  }

  // ── Physical keyboard support ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= "0" && e.key <= "9") {
        pressKey(e.key);
      } else if (e.key === "Backspace") {
        pressKey("⌫");
      } else if (e.key === "Tab" || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        setActiveBlankIdx(i => (i + 1) % answers.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveBlankIdx(i => (i - 1 + answers.length) % answers.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // ── Restart ──
  function startNewGame() {
    usedKeysRef.current.clear();
    setPlayerScore(0);
    setStreak(0);
    setDifficulty(1);
    setTimeLeft(TOTAL_SECONDS);
    setGameOver(false);
    setRoundCount(0);
    startNewRound(0);
  }

  // ── End screens ──
  if (gameOver) {
    if (playerScore >= 5) {
      return (
        <VictoryScreen
          playerScore={playerScore}
          opponentScore={0}
          onRematch={startNewGame}
          flows={roundCount}
          grinds={playerScore}
          chokes={0}
        />
      );
    } else {
      return (
        <LossScreen
          playerScore={playerScore}
          opponentScore={Math.max(1, playerScore + 1)}
          onRematch={startNewGame}
          flows={0}
          grinds={0}
          chokes={roundCount}
        />
      );
    }
  }

  // ── Build tile data ──
  // We need to show all terms of the sequence.
  // Known terms show their value; blanks show the player's input.
  const totalLen = question.fullSequence.length;
  const missingSet = new Set(question.missingIndices);
  const blankIndexMap = new Map<number, number>(); // seqIdx → blankIdx
  question.missingIndices.forEach((seqIdx, blankIdx) => blankIndexMap.set(seqIdx, blankIdx));

  type TileData = {
    display: string;
    type: "given" | "blank" | "correct" | "wrong";
    blankIdx?: number;
    correctAnswer?: string;
  };

  const tiles: TileData[] = [];
  for (let i = 0; i < totalLen; i++) {
    if (missingSet.has(i)) {
      const bIdx = blankIndexMap.get(i)!;
      const slotRes = slotResults[bIdx];
      if (slotRes === "correct") {
        tiles.push({ display: answers[bIdx], type: "correct", blankIdx: bIdx });
      } else if (slotRes === "wrong") {
        tiles.push({
          display: answers[bIdx],
          type: "wrong",
          blankIdx: bIdx,
          correctAnswer: question.correctAnswers[bIdx],
        });
      } else {
        tiles.push({ display: answers[bIdx] ?? "", type: "blank", blankIdx: bIdx });
      }
    } else {
      tiles.push({ display: question.fullSequence[i], type: "given" });
    }
  }

  // ── Keypad layout (identical to Poker Odds & Probability Draw) ──
  const KEYS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "⌫"],
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

        {/* Tiles row – maximum 6 boxes */}
        <div className="flex flex-nowrap gap-2 items-center justify-center w-full max-w-[340px] px-1">
          {tiles.map((tile, i) => {
            const isBlank = tile.type === "blank";
            const isActive = isBlank && tile.blankIdx === activeBlankIdx;
            const isCorrectResult = tile.type === "correct";
            const isWrongResult = tile.type === "wrong";

            let bg = "bg-[#09b964]";
            let textColor = "text-[#121316]";
            let border = "";
            let ring = "";

            if (isBlank) {
              bg = "bg-[#1b3828]";
              textColor = "text-white";
              border = "border border-[rgba(6,78,59,0.4)]";
              if (isActive) ring = "ring-2 ring-[#09b964]";
            }
            if (isCorrectResult) { bg = "bg-[#09b964]"; textColor = "text-[#121316]"; }
            if (isWrongResult) { bg = "bg-[#ff5768]"; textColor = "text-white"; }

            // Determine display text
            const displayText = tile.display;

            return (
              <div
                key={i}
                onClick={() => isBlank ? tapBlank(tile.blankIdx!) : undefined}
                className={`relative rounded-[12px] flex-1 max-w-[52px] h-[52px] min-w-[42px] flex flex-col items-center justify-center ${bg} ${border} ${ring} ${isBlank ? "cursor-pointer" : ""} transition-all duration-200`}
              >
                {displayText ? (
                  <span className={`font-['Space_Grotesk:Bold'] font-bold ${textColor} text-[18px] text-center leading-normal`}>
                    {displayText}
                  </span>
                ) : null}
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
        <div className="pb-4 w-full max-w-[257px]">
          <div className="border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex h-[54px] items-center justify-center rounded-[16px] w-full shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <span className={`font-['Plus_Jakarta_Sans:Medium'] font-medium text-[18px] leading-[28px] ${answers[activeBlankIdx] ? "text-white" : "text-[#a1a1aa]"}`}>
              {roundPhase !== "playing"
                ? (roundPhase === "correct" ? "✓ Correct!" : "✕ Wrong")
                : (answers[activeBlankIdx] || "Enter answer")}
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
              onClick={() => pressKey(key)}
              disabled={roundPhase !== "playing"}
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
      </div>
    </div>
  );
}
