"use client";

import { useEffect, useState } from "react";

// L'horloge du studio. En lecture normale, l'animation boucle en temps réel.
// En mode capture (?capture), c'est l'enregistreur qui fixe le temps image par
// image (window.__studioT puis l'événement « studio-t ») : chaque image est
// alors exactement reproductible, et la vidéo parfaitement fluide.

declare global {
  interface Window { __studioT?: number; __studioReady?: boolean }
}

export function useStudioTime(duration: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("capture")) {
      const on = () => setT(window.__studioT ?? 0);
      window.addEventListener("studio-t", on);
      on();
      window.__studioReady = true;
      return () => window.removeEventListener("studio-t", on);
    }
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => { setT(((now - start) / 1000) % duration); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
  return t;
}

// ── Petites fonctions de mouvement, toutes pilotées par t ─────────────
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Avancement de 0 à 1 entre a et b. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Rebond léger à l'arrivée (0 → 1 avec un petit dépassement). */
export const backOut = (x: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/** Apparition : fondu et montée, entre `at` et `at + d`, puis disparition à `out`. */
export function rise(t: number, at: number, d = 0.5, dist = 24, out?: number): React.CSSProperties {
  const p = easeOut(seg(t, at, at + d));
  const q = out === undefined ? 0 : easeOut(seg(t, out, out + 0.35));
  return { opacity: p * (1 - q), transform: `translateY(${(1 - p) * dist - q * dist * 0.6}px)` };
}
/** Arrivée avec rebond (échelle). */
export function pop(t: number, at: number, d = 0.45): React.CSSProperties {
  const x = seg(t, at, at + d);
  return { opacity: clamp01(x * 3), transform: `scale(${x === 0 ? 0.6 : 0.6 + 0.4 * backOut(x)})` };
}
/** Texte tapé à la machine. */
export const typed = (text: string, t: number, at: number, cps = 22) => text.slice(0, Math.max(0, Math.floor((t - at) * cps)));
