"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import LoupeMascot from "@/components/brand/LoupeMascot";
import css from "./tour.module.css";

// Visite guidée, la première fois qu'on arrive sur un écran : la page
// s'assombrit sauf l'élément à regarder, une bulle explique, on avance d'étape
// en étape. Les éléments se désignent par un attribut data-tour="nom". Une
// étape dont l'élément n'est pas à l'écran est sautée : la visite s'adapte à
// ce que la page montre vraiment. C'est la loupe de Rarelyst qui explique :
// elle regarde l'élément éclairé.

export type TourStep = { target: string; title: string; text: string };

type Lang = "fr" | "en";
const T = {
  fr: { next: "Suivant", done: "C'est parti", skip: "Passer", replay: "Revoir le guide" },
  en: { next: "Next", done: "Let's go", skip: "Skip", replay: "Replay the guide" },
};

const PAD = 8;
const key = (id: string) => `rl-tour-${id}`;

function seen(id: string) {
  try { return localStorage.getItem(key(id)) === "1"; } catch { return true; }
}
function markSeen(id: string) {
  try { localStorage.setItem(key(id), "1"); } catch { /* sans stockage, la visite reviendra */ }
}

const find = (target: string) => document.querySelector<HTMLElement>(`[data-tour="${target}"]`);

export default function Tour({ id, steps, lang = "fr", delay = 700 }: { id: string; steps: TourStep[]; lang?: Lang; delay?: number }) {
  const t = T[lang];
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Étapes présentes à l'écran, recalculées à chaque ouverture.
  const [visible, setVisible] = useState<TourStep[]>([]);

  const start = useCallback(() => {
    const present = steps.filter((s) => find(s.target));
    if (!present.length) return;
    setVisible(present);
    setIndex(0);
    setActive(true);
  }, [steps]);

  useEffect(() => {
    // Le portail ne peut s'ouvrir qu'une fois la page dans le navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (seen(id)) return;
    const timer = setTimeout(start, delay);
    return () => clearTimeout(timer);
  }, [id, delay, start]);

  const step = active ? visible[index] : null;

  // Suit l'élément : défilement jusqu'à lui, puis mesure à chaque mouvement.
  useLayoutEffect(() => {
    if (!step) return;
    const el = find(step.target);
    if (!el) return;
    // Un élément plus haut que l'écran se montre par son début.
    el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.55 ? "start" : "center", behavior: "smooth" });
    let raf = 0;
    const measure = () => { raf = 0; setRect(el.getBoundingClientRect()); };
    const onMove = () => { if (!raf) raf = requestAnimationFrame(measure); };
    onMove();
    const settle = setTimeout(onMove, 450);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [step]);

  const finish = useCallback(() => { markSeen(id); setActive(false); setRect(null); }, [id]);
  const next = () => (index + 1 < visible.length ? setIndex(index + 1) : finish());

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!mounted) return null;

  const replay = (
    <button type="button" className={css.replay} onClick={start} title={t.replay} aria-label={t.replay}>
      <LoupeMascot size={34} />
    </button>
  );
  if (!step || !rect) return createPortal(replay, document.body);

  // La bulle se place sous l'élément, au-dessus s'il n'y a pas la place, ou en
  // bas de l'écran quand l'élément le remplit : elle reste toujours cliquable.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const BUBBLE_H = 210;
  const tall = rect.height > vh * 0.55;
  const side = !tall && rect.bottom + PAD + 14 + BUBBLE_H < vh ? "below"
    : !tall && rect.top - PAD - 14 - BUBBLE_H > 0 ? "above"
    : "inside";
  const bubbleW = Math.min(372, vw - 24);
  const left = Math.max(12, Math.min(vw - bubbleW - 12, rect.left + rect.width / 2 - bubbleW / 2));
  const arrowX = Math.max(18, Math.min(bubbleW - 18, rect.left + rect.width / 2 - left));
  // Le regard de la loupe : vers l'élément éclairé.
  const dx = rect.left + rect.width / 2 - (left + 40);
  const look = { x: Math.max(-2.4, Math.min(2.4, dx / 80)), y: side === "above" ? 2.2 : -2.2 };

  return createPortal(
    <div className={css.layer} role="dialog" aria-modal="false" aria-label={step.title}>
      <div
        className={css.spot}
        style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
      />
      <div
        className={css.bubble}
        data-side={side}
        style={{
          left, width: bubbleW,
          ...(side === "below" ? { top: rect.bottom + PAD + 14 } : side === "above" ? { bottom: vh - rect.top + PAD + 14 } : { bottom: 20 }),
          ["--ax" as string]: `${arrowX}px`,
        }}
      >
        <span className={css.guide} key={`m${index}`}><LoupeMascot size={48} mood={index + 1 === visible.length ? "wow" : "happy"} look={look} /></span>
        <span className={css.count}>{index + 1} / {visible.length}</span>
        <b className={css.title}>{step.title}</b>
        <p className={css.text}>{step.text}</p>
        <div className={css.actions}>
          <button type="button" className={css.skip} onClick={finish}>{t.skip}</button>
          <button type="button" className={css.next} onClick={next} autoFocus>
            {index + 1 < visible.length ? `${t.next} →` : t.done}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
