"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Medallion from "@/components/badges/Medallion";
import Hallmark from "@/components/brand/Hallmark";
import type { BadgeId } from "@/lib/participants/badges";
import type { Lang } from "@/lib/i18n/detect";
import { FILM_COPY, type FilmCopy, type SceneId } from "./filmCopy";
import f from "./film.module.css";

// Le film de la page d'accueil : une étude entière, du brief à la décision,
// jouée dans une fausse fenêtre de l'application. Six scènes, une horloge.
// Chaque scène reçoit le temps écoulé `t` (en secondes) et en déduit ce qui
// est affiché : pas de minuterie par élément, tout se recale sur l'horloge.
// Le curseur vise des éléments réels (`data-cursor`), il suit donc la mise en
// page, sur ordinateur comme sur téléphone.

type Step = [at: number, target: string, click?: boolean];

type Scene = { id: SceneId; dur: number; cursor: Step[] };

// Minutage et curseur ; les textes sont dans filmCopy.ts. Les durées sont en
// « secondes de film » : l'horloge les parcourt SPEED fois plus vite.
export const SCENES: Scene[] = [
  { id: "brief", dur: 7, cursor: [[0, "file"], [0.9, "text"], [5.8, "send"], [6.2, "send", true]] },
  { id: "profils", dur: 7.8, cursor: [[0.2, "keep-0"], [2.9, "keep-0", true], [3.3, "keep-2"], [3.8, "keep-2", true], [4.2, "keep-3"], [4.7, "keep-3", true], [5.9, "pay"], [6.5, "pay", true]] },
  { id: "date", dur: 5.4, cursor: [[0.3, "slot-1"], [2.2, "slot-1", true]] },
  { id: "visio", dur: 10.8, cursor: [] },
  { id: "synthese", dur: 7.2, cursor: [[3.9, "doc"]] },
  { id: "decision", dur: 5.4, cursor: [] },
];

/** Le film entier dure une trentaine de secondes. */
export const SPEED = 1.45;

const Copy = createContext<FilmCopy>(FILM_COPY.fr);
const useCopy = () => useContext(Copy);

type Profile = { initial: string; tier: "averti" | "initie" | "rare"; credits: number; medals: BadgeId[]; tone: string };

const PROFILES: Profile[] = [
  { initial: "C", tier: "initie", credits: 69, medals: ["verifie", "linkedin"], tone: "#c98e68" },
  { initial: "I", tier: "rare", credits: 130, medals: ["verifie", "emploi"], tone: "#8a6bd8" },
  { initial: "S", tier: "initie", credits: 69, medals: ["verifie", "portfolio"], tone: "#d07a5c" },
  { initial: "J", tier: "averti", credits: 39, medals: ["verifie", "cv"], tone: "#5d8f7a" },
];
// Trois cartes à l'écran, pas quatre : on lit mieux ce qui se passe.
const SHOWN = [0, 2, 3];
const KEPT_AT = [3.0, null, 3.9, 4.8];
const START_BALANCE = 400;
const SPENT = 69 + 69 + 39;

// Qui parle et quand ; les répliques sont dans filmCopy.ts (call.lines).
const LINES: { who: "brand" | "camille"; from: number; to: number }[] = [
  { who: "brand", from: 0.5, to: 2.8 },
  { who: "camille", from: 3.2, to: 6.4 },
  { who: "camille", from: 6.9, to: 9.9 },
];

// ── Petites fonctions de temps ─────────────────────────────────
const at = (t: number, s: number) => t >= s;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const typed = (text: string, t: number, start: number, cps: number) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

// Préférence « réduire les animations », lue sans effet.
export function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
export const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const getReducedMotionServer = () => false;

/**
 * L'horloge du film : elle ne tourne que lorsque le film est à l'écran, et se
 * met en pause au survol. Partagée par la version à onglets (téléphone) et la
 * version à étapes (grand écran, HowItWorks).
 */
