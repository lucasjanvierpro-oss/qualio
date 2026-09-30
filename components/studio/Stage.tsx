"use client";

import { useEffect, useState } from "react";
import { renderComposition } from "./compositions";
import { findMeta, SIZES, type Lang } from "./registry";
import { useStudioTime } from "./clock";

/** Un format, à sa taille exacte, qui se joue en boucle (ou suit l'enregistreur). */
export default function Stage({ id, lang, scale = 1 }: { id: string; lang: Lang; scale?: number }) {
  const meta = findMeta(id);
  const t = useStudioTime(meta?.duration || 1);
  const [ready, setReady] = useState(false);
  useEffect(() => { document.fonts?.ready.then(() => setReady(true)); }, []);
  if (!meta) return null;
  const [w, h] = SIZES[meta.format];
  return (
    <div style={{ width: w * scale, height: h * scale, overflow: "hidden" }} data-ready={ready}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "left top" }}>
        {renderComposition(id, t, lang)}
      </div>
    </div>
  );
}
