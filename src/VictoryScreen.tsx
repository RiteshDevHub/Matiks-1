// VictoryScreen — shared component shown when a player wins a duel.
// Matches the "Victory — Dice Detective" design reference.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GAMES } from "./GameDetailPage";

const imgBack      = "/assets/victory-back.svg";
const imgHoneycomb = "/assets/victory-honeycomb.svg";
const imgReaction  = "/assets/victory-reaction.svg";
const imgChevron   = "/assets/victory-chevron.svg";
const imgFlows     = "/assets/victory-flows.svg";
const imgGrinds    = "/assets/victory-grinds.svg";
const imgChokes    = "/assets/victory-chokes.svg";

interface Props {
  playerScore: number;
  opponentScore: number;
  /** Called when the user wants to start a fresh game */
  onRematch: () => void;
  /** Flows / Grinds / Chokes stat values – use actual game data if available */
  flows?: number;
  grinds?: number;
  chokes?: number;
  customGameName?: string;
}

export default function VictoryScreen({
  playerScore,
  opponentScore,
  onRematch,
  flows = 2,
  grinds = 4,
  chokes = 1,
  customGameName,
}: Props) {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const game = GAMES.find((g) => g.id === gameId);
  const gameName = customGameName || (game ? game.titleLines.join(" ") : "DICE DETECTIVE");

  const [analysisOpen, setAnalysisOpen] = useState(false);

  // Rating change placeholder (±22 matches the reference design)
  const PLAYER_RATING  = 1104;
  const OPP_RATING     = 1108;
  const RATING_CHANGE  = 22;

  return (
    <div
      className="relative w-full min-h-dvh overflow-hidden flex flex-col justify-between"
      style={{ background: "#0d0d0d", fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* ── Navigation bar ── */}
      <nav
        className="flex items-center justify-between px-5 pt-4 pb-2"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center justify-center rounded-xl cursor-pointer"
          style={{
            width: 44,
            height: 44,
            background: "#171717",
            border: "2px solid #2b2f3b",
            boxShadow: "0 3px 0 #2b2f3b",
          }}
        >
          <img src={imgBack} alt="" style={{ width: 16, height: 16 }} />
        </button>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          {/* Grid / game-modes icon */}
          <button
            type="button"
            aria-label="Game modes"
            onClick={() => navigate("/")}
            className="flex items-center justify-center rounded-xl cursor-pointer"
            style={{
              width: 44,
              height: 44,
              background: "#171717",
              border: "2px solid #2b2f3b",
              boxShadow: "0 3px 0 #2b2f3b",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 3,
                width: 18,
                height: 18,
              }}
            >
              {["#bbf443", "#313131", "#313131", "#bbf443"].map((bg, i) => (
                <span
                  key={i}
                  style={{
                    background: bg,
                    borderRadius: 3,
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                />
              ))}
            </span>
          </button>
          {/* Honeycomb / rating icon */}
          <button
            type="button"
            aria-label="Your rating"
            className="flex items-center justify-center rounded-xl cursor-pointer"
            style={{
              width: 44,
              height: 44,
              background: "#171717",
              border: "2px solid #2b2f3b",
              boxShadow: "0 3px 0 #2b2f3b",
            }}
          >
            <img src={imgHoneycomb} alt="" style={{ width: 23, height: 23 }} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start pb-[220px]">
        {/* ── Hero: YOU WIN ── */}
        <section
          className="flex flex-col items-center justify-center"
          style={{ marginTop: 20, position: "relative", height: 100 }}
          aria-label="Match result"
        >
          <h1
            style={{
              margin: 0,
              color: "#171717",
              fontFamily: "Impact, Anton, sans-serif",
              fontSize: 72,
              fontWeight: 400,
              letterSpacing: "-0.6px",
              lineHeight: "88px",
              textAlign: "center",
              whiteSpace: "nowrap",
              WebkitTextStroke: "1px #bbf443",
              textShadow: "0 3px 0 #bbf443",
              transform: "translateY(3px) scaleX(1.11)",
            }}
          >
            YOU WIN
          </h1>
          {/* Ribbon */}
          <span
            style={{
              position: "absolute",
              top: 30,
              left: "50%",
              transform: "translateX(-50%) rotate(-10deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 32,
              padding: "4px 14px",
              border: "1px solid #000",
              borderRadius: 999,
              background: "#10d070",
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.55px",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            {gameName.toUpperCase()}
          </span>
        </section>

        {/* ── Scoreboard ── */}
        <section
          className="flex items-center justify-between w-full max-w-[420px]"
          style={{ padding: "0 28px", marginTop: 24, height: 140 }}
          aria-label="Final score"
        >
          {/* Winner (player) */}
          <PlayerCard
            score={playerScore}
            name="mathlete4..."
            rating={PLAYER_RATING}
            ratingChange={+RATING_CHANGE}
            isWinner
          />

          {/* Divider */}
          <span
            aria-hidden="true"
            style={{
              width: 12,
              height: 4,
              borderRadius: 999,
              background: "#313131",
              opacity: 0.6,
              flexShrink: 0,
              margin: "0 8px",
            }}
          />

          {/* Loser (opponent) */}
          <PlayerCard
            score={opponentScore}
            name="gunnarcarl..."
            rating={OPP_RATING}
            ratingChange={-RATING_CHANGE}
            isWinner={false}
          />
        </section>

        {/* ── Send a Reaction ── */}
        <div className="flex justify-center" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer transition-opacity active:opacity-75"
            style={{
              height: 34,
              padding: "0 17px",
              border: "1px solid rgba(51,65,85,0.4)",
              borderRadius: 4,
              background: "#171717",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              color: "#cbd5e1",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: "16px",
            }}
          >
            <img src={imgReaction} alt="" style={{ width: 16, height: 16 }} />
            Send a Reaction
          </button>
        </div>

        {/* ── CTA Row: REMATCH + PLAY DUEL ── */}
        <div className="flex gap-3 w-full max-w-[420px]" style={{ padding: "24px 20px 0" }}>
          <button
            type="button"
            onClick={onRematch}
            className="cursor-pointer transition-opacity active:opacity-85"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 56,
              padding: "0 20px",
              borderRadius: 12,
              border: "1px solid #bbf443",
              background: "#1a1c20",
              boxShadow: "0 4px 0 #bbf443",
              color: "#bbf443",
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              whiteSpace: "nowrap",
            }}
          >
            REMATCH
          </button>
          <button
            type="button"
            onClick={() => (gameId ? navigate(`/game/${gameId}`) : navigate("/"))}
            className="cursor-pointer transition-opacity active:opacity-85"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 56,
              borderRadius: 12,
              border: "none",
              background: "#bbf443",
              boxShadow: "0 4px 0 #8fbf24",
              color: "#000",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.4px",
              lineHeight: "24px",
              whiteSpace: "nowrap",
            }}
          >
            PLAY DUEL
          </button>
        </div>
      </div>

      {/* ── Match Analysis panel ── */}
      <section
        aria-label="Match analysis"
        className="w-full max-w-[460px] mx-auto"
        style={{
          position: "fixed",
          bottom: 16,
          left: 13,
          right: 13,
          margin: "0 auto",
          height: analysisOpen ? 270 : 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          padding: "12px 16px 14px",
          border: "1px solid rgba(30,41,59,0.8)",
          borderRadius: 28,
          background: "#000",
          backgroundImage: `
            linear-gradient(to right, rgba(88,94,104,0.28) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(88,94,104,0.28) 1px, transparent 1px),
            radial-gradient(ellipse at center, rgba(255,255,255,0.06), transparent 80%)
          `,
          backgroundSize: "36px 39px, 36px 39px, auto",
          backgroundPosition: "16px 0, 0 4px, center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          transition: "height 240ms ease",
          zIndex: 40,
        }}
      >
        {/* Handle + label */}
        <div
          className="flex flex-col items-center w-full"
          style={{ flex: 1, minHeight: 0, justifyContent: "center" }}
        >
          <button
            type="button"
            aria-expanded={analysisOpen}
            aria-label="Expand match analysis"
            onClick={() => setAnalysisOpen((o) => !o)}
            className="cursor-pointer flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 40,
              height: 60,
              marginBottom: 4,
              border: "1px solid rgba(51,65,85,0.6)",
              borderRadius: "999px 999px 1400px 1400px",
              background: "#1c212a",
            }}
          >
            <img
              src={imgChevron}
              alt=""
              style={{
                width: 16,
                height: 16,
                transition: "transform 240ms ease",
                transform: analysisOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.5px",
              lineHeight: "15px",
              whiteSpace: "nowrap",
            }}
          >
            SWIPE FOR MATCH ANALYSIS
          </p>
        </div>

        {/* Stats row */}
        <div className="flex w-full gap-2 mt-2" style={{ flexShrink: 0 }}>
          <StatCard label="FLOWS" icon={imgFlows} iconBg="#bbf443" value={flows} />
          <StatCard label="GRINDS" icon={imgGrinds} iconBg="#f472b6" value={grinds} />
          <StatCard label="CHOKES" icon={imgChokes} iconBg="#fbbf24" value={chokes} />
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

interface PlayerCardProps {
  score: number;
  name: string;
  rating: number;
  ratingChange: number;
  isWinner: boolean;
}

function PlayerCard({ score, name, rating, ratingChange, isWinner }: PlayerCardProps) {
  return (
    <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
      {/* Score */}
      <div
        style={{
          height: 72,
          color: isWinner ? "#bbf443" : "#313131",
          fontFamily: "Impact, Anton, sans-serif",
          fontSize: 72,
          fontWeight: 400,
          lineHeight: "72px",
        }}
      >
        {score}
      </div>

      {/* Username pill */}
      <div
        className="flex items-center gap-1 overflow-hidden"
        style={{
          marginTop: 12,
          height: 26,
          padding: "0 13px",
          border: "1px solid #313131",
          borderRadius: 4,
          background: "#171717",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
          color: isWinner ? "#e2e8f0" : "#cbd5e1",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "-0.3px",
          lineHeight: "16px",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            flexShrink: 0,
            borderRadius: "50%",
            background: isWinner ? "#ec4899" : "#38bdf8",
            boxShadow: isWinner
              ? "0 0 0 2px rgba(236,72,153,0.2)"
              : "0 0 0 2px rgba(56,189,248,0.2)",
          }}
        />
        {name}
      </div>

      {/* Rating row */}
      <div
        className="flex items-center gap-1"
        style={{
          marginTop: 8,
          color: "#94a3b8",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: "16px",
        }}
      >
        <span>{rating}</span>
        <span
          className="flex items-center gap-0.5"
          style={{
            height: 20,
            padding: ratingChange > 0 ? "2px 6px" : "1px 7px",
            border: ratingChange > 0 ? "none" : "1px solid #323232",
            borderRadius: 4,
            background: ratingChange > 0 ? "#bbf443" : "#171717",
            color: ratingChange > 0 ? "#000" : "#cbd5e1",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 8,
            }}
          >
            {ratingChange > 0 ? "▲" : "▼"}
          </span>
          {Math.abs(ratingChange)}
        </span>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  icon: string;
  iconBg: string;
  value: number;
}

function StatCard({ label, icon, iconBg, value }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        flex: 1,
        height: 73,
        padding: 5,
        border: "1px solid rgba(51,65,85,0.4)",
        borderRadius: 16,
        background: "#161616",
        boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
        minWidth: 0,
      }}
    >
      <span
        style={{
          marginBottom: 4,
          color: "#94a3b8",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          lineHeight: "15px",
        }}
      >
        {label}
      </span>
      <div
        className="flex items-center justify-center gap-1"
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          borderRadius: 12,
          background: "#000",
        }}
      >
        <span
          className="flex items-center justify-center"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: iconBg,
          }}
        >
          <img src={icon} alt="" style={{ width: 14, height: 14 }} />
        </span>
        <strong
          style={{
            color: "#f1f5f9",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: "28px",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}
