import { useId } from "react";
import { CERT_TITLES, type CertLevel } from "@/lib/brands/certification";

// Le poinçon : un cartouche gravé, comme ceux frappés sur l'orfèvrerie.
// Acier pour le titre I, argent pour le II, or sur encre pour le III.
const METALS: Record<CertLevel, { rim: [string, string, string]; field: [string, string]; ink: string }> = {
  0: { rim: ["#f2f0f5", "#cfc9d6", "#9a93a3"], field: ["#f6f4f8", "#e6e1ec"], ink: "#9c95a4" },
  1: { rim: ["#eef2f6", "#a7b1bd", "#5c6673"], field: ["#dfe5ec", "#b9c3cf"], ink: "#2f3843" },
  2: { rim: ["#ffffff", "#c9ced6", "#6e7682"], field: ["#f4f6f9", "#cfd5dd"], ink: "#1c1624" },
  3: { rim: ["#fff3c4", "#d9a83e", "#7d5410"], field: ["#2a2233", "#0f0b15"], ink: "#f1cf78" },
};

// Cartouche à pans coupés, 120 × 64
const SHAPE = "M18 2H102L118 18V46L102 62H18L2 46V18Z";
const INNER = "M21 8H99L112 21V43L99 56H21L8 43V21Z";

export default function Hallmark({ level, size = 120, initial }: { level: CertLevel; size?: number; initial?: string }) {
  const uid = useId().replace(/:/g, "");
  const m = METALS[level];
  const t = CERT_TITLES[level];
  return (
    <svg viewBox="0 0 120 64" width={size} height={(size * 64) / 120} role="img" aria-label={`Poinçon Rarelyst — ${t.name}`}
      style={{ filter: "drop-shadow(0 8px 12px rgba(40,20,70,.22))", overflow: "visible" }}>
      <defs>
        <linearGradient id={`hr${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.rim[0]} /><stop offset=".4" stopColor={m.rim[1]} />
          <stop offset=".6" stopColor={m.rim[2]} /><stop offset="1" stopColor={m.rim[0]} />
        </linearGradient>
        <linearGradient id={`hf${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.field[0]} /><stop offset="1" stopColor={m.field[1]} />
        </linearGradient>
      </defs>
      <path d={SHAPE} fill={`url(#hr${uid})`} />
      <path d={INNER} fill={`url(#hf${uid})`} stroke="#000" strokeOpacity=".18" />
      <path d={INNER} fill="none" stroke="#fff" strokeOpacity=".35" transform="translate(0 .8)" />
      {/* Monogramme à gauche, titre en chiffres romains à droite */}
      <circle cx="34" cy="32" r="14" fill="none" stroke={m.ink} strokeWidth="1.3" opacity=".9" />
      <text x="34" y="37.5" textAnchor="middle" fontSize="15" fontWeight="700" fill={m.ink} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {(initial ?? "R").slice(0, 1).toUpperCase()}
      </text>
      <text x="80" y="27" textAnchor="middle" fontSize="7" fontWeight="700" letterSpacing="2" fill={m.ink} opacity=".8">RARELYST</text>
      <text x="80" y="47" textAnchor="middle" fontSize={level ? 19 : 11} fontWeight="700" letterSpacing="2" fill={m.ink}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {level ? t.roman : "—"}
      </text>
    </svg>
  );
}
