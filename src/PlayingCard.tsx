// Dynamic card component — matches Figma "Card type=X, Value=Y" spec exactly.
// Default natural size is 76×108px. Pass width to scale proportionally.

export type CardSuit  = "Heart" | "Diamond" | "Clubs" | "Spades";
export type CardValue = "Ace" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "Jack" | "Queen" | "King";

export interface CardData { suit: CardSuit; value: CardValue; }

const SUIT_SYMBOL: Record<CardSuit, string> = {
  Heart: "♥", Diamond: "♦", Clubs: "♣", Spades: "♠",
};
const SUIT_COLOR: Record<CardSuit, string> = {
  Heart: "#ea384d", Diamond: "#ea384d", Clubs: "#1e2024", Spades: "#1e2024",
};
const RANK_LABEL: Record<CardValue, string> = {
  Ace: "A", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6",
  "7": "7", "8": "8", "9": "9", "10": "10", Jack: "J", Queen: "Q", King: "K",
};

// Natural card size from Figma
const NAT_W = 76;
const NAT_H = 108;

interface Props {
  suit: CardSuit;
  value: CardValue;
  /** Rendered width; height scales to maintain 76:108 ratio */
  width?: number;
  rotate?: number;
  style?: React.CSSProperties;
}

export default function PlayingCard({ suit, value, width = NAT_W, rotate = 0, style }: Props) {
  const scale  = width / NAT_W;
  const height = NAT_H * scale;
  const color  = SUIT_COLOR[suit];
  const sym    = SUIT_SYMBOL[suit];
  const rank   = RANK_LABEL[value];

  const corner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <span style={{
        fontFamily: "'Space Grotesk:Bold', 'Space Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: 15,
        lineHeight: "15px",
        letterSpacing: "-0.6px",
        color,
        whiteSpace: "nowrap",
      }}>{rank}</span>
      <span style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 10,
        lineHeight: "10px",
        color,
        whiteSpace: "nowrap",
        marginTop: 1,
      }}>{sym}</span>
    </div>
  );

  return (
    <div style={{
      width,
      height,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}>
      <div style={{
        width: NAT_W,
        height: NAT_H,
        transform: `scale(${scale})${rotate ? ` rotate(${rotate}deg)` : ""}`,
        transformOrigin: "center center",
        flexShrink: 0,
        position: "relative",
        borderRadius: 12,
        background: "white",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0px 8px 9px rgba(0,0,0,0.45), 0px 2px 2px rgba(0,0,0,0.3), inset 0px 1px 0px 0px rgba(255,255,255,0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "7px 8px",
        boxSizing: "border-box",
      }}>
        {/* Top-left corner */}
        {corner}

        {/* Centre suit symbol */}
        <span style={{
          fontFamily: "Arial, sans-serif",
          fontSize: 32,
          lineHeight: "32px",
          color,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          userSelect: "none",
          pointerEvents: "none",
        }}>{sym}</span>

        {/* Bottom-right corner — rotated 180° */}
        <div style={{ alignSelf: "flex-end", transform: "rotate(180deg)" }}>
          {corner}
        </div>
      </div>
    </div>
  );
}
