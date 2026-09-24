import { useId } from "react";
import { BADGES, type BadgeId, type BadgeState } from "@/lib/participants/badges";
import css from "./badges.module.css";

// Médaille gravée : bord métallique, champ émaillé, nom en arc, pictogramme
// au centre, reflet qui passe. Chaque famille a sa forme — sceau festonné pour
// l'identité, hexagone pour les preuves, octogone pour l'historique.

type Metal = [string, string, string];
const GOLD: Metal = ["#fff3c4", "#d9a83e", "#7d5410"];
const SILVER: Metal = ["#ffffff", "#bfc5ce", "#646d79"];
const BRONZE: Metal = ["#ffe0bf", "#c07a3e", "#6a3a13"];
const ROSE: Metal = ["#ffe6de", "#d99380", "#83453a"];
const LILAC: Metal = ["#f6f1ff", "#ab96ec", "#4a3391"];
const HOLO: Metal = ["#c8fbea", "#b7c8ff", "#ffc9e6"];

type Palette = { rim: Metal; field: [string, string]; ink: string; text: string; holo?: boolean };

const PALETTES: Record<BadgeId, Palette> = {
  nouveau:    { rim: HOLO,   field: ["#3a2a66", "#120b24"], ink: "#f2e9ff", text: "#e3d6ff", holo: true },
  verifie:    { rim: SILVER, field: ["#23845f", "#0a3a28"], ink: "#dcfbeb", text: "#bdf0d6" },
  linkedin:   { rim: SILVER, field: ["#2f6fb3", "#0e2d57"], ink: "#e6f0ff", text: "#cfe0fa" },
  emploi:     { rim: GOLD,   field: ["#2e2638", "#0c0911"], ink: "#f1cf78", text: "#e6c46d" },
  video:      { rim: ROSE,   field: ["#e2386f", "#6c1236"], ink: "#fff0f5", text: "#ffd0e0" },
  cv:         { rim: SILVER, field: ["#f1f3f5", "#a3acb6"], ink: "#262c33", text: "#3b424b" },
  portfolio:  { rim: LILAC,  field: ["#7c56f2", "#2b1479"], ink: "#ffffff", text: "#e6dcff" },
  reseaux:    { rim: ROSE,   field: ["#ea6a50", "#76230f"], ink: "#fff1ea", text: "#ffd9cc" },
  achat:      { rim: GOLD,   field: ["#921f3d", "#360613"], ink: "#f3d27f", text: "#f0c9a0" },
  diplome:    { rim: BRONZE, field: ["#72833a", "#29330d"], ink: "#f0f7cf", text: "#dfeab0" },
  premier:    { rim: BRONZE, field: ["#6e4b2b", "#26170a"], ink: "#ffd9ab", text: "#f3c996" },
  habitue:    { rim: SILVER, field: ["#4d535d", "#1a1d22"], ink: "#eef1f5", text: "#d3d8df" },
  recommande: { rim: GOLD,   field: ["#f2c64a", "#8f6200"], ink: "#3a2600", text: "#4a3200" },
  ponctuel:   { rim: SILVER, field: ["#159064", "#063d2d"], ink: "#dcfff0", text: "#b8f0d8" },
};

// Pictogrammes dessinés sur une grille de 24.
const GLYPHS: Record<BadgeId, string> = {
  nouveau: "M12 2.5l1.9 6.2 6.1 2.3-6.1 2.3L12 19.5l-1.9-6.2L4 11l6.1-2.3z M19 3v4 M17 5h4",
  verifie: "M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z M8.6 12.2l2.4 2.4 4.6-4.9",
  linkedin: "M3 5h18v14H3z M7.5 9.5a2 2 0 1 0 0 .01 M5 15.5c.6-2.2 4.4-2.2 5 0 M13 9h5 M13 12h5 M13 15h3",
  emploi: "M4 8h16v11H4z M9 8V5.5h6V8 M8.5 13.5l2.2 2.2 4.8-4.7",
  video: "M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3",
  cv: "M6 3h9l3 3v15H6z M15 3v3h3 M9 11h6 M9 14h6 M9 17h4",
  portfolio: "M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6.5v13",
  reseaux: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M3.5 9h17 M3.5 15h17 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  achat: "M5 8h14l-1 13H6z M9 8a3 3 0 0 1 6 0 M9.5 14.5l2 2 3.5-3.5",
  diplome: "M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5 M22 9v5",
  premier: "M9 5a3 3 0 0 1 6 0v6.5a3 3 0 0 1-6 0z M5.5 11.5a6.5 6.5 0 0 0 13 0 M12 18v3",
  habitue: "M4 6h16v14H4z M4 10h16 M8 3.5v4 M16 3.5v4 M8.5 14.5l2.2 2.2 4.8-4.7",
  recommande: "M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z",
  ponctuel: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M12 7v5.2l3.4 2",
};

const C = 60;

