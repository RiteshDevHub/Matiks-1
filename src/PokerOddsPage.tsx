// Poker Odds Duels game screen
import { useState, useEffect, useCallback } from "react";

const assetPathPrefix  = "/assets";
const imgStarIcon      = `${assetPathPrefix}/dd268.svg`;
const imgTimerIcon     = `${assetPathPrefix}/ed88e.svg`;
const imgBackspaceIcon = `${assetPathPrefix}/caa66.svg`;
const imgCardBack      = `${assetPathPrefix}/b17e4.png`;

const CORRECT_PAIRS = [{ n: "9", d: "47" }];
const TOTAL_SECONDS = 23;
const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

function isCorrect(n: string, d: string) {
  return CORRECT_PAIRS.some(p => p.n === n.trim() && p.d === d.trim());
}

// ── Deck ──────────────────────────────────────────────────────────────────────

type CardSuit  = "Heart" | "Diamond" | "Clubs" | "Spades";
type CardValue = "Ace"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"Jack"|"Queen"|"King";
interface CardData { suit: CardSuit; value: CardValue; }

const SUITS: CardSuit[]   = ["Heart","Diamond","Clubs","Spades"];
const VALUES: CardValue[] = ["Ace","2","3","4","5","6","7","8","9","10","Jack","Queen","King"];
const SUIT_SYM: Record<CardSuit, string>  = { Heart:"♥", Diamond:"♦", Clubs:"♣", Spades:"♠" };
const RANK_LBL: Record<CardValue, string> = {
  Ace:"A","2":"2","3":"3","4":"4","5":"5","6":"6",
  "7":"7","8":"8","9":"9","10":"10",Jack:"J",Queen:"Q",King:"K",
};

function buildDeck(): CardData[] {
  return SUITS.flatMap(s => VALUES.map(v => ({ suit: s, value: v })));
}
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function dealCards() {
  const deck = shuffle(buildDeck());
  return { hand: deck.slice(0, 2), community: deck.slice(2, 7) };
}

// ── Card visual components (exact v30 design) ─────────────────────────────────

type Suit = "♥" | "♣" | "♦" | "♠";

interface FaceCardProps {
  rank: string;
  suit: Suit;
  width: number;
  height: number;
  rotate?: number;
}

