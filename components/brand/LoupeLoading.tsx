"use client";

import { useEffect, useState } from "react";
import { LoupeScan } from "./LoupeMascot";
import css from "./loupe.module.css";

// Écran d'attente avec la loupe : pendant qu'une page se charge, ou pendant
// qu'une IA travaille (recherche dans le panel, synthèse, simulation). Les
// phrases défilent pour dire ce qui se passe vraiment.

export default function LoupeLoading({ lines = ["Un instant…"], variant = "doc", tone = "light", compact = false }: {
  lines?: string[];
  variant?: "doc" | "profiles";
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (lines.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % lines.length), 2600);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div className={css.loading} data-tone={tone} data-compact={compact} role="status" aria-live="polite">
      <LoupeScan variant={variant} size={compact ? 0.8 : 1} />
      <p key={i}>{lines[i]}</p>
    </div>
  );
}
