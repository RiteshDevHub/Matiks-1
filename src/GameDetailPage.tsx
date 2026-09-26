import { useNavigate, useParams } from "react-router-dom";

const assetPathPrefix = "/assets";
const imgSvgBack = `${assetPathPrefix}/83ea1.svg`;
const imgSvgBellIcon = `${assetPathPrefix}/b1b2c.svg`;

export type GameInfo = {
  id: string;
  titleLines: string[];
  subtitle: string;
  ratingLabel: string;
  rating: string;
  duration: string;
};

export const GAMES: GameInfo[] = [
  {
    id: "probability-draw-duels",
    titleLines: ["PROBABILITY", "DRAW DUELS"],
    subtitle: "DRAW THE RIGHT PROBABILITY AND OUTSCORE YOUR OPPONENT.",
    ratingLabel: "PROB RATING:",
    rating: "1012",
    duration: "2 MIN DUEL",
  },
  {
    id: "poker-odds-duels",
    titleLines: ["POKER ODDS", "DUELS"],
    subtitle: "CALCULATE THE ODDS AND WIN THE HAND.",
    ratingLabel: "POKER RATING:",
    rating: "1050",
    duration: "2 MIN DUEL",
  },
  {
    id: "dice-detective-duels",
    titleLines: ["DICE", "DETECTIVE"],
    subtitle: "SOLVE THE SAMPLE SPACE WITH LOGIC AND SPEED.",
    ratingLabel: "DICE RATING:",
    rating: "1024",
    duration: "2 MIN DUEL",
  },
  {
    id: "number-line-race-duels",
    titleLines: ["NUMBER LINE", "RACE DUELS"],
    subtitle: "RACE ALONG THE NUMBER LINE FASTER THAN YOUR OPPONENT.",
    ratingLabel: "LINE RATING:",
    rating: "980",
    duration: "2 MIN DUEL",
  },
  {
    id: "sequence-builder-duels",
    titleLines: ["SEQUENCE", "BUILDER"],
    subtitle: "BUILD THE CORRECT SEQUENCE BEFORE YOUR RIVAL DOES.",
    ratingLabel: "SEQ RATING:",
    rating: "1035",
    duration: "2 MIN DUEL",
  },
];

export default function GameDetailPage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const game = GAMES.find((g) => g.id === gameId) ?? GAMES[0];

  return (
    <div
      className="relative w-full min-h-dvh flex flex-col items-center justify-between"
      style={{ background: "rgb(18, 19, 22)" }}
      data-node-id="2:1172"
    >
      <div className="flex flex-1 flex-col justify-between max-w-[420px] w-full mx-auto">
        {/* Top Navigation Header */}
        <div className="flex flex-col w-full" data-node-id="2:1186">
        {/* Main App Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 w-full" data-node-id="2:1202">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-[#171717] border-2 border-[#727272] drop-shadow-[0px_3px_0px_#727272] flex gap-1 items-center justify-center p-[14px] rounded-[12px] cursor-pointer"
            data-node-id="2:1164"
          >
            <div className="relative size-[16px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvgBack} />
            </div>
          </button>

          {/* How to play button */}
          <button
            className="bg-[#171717] border-2 border-[#727272] drop-shadow-[0px_3px_0px_#727272] flex gap-1 items-center justify-center px-[14px] py-[14px] rounded-[12px] cursor-pointer"
            data-node-id="2:1164b"
          >
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-white text-[14px] tracking-[0.55px] uppercase leading-[16px] whitespace-nowrap"
              data-node-id="2:1167"
            >
              HOW TO PLAY?
            </span>
          </button>
        </div>

        {/* Notification Banner */}
        <div
          className="bg-[#facc15] flex items-center justify-between px-4 py-[10px] w-full"
          data-node-id="2:1205"
        >
          <div className="flex gap-2 items-center">
            <div className="relative size-[20px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvgBellIcon} />
            </div>
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-[#252325] text-[14px] tracking-[-0.3px] leading-normal whitespace-nowrap"
              data-node-id="2:1209"
            >
              New Puzzle Rating System!
            </span>
          </div>
          <button
            className="bg-[#facc15] border-2 border-[#252325] drop-shadow-[0px_2px_0px_#252325] flex gap-1 items-center justify-center px-3 py-2 rounded-[12px] cursor-pointer"
            data-node-id="2:1210"
          >
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-[#252325] text-[14px] tracking-[0.55px] uppercase leading-[16px] whitespace-nowrap"
            >
              LEARN MORE
            </span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col pt-10 px-6" data-node-id="2:1173">
        {/* Rating & Mode Chips */}
        <div className="flex gap-3 items-center mb-8" data-node-id="2:1175">
          <div
            className="bg-[#1e2024] border border-[#2b2d33] flex gap-1 items-center px-[11px] py-[7px] rounded-[6px]"
            data-node-id="2:1176"
          >
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-white text-[11px] tracking-[0.55px] uppercase leading-[16px] whitespace-nowrap"
              data-node-id="2:1177"
            >
              {game.ratingLabel}
            </span>
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-[#facc15] text-[11px] tracking-[0.55px] leading-[16px] whitespace-nowrap"
              data-node-id="2:1178"
            >
              {game.rating}
            </span>
          </div>
          <div
            className="bg-[#1e2024] border border-[#2b2d33] flex flex-col items-start px-[11px] py-[7px] rounded-[6px]"
            data-node-id="2:1179"
          >
            <span
              className="font-['Space_Grotesk:Medium'] font-medium text-white text-[11px] tracking-[0.55px] uppercase leading-[16px] whitespace-nowrap"
              data-node-id="2:1180"
            >
              {game.duration}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col" data-node-id="2:1181">
          <div
            className="font-['Impact:Regular',Impact,impact,sans-serif] not-italic text-white text-[62px] tracking-[2px] uppercase leading-[1.05]"
            data-node-id="2:1182"
          >
            {game.titleLines.map((line, i) => (
              <p key={i} className={i < game.titleLines.length - 1 ? "mb-0" : ""}>
                {line}
              </p>
            ))}
          </div>
          <div className="pt-6" data-node-id="2:1183">
            <p
              className="font-['Space_Grotesk:Regular'] font-normal text-[#8e929b] text-[12px] tracking-[0.6px] uppercase leading-[16px]"
              data-node-id="2:1185"
            >
              {game.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Bottom Actions */}
      <div
        className="flex flex-col gap-4 items-center pb-5 px-5 w-full"
        data-node-id="2:1211"
      >
        <button
          onClick={() => navigate(`/game/${game.id}/searching`)}
          className="bg-[#facc15] flex gap-2 h-14 items-center justify-center rounded-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.4),0px_4px_0px_0px_#facc15] w-full cursor-pointer"
          data-node-id="2:1212"
        >
          <span
            className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] text-center tracking-[0.4px] leading-[24px] whitespace-nowrap"
          >
            PLAY DUEL
          </span>
        </button>
        <button
          className="flex flex-col items-center justify-center py-2 cursor-pointer"
          data-node-id="2:1213"
        >
          <span
            className="font-[Arial,sans-serif] font-bold text-[#a0a5b0] text-[12px] text-center tracking-[1.2px] uppercase leading-[16px] whitespace-nowrap"
          >
            PLAY A FRIEND
          </span>
        </button>
      </div>
    </div>
  </div>
  );
}
