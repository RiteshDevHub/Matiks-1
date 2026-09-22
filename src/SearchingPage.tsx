import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SearchingPage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/game/${gameId}/play`, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [gameId, navigate]);

  return (
    <div
      className="relative w-full min-h-dvh flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "rgb(18, 19, 22)" }}
      data-node-id="4:121"
    >
      {/* CSS keyframe animations */}
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.03); }
        }
        @keyframes center-glow {
          0%, 100% { box-shadow: 0 0 18px 4px rgba(16,208,112,0.25); }
          50%       { box-shadow: 0 0 32px 10px rgba(16,208,112,0.45); }
        }

      `}</style>

      {/* Main vertically-centred block */}
      <div className="flex flex-col items-center gap-8 px-6 w-full" data-node-id="4:123">

        {/* Label */}
        <p
          className="font-['Space_Grotesk:Bold'] font-extrabold text-[#8e929b] text-[12px] tracking-[2.4px] uppercase leading-[16px] text-center"
          data-node-id="4:126"
        >
          SEARCHING FOR OPPONENT
        </p>

        {/* Radar widget */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 288, height: 288 }}
          data-node-id="4:127"
        >
          {/* Outermost ring */}
          <div
            className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.10)]"
            style={{ animation: "ring-pulse 3s ease-in-out infinite" }}
            data-node-id="4:129"
          />
          {/* Ring 2 */}
          <div
            className="absolute rounded-full border border-[rgba(255,255,255,0.15)]"
            style={{ inset: 24, animation: "ring-pulse 3s ease-in-out infinite 0.4s" }}
            data-node-id="4:130"
          />
          {/* Ring 3 */}
          <div
            className="absolute rounded-full border border-[rgba(255,255,255,0.20)] bg-[rgba(24,24,27,0.10)]"
            style={{ inset: 48, animation: "ring-pulse 3s ease-in-out infinite 0.8s" }}
            data-node-id="4:131"
          />
          {/* Ring 4 */}
          <div
            className="absolute rounded-full border border-[rgba(255,255,255,0.25)]"
            style={{ inset: 80, animation: "ring-pulse 3s ease-in-out infinite 1.2s" }}
            data-node-id="4:132"
          />

          {/* Rotating sweep — conic gradient fan */}
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(16,208,112,0.55) 0%, rgba(16,208,112,0.0) 22%, rgba(255,255,255,0) 100%)",
              animation: "radar-sweep 2.4s linear infinite",
            }}
            data-node-id="4:133"
          />

          {/* Green glow blob behind centre */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 96,
              background: "rgba(16,208,112,0.20)",
              filter: "blur(12px)",
            }}
            data-node-id="4:134"
          />

          {/* Centre icon */}
          <div
            className="relative z-10 bg-[#16171a] border border-[rgba(63,63,70,0.8)] rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              animation: "center-glow 2.4s ease-in-out infinite",
            }}
            data-node-id="4:135"
          >
            <span
              className="font-['Space_Grotesk:Bold'] font-black text-[#10d070] text-[30px] tracking-[-1.5px] leading-[36px]"
              data-node-id="4:138"
            >
              %
            </span>
          </div>
        </div>

      </div>

      {/* Cancel button */}
      <div
        className="absolute left-[35px] right-[35px] bottom-[60px]"
        data-node-id="4:139"
      >
        <button
          onClick={() => navigate(`/game/${gameId}`)}
          className="relative w-full bg-[#1e2025] border border-[#323640] rounded-[16px] flex items-center justify-center px-6 py-[15px] cursor-pointer shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
        >
          <span
            className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#f4f4f5] text-[14px] tracking-[0.35px] leading-[20px] text-center whitespace-nowrap"
            data-node-id="4:141"
          >
            Cancel Search
          </span>
        </button>
      </div>
    </div>
  );
}