function seal(): string {
  // Bord festonné : 30 lobes, rayon 54 ± 2,6.
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const r = 54 + 2.6 * Math.cos(30 * a);
    pts.push(`${(C + r * Math.sin(a)).toFixed(2)},${(C - r * Math.cos(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

function polygon(sides: number, r: number, round: number, rot = 0): string {
  // Polygone régulier aux coins arrondis.
  const v = Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * Math.PI * 2;
    return [C + r * Math.sin(a), C - r * Math.cos(a)];
  });
  let d = "";
  for (let i = 0; i < sides; i++) {
    const [px, py] = v[(i - 1 + sides) % sides];
    const [x, y] = v[i];
    const [nx, ny] = v[(i + 1) % sides];
    const lerp = (ax: number, ay: number, t: number) => [x + (ax - x) * t, y + (ay - y) * t];
    const t = round / Math.hypot(nx - x, ny - y);
    const [ax, ay] = lerp(px, py, t);
    const [bx, by] = lerp(nx, ny, t);
    d += `${i ? "L" : "M"}${ax.toFixed(2)},${ay.toFixed(2)}Q${x.toFixed(2)},${y.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)}`;
  }
  return d + "Z";
}

// Sceau pour l'identité et le statut, hexagone pour les preuves, octogone
// pour l'historique.
const SHAPES = {
  statut: seal(),
  identite: seal(),
  preuve: polygon(6, 57, 9),
  historique: polygon(8, 56, 7, Math.PI / 8),
};

export type MedallionProps = {
  id: BadgeId;
  state?: BadgeState;
  size?: number;
  lang?: "fr" | "en";
  /** Rejoue l'apparition (écran de révélation). `delay` en ms. */
  reveal?: boolean;
  delay?: number;
  className?: string;
};

export default function Medallion({ id, state = "earned", size = 96, lang = "fr", reveal, delay = 0, className }: MedallionProps) {
  const uid = useId().replace(/:/g, "");
  const def = BADGES[id];
  const pal = PALETTES[id];
  const shape = SHAPES[def.family];
  const name = def.name[lang];
  const withText = size >= 64;
  // Comme une pièce : le nom en arc sur le haut, la signature sur le bas.
  const top = name.toUpperCase();
  const topSize = top.length > 15 ? 6.6 : 7.4;

  return (
    <span
      className={[css.medal, reveal ? css.reveal : "", className ?? ""].join(" ")}
      data-state={state}
      data-holo={pal.holo ? "true" : undefined}
      style={{ width: size, height: size, ["--d" as string]: `${delay}ms` }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={name}>
        <defs>
          <linearGradient id={`rim${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={pal.rim[0]} />
            <stop offset=".35" stopColor={pal.rim[1]} />
            <stop offset=".55" stopColor={pal.rim[2]} />
            <stop offset=".78" stopColor={pal.rim[1]} />
            <stop offset="1" stopColor={pal.rim[0]} />
          </linearGradient>
          <radialGradient id={`fld${uid}`} cx=".38" cy=".3" r=".85">
            <stop offset="0" stopColor={pal.field[0]} />
            <stop offset="1" stopColor={pal.field[1]} />
          </radialGradient>
          <linearGradient id={`shn${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`gls${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".32" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clp${uid}`}><path d={shape} /></clipPath>
          <path id={`top${uid}`} d={`M${C - 39.4},${C} A39.4,39.4 0 0 1 ${C + 39.4},${C}`} />
          <path id={`bot${uid}`} d={`M${C - 44.6},${C} A44.6,44.6 0 0 0 ${C + 44.6},${C}`} />
        </defs>

        {/* Bord métallique puis champ émaillé, légèrement en retrait */}
        <path d={shape} fill={`url(#rim${uid})`} className={pal.holo ? css.holoRim : undefined} />
        <path d={shape} fill={`url(#fld${uid})`} transform={`translate(${C} ${C}) scale(.86) translate(${-C} ${-C})`} />

        {/* Filets gravés autour de la devise */}
        <circle cx={C} cy={C} r="47.6" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth=".7" />
        <circle cx={C} cy={C} r="36.4" fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="1.1" />
        <circle cx={C} cy={C} r="35.4" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth=".7" />

        {withText && (
          <g fill={pal.text} fontWeight="700" className={css.motto}>
            <text fontSize={topSize} letterSpacing={top.length > 15 ? 0.6 : 1.1}>
              <textPath href={`#top${uid}`} startOffset="50%" textAnchor="middle">{top}</textPath>
            </text>
            <text fontSize="5.6" letterSpacing="2.4" opacity=".85">
              <textPath href={`#bot${uid}`} startOffset="50%" textAnchor="middle">RARELYST</textPath>
            </text>
            <circle cx={C - 42} cy={C} r="1.3" />
            <circle cx={C + 42} cy={C} r="1.3" />
          </g>
        )}

        <g transform={`translate(${C - 20.4} ${C - 20.4}) scale(1.7)`} fill="none" stroke={pal.ink}
          strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
          <path d={GLYPHS[id]} />
        </g>

        {/* Reflet vernis et éclat qui passe */}
        <g clipPath={`url(#clp${uid})`}>
          <ellipse cx={C} cy="30" rx="42" ry="24" fill={`url(#gls${uid})`} />
          <g transform={`rotate(24 ${C} ${C})`}>
            <rect className={css.sheen} x="-70" y="-30" width="36" height="180" fill={`url(#shn${uid})`} />
          </g>
        </g>

        {state === "pending" && (
          <circle cx={C} cy={C} r="58" fill="none" stroke={pal.rim[1]} strokeWidth="1.4"
            strokeDasharray="3 5" className={css.orbit} />
        )}
      </svg>
      {state === "locked" && (
        <span className={css.lock} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      )}
    </span>
  );
}
