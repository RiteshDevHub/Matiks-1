import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAMES } from "./GameDetailPage";

const assetPathPrefix = "/assets";
const imgFrame24 = `${assetPathPrefix}/2b24f.svg`;
const imgFrame25 = `${assetPathPrefix}/d1b6d.svg`;
const imgRectangle2 = `${assetPathPrefix}/85ec7.svg`;
const imgOverlappingCyanRoundedSquareIcon = `${assetPathPrefix}/fc81c.svg`;
const imgVector = `${assetPathPrefix}/04d7c.svg`;
const imgFrame26 = `${assetPathPrefix}/9d3f1.svg`;
const imgSvgInfinityPretzelIcon = `${assetPathPrefix}/4b209.svg`;
const imgSvgTrophyIcon = `${assetPathPrefix}/dcf9b.svg`;
const imgSvgThreeDots = `${assetPathPrefix}/4c5ba.svg`;
const imgSvg = `${assetPathPrefix}/7af64.svg`;
const imgGroup5 = `${assetPathPrefix}/4bb22.svg`;
const imgSvg1 = `${assetPathPrefix}/6f825.svg`;

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<"math" | "puzzle" | "memory" | "logic">("math");

  return (
    <div
      className="relative w-full min-h-dvh flex flex-col items-center"
      style={{ background: "rgb(18, 19, 22)" }}
      data-node-id="1:3"
    >
      {/* Fixed top: Player Stats Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-[#121316]/95 backdrop-blur-[6px] border-b border-[#232630]/60 flex justify-center w-full"
        data-node-id="1:165"
      >
        <div className="w-full max-w-[420px] mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center" data-node-id="1:166">
          {/* Token Pill */}
          <div
            className="bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center px-[13px] py-[7px] rounded-full"
            data-node-id="1:167"
          >
            <div className="bg-[rgba(16,208,112,0.15)] border border-[#10d070] rounded-full size-[20px] flex items-center justify-center">
              <span
                className="font-['JetBrains_Mono:Bold'] font-bold text-[#10d070] text-[10px] leading-[16px]"
                data-node-id="1:169"
              >
                π
              </span>
            </div>
            <span
              className="font-['Space_Grotesk:Bold'] font-bold text-white text-[14px] tracking-[-0.35px] leading-[20px] pl-[6px] whitespace-nowrap"
              data-node-id="1:171"
            >
              730
            </span>
          </div>

          {/* Streak Pill */}
          <div className="pl-2" data-node-id="1:172">
            <div
              className="bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center px-[11px] py-[7px] rounded-full"
              data-node-id="1:173"
            >
              <div className="relative size-[16px] overflow-clip rounded-[inherit]">
                <div className="absolute inset-[0_12.61%_0_8.82%]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup5} />
                </div>
              </div>
              <span
                className="font-['Space_Grotesk:Bold'] font-bold text-white text-[14px] leading-[20px] pl-[6px] whitespace-nowrap"
                data-node-id="1:179"
              >
                2
              </span>
            </div>
          </div>

          {/* XP Pill */}
          <div className="pl-2" data-node-id="1:180">
            <div
              className="bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center pb-[5.1px] pl-[10.1px] pr-[13px] pt-[5.1px] rounded-full"
              data-node-id="1:181"
            >
              <div className="relative flex items-center justify-center size-[19.8px] mr-[-2.9px]">
                <div className="flex-none rotate-45">
                  <div className="bg-[#784e1a] border border-[#c58b42] rounded-[2px] size-[14px]" />
                </div>
              </div>
              <span
                className="font-['Space_Grotesk:Bold'] font-bold text-white text-[12px] tracking-[-0.3px] leading-[16px] pl-[6px] whitespace-nowrap"
                data-node-id="1:185"
              >
                0 XP
              </span>
            </div>
          </div>
        </div>

        {/* Messages button */}
        <div
          className="bg-[#1b1d23] border border-[#2b2f3b] flex items-center justify-center p-px rounded-full size-[40px]"
          data-node-id="1:186"
        >
          <div className="relative size-[20px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvg1} />
          </div>
          </div>
        </div>
      </div>

      {/* Scrollable main content */}
      <div className="flex-1 w-full flex flex-col items-center overflow-y-auto pt-[56px] pb-[74px]">
        <div className="flex flex-col gap-6 px-4 py-6 w-full max-w-[420px] mx-auto" data-node-id="1:4">

          {/* Section - Game Mode Categories */}
          <div className="flex flex-col gap-3" data-node-id="1:5">
            <div className="px-1" data-node-id="1:6">
              <p
                className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[12px] tracking-[0.6px] uppercase leading-[16px]"
                data-node-id="1:7"
              >
                DUELS
              </p>
            </div>
            <div className="flex gap-3 justify-center" data-node-id="1:8">

              {/* Category 1: Math */}
              <button
                type="button"
                onClick={() => setSelectedCategory("math")}
                className="flex flex-1 flex-col items-center min-w-0 cursor-pointer text-left"
                data-node-id="1:9"
              >
                <div
                  className={`relative flex flex-col items-center justify-start pt-[10px] pb-[4px] rounded-[12px] size-[72px] transition-all ${
                    selectedCategory === "math"
                      ? "bg-[#f5c400]"
                      : "bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  }`}
                  data-node-id="1:10"
                >
                  {/* Active border with consistent relative gap */}
                  {selectedCategory === "math" && (
                    <div className="absolute -inset-[4px] rounded-[16px] border-2 border-[#f5c400] pointer-events-none" />
                  )}

                  {/* Icon */}
                  <div className="border-2 border-black rounded-[4px] size-[28px] relative">
                    <div className="overflow-clip relative rounded-[inherit] size-full">
                      <div className="absolute -translate-x-1/2 -translate-y-1/2 flex gap-1 h-[28px] items-center left-1/2 top-1/2">
                        <div className="h-[33px] relative w-[5.833px]">
                          <div className="absolute inset-[0_-18.57%]">
                            <img alt="" className="block max-w-none size-full" src={imgFrame24} />
                          </div>
                        </div>
                        <div className="h-[26px] relative w-[5.833px]">
                          <div className="absolute inset-[0_-18.57%]">
                            <img alt="" className="block max-w-none size-full" src={imgFrame25} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating badge */}
                  <div className="absolute -translate-x-1/2 bottom-0 left-1/2 flex items-center justify-center h-[18px] w-[54px]" data-node-id="1:21">
                    <img alt="" className="absolute inset-0 size-full" src={imgRectangle2} />
                    <span
                      className="font-['JetBrains_Mono:ExtraBold'] font-extrabold text-[#f5c400] text-[11px] leading-[13.75px] whitespace-nowrap relative z-10 pt-[2px]"
                      data-node-id="1:23"
                    >
                      1035
                    </span>
                  </div>
                </div>
                <div className="pt-2" data-node-id="1:25">
                  <p
                    className={`font-['Space_Grotesk:Bold'] font-extrabold text-[11px] tracking-[0.55px] uppercase leading-[16.5px] whitespace-nowrap ${
                      selectedCategory === "math" ? "text-[#f5c400]" : "text-[#8e93a0]"
                    }`}
                    data-node-id="1:26"
                  >
                    MATH
                  </p>
                </div>
              </button>

              {/* Category 2: Puzzle */}
              <button
                type="button"
                onClick={() => setSelectedCategory("puzzle")}
                className="flex flex-1 flex-col items-center min-w-0 cursor-pointer text-left"
                data-node-id="1:27"
              >
                <div
                  className={`relative flex items-center justify-center rounded-[12px] size-[72px] transition-all ${
                    selectedCategory === "puzzle"
                      ? "bg-[#f5c400]"
                      : "bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  }`}
                  data-node-id="1:28"
                >
                  {selectedCategory === "puzzle" && (
                    <div className="absolute -inset-[4px] rounded-[16px] border-2 border-[#f5c400] pointer-events-none" />
                  )}
                  <div className="relative w-[28px]">
                    <div
                      className="grid grid-cols-2 gap-[1.87px]"
                      style={{ gridTemplateRows: "13.07px 13.07px" }}
                    >
                      <div className={`rounded-[3.733px] size-[13.067px] ${selectedCategory === "puzzle" ? "bg-black" : "bg-[#10d070]"}`} />
                      <div className={`border-[1.4px] border-solid rounded-[3.733px] size-[13.067px] ${selectedCategory === "puzzle" ? "border-black" : "border-[#10d070]"}`} />
                      <div className={`border-[1.4px] border-solid rounded-[3.733px] size-[13.067px] ${selectedCategory === "puzzle" ? "border-black" : "border-[#10d070]"}`} />
                      <div className={`rounded-[3.733px] size-[13.067px] ${selectedCategory === "puzzle" ? "bg-black" : "bg-[#10d070]"}`} />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <p
                    className={`font-['Space_Grotesk:Bold'] font-bold text-[11px] tracking-[0.55px] uppercase leading-[16.5px] whitespace-nowrap ${
                      selectedCategory === "puzzle" ? "text-[#f5c400]" : "text-[#8e93a0]"
                    }`}
                    data-node-id="1:35"
                  >
                    PUZZLE
                  </p>
                </div>
              </button>

              {/* Category 3: Memory */}
              <button
                type="button"
                onClick={() => setSelectedCategory("memory")}
                className="flex flex-1 flex-col items-center min-w-0 cursor-pointer text-left"
                data-node-id="1:36"
              >
                <div
                  className={`relative flex items-center justify-center rounded-[12px] size-[72px] transition-all ${
                    selectedCategory === "memory"
                      ? "bg-[#f5c400]"
                      : "bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  }`}
                  data-node-id="1:37"
                >
                  {selectedCategory === "memory" && (
                    <div className="absolute -inset-[4px] rounded-[16px] border-2 border-[#f5c400] pointer-events-none" />
                  )}
                  <div className="relative size-[28px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgOverlappingCyanRoundedSquareIcon} />
                  </div>
                </div>
                <div className="pt-2">
                  <p
                    className={`font-['Space_Grotesk:Bold'] font-bold text-[11px] tracking-[0.55px] uppercase leading-[16.5px] whitespace-nowrap ${
                      selectedCategory === "memory" ? "text-[#f5c400]" : "text-[#8e93a0]"
                    }`}
                    data-node-id="1:44"
                  >
                    MEMORY
                  </p>
                </div>
              </button>

              {/* Category 4: Logic */}
              <button
                type="button"
                onClick={() => setSelectedCategory("logic")}
                className="flex flex-1 flex-col items-center min-w-0 cursor-pointer text-left"
                data-node-id="1:45"
              >
                <div
                  className={`relative flex items-center justify-center rounded-[12px] size-[72px] transition-all ${
                    selectedCategory === "logic"
                      ? "bg-[#f5c400]"
                      : "bg-[#1b1d23] border border-[#2b2f3b] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  }`}
                  data-node-id="1:46"
                >
                  {selectedCategory === "logic" && (
                    <div className="absolute -inset-[4px] rounded-[16px] border-2 border-[#f5c400] pointer-events-none" />
                  )}
                  <div className="relative size-[28px]">
                    <div className="relative size-full">
                      <div className="absolute bg-[#ff4f8b] left-0 rounded-full size-[18.667px] top-0" />
                      <div className="absolute border-2 border-[#ff4f8b] border-solid bottom-0 right-0 rounded-[2.333px] size-[18.667px]" />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <p
                    className={`font-['Space_Grotesk:Bold'] font-bold text-[11px] tracking-[0.55px] uppercase leading-[16.5px] whitespace-nowrap ${
                      selectedCategory === "logic" ? "text-[#f5c400]" : "text-[#8e93a0]"
                    }`}
                    data-node-id="1:52"
                  >
                    LOGIC
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Section - Game Mode Cards */}
          <div className="flex flex-col gap-4" data-node-id="1:53">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(`/game/${game.id}`)}
                className="bg-[#17181b] flex flex-col gap-3 overflow-clip pb-5 pt-[23px] px-5 rounded-[16px] shadow-[0px_4px_0px_0px_#111216] w-full text-left cursor-pointer active:opacity-80 transition-opacity"
              >
                <div className="bg-[#202124] rounded-[4px] self-start">
                  <div className="flex items-start px-[10px] py-[2px]">
                    <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#f5c400] text-[10px] tracking-[0.25px] uppercase leading-[15px] whitespace-nowrap">
                      MATH
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between w-full">
                    <div className="font-['Impact:Regular',Impact,impact,sans-serif] not-italic text-[#f3f4f6] text-[32px] tracking-[-0.6px] uppercase leading-normal">
                      {game.titleLines.map((line, i) => (
                        <p key={i} className={i < game.titleLines.length - 1 ? "mb-0" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-center size-[28px]">
                      <div className="drop-shadow-[0px_0px_4px_rgba(245,196,0,0.6)] flex flex-col items-center justify-center overflow-clip size-[16px]">
                        <div className="flex-1 overflow-clip w-[16px] min-h-px relative">
                          <div className="absolute inset-[20.83%_20.83%_20.83%_33.33%]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="font-['Space_Grotesk:Bold'] font-bold text-[#8e93a0] text-[11px] tracking-[0.55px] uppercase leading-[16.5px] whitespace-nowrap">
                      RACE TO SOLVE THE MOST IN 1 MINUTE
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom: Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-[6px] bg-[rgba(20,21,25,0.95)] border-t border-[#232630] pb-3 pt-[13px] px-2 flex justify-center w-full"
        data-node-id="1:114"
      >
        <div className="flex items-start justify-between w-full max-w-[420px] mx-auto h-[49px]">

          {/* Arena (Active) */}
          <div className="flex flex-col items-center flex-1" data-node-id="1:116">
            <div className="h-[22.75px] w-[27.672px] relative">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame26} />
            </div>
            <div className="pt-1">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#10d070] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                ARENA
              </span>
            </div>
          </div>

          {/* SNAC */}
          <div className="flex flex-col items-center flex-1 pt-[3px]" data-node-id="1:128">
            <div className="relative size-[24px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvgInfinityPretzelIcon} />
            </div>
            <div className="pt-1">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                SNAC
              </span>
            </div>
          </div>

          {/* Compete */}
          <div className="flex flex-col items-center flex-1 pt-[3px]" data-node-id="1:134">
            <div className="relative size-[24px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvgTrophyIcon} />
            </div>
            <div className="pt-1">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                COMPETE
              </span>
            </div>
          </div>

          {/* Quests (with badge) */}
          <div className="flex flex-col items-center flex-1" data-node-id="1:153">
            <div className="relative flex flex-col items-start">
              <div className="relative size-[24px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvg} />
              </div>
              <div
                className="absolute -translate-x-1/2 bg-[#ff4d4d] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] h-[13.5px] left-[calc(50%-0.05px)] rounded-[2px] w-[24.2px]"
                style={{ bottom: "-8px" }}
              >
                <span className="absolute font-['JetBrains_Mono:ExtraBold'] font-extrabold text-white text-[9px] leading-[13.5px] left-1 -translate-y-1/2 top-[6px] whitespace-nowrap">
                  0/3
                </span>
              </div>
            </div>
            <div className="pt-[10px]">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                QUESTS
              </span>
            </div>
          </div>

          {/* Feed */}
          <div className="flex flex-col items-center flex-1 pt-[3px]" data-node-id="1:139">
            <div className="overflow-clip relative size-[24px]">
              <div className="absolute bg-[#8e93a0] inset-[12.5%_10.4%_8.33%_10.44%] rounded-[4px]" />
              <div className="absolute bottom-[20.83%] flex flex-col gap-px items-start left-[22.94%] right-[22.9%] top-1/4">
                <div className="bg-[#131418] h-[3px] rounded-[2px] w-[9px]" />
                <div className="bg-[#131418] h-[9px] rounded-[1px] w-full" />
              </div>
            </div>
            <div className="pt-1">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                FEED
              </span>
            </div>
          </div>

          {/* More */}
          <div className="flex flex-col items-center flex-1 pt-[3px]" data-node-id="1:148">
            <div className="relative size-[24px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSvgThreeDots} />
            </div>
            <div className="pt-1">
              <span className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e93a0] text-[10px] tracking-[0.5px] uppercase leading-[15px] whitespace-nowrap">
                MORE
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
