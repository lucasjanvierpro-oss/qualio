"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n/detect";
import Film, { FilmWindow, SCENES, useFilmClock } from "./Film";
import { FILM_COPY } from "./filmCopy";
import h from "./how.module.css";

// « Comment ça marche » : le film se joue tout seul dès qu'il est à l'écran.
// Sur grand écran, les six étapes sont listées à côté de la fenêtre et
// s'allument au fil du film ; un clic en rejoue une. Sur téléphone, les
// étapes deviennent des onglets au-dessus du film.

const WIDE = "(min-width: 980px)";
function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getWide = () => window.matchMedia(WIDE).matches;
const getWideServer = () => false;

export default function HowItWorks({ lang = "fr" }: { lang?: Lang }) {
  const wide = useSyncExternalStore(subscribeWide, getWide, getWideServer);
  return wide ? <Showcase lang={lang} /> : <Film lang={lang} />;
}

function Showcase({ lang }: { lang: Lang }) {
  const copy = FILM_COPY[lang];
  const { sceneIndex, t, reduced, held, setHeld, jump, rootRef } = useFilmClock();
  const progress = (sceneIndex + t / SCENES[sceneIndex].dur) / SCENES.length;

  return (
    <div ref={rootRef} className={h.show}>
      <ol className={h.steps} aria-label={copy.tablist}>
        <span className={h.rail} aria-hidden="true"><i style={{ height: `${progress * 100}%` }} /></span>
        {SCENES.map((sc, i) => (
          <li key={sc.id} data-state={i < sceneIndex ? "past" : i === sceneIndex ? "now" : "next"}>
            <button type="button" onClick={() => jump(i)} aria-current={i === sceneIndex ? "step" : undefined}>
              <span className={h.num}>0{i + 1}</span>
              <span className={h.stepTitle}>{copy.scenes[sc.id].step}</span>
            </button>
            <div className={h.more}><p>{copy.scenes[sc.id].caption}</p></div>
          </li>
        ))}
      </ol>
      <div className={h.win} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
        <FilmWindow lang={lang} sceneIndex={sceneIndex} t={t} reduced={reduced} status={held && !reduced ? copy.paused : undefined} />
      </div>
    </div>
  );
}