export function useFilmClock() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const [frame, setFrame] = useState({ scene: 0, t: 0 });
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const clock = useRef({ scene: 0, t: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const running = !reduced && visible && !held;

  // Inutile de chauffer un téléphone pour une scène que personne ne regarde.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * SPEED;
      last = now;
      const c = clock.current;
      c.t += dt;
      acc += dt;
      if (c.t >= SCENES[c.scene].dur) {
        c.scene = (c.scene + 1) % SCENES.length;
        c.t = 0;
        acc = 1;
      }
      // Vingt images par seconde suffisent : le reste est porté par les transitions CSS.
      if (acc >= 0.05 * SPEED) {
        acc = 0;
        setFrame({ scene: c.scene, t: c.t });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const jump = (i: number) => {
    clock.current = { scene: i, t: 0 };
    setFrame({ scene: i, t: 0 });
  };

  const scene = SCENES[frame.scene];
  // Sans animation, chaque scène s'affiche dans son état final.
  const t = reduced ? scene.dur : frame.t;
  return { sceneIndex: frame.scene, t, reduced, held, setHeld, jump, rootRef };
}

export default function Film({ lang = "fr" }: { lang?: Lang }) {
  const copy = FILM_COPY[lang];
  const { sceneIndex, t, reduced, held, setHeld, jump, rootRef } = useFilmClock();
  const scene = SCENES[sceneIndex];

  return (
    <div className={f.film} ref={rootRef}>
      <div className={f.tabs} role="tablist" aria-label={copy.tablist}>
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === sceneIndex}
            className={f.tab}
            data-state={i < sceneIndex ? "past" : i === sceneIndex ? "now" : "next"}
            onClick={() => jump(i)}
          >
            <span className={f.tabNum}>0{i + 1}</span>
            <span className={f.tabLabel}>{copy.scenes[s.id].label}</span>
            <span className={f.tabTrack}><i style={{ width: `${i < sceneIndex ? 100 : i === sceneIndex ? (t / s.dur) * 100 : 0}%` }} /></span>
          </button>
        ))}
      </div>

      <div onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
        <FilmWindow lang={lang} sceneIndex={sceneIndex} t={t} reduced={reduced} status={held && !reduced ? copy.paused : undefined} />
      </div>

      <p className={f.caption}><b>0{sceneIndex + 1}</b>{copy.scenes[scene.id].caption}</p>
    </div>
  );
}

/**
 * La fenêtre seule, pilotée de l'extérieur : par l'horloge du film ci-dessus,
 * ou par le défilement de la page (HowItWorks).
 */
