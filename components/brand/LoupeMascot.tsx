"use client";

import { useId } from "react";
import css from "./loupe.module.css";

// La loupe de Rarelyst, en personnage : la loupe du logo, avec des yeux.
// Elle accompagne la page d'accueil, le guide de première utilisation, les
// attentes (lecture du brief, recherche des profils) et les pages vides.
//
// Humeurs : « happy » (par défaut), « search » (les yeux balayent),
// « puzzled » (sourcil levé : rien trouvé), « wow » (bouche ronde : succès).

export type LoupeMood = "happy" | "search" | "puzzled" | "wow";

export default function LoupeMascot({ size = 58, mood = "happy", look, animated = true, eyesRef, label, className }: {
  size?: number;
  mood?: LoupeMood;
  /** Décalage du regard, en unités du dessin (±3 au plus). */
  look?: { x: number; y: number };
  animated?: boolean;
  /** Pour piloter le regard image par image (page d'accueil). */
  eyesRef?: React.Ref<SVGGElement>;
  label?: string;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glass = `lg${uid}`, rim = `lr${uid}`, lens = `lc${uid}`;
  const lookStyle = look ? { transform: `translate(${look.x}px, ${look.y}px)` } : undefined;
  return (
    <svg
      viewBox="0 0 64 64" width={size} height={size}
      className={`${css.mascot} ${className ?? ""}`} data-mood={mood} data-animated={animated}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={glass} cx=".36" cy=".3" r=".85"><stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#f1ebff" /><stop offset="1" stopColor="#d6c8ff" /></radialGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a585ff" /><stop offset="1" stopColor="#4b2bb5" /></linearGradient>
        <clipPath id={lens}><circle cx="26" cy="26" r="16.5" /></clipPath>
      </defs>
      {/* Le manche, puis la monture et le verre */}
      <rect x="37.5" y="38" width="9.5" height="24" rx="4.75" transform="rotate(-45 42 50)" fill="#1c1624" />
      <rect x="39.5" y="38.5" width="5.5" height="6" rx="2" transform="rotate(-45 42 50)" fill="#6a43db" />
      <circle cx="26" cy="26" r="20.5" fill={`url(#${rim})`} />
      <circle cx="26" cy="26" r="16.5" fill={`url(#${glass})`} />
      <g clipPath={`url(#${lens})`}>
        <g ref={eyesRef} className={css.look} style={lookStyle}>
          <g className={css.eyes}>
            <ellipse cx="20.5" cy="25.5" rx="2.6" ry={mood === "wow" ? 3.8 : 3.4} fill="#1c1624" />
            <ellipse cx="31.5" cy="25.5" rx="2.6" ry={mood === "wow" ? 3.8 : 3.4} fill="#1c1624" />
            <circle cx="21.3" cy="24.4" r=".9" fill="#fff" />
            <circle cx="32.3" cy="24.4" r=".9" fill="#fff" />
          </g>
        </g>
        {mood === "puzzled" && <path d="M28.5 19.2q3-2.4 6-.6" fill="none" stroke="#1c1624" strokeWidth="1.5" strokeLinecap="round" />}
        <circle cx="16.5" cy="31" r="2.4" fill="#ff9dc4" opacity=".55" />
        <circle cx="35.5" cy="31" r="2.4" fill="#ff9dc4" opacity=".55" />
        {mood === "wow" ? <ellipse cx="26" cy="33.4" rx="2.4" ry="2.8" fill="#1c1624" />
          : mood === "puzzled" ? <path d="M22.5 33.5q2-1.2 3.5 0t3.5 0" fill="none" stroke="#1c1624" strokeWidth="1.6" strokeLinecap="round" />
          : mood === "search" ? <path d="M23.5 33q2.5 1.8 5 0" fill="none" stroke="#1c1624" strokeWidth="1.6" strokeLinecap="round" />
          : <path d="M22 32.5q4 3.4 8 0" fill="none" stroke="#1c1624" strokeWidth="1.7" strokeLinecap="round" />}
        <rect className={css.glint} x="2" y="-10" width="7" height="80" fill="#fff" opacity=".75" />
      </g>
      <ellipse cx="18.5" cy="16.5" rx="5" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-32 18.5 16.5)" />
    </svg>
  );
}

/**
 * Une petite scène d'attente : la loupe passe ligne à ligne sur un document
 * (« doc », lecture d'un brief) ou de visage en visage (« profiles »,
 * recherche dans le panel).
 */
export function LoupeScan({ variant = "doc", size = 1 }: { variant?: "doc" | "profiles"; size?: number }) {
  return (
    <div className={css.scan} data-variant={variant} style={{ ["--s" as string]: size }} aria-hidden="true">
      {variant === "doc" ? (
        <div className={css.doc}>
          <i style={{ width: "70%" }} /><i /><i style={{ width: "86%" }} /><i style={{ width: "54%" }} /><i style={{ width: "78%" }} />
        </div>
      ) : (
        <div className={css.faces}>
          {["#c98e68", "#8a6bd8", "#d07a5c", "#5d8f7a", "#6f7a93"].map((c, i) => <i key={c} style={{ background: c, ["--i" as string]: i }} />)}
        </div>
      )}
      <span className={css.scanner}><LoupeMascot size={54} mood="search" look={{ x: 0, y: 2 }} /></span>
    </div>
  );
}
