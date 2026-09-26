import { useState, useEffect, Fragment, useCallback, useRef } from "react";
import {
  generateDiceQuestion,
  type DiceQuestion,
} from "./diceDetectiveGenerator";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";

const assetPathPrefix = "/assets";
const imgStarIcon = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon = `${assetPathPrefix}/ed88e.svg`;

const TOTAL_SECONDS = 60; // 1-minute match timer
const OPPONENT_THRESHOLDS = [40, 20, 5]; // timeLeft values when opponent gets 1, 2, 3 points

interface DiceCardProps {
  selected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
}

function DiceCard({ selected, isCorrect, isWrong, onClick }: DiceCardProps) {
  const backBg = isCorrect
    ? "bg-[#10d070] shadow-[0px_0px_16px_0px_rgba(16,208,112,0.7)]"
    : isWrong
    ? "bg-[#ff5768] shadow-[0px_0px_14px_0px_rgba(255,87,104,0.6)]"
    : "bg-[#5eead4] shadow-[0px_0px_14px_0px_rgba(94,234,212,0.65)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square w-full relative cursor-pointer select-none focus:outline-none p-0 border-0 bg-transparent"
      style={{
        perspective: 600,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: selected ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Grey Front Face (Initial State) */}
        <div
          className="absolute inset-0 rounded-[10px] sm:rounded-[12px] bg-[#22252a] border border-[#2c3038] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.35)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        />

        {/* Back Face (Flipped/Selected State: Cyan / Green / Red) */}
        <div
          className={`absolute inset-0 rounded-[10px] sm:rounded-[12px] transition-colors duration-250 ${backBg}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        />
      </div>
    </button>
  );
}

export default function DiceDetectivePage() {
  // Question & difficulty state
  const [difficulty, setDifficulty] = useState(1);
  const [question, setQuestion] = useState<DiceQuestion>(() => generateDiceQuestion(1));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Visual feedback states
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrongFlash, setIsWrongFlash] = useState(false);

  // Scores & timer
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [gameOver, setGameOver] = useState(false);

  // Refs for tracking async state & timers
  const difficultyRef = useRef(1);
  const opponentIdxRef = useRef(0);
  const advancingRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuestionTextRef = useRef(question.text);

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

  // ── Reset Game Sequence ──
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
    setSelected(new Set());

    const firstQ = generateDiceQuestion(1);
    lastQuestionTextRef.current = firstQ.text;
    setQuestion(firstQ);
  }, []);

  // ── Handle Correct Answer Flow ──
  const handleCorrect = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    // 1. Selected cards turn GREEN
    setIsCorrect(true);
    setIsWrongFlash(false);

    // 2. Award +1 point
    setPlayerScore(s => s + 1);

    // 3. Keep green state visible briefly, then advance
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      // Difficulty increases after every correct answer
      difficultyRef.current += 1;
      setDifficulty(difficultyRef.current);

      // Generate new question from next difficulty category
      const nextQ = generateDiceQuestion(difficultyRef.current, lastQuestionTextRef.current);
      lastQuestionTextRef.current = nextQ.text;
      setQuestion(nextQ);

      // All cards reset to unselected grey state
      setSelected(new Set());
      setIsCorrect(false);
      advancingRef.current = false;
    }, 850);
  }, []);

  // ── Card Toggle with Automatic Verification ──
  function toggleCell(key: string) {
    if (gameOver || advancingRef.current) return;

    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      // Check if complete candidate set is selected
      const targetCount = question.correctOutcomes.length;
      if (next.size === targetCount) {
        // Verify if all selected keys match the correct outcomes
        let allCorrect = true;
        for (const k of next) {
          if (!question.correctKeys.has(k)) {
            allCorrect = false;
            break;
          }
        }

        if (allCorrect) {
          // Exactly the correct set!
          handleCorrect();
        } else {
          // Complete candidate set has errors: briefly indicate incorrect without revealing individual cards
          setIsWrongFlash(true);
          if (wrongFlashTimerRef.current) clearTimeout(wrongFlashTimerRef.current);
          wrongFlashTimerRef.current = setTimeout(() => {
            setIsWrongFlash(false);
          }, 500);
        }
      } else {
        setIsWrongFlash(false);
      }

      return next;
    });
  }

  const winner = gameOver
    ? playerScore > opponentScore
      ? "You win! 🎉"
      : playerScore < opponentScore
      ? "Opponent wins!"
      : "It's a tie!"
    : "";

  if (gameOver) {
    if (playerScore > opponentScore) {
      return (
        <VictoryScreen
          playerScore={playerScore}
          opponentScore={opponentScore}
          onRematch={startNewGame}
          flows={Math.max(1, Math.floor(playerScore / 2))}
          grinds={playerScore}
          chokes={Math.max(0, 3 - playerScore)}
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
          chokes={Math.max(1, 3 - playerScore)}
        />
      );
    }
  }

  return (
    <div className="bg-[#121316] w-full min-h-dvh flex flex-col justify-between" data-node-id="6:165">
      <div className="flex flex-1 flex-col justify-between px-4 sm:px-5 py-6 sm:py-8 max-w-[420px] mx-auto w-full">

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
              <span className={`font-['Space_Grotesk:Bold'] font-bold text-[12px] tracking-[0.6px] leading-[16px] ${timeLeft <= 10 ? "text-[#ff5768]" : "text-[#5eead4]"}`}>
                {mins}:{secs}
              </span>
            </div>
            <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
              <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[12px] leading-[16px]">{opponentScore}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE: Question Area */}
        <div className="flex flex-col gap-[6px] items-center px-1 pt-6 pb-2" data-node-id="6:206">
          <div className="w-full max-w-[340px] text-center min-h-[50px] flex items-center justify-center">
            <p className="font-['Space_Grotesk:Bold'] font-bold text-white text-[17px] sm:text-[19px] leading-[24px]">
              {gameOver ? "Time's up!" : question.text}
            </p>
          </div>
          <p className="font-['Plus_Jakarta_Sans:Medium'] font-medium text-[#7a7e89] text-[11px] sm:text-[12px] text-center leading-[16.5px]">
            6×6 Sample Space • Tap cards to flip & select
          </p>
        </div>

        {/* MAIN: 6×6 Grid System */}
        <div className="flex items-center justify-center flex-1 py-2 w-full" data-node-id="6:211">
          {gameOver ? (
            <div className="flex flex-col items-center gap-5 py-4 w-full">
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
            <div
              className={`grid w-full max-w-[360px] mx-auto transition-transform ${isWrongFlash ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
              style={{
                gridTemplateColumns: "22px repeat(6, 1fr)",
                gap: "7px",
              }}
            >
              {/* Top-left spacer */}
              <div />

              {/* Column labels (Die 2: 1 to 6) */}
              {[1, 2, 3, 4, 5, 6].map(col => (
                <div key={`col-${col}`} className="flex items-center justify-center pb-1">
                  <span className="font-['Space_Grotesk:Bold'] font-bold text-[#71717a] text-[12px] sm:text-[13px] leading-none select-none">
                    {col}
                  </span>
                </div>
              ))}

              {/* 6 Rows of (Row Label Die 1 + 6 Cards) */}
              {[1, 2, 3, 4, 5, 6].map(row => (
                <Fragment key={`row-group-${row}`}>
                  {/* Row label (Die 1: 1 to 6) */}
                  <div className="flex items-center justify-center pr-1 h-full">
                    <span className="font-['Space_Grotesk:Bold'] font-bold text-[#71717a] text-[12px] sm:text-[13px] leading-none select-none">
                      {row}
                    </span>
                  </div>

                  {/* 6 Cards for this row */}
                  {[1, 2, 3, 4, 5, 6].map(col => {
                    const key = `${row}-${col}`;
                    const isCardSelected = selected.has(key);
                    return (
                      <DiceCard
                        key={key}
                        selected={isCardSelected}
                        isCorrect={isCorrect && isCardSelected}
                        isWrong={isWrongFlash && isCardSelected}
                        onClick={() => toggleCell(key)}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM: Subtle Status Bar (Check Answer button removed) */}
        {!gameOver && (
          <div className="flex items-center justify-between px-2 pt-2 pb-1 text-[#7a7e89]">
            <span className="font-['Space_Grotesk:Bold'] font-medium text-[11px] tracking-[0.5px]">
              Level {difficulty}
            </span>
            <span className="font-['Space_Grotesk:Bold'] font-medium text-[11px] tracking-[0.5px]">
              {selected.size} / {question.correctOutcomes.length} selected
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
