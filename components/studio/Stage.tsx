"use client";

import { useEffect, useState } from "react";
import { findComposition, SIZES, type Lang } from "./compositions";
import { useStudioTime } from "./clock";

/** Un format, à sa taille exacte, qui se joue en boucle (ou suit l'enregistreur). */
export default function Stage({ id, lang, scale = 1 }: { id: string; lang: Lang; scale?: number }) {
  const comp = findComposition(id);
  const t = useStudioTime(comp?.duration || 1);
  const [ready, setReady] = useState(false);
  useEffect(() => { document.fonts?.ready.then(() => setReady(true)); }, []);
  if (!comp) return null;
  const [w, h] = SIZES[comp.format];
  return (
    <div style={{ width: w * scale, height: h * scale, overflow: "hidden" }} data-ready={ready}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "left top" }}>
        {comp.render(comp.duration ? t : comp.still ?? 99, lang)}
      </div>
    </div>
  );
}