function FaceCard({ rank, suit, width, height, rotate = 0 }: FaceCardProps) {
  const color  = suit === "♥" || suit === "♦" ? "#ea384d" : "#1e2024";
  const scale  = width / 100;
  const rankSz   = Math.round(19.737 * scale * 10) / 10;
  const suitSmSz = Math.round(13.158 * scale * 10) / 10;
  const suitLgSz = Math.round(42.105 * scale * 10) / 10;
  const px       = Math.round(10.527 * scale * 10) / 10;
  const py       = Math.round(9.211  * scale * 10) / 10;
  const r        = Math.round(9.375  * scale * 10) / 10;

  const corner = (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
      <span style={{ fontFamily:"'Space Grotesk:Bold','Space Grotesk',sans-serif", fontWeight:800, fontSize:rankSz, lineHeight:`${rankSz}px`, letterSpacing:"-0.04em", color, whiteSpace:"nowrap" }}>{rank}</span>
      <span style={{ fontFamily:"Arial,sans-serif", fontSize:suitSmSz, lineHeight:`${suitSmSz}px`, color, whiteSpace:"nowrap" }}>{suit}</span>
    </div>
  );

  return (
    <div style={{ width, height, rotate:rotate?`${rotate}deg`:undefined, borderRadius:r, background:"white", border:"1.316px solid rgba(255,255,255,0.2)", boxShadow:"0px 10.526px 11.842px rgba(0,0,0,0.45),0px 2.632px 2.632px rgba(0,0,0,0.3),inset 0px 1.316px 0px rgba(255,255,255,0.9)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:`${py}px ${px}px`, position:"relative", flexShrink:0 }}>
      {corner}
      <span style={{ fontFamily:"Arial,sans-serif", fontSize:suitLgSz, lineHeight:`${suitLgSz}px`, color, position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", userSelect:"none" }}>{suit}</span>
      <div style={{ alignSelf:"flex-end", transform:"rotate(180deg)" }}>{corner}</div>
    </div>
  );
}

function CardBack({ width, height, rotate = 0 }: { width:number; height:number; rotate?:number }) {
  return (
    <div style={{ width, height, borderRadius:6, overflow:"hidden", flexShrink:0, transform:rotate?`rotate(${rotate}deg)`:undefined, boxShadow:"0px 6.737px 7.579px rgba(0,0,0,0.45),0px 1.684px 1.684px rgba(0,0,0,0.3)" }}>
      <img alt="card back" src={imgCardBack} style={{ width:"108%", height:"105.85%", marginLeft:"-4.2%", marginTop:"-2.72%", display:"block" }} />
    </div>
  );
}

// ── FlipCard: CardBack → FaceCard on tap ──────────────────────────────────────

function FlipCard({ card, revealed, width, height, onFlip }: {
  card: CardData; revealed: boolean; width: number; height: number; onFlip?: () => void;
}) {
  const rank = RANK_LBL[card.value];
  const suit = SUIT_SYM[card.suit] as Suit;
  return (
    <div onClick={!revealed ? onFlip : undefined}
      style={{ width, height, perspective:700, cursor:revealed?"default":"pointer", flexShrink:0 }}>
      <div style={{ width:"100%", height:"100%", position:"relative", transformStyle:"preserve-3d",
        transition:"transform 0.42s cubic-bezier(0.4,0,0.2,1)",
        transform:revealed?"rotateY(180deg)":"rotateY(0deg)" }}>
        {/* back */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden" }}>
          <CardBack width={width} height={height} />
        </div>
        {/* front */}
        <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", transform:"rotateY(180deg)" }}>
          <FaceCard rank={rank} suit={suit} width={width} height={height} />
        </div>
      </div>
    </div>
  );
}

// ── Deal animation ─────────────────────────────────────────────────────────────

function dealAnim(dealIdx: number, dealtCount: number): React.CSSProperties {
  const show = dealIdx < dealtCount;
  return {
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.85)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  };
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PokerOddsPage() {
  // Card state
  const [hand, setHand]           = useState<CardData[]>([]);
  const [community, setCommunity] = useState<CardData[]>([]);
  const [revealed, setRevealed]   = useState<boolean[]>([true,true,true,false,false]);
  const [dealtCount, setDealtCount] = useState(7); // start fully dealt

  // Answer state (unchanged from v30)
  const [active, setActive]       = useState<"n" | "d">("n");
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenom]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect]     = useState(false);
  const [playerScore, setScore]   = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS);

  const startNewRound = useCallback(() => {
    const { hand: h, community: c } = dealCards();
    setHand(h);
    setCommunity(c);
    setRevealed([true, true, true, false, false]);
    setDealtCount(0);
    setActive("n"); setNumerator(""); setDenom("");
    setSubmitted(false); setCorrect(false); setScore(0);
    // community 0-4 first, then hand 5-6
    for (let i = 1; i <= 7; i++) setTimeout(() => setDealtCount(i), i * 130);
  }, []);

  // Initial deal
  useEffect(() => { startNewRound(); }, [startNewRound]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  function flipCommunity(idx: number) {
    const firstUnrevealed = revealed.findIndex(r => !r);
    if (idx !== firstUnrevealed) return;
    setRevealed(prev => prev.map((v, i) => i === idx ? true : v));
  }

  function pressKey(key: string) {
    if (submitted) return;
    const setter = active === "n" ? setNumerator : setDenom;
    const val    = active === "n" ? numerator : denominator;
    if (key === "⌫") setter(val.slice(0, -1));
    else if (val.length < 4) setter(val + key);
  }

  function submit() {
    if (!numerator || !denominator || submitted) return;
    const ok = isCorrect(numerator, denominator);
    setSubmitted(true); setCorrect(ok);
    if (ok) setScore(1);
  }

  const canSubmit = numerator.length > 0 && denominator.length > 0;

  function boxStyle(field: "n" | "d") {
    if (!submitted) return active === field ? "ring-2 ring-[#5eead4]" : "";
    return correct ? "ring-2 ring-[#09b964]" : "ring-2 ring-[#ff5768]";
  }

  if (hand.length < 2 || community.length < 5) return null;

  // map card data → FaceCard props
  function cardProps(c: CardData) {
    return { rank: RANK_LBL[c.value], suit: SUIT_SYM[c.suit] as Suit };
  }

  return (
    <div className="w-full min-h-dvh flex flex-col gap-0 items-center pt-8 px-5"
      style={{ background:"rgb(18,19,22)" }} data-node-id="22:32">

      {/* ── HUD (unchanged) ── */}
      <div className="flex flex-col gap-4 h-[84px] items-start pt-1 w-full shrink-0">
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
            <span className="font-['Space_Grotesk:Bold'] font-bold text-[#5eead4] text-[12px] tracking-[0.6px] leading-[16px]">{mins}:{secs}</span>
          </div>
          <div className="border border-[#272a32] bg-[#181a1f] flex h-[28px] items-center justify-center rounded-full w-[56px]">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-[#7a7e89] text-[12px] leading-[16px]">0</span>
          </div>
        </div>
      </div>

      {/* ── Question (unchanged) ── */}
      <div className="flex flex-col items-center pt-6 pb-4 w-full shrink-0" data-node-id="22:101">
        <span className="font-['Space_Grotesk:Bold'] font-bold text-white text-[24px] text-center leading-normal w-full px-1">
          Probability of getting a flush
        </span>
      </div>

      {/* ── Community cards — same layout as v30, now dynamic + deal anim + flip ── */}
      <div className="flex items-center justify-center gap-[6px] w-full shrink-0 pb-4" data-node-id="22:104">
        {community.map((card, i) => {
          const { rank, suit } = cardProps(card);
          if (i < 3) {
            return (
              <div key={i} style={dealAnim(i, dealtCount)}>
                <FaceCard rank={rank} suit={suit} width={66} height={94} />
              </div>
            );
          }
          return (
            <div key={i} style={dealAnim(i, dealtCount)}>
              <FlipCard card={card} revealed={revealed[i]} width={66} height={94} onFlip={() => flipCommunity(i)} />
            </div>
          );
        })}
      </div>

      {/* ── Hole cards — ±5° angles with 30px overlap, bottom cropped ── */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height:115 }} data-node-id="22:33">
        <div style={{ position:"absolute", left:"50%", top:8, transform:"translateX(-85px) rotate(-5deg)", transformOrigin:"top center", zIndex:1 }}>
          <div style={dealAnim(5, dealtCount)}>
            <FaceCard {...cardProps(hand[0])} width={100} height={142} />
          </div>
        </div>
        <div style={{ position:"absolute", left:"50%", top:8, transform:"translateX(-15px) rotate(5deg)", transformOrigin:"top center", zIndex:2 }}>
          <div style={dealAnim(6, dealtCount)}>
            <FaceCard {...cardProps(hand[1])} width={100} height={142} />
          </div>
        </div>
      </div>

      {/* ── New Round button — sits between hole cards and answer section ── */}
      <button onClick={startNewRound}
        className="flex items-center justify-center gap-[6px] h-8 px-4 rounded-full cursor-pointer active:opacity-70 transition-opacity mt-2 mb-1 self-center shrink-0"
        style={{ background:"rgba(94,234,212,0.1)", border:"1px solid rgba(94,234,212,0.22)" }}>
        <span style={{ fontFamily:"'Space Grotesk:Bold','Space Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.8px", color:"#5eead4" }}>
          NEW ROUND
        </span>
      </button>

      {/* ── Answer + Keypad (unchanged from v30) ── */}
      <div className="flex flex-col items-center w-full" data-node-id="22:155">
        <div className="pb-[10px]">
          <span className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#a1a1aa] text-[11px] tracking-[1.1px] uppercase leading-[16.5px]">
            TYPE OUT YOUR ANSWER
          </span>
        </div>
        <div className="flex gap-3 items-center justify-center pb-6" data-node-id="22:158">
          <button onClick={() => !submitted && setActive("n")}
            className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all ${boxStyle("n")}`}>
            <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${submitted?(correct?"text-[#09b964]":"text-[#ff5768]"):"text-white"}`}>{numerator}</span>
          </button>
          <span className="font-['Space_Grotesk:Medium'] font-medium text-white text-[18px] leading-[28px]">/</span>
          <button onClick={() => !submitted && setActive("d")}
            className={`border border-[rgba(63,63,70,0.4)] bg-[#2a2c31] flex items-center justify-center rounded-[16px] size-[54px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] transition-all ${boxStyle("d")}`}>
            <span className={`font-['Space_Grotesk:Bold'] font-bold text-[20px] leading-[28px] ${submitted?(correct?"text-[#09b964]":"text-[#ff5768]"):"text-white"}`}>{denominator}</span>
          </button>
        </div>
        <div className="grid gap-[6px] pb-2 px-2 w-full"
          style={{ gridTemplateColumns:"repeat(3,minmax(0,1fr))", gridTemplateRows:"repeat(4,60px)" }}
          data-node-id="22:164">
          {KEYS.flat().map(key => (
            <button key={key} onClick={() => pressKey(key)} disabled={submitted}
              className="bg-[#3b3d42] flex h-[60px] items-center justify-center rounded-[8px] cursor-pointer active:bg-[#4e5057] transition-colors disabled:opacity-40">
              {key === "⌫" ? (
                <div className="relative size-[24px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBackspaceIcon} />
                </div>
              ) : (
                <span className="font-['Plus_Jakarta_Sans:Medium'] font-medium text-white text-[24px] text-center leading-[32px]">{key}</span>
              )}
            </button>
          ))}
        </div>
        {!submitted ? (
          <button onClick={submit} disabled={!canSubmit}
            className="bg-[#10d070] drop-shadow-[0px_4px_0px_#0a7f44] flex h-14 items-center justify-center rounded-[12px] w-full mt-1 cursor-pointer disabled:opacity-40 disabled:cursor-default transition-opacity">
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">SUBMIT</span>
          </button>
        ) : (
          <div className={`flex items-center justify-center w-full mt-1 rounded-[12px] h-14 ${correct?"bg-[#10d070]":"bg-[#ff5768]"}`}>
            <span className="font-['Space_Grotesk:Bold'] font-bold text-black text-[16px] tracking-[0.4px] leading-[24px]">
              {correct ? "CORRECT! 🎉" : "Wrong — answer is 9/47"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
