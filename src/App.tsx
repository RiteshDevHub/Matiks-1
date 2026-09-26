import { Routes, Route, useParams } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import HomePage from "./HomePage";
import GameDetailPage from "./GameDetailPage";
import SearchingPage from "./SearchingPage";
import DiceDetectivePage from "./DiceDetectivePage";
import NumberLineRacePage from "./NumberLineRacePage";
import SequenceBuilderPage from "./SequenceBuilderPage";
import ProbabilityDrawPage from "./ProbabilityDrawPage";
import PokerOddsPage from "./PokerOddsPage";
import VictoryScreen from "./VictoryScreen";
import LossScreen from "./LossScreen";

function GamePlayRouter() {
  const { gameId } = useParams<{ gameId: string }>();
  if (gameId === "dice-detective-duels") return <DiceDetectivePage />;
  if (gameId === "number-line-race-duels") return <NumberLineRacePage />;
  if (gameId === "sequence-builder-duels") return <SequenceBuilderPage />;
  if (gameId === "probability-draw-duels") return <ProbabilityDrawPage />;
  if (gameId === "poker-odds-duels") return <PokerOddsPage />;
  // Placeholder for games whose screens haven't been provided yet
  return (
    <div className="min-h-dvh bg-[#121316] flex flex-col items-center justify-center gap-4 px-6 w-full">
      <div className="flex flex-col items-center justify-center gap-4 max-w-[420px] w-full text-center">
        <p className="font-['Space_Grotesk:Bold'] font-bold text-white text-[20px] text-center uppercase tracking-widest">
          Game Screen
        </p>
        <p className="font-['Space_Grotesk:Bold'] font-bold text-[#8e929b] text-[13px] text-center tracking-[1px] uppercase">
          Coming soon for this game
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
    <Analytics />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/:gameId" element={<GameDetailPage />} />
      <Route path="/game/:gameId/searching" element={<SearchingPage />} />
      <Route path="/game/:gameId/play" element={<GamePlayRouter />} />
      <Route
        path="/victory"
        element={
          <VictoryScreen
            playerScore={7}
            opponentScore={2}
            onRematch={() => window.history.back()}
          />
        }
      />
      <Route
        path="/loss"
        element={
          <LossScreen
            playerScore={2}
            opponentScore={7}
            onRematch={() => window.history.back()}
          />
        }
      />
    </Routes>
    </>
  );
}
