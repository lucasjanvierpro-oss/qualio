"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import styles from "./landing.module.css";
import { BRIEFS, PANEL, RARITY_LABEL, type Brief, type ConsoleProfile } from "./content";

type Match = { profile: ConsoleProfile; score: number };

function matchesFor(brief: Brief): Match[] {
  return PANEL.map((profile) => ({
    profile,
    score: profile.signals.filter((s) => brief.signals.includes(s)).length,
  }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Préférence « réduire les animations » du système, lue sans effet.
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionServer = () => false;

function fitLabel(score: number) {
  if (score >= 3) return "Très proche";
  if (score === 2) return "Proche";
  return "À considérer";
}

// Une demande de marque s'écrit toute seule, puis les profils correspondants
// apparaissent. Le premier brief est affiché complet dès le chargement : la
// page est lisible avant que l'animation ne démarre.
export default function SearchConsole() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(BRIEFS[0].text);
  const [shown, setShown] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const pausedRef = useRef(paused);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const tick = () => {
          if (cancelled) return;
          if (pausedRef.current) { timer = setTimeout(tick, 250); return; }
          resolve();
        };
        timer = setTimeout(tick, ms);
      });

    (async () => {
      let i = 0;
      await wait(5200);
      while (!cancelled) {
        i = (i + 1) % BRIEFS.length;
        const text = BRIEFS[i].text;
        setIndex(i);
        setShown(false);
        for (let k = 1; k <= text.length && !cancelled; k++) {
          setTyped(text.slice(0, k));
          await wait(24 + Math.random() * 32);
        }
        if (cancelled) return;
        setShown(true);
        await wait(4600);
      }
    })();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [reduced]);

  const brief = BRIEFS[index];
  const matches = shown ? matchesFor(brief) : [];

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    box.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    box.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div className={styles.console} ref={boxRef} onPointerMove={onPointerMove} aria-label="Démonstration de la recherche de profils">
      <div className={styles.mesh} aria-hidden="true" />
      <div className={styles.spot} aria-hidden="true" />

      <div className={styles.consoleHead}>
        <span>Brief d&apos;une marque</span>
        <span><b>{shown ? matches.length : "…"}</b> profils correspondent</span>
      </div>

      <p className={styles.brief} aria-live="polite">
        {typed}
        <span className={styles.caret} aria-hidden="true" />
      </p>

      <div className={styles.chips}>
        {shown && brief.signals.map((s, k) => (
          <span key={`${index}-${s}`} className={styles.chip} style={{ animationDelay: `${k * 90}ms` }}>{s}</span>
        ))}
      </div>

      <div className={styles.rows}>
        {matches.map(({ profile, score }, k) => (
          <div key={`${index}-${profile.name}`} className={styles.row} style={{ animationDelay: `${320 + k * 130}ms` }}>
            <span className={styles.avatar}>
              {profile.photo
                ? <Image src={profile.photo} alt="" fill sizes="44px" />
                : profile.name[0]}
            </span>
            <span>
              <span className={styles.rowName}>
                {profile.name}
                {profile.rarity && (
                  <span className={`${styles.tag} ${profile.rarity === "rare" ? styles.tagRare : styles.tagIntrouvable}`}>
                    {profile.rarity === "rare" ? "◆" : "✦"} {RARITY_LABEL[profile.rarity]}
                  </span>
                )}
              </span>
              <span className={styles.rowRole}>{profile.role}</span>
            </span>
            <span className={styles.fit}>{fitLabel(score)}</span>
          </div>
        ))}
      </div>

      <div className={styles.consoleFoot}>
        <span>Démonstration sur des profils d&apos;exemple.</span>
        {!reduced && (
          <button type="button" onClick={() => setPaused((p) => !p)}>
            {paused ? "Reprendre" : "Mettre en pause"}
          </button>
        )}
      </div>
    </div>
  );
}
