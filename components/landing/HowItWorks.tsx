"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Film, { FilmWindow, SCENES, getReducedMotion, getReducedMotionServer, subscribeReducedMotion } from "./Film";
import h from "./how.module.css";

// « Comment ça marche », joué au défilement. Sur grand écran, la section se
// fige et c'est la molette qui fait avancer le film : chaque scène occupe une
// portion de la hauteur, et le temps de la scène suit la position. Sur
// téléphone, ou si l'on préfère moins d'animations, le film tourne seul.

const PER_SCENE_VH = 70;
// La fin de chaque scène reste affichée sur le dernier cinquième de sa portion.
const HOLD = 0.8;

const WIDE = "(min-width: 980px) and (min-height: 700px)";
function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getWide = () => window.matchMedia(WIDE).matches;
const getWideServer = () => false;

export default function HowItWorks() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const wide = useSyncExternalStore(subscribeWide, getWide, getWideServer);
  if (!wide || reduced) return <Film />;
  return <Pinned />;
}

function Pinned() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ scene: 0, t: 0, p: 0 });

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = Math.max(0, Math.min(1, run > 0 ? -r.top / run : 0));
      const x = p * SCENES.length;
      const scene = Math.min(SCENES.length - 1, Math.floor(x));
      const frac = Math.min(1, (x - scene) / HOLD);
      const t = frac * SCENES[scene].dur;
      setFrame((f) => (f.scene === scene && Math.abs(f.t - t) < 0.01 ? f : { scene, t, p }));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Cliquer une étape amène le défilement au début de sa scène.
  function go(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.02) / SCENES.length) * run, behavior: "smooth" });
  }

  return (
    <div ref={trackRef} className={h.track} style={{ height: `calc(100vh + ${SCENES.length * PER_SCENE_VH}vh)` }}>
      <div className={h.sticky}>
        <ol className={h.steps}>
          <span className={h.rail} aria-hidden="true"><i style={{ height: `${frame.p * 100}%` }} /></span>
          {SCENES.map((sc, i) => (
            <li key={sc.id} data-state={i < frame.scene ? "past" : i === frame.scene ? "now" : "next"}>
              <button type="button" onClick={() => go(i)}>
                <span className={h.num}>0{i + 1}</span>
                <span className={h.stepTitle}>{sc.step}</span>
              </button>
              <div className={h.more}><p>{sc.caption}</p></div>
            </li>
          ))}
        </ol>
        <div className={h.win}>
          <FilmWindow sceneIndex={frame.scene} t={frame.t} />
          <p className={h.hint} data-hide={frame.p > 0.04}>Faites défiler : le film avance avec vous.</p>
        </div>
      </div>
    </div>
  );
}