export function FilmWindow({ lang = "fr", sceneIndex, t, reduced = false, status }: { lang?: Lang; sceneIndex: number; t: number; reduced?: boolean; status?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scene = SCENES[sceneIndex];
  const copy = FILM_COPY[lang];
  return (
    <Copy.Provider value={copy}>
    <div className={f.window}>
      <div className={f.chrome} aria-hidden="true">
        <span className={f.dots}><i /><i /><i /></span>
        <span className={f.url}>{copy.scenes[scene.id].url}</span>
        <span className={f.chromeRight}>{status ?? copy.scenes[scene.id].label}</span>
      </div>
      <div className={f.stage} ref={stageRef} aria-hidden="true">
        <div key={scene.id} className={f.scene}>
          {scene.id === "brief" && <BriefScene t={t} />}
          {scene.id === "profils" && <ProfilesScene t={t} />}
          {scene.id === "date" && <DateScene t={t} />}
          {scene.id === "visio" && <CallScene t={t} />}
          {scene.id === "synthese" && <SynthesisScene t={t} />}
          {scene.id === "decision" && <DecisionScene t={t} />}
        </div>
        {!reduced && <Cursor stage={stageRef} steps={scene.cursor} t={t} sceneKey={scene.id} />}
      </div>
    </div>
    </Copy.Provider>
  );
}

// ── Curseur ────────────────────────────────────────────────────
// Déplacé en écrivant directement son style : il suit un élément du DOM, pas
// un état React.
function Cursor({ stage, steps, t, sceneKey }: { stage: React.RefObject<HTMLDivElement | null>; steps: Step[]; t: number; sceneKey: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  let current: Step | null = null;
  for (const s of steps) if (s[0] <= t) current = s;
  const target = current?.[1] ?? null;
  const clicking = !!current?.[2] && t - current[0] < 0.35;

  useLayoutEffect(() => {
    const el = ref.current;
    const root = stage.current;
    if (!el || !root) return;
    const node = target ? root.querySelector<HTMLElement>(`[data-cursor="${target}"]`) : null;
    if (!node) { el.style.opacity = "0"; return; }
    const r = root.getBoundingClientRect();
    const n = node.getBoundingClientRect();
    const x = n.left - r.left + n.width * 0.62;
    const y = n.top - r.top + n.height * 0.6;
    el.style.opacity = "1";
    el.style.transform = `translate(${x}px, ${y}px)`;
  });

  return (
    <span ref={ref} key={sceneKey} className={f.cursor} data-click={clicking}>
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="#1c1624" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    </span>
  );
}

function Pane({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${f.pane} ${className ?? ""}`}>
      <header className={f.paneHead}><b>{title}</b>{aside}</header>
      {children}
    </section>
  );
}

// ── 1. Brief ───────────────────────────────────────────────────
function BriefScene({ t }: { t: number }) {
  const c = useCopy().brief;
  const text = typed(c.text, t, 1.0, 64);
  const reading = at(t, 3.7) && !at(t, 4.6);
  const rows: { at: number; k: string; v: React.ReactNode }[] = [
    { at: 4.6, k: c.rows.profiles, v: <span className={f.chips}><i>{c.rows.chips[0]}</i><i>{c.rows.chips[1]}</i></span> },
    { at: 5.0, k: c.rows.format, v: c.rows.formatV },
    { at: 5.4, k: c.rows.decide, v: c.rows.decideV },
  ];
  return (
    <div className={f.brief}>
      <Pane title={c.newBrief} aside={<span className={f.muted}>{c.newBriefHint}</span>} className={f.composer}>
        <div className={f.drop} data-cursor="file" data-filled={at(t, 0.5)}>
          {at(t, 0.5) ? (
            <span className={`${f.file} ${f.pop}`}>
              <span className={f.fileIcon}>PDF</span>
              <span><b>{c.fileName}</b><small>{c.fileMeta}</small></span>
            </span>
          ) : <span className={f.muted}>{c.drop}</span>}
        </div>
        <div className={f.textarea} data-cursor="text">
          {text}{t < 4.4 && <i className={f.caret} />}
        </div>
        <div className={f.composerFoot}>
          <span className={f.muted}>{c.enough}</span>
          <span className={f.btnInk} data-cursor="send" data-pressed={at(t, 6.2)}>{at(t, 6.2) ? c.sent : c.send}</span>
        </div>
      </Pane>

      <Pane title={c.understood} className={f.extract}
        aside={at(t, 4.6) ? <span className={f.ok}>{c.readIn}</span> : reading ? <span className={f.reading}>{c.reading}</span> : null}>
        <dl className={f.facts}>
          {rows.map((r) => (
            <div key={r.k} className={f.fact}>
              <dt>{r.k}</dt>
              <dd>{at(t, r.at) ? <span className={f.pop}>{r.v}</span> : <span className={f.skeleton} data-busy={reading} />}</dd>
            </div>
          ))}
        </dl>
      </Pane>
    </div>
  );
}

// ── 2. Profils ─────────────────────────────────────────────────
function ProfilesScene({ t }: { t: number }) {
  const { profiles: c, locale } = useCopy();
  const paid = at(t, 6.5);
  const balance = Math.round(START_BALANCE - SPENT * prog(t, 6.6, 7.4));
  const keptCount = KEPT_AT.filter((k) => k !== null && at(t, k)).length;
  const keptCredits = PROFILES.reduce((sum, p, i) => sum + (KEPT_AT[i] !== null && at(t, KEPT_AT[i]!) ? p.credits : 0), 0);
  return (
    <div className={f.profiles}>
      <header className={f.listHead}>
        <b>{c.proposed}</b>
        <span className={f.review}><Check /> {c.reviewed}</span>
        <span className={f.balance} data-moving={at(t, 6.6) && !at(t, 7.4)}>{c.balance} <b>{balance}</b> {c.credits}</span>
      </header>
      <div className={f.cards}>
        {SHOWN.map((i, k) => {
          const p = PROFILES[i];
          const kept = KEPT_AT[i] !== null && at(t, KEPT_AT[i]!);
          const txt = c.list[i];
          return at(t, 0.2 + k * 0.3) ? (
            <article key={txt.name} className={`${f.pcard} ${f.pop}`} data-kept={kept} data-dim={paid && !kept}>
              <div className={f.pTop}>
                <span className={f.pAv} style={{ background: p.tone }}>{p.initial}</span>
                <span className={f.pName}><b>{txt.name}</b><small>{txt.role}</small></span>
                <span className={f.tier} data-tier={p.tier}>{p.tier === "rare" ? "◆ " : ""}{txt.tierLabel}</span>
              </div>
              <p className={f.pWhy}>{txt.why}</p>
              <div className={f.pFoot}>
                <span className={f.medals}>{p.medals.map((m) => <Medallion key={m} id={m} size={30} />)}</span>
                <span className={f.price}><b>{p.credits}</b> {c.cr}</span>
                <span className={f.keep} data-on={kept} data-cursor={`keep-${i}`}>{kept ? c.kept : c.keep}</span>
              </div>
            </article>
          ) : <div key={txt.name} className={f.pcardGhost} />;
        })}
      </div>
      <footer className={f.payBar} data-in={keptCount > 0}>
        <span>{c.keptCount(keptCount)} · <b>{keptCredits} {c.credits}</b> <small>{c.worth((keptCredits * 10).toLocaleString(locale))}</small></span>
        <span className={f.btnInk} data-cursor="pay" data-pressed={paid}>{paid ? c.paid : c.confirm}</span>
      </footer>
    </div>
  );
}

// ── 3. Date ────────────────────────────────────────────────────
const SLOTS = [
  { day: 1, from: 14 },
  { day: 3, from: 10 },
  { day: 4, from: 17.5 },
];
const H0 = 9;
const H1 = 20;

function DateScene({ t }: { t: number }) {
  const c = useCopy().date;
  const chosen = at(t, 2.2);
  const done = [
    { at: 3.0, text: c.checklist[0] },
    { at: 3.4, text: c.checklist[1] },
    { at: 3.8, text: c.checklist[2] },
  ];
  return (
    <div className={f.date}>
      <Pane title={c.title} aside={<span className={f.muted}>{c.hint}</span>} className={f.calendar}>
        <div className={f.week}>
          <div className={f.hours}>{[10, 12, 14, 16, 18].map((h) => <span key={h} style={{ top: `${((h - H0) / (H1 - H0)) * 100}%` }}>{c.hour(h)}</span>)}</div>
          {c.days.map((d, di) => (
            <div key={d} className={f.dayCol}>
              <span className={f.dayName}>{d}</span>
              <div className={f.dayBody}>
                {SLOTS.map((s, si) => s.day === di && at(t, 0.2 + si * 0.25) ? (
                  <span key={si} className={`${f.slot} ${f.pop}`} data-cursor={`slot-${si}`}
                    data-state={chosen ? (si === 1 ? "chosen" : "gone") : "open"}
                    style={{ top: `${((s.from - H0) / (H1 - H0)) * 100}%` }}>
                    <b><span className={f.slotDay}>{c.days[s.day]} </span>{c.slots[si]}</b><small>{si === 1 && chosen ? c.confirmed : c.proposedBy}</small>
                  </span>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      </Pane>
      <Pane title={chosen ? c.done : c.waiting} className={f.confirm}
        aside={chosen ? <span className={f.ok}>{c.when}</span> : null}>
        <div className={f.invite} data-on={chosen}>
          <Hallmark level={3} size={78} initial="M" />
          <span><b>{c.inviteTitle}</b><small>{c.inviteText}</small></span>
        </div>
        <ul className={f.checklist}>
          {done.map((d) => <li key={d.text} data-on={at(t, d.at)}><Check />{d.text}</li>)}
        </ul>
      </Pane>
    </div>
  );
}

// ── 4. Visio ───────────────────────────────────────────────────
// Moment où chaque question du guide est cochée.
const GUIDE_DONE = [0, 6.6, 10.2];

function CallScene({ t }: { t: number }) {
  const c = useCopy().call;
  const GUIDE = GUIDE_DONE.map((done, i) => ({ q: c.guide[i], done }));
  const speaking = LINES.find((l) => t >= l.from && t <= l.to)?.who ?? null;
  const shown = LINES.map((l, i) => ({ ...l, text: c.lines[i] })).filter((l) => t >= l.from).slice(-2);
  const secs = 31 + Math.floor(t);
  const clock = `00:${String(12 + Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  const current = GUIDE.findIndex((g) => t < g.done);
  return (
    <div className={f.call}>
      <div className={f.callMain}>
        <div className={f.tile} data-speaking={speaking === "camille"}>
          <Portrait who="camille" speaking={speaking === "camille"} />
          <span className={f.rec}><i />REC {clock}</span>
          <span className={f.tileName}><Bars on={speaking === "camille"} />{c.who}</span>
          <div className={f.captions}>
            {shown.map((l) => (
              <p key={l.text} className={f.pop}>
                <b>{l.who === "brand" ? c.you : c.speaker}</b>
                {t <= l.to ? typed(l.text, t, l.from, 30) : l.text}
              </p>
            ))}
          </div>
        </div>
        <div className={f.pip} data-speaking={speaking === "brand"}>
          <Portrait who="brand" speaking={speaking === "brand"} />
          <span className={f.pipName}><Bars on={speaking === "brand"} />{c.you}</span>
        </div>
        <div className={f.controls}>
          <span className={f.ctrl}><Icon d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M6 11a6 6 0 0 0 12 0 M12 17v4" /></span>
          <span className={f.ctrl}><Icon d="M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3" /></span>
          <span className={f.ctrl}><Icon d="M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3" /></span>
          <span className={`${f.ctrl} ${f.hang}`}><Icon d="M3 14c5-5 13-5 18 0l-2.5 2.5-3-2v-2.5c-2.3-.8-4.7-.8-7 0v2.5l-3 2z" /></span>
        </div>
      </div>
      <aside className={f.guide}>
        <b className={f.guideTitle}>{c.guideTitle}</b>
        <ol>
          {GUIDE.map((g, i) => (
            <li key={g.q} data-state={t >= g.done ? "done" : i === current ? "now" : "next"}>
              <span className={f.gDot}>{t >= g.done ? "✓" : i + 1}</span>{g.q}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Bars({ on }: { on: boolean }) {
  return <span className={f.bars} data-on={on}><i /><i /><i /></span>;
}

// ── 5. Synthèse ────────────────────────────────────────────────
function SynthesisScene({ t }: { t: number }) {
  const { synth: c, quote: q } = useCopy();
  const p = prog(t, 1.4, 3.9);
  const ready = p >= 1;
  const insights = [
    { at: 4.8, n: "1", text: c.insights[0] },
    { at: 5.3, n: "2", text: c.insights[1] },
    { at: 5.8, n: "3", text: c.insights[2] },
  ];
  return (
    <div className={f.after}>
      <Pane title={c.title} aside={<span className={f.muted}>{c.ended}</span>} className={f.deliv}>
        <ul className={f.files}>
          <li data-on={at(t, 0.3)}><span className={f.fIcon}><Icon d="M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3" /></span><span><b>{c.video}</b><small>{c.videoMeta}</small></span><span className={f.dl}>{at(t, 0.3) ? c.download : "…"}</span></li>
          <li data-on={at(t, 0.8)}><span className={f.fIcon}><Icon d="M6 3h9l3 3v15H6z M9 11h6 M9 14h6 M9 17h4" /></span><span><b>{c.transcript}</b><small>{c.transcriptMeta}</small></span><span className={f.dl}>{at(t, 0.8) ? c.download : "…"}</span></li>
          <li data-on={ready}>
            <span className={f.fIcon}><Icon d="M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5" /></span>
            <span><b>{c.synthesis}</b><small>{ready ? c.ready : at(t, 1.4) ? c.writing(Math.round(p * 100)) : c.waiting}</small>
              <span className={f.meter}><i style={{ width: `${p * 100}%` }} /></span>
            </span>
            <span className={f.dl}>{ready ? c.open : ""}</span>
          </li>
        </ul>
      </Pane>
      <article className={f.doc} data-in={at(t, 4.1)} data-cursor="doc">
        <span className={f.docKicker}>{c.kicker}</span>
        <h4>{c.heading}</h4>
        <ol className={f.insights}>
          {insights.map((i) => <li key={i.n} data-on={at(t, i.at)}><b>{i.n}</b>{i.text}</li>)}
        </ol>
        <blockquote className={f.verbatim} data-on={at(t, 6.2)}>
          {q(c.verbatim)}<cite>{c.cite}</cite>
        </blockquote>
      </article>
    </div>
  );
}

// ── 6. Décision ────────────────────────────────────────────────
function DecisionScene({ t }: { t: number }) {
  const { decision: c, quote: q } = useCopy();
  const items = [
    { at: 0.4, stamp: 1.0, tone: "ok", ...c.items[0] },
    { at: 1.4, stamp: 2.0, tone: "ok", ...c.items[1] },
    { at: 2.4, stamp: 3.0, tone: "next", ...c.items[2] },
  ];
  return (
    <div className={f.decision}>
      <Pane title={c.board} aside={<span className={f.muted}>{c.when}</span>} className={f.board}>
        <ul className={f.decisions}>
          {items.map((d) => at(t, d.at) ? (
            <li key={d.text} className={f.pop}>
              <span><b>{d.text}</b><small>{c.source} {d.source}</small></span>
              {at(t, d.stamp) && <span className={f.stamp} data-tone={d.tone}>{d.label}</span>}
            </li>
          ) : <li key={d.text} className={f.decGhost} />)}
        </ul>
      </Pane>
      <div className={f.quotes}>
        {[
          { at: 3.2, ...c.quotes[0] },
          { at: 3.7, ...c.quotes[1] },
        ].map((v) => (
          <blockquote key={v.q} className={f.qcard} data-on={at(t, v.at)}>{q(v.q)}<cite>{v.who}</cite></blockquote>
        ))}
      </div>
    </div>
  );
}

// ── Pièces communes ────────────────────────────────────────────
function Check() {
  return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.4l2.9 2.8 6-6.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

// Les deux personnes de la visio, dessinées : une vraie vidéo serait plus
// lourde que toute la page, et une photo de banque d'images sonnerait faux.
function Portrait({ who, speaking }: { who: "camille" | "brand"; speaking: boolean }) {
  const uid = useId().replace(/:/g, "");
  if (who === "brand") {
    return (
      <svg viewBox="0 0 240 180" className={f.portrait} data-speaking={speaking} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`bw${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef0f4" /><stop offset="1" stopColor="#dfe2ea" /></linearGradient>
          <filter id={`bb${uid}`}><feGaussianBlur stdDeviation="1.6" /></filter>
        </defs>
        <rect width="240" height="180" fill={`url(#bw${uid})`} />
        <g filter={`url(#bb${uid})`}>
          <rect x="150" y="18" width="62" height="78" rx="2" fill="#fbfbfd" stroke="#cfd3dc" strokeWidth="3" />
          <circle cx="181" cy="52" r="16" fill="#e7c7b0" />
          <rect x="20" y="96" width="70" height="4" fill="#c9ccd6" />
          <rect x="26" y="74" width="8" height="22" fill="#9aa3b8" /><rect x="36" y="80" width="7" height="16" fill="#c49a86" /><rect x="45" y="70" width="9" height="26" fill="#6f7a93" />
        </g>
        <g className={f.body}>
          <path d="M52 180c4-34 26-50 52-54h32c26 4 48 20 52 54z" fill="#2f3b56" />
          <path d="M106 126l14 18 14-18z" fill="#f4f1ec" />
          <path d="M108 104h24v26c-7 6-17 6-24 0z" fill="#e9c1a4" />
          <g className={f.head} style={{ transformOrigin: "120px 124px" }}>
            <ellipse cx="120" cy="80" rx="29" ry="35" fill="#efcdb3" />
            <path d="M90 76c-2-26 14-38 31-38 20 0 32 14 29 38-4-10-12-16-24-17-12 5-24 10-36 17z" fill="#5b4030" />
            <ellipse cx="91" cy="84" rx="4" ry="7" fill="#e6bfa3" /><ellipse cx="149" cy="84" rx="4" ry="7" fill="#e6bfa3" />
            <g fill="none" stroke="#2a2a33" strokeWidth="2.2">
              <rect x="97" y="76" width="19" height="14" rx="5" /><rect x="124" y="76" width="19" height="14" rx="5" /><path d="M116 81h8" />
            </g>
            <ellipse className={f.eye} cx="106.5" cy="83" rx="2.2" ry="2.6" fill="#2a2a33" />
            <ellipse className={f.eye} cx="133.5" cy="83" rx="2.2" ry="2.6" fill="#2a2a33" />
            <path d="M120 88q-3 9 1 11" fill="none" stroke="#cf9f82" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse className={f.mouth} cx="120" cy="104" rx="7" ry="3.4" fill="#9b4a45" />
          </g>
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="-80 0 560 300" className={f.portrait} data-speaking={speaking} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`cw${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1e8de" /><stop offset="1" stopColor="#e2d4c5" /></linearGradient>
        <radialGradient id={`cl${uid}`} cx=".12" cy=".3" r=".7"><stop offset="0" stopColor="#fffaf2" stopOpacity=".9" /><stop offset="1" stopColor="#fffaf2" stopOpacity="0" /></radialGradient>
        <filter id={`cb${uid}`}><feGaussianBlur stdDeviation="2.6" /></filter>
      </defs>
      <rect x="-80" width="560" height="300" fill={`url(#cw${uid})`} />
      <g filter={`url(#cb${uid})`}>
        {/* Fenêtre, étagère, plante : le salon, flou comme derrière une vraie caméra */}
        <rect x="-44" y="60" width="4" height="200" fill="#8f7a66" />
        <path d="M-66 60h48l-10-26h-28z" fill="#efe2cf" />
        <rect x="16" y="22" width="108" height="156" rx="3" fill="#fbf7f1" />
        <path d="M70 22v156M16 98h108" stroke="#e1d4c4" strokeWidth="5" />
        <rect x="282" y="112" width="170" height="6" fill="#b3927a" />
        <rect x="400" y="84" width="11" height="28" fill="#a5896f" /><rect x="413" y="92" width="9" height="20" fill="#6f6480" />
        <circle cx="438" cy="160" r="16" fill="#d7c6b6" />
        <rect x="292" y="80" width="10" height="32" fill="#7b6a8c" /><rect x="304" y="86" width="8" height="26" fill="#c8a98f" />
        <rect x="314" y="76" width="12" height="36" fill="#8e6a55" /><rect x="328" y="90" width="9" height="22" fill="#d9c7b6" />
        <path d="M352 112c0-16 6-26 14-26s14 10 14 26z" fill="#c9b6a4" />
        <rect x="286" y="180" width="166" height="6" fill="#b3927a" />
        <rect x="298" y="150" width="30" height="30" rx="4" fill="#e9dccd" />
        <rect x="40" y="232" width="44" height="50" rx="7" fill="#c7ad93" />
        <ellipse cx="50" cy="212" rx="12" ry="26" fill="#7f9270" transform="rotate(-24 50 212)" />
        <ellipse cx="74" cy="206" rx="11" ry="28" fill="#6c8160" transform="rotate(18 74 206)" />
        <ellipse cx="62" cy="200" rx="9" ry="30" fill="#8aa07b" />
      </g>
      <rect x="-80" width="560" height="300" fill={`url(#cl${uid})`} />
      <g className={f.body}>
        {/* Manteau camel sur un haut noir */}
        <path d="M86 300c6-54 40-82 88-90h52c48 8 82 36 88 90z" fill="#bf915f" />
        <path d="M174 208l26 62 26-62z" fill="#1f1a22" />
        <path d="M172 210l28 64-24-2-22-50z" fill="#a67a4d" />
        <path d="M228 210l-28 64 24-2 22-50z" fill="#a67a4d" />
        <path d="M184 172h32v42c-10 9-22 9-32 0z" fill="#c68b64" />
        <g className={f.head} style={{ transformOrigin: "200px 206px" }}>
          <path d="M148 138c-4-50 22-78 54-78 34 0 58 26 52 80l6 64c-14 12-34 12-46 4l-4-58h-24l-4 58c-12 8-32 8-44-4z" fill="#2a1c16" />
          <ellipse cx="200" cy="136" rx="40" ry="50" fill="#d39a72" />
          <path d="M158 132c-2-32 18-52 46-52 26 0 42 18 40 44-8-16-20-24-34-25-14 14-32 26-52 33z" fill="#2a1c16" />
          <ellipse cx="178" cy="160" rx="10" ry="6" fill="#e2897a" opacity=".25" />
          <ellipse cx="222" cy="160" rx="10" ry="6" fill="#e2897a" opacity=".25" />
          <path d="M173 126q9-5 18-1M209 125q9-4 18 1" fill="none" stroke="#2a1c16" strokeWidth="2.8" strokeLinecap="round" />
          <ellipse className={f.eye} cx="182" cy="139" rx="3.4" ry="4.2" fill="#2a1c16" />
          <ellipse className={f.eye} cx="218" cy="139" rx="3.4" ry="4.2" fill="#2a1c16" />
          <path d="M199 148q-3 8 1 10q3 1 5-1" fill="none" stroke="#b07651" strokeWidth="2" strokeLinecap="round" />
          <ellipse className={f.mouth} cx="200" cy="171" rx="9" ry="4.4" fill="#9a4a45" />
          <circle cx="161" cy="170" r="3.6" fill="#e0b85a" /><circle cx="239" cy="170" r="3.6" fill="#e0b85a" />
        </g>
      </g>
    </svg>
  );
}
