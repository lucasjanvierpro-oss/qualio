"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Medallion from "@/components/badges/Medallion";
import Hallmark from "@/components/brand/Hallmark";
import type { BadgeId } from "@/lib/participants/badges";
import f from "./film.module.css";

// Le film de la page d'accueil : une étude entière, du brief à la décision,
// jouée dans une fausse fenêtre de l'application. Six scènes, une horloge.
// Chaque scène reçoit le temps écoulé `t` (en secondes) et en déduit ce qui
// est affiché : pas de minuterie par élément, tout se recale sur l'horloge.
// Le curseur vise des éléments réels (`data-cursor`), il suit donc la mise en
// page, sur ordinateur comme sur téléphone.

type Step = [at: number, target: string, click?: boolean];

type Scene = { id: string; label: string; dur: number; caption: string; url: string; cursor: Step[] };

const SCENES: Scene[] = [
  {
    id: "brief", label: "Brief", dur: 8,
    caption: "Vous écrivez ce que vous cherchez, ou vous déposez votre brief. L'IA en tire les profils, le format et ce que la synthèse devra trancher.",
    url: "rarelyst.co/marque/nouvelle-etude",
    cursor: [[0, "file"], [1.2, "text"], [6.7, "send"], [7.1, "send", true]],
  },
  {
    id: "profils", label: "Profils", dur: 8.4,
    caption: "Des profils prouvés vous sont proposés, revus à la main par l'équipe. Chacun affiche son prix : vous ne payez que ceux que vous gardez.",
    url: "rarelyst.co/marque/etudes/maroquinerie",
    cursor: [[0.2, "keep-0"], [2.9, "keep-0", true], [3.3, "keep-2"], [3.8, "keep-2", true], [4.2, "keep-3"], [4.7, "keep-3", true], [5.9, "pay"], [6.5, "pay", true]],
  },
  {
    id: "date", label: "Date", dur: 6,
    caption: "Le participant propose ses créneaux, vous en choisissez un. La salle de visio, l'invitation et les rappels partent seuls.",
    url: "rarelyst.co/marque/etudes/maroquinerie",
    cursor: [[0.3, "slot-1"], [2.2, "slot-1", true]],
  },
  {
    id: "visio", label: "Visio", dur: 11,
    caption: "Vous menez l'entretien, votre guide à côté. Il est enregistré et transcrit pendant que vous parlez.",
    url: "rarelyst.co/entretien/salle-privee",
    cursor: [],
  },
  {
    id: "synthese", label: "Synthèse", dur: 8.4,
    caption: "La vidéo et la transcription sont prêtes à la fin de l'appel. La synthèse de l'étude suit, construite autour de vos questions.",
    url: "rarelyst.co/marque/etudes/maroquinerie/synthese",
    cursor: [[3.9, "doc"]],
  },
  {
    id: "decision", label: "Décision", dur: 6.4,
    caption: "Vous arrivez en comité avec des verbatims, pas des impressions. Chaque décision renvoie à ce qui a été dit.",
    url: "rarelyst.co/marque/etudes/maroquinerie/synthese",
    cursor: [],
  },
];

const BRIEF = "On lance une ligne de maroquinerie en cuir recyclé. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et des vendeuses en boutique.";

type Profile = { initial: string; name: string; role: string; why: string; tier: "averti" | "initie" | "rare"; tierLabel: string; credits: number; medals: BadgeId[]; tone: string };

const PROFILES: Profile[] = [
  { initial: "C", name: "Camille R.", role: "Acheteuse luxe · Paris · 34 ans", why: "Trois à quatre sacs par an, la moitié en seconde main.", tier: "initie", tierLabel: "Initiée", credits: 69, medals: ["verifie", "linkedin", "achat"], tone: "#c98e68" },
  { initial: "I", name: "Inès B.", role: "Vendeuse en boutique de luxe · 8 ans", why: "Voit quarante clientes par semaine hésiter devant un prix.", tier: "rare", tierLabel: "Rare", credits: 130, medals: ["verifie", "emploi", "linkedin"], tone: "#8a6bd8" },
  { initial: "S", name: "Sofia M.", role: "Revendeuse seconde main · Lyon", why: "Revend trente sacs par mois, connaît la cote de chaque modèle.", tier: "initie", tierLabel: "Initiée", credits: 69, medals: ["verifie", "reseaux", "portfolio"], tone: "#d07a5c" },
  { initial: "J", name: "Jeanne L.", role: "Cliente avertie · Bordeaux · 29 ans", why: "A comparé cinq marques de cuir recyclé cette année.", tier: "averti", tierLabel: "Averti", credits: 39, medals: ["verifie", "cv"], tone: "#5d8f7a" },
];
const KEPT_AT = [3.0, null, 3.9, 4.8];
const START_BALANCE = 400;
const SPENT = 69 + 69 + 39;

const LINES: { who: "brand" | "camille"; from: number; to: number; text: string }[] = [
  { who: "brand", from: 0.5, to: 2.8, text: "Qu'est-ce qui vous ferait payer un sac en cuir recyclé au prix du neuf ?" },
  { who: "camille", from: 3.2, to: 6.4, text: "Qu'on ne le voie pas. Je l'achète pour la pièce, pas pour le discours." },
  { who: "camille", from: 6.9, to: 9.9, text: "Et trois coloris, pas cinq : le noir partira, le reste finira en soldes." },
];

// ── Petites fonctions de temps ─────────────────────────────────
const at = (t: number, s: number) => t >= s;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const typed = (text: string, t: number, start: number, cps: number) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

// Préférence « réduire les animations », lue sans effet.
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionServer = () => false;

export default function Film() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const [frame, setFrame] = useState({ scene: 0, t: 0 });
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const clock = useRef({ scene: 0, t: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const running = !reduced && visible && !held;

  // Le film ne tourne que visible à l'écran : inutile de chauffer un téléphone
  // pour une scène que personne ne regarde.
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
      const dt = Math.min(0.1, (now - last) / 1000);
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
      if (acc >= 0.05) {
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

  return (
    <div className={f.film} ref={rootRef}>
      <div className={f.tabs} role="tablist" aria-label="Une étude, de bout en bout">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === frame.scene}
            className={f.tab}
            data-state={i < frame.scene ? "past" : i === frame.scene ? "now" : "next"}
            onClick={() => jump(i)}
          >
            <span className={f.tabNum}>0{i + 1}</span>
            <span className={f.tabLabel}>{s.label}</span>
            <span className={f.tabTrack}><i style={{ width: `${i < frame.scene ? 100 : i === frame.scene ? (t / s.dur) * 100 : 0}%` }} /></span>
          </button>
        ))}
      </div>

      <div className={f.window} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
        <div className={f.chrome} aria-hidden="true">
          <span className={f.dots}><i /><i /><i /></span>
          <span className={f.url}>{scene.url}</span>
          <span className={f.chromeRight}>{held && !reduced ? "En pause" : scene.label}</span>
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

      <p className={f.caption}><b>0{frame.scene + 1}</b>{scene.caption}</p>
    </div>
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
  const text = typed(BRIEF, t, 1.4, 46);
  const reading = at(t, 3.6) && !at(t, 5.0);
  const rows: { at: number; k: string; v: React.ReactNode }[] = [
    { at: 5.0, k: "Profils", v: <span className={f.chips}><i>Acheteuses de luxe, aussi en seconde main</i><i>Vendeuses en boutique</i></span> },
    { at: 5.4, k: "Format", v: "6 entretiens · 45 min · en visio" },
    { at: 5.8, k: "À trancher", v: "Le prix de lancement · 3 ou 5 coloris" },
    { at: 6.2, k: "Budget", v: <span>234 à 414 crédits <small>selon les profils retenus</small></span> },
  ];
  return (
    <div className={f.brief}>
      <Pane title="Nouveau brief" aside={<span className={f.muted}>Écrivez, ou déposez un document</span>} className={f.composer}>
        <div className={f.drop} data-cursor="file" data-filled={at(t, 0.5)}>
          {at(t, 0.5) ? (
            <span className={`${f.file} ${f.pop}`}>
              <span className={f.fileIcon}>PDF</span>
              <span><b>brief-maroquinerie-FW27.pdf</b><small>2,4 Mo · 12 pages</small></span>
            </span>
          ) : <span className={f.muted}>Glissez un PDF, un Word ou un PowerPoint</span>}
        </div>
        <div className={f.textarea} data-cursor="text">
          {text}{t < 5.6 && <i className={f.caret} />}
        </div>
        <div className={f.composerFoot}>
          <span className={f.muted}>Ou quelques phrases suffisent.</span>
          <span className={f.btnInk} data-cursor="send" data-pressed={at(t, 7.1)}>{at(t, 7.1) ? "Brief envoyé ✓" : "Envoyer le brief →"}</span>
        </div>
      </Pane>

      <Pane title="Ce que nous avons compris" className={f.extract}
        aside={at(t, 5.0) ? <span className={f.ok}>Lu en 6 secondes</span> : reading ? <span className={f.reading}>Lecture du brief…</span> : null}>
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
  const paid = at(t, 6.5);
  const balance = Math.round(START_BALANCE - SPENT * prog(t, 6.6, 7.4));
  const keptCount = KEPT_AT.filter((k) => k !== null && at(t, k)).length;
  const keptCredits = PROFILES.reduce((sum, p, i) => sum + (KEPT_AT[i] !== null && at(t, KEPT_AT[i]!) ? p.credits : 0), 0);
  return (
    <div className={f.profiles}>
      <header className={f.listHead}>
        <b>4 profils proposés</b>
        <span className={f.review}><Check /> Sélection revue par l&apos;équipe</span>
        <span className={f.balance} data-moving={at(t, 6.6) && !at(t, 7.4)}>Solde <b>{balance}</b> crédits</span>
      </header>
      <div className={f.cards}>
        {PROFILES.map((p, i) => {
          const kept = KEPT_AT[i] !== null && at(t, KEPT_AT[i]!);
          return at(t, 0.2 + i * 0.3) ? (
            <article key={p.name} className={`${f.pcard} ${f.pop}`} data-kept={kept} data-dim={paid && !kept}>
              <div className={f.pTop}>
                <span className={f.pAv} style={{ background: p.tone }}>{p.initial}</span>
                <span className={f.pName}><b>{p.name}</b><small>{p.role}</small></span>
                <span className={f.tier} data-tier={p.tier}>{p.tier === "rare" ? "◆ " : ""}{p.tierLabel}</span>
              </div>
              <p className={f.pWhy}>{p.why}</p>
              <div className={f.pFoot}>
                <span className={f.medals}>{p.medals.map((m) => <Medallion key={m} id={m} size={30} />)}</span>
                <span className={f.price}><b>{p.credits}</b> cr.</span>
                <span className={f.keep} data-on={kept} data-cursor={`keep-${i}`}>{kept ? "✓ Gardé" : "Garder"}</span>
              </div>
            </article>
          ) : <div key={p.name} className={f.pcardGhost} />;
        })}
      </div>
      <footer className={f.payBar} data-in={keptCount > 0}>
        <span>{keptCount} profil{keptCount > 1 ? "s" : ""} gardé{keptCount > 1 ? "s" : ""} · <b>{keptCredits} crédits</b> <small>soit {(keptCredits * 10).toLocaleString("fr-FR")} € HT</small></span>
        <span className={f.btnInk} data-cursor="pay" data-pressed={paid}>{paid ? "Payé ✓" : "Confirmer"}</span>
      </footer>
    </div>
  );
}

// ── 3. Date ────────────────────────────────────────────────────
const DAYS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."];
const SLOTS = [
  { day: 1, from: 14, label: "14 h" },
  { day: 3, from: 10, label: "10 h" },
  { day: 4, from: 17.5, label: "17 h 30" },
];
const H0 = 9;
const H1 = 19;

function DateScene({ t }: { t: number }) {
  const chosen = at(t, 2.2);
  const done = [
    { at: 3.0, text: "Salle de visio privée créée" },
    { at: 3.4, text: "Invitation envoyée à Camille" },
    { at: 3.8, text: "Rappels la veille et une heure avant" },
  ];
  return (
    <div className={f.date}>
      <Pane title="Camille propose trois créneaux" aside={<span className={f.muted}>Choisissez, c&apos;est confirmé</span>} className={f.calendar}>
        <div className={f.week}>
          <div className={f.hours}>{[10, 12, 14, 16, 18].map((h) => <span key={h} style={{ top: `${((h - H0) / (H1 - H0)) * 100}%` }}>{h} h</span>)}</div>
          {DAYS.map((d, di) => (
            <div key={d} className={f.dayCol}>
              <span className={f.dayName}>{d}</span>
              <div className={f.dayBody}>
                {SLOTS.map((s, si) => s.day === di && at(t, 0.2 + si * 0.25) ? (
                  <span key={s.label} className={`${f.slot} ${f.pop}`} data-cursor={`slot-${si}`}
                    data-state={chosen ? (si === 1 ? "chosen" : "gone") : "open"}
                    style={{ top: `${((s.from - H0) / (H1 - H0)) * 100}%` }}>
                    <b><span className={f.slotDay}>{DAYS[s.day]} </span>{s.label}</b><small>{si === 1 && chosen ? "Confirmé" : "Proposé par Camille"}</small>
                  </span>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      </Pane>
      <Pane title={chosen ? "Entretien confirmé" : "En attente de votre choix"} className={f.confirm}
        aside={chosen ? <span className={f.ok}>Jeudi · 10 h · 45 min</span> : null}>
        <div className={f.invite} data-on={chosen}>
          <Hallmark level={3} size={78} initial="M" />
          <span><b>Invitation d&apos;une maison vérifiée</b><small>Camille voit votre poinçon, pas votre nom, jusqu&apos;au jour J.</small></span>
        </div>
        <ul className={f.checklist}>
          {done.map((d) => <li key={d.text} data-on={at(t, d.at)}><Check />{d.text}</li>)}
        </ul>
      </Pane>
    </div>
  );
}

// ── 4. Visio ───────────────────────────────────────────────────
const GUIDE = [
  { q: "Vos derniers achats de maroquinerie", done: 0 },
  { q: "Le cuir recyclé : frein ou argument ?", done: 6.6 },
  { q: "Combien de coloris ?", done: 10.2 },
  { q: "Le prix juste pour ce sac", done: 99 },
];

function CallScene({ t }: { t: number }) {
  const speaking = LINES.find((l) => t >= l.from && t <= l.to)?.who ?? null;
  const shown = LINES.filter((l) => t >= l.from).slice(-2);
  const secs = 31 + Math.floor(t);
  const clock = `00:${String(12 + Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  const current = GUIDE.findIndex((g) => t < g.done);
  return (
    <div className={f.call}>
      <div className={f.callMain}>
        <div className={f.tile} data-speaking={speaking === "camille"}>
          <Portrait who="camille" speaking={speaking === "camille"} />
          <span className={f.rec}><i />REC {clock}</span>
          <span className={f.tileName}><Bars on={speaking === "camille"} />Camille R. · Acheteuse luxe</span>
          <div className={f.captions}>
            {shown.map((l) => (
              <p key={l.text} className={f.pop}>
                <b>{l.who === "brand" ? "Vous" : "Camille"}</b>
                {t <= l.to ? typed(l.text, t, l.from, 30) : l.text}
              </p>
            ))}
          </div>
        </div>
        <div className={f.pip} data-speaking={speaking === "brand"}>
          <Portrait who="brand" speaking={speaking === "brand"} />
          <span className={f.pipName}><Bars on={speaking === "brand"} />Vous</span>
        </div>
        <div className={f.controls}>
          <span className={f.ctrl}><Icon d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M6 11a6 6 0 0 0 12 0 M12 17v4" /></span>
          <span className={f.ctrl}><Icon d="M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3" /></span>
          <span className={f.ctrl}><Icon d="M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3" /></span>
          <span className={`${f.ctrl} ${f.hang}`}><Icon d="M3 14c5-5 13-5 18 0l-2.5 2.5-3-2v-2.5c-2.3-.8-4.7-.8-7 0v2.5l-3 2z" /></span>
        </div>
      </div>
      <aside className={f.guide}>
        <b className={f.guideTitle}>Votre guide</b>
        <ol>
          {GUIDE.map((g, i) => (
            <li key={g.q} data-state={t >= g.done ? "done" : i === current ? "now" : "next"}>
              <span className={f.gDot}>{t >= g.done ? "✓" : i + 1}</span>{g.q}
            </li>
          ))}
        </ol>
        <div className={f.person}>
          <b>Pourquoi Camille</b>
          <p>Trois à quatre sacs par an, la moitié en seconde main. Refuse de payer « l&apos;histoire » d&apos;un produit.</p>
          <span className={f.medalsRow}><Medallion id="verifie" size={26} /><Medallion id="linkedin" size={26} /><Medallion id="achat" size={26} /></span>
        </div>
      </aside>
    </div>
  );
}

function Bars({ on }: { on: boolean }) {
  return <span className={f.bars} data-on={on}><i /><i /><i /></span>;
}

// ── 5. Synthèse ────────────────────────────────────────────────
function SynthesisScene({ t }: { t: number }) {
  const p = prog(t, 1.4, 3.9);
  const ready = p >= 1;
  const insights = [
    { at: 4.8, n: "1", text: "« Recyclé » rassure l'acheteuse de seconde main, pas la cliente du neuf." },
    { at: 5.3, n: "2", text: "Cinq coloris diluent la collection : trois suffisent, le noir porte les ventes." },
    { at: 5.8, n: "3", text: "Le prix du neuf passe si la finition est irréprochable." },
  ];
  return (
    <div className={f.after}>
      <Pane title="Entretien avec Camille R." aside={<span className={f.muted}>Terminé · 44 min</span>} className={f.deliv}>
        <ul className={f.files}>
          <li data-on={at(t, 0.3)}><span className={f.fIcon}><Icon d="M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3" /></span><span><b>Vidéo de l&apos;entretien</b><small>MP4 · 44 min</small></span><span className={f.dl}>{at(t, 0.3) ? "Télécharger" : "…"}</span></li>
          <li data-on={at(t, 0.8)}><span className={f.fIcon}><Icon d="M6 3h9l3 3v15H6z M9 11h6 M9 14h6 M9 17h4" /></span><span><b>Transcription</b><small>6 820 mots · horodatée</small></span><span className={f.dl}>{at(t, 0.8) ? "Télécharger" : "…"}</span></li>
          <li data-on={ready}>
            <span className={f.fIcon}><Icon d="M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5" /></span>
            <span><b>Synthèse de l&apos;étude</b><small>{ready ? "6 entretiens sur 6 · prête" : at(t, 1.4) ? `Rédaction · ${Math.round(p * 100)} %` : "En attente des entretiens"}</small>
              <span className={f.meter}><i style={{ width: `${p * 100}%` }} /></span>
            </span>
            <span className={f.dl}>{ready ? "Ouvrir" : ""}</span>
          </li>
        </ul>
        <div className={f.moments}>
          <b>Extraits de la transcription</b>
          {[
            { at: 1.0, time: "12:36", text: "Je l'achète pour la pièce, pas pour le discours." },
            { at: 1.3, time: "12:41", text: "Trois coloris, pas cinq : le noir partira." },
            { at: 1.6, time: "31:08", text: "À ce prix, je veux voir la couture de près." },
          ].map((m) => <p key={m.time} data-on={at(t, m.at)}><time>{m.time}</time>« {m.text} »</p>)}
        </div>
      </Pane>
      <article className={f.doc} data-in={at(t, 4.1)} data-cursor="doc">
        <span className={f.docKicker}>Synthèse · Maroquinerie en cuir recyclé</span>
        <h4>Le recyclé se vend par la pièce, pas par le discours</h4>
        <ol className={f.insights}>
          {insights.map((i) => <li key={i.n} data-on={at(t, i.at)}><b>{i.n}</b>{i.text}</li>)}
        </ol>
        <blockquote className={f.verbatim} data-on={at(t, 6.4)}>
          « Je l&apos;achète pour la pièce, pas pour le discours. »<cite>Acheteuse luxe, 34 ans</cite>
        </blockquote>
        <div className={f.themes} data-on={at(t, 6.9)}>
          {[{ n: "Finition", v: 5 }, { n: "Prix", v: 4 }, { n: "Discours écologique", v: 2 }].map((x) => (
            <span key={x.n}><small>{x.n}</small><i style={{ width: at(t, 6.9) ? `${x.v * 20}%` : 0 }} /></span>
          ))}
        </div>
      </article>
    </div>
  );
}

// ── 6. Décision ────────────────────────────────────────────────
function DecisionScene({ t }: { t: number }) {
  const items = [
    { at: 0.4, stamp: 1.0, text: "Lancer en trois coloris : noir, cognac, sable", source: "5 entretiens sur 6", tone: "ok", label: "Décidé" },
    { at: 1.4, stamp: 2.0, text: "Ne pas écrire « recyclé » sur l'étiquette", source: "4 entretiens sur 6", tone: "ok", label: "Décidé" },
    { at: 2.4, stamp: 3.0, text: "Tester 420 € auprès de six clientes", source: "Question ouverte de la synthèse", tone: "next", label: "À tester" },
  ];
  return (
    <div className={f.decision}>
      <Pane title="Comité produit" aside={<span className={f.muted}>Lundi · 9 h</span>} className={f.board}>
        <ul className={f.decisions}>
          {items.map((d) => at(t, d.at) ? (
            <li key={d.text} className={f.pop}>
              <span><b>{d.text}</b><small>Source : {d.source}</small></span>
              {at(t, d.stamp) && <span className={f.stamp} data-tone={d.tone}>{d.label}</span>}
            </li>
          ) : <li key={d.text} className={f.decGhost} />)}
        </ul>
        <div className={f.tally} data-on={at(t, 3.6)}>
          <span><b>12 jours</b><small>du brief au comité</small></span>
          <span><b>6</b><small>entretiens</small></span>
          <span><b>3</b><small>décisions sourcées</small></span>
        </div>
      </Pane>
      <div className={f.quotes}>
        {[
          { at: 3.4, q: "Trois coloris, pas cinq : le noir partira.", who: "Acheteuse luxe, 34 ans" },
          { at: 3.9, q: "Si c'est écrit recyclé, je pense seconde main.", who: "Vendeuse en boutique, 8 ans" },
          { at: 4.4, q: "À 420 €, je veux voir la couture de près.", who: "Cliente avertie, 29 ans" },
        ].map((v) => (
          <blockquote key={v.q} className={f.qcard} data-on={at(t, v.at)}>« {v.q} »<cite>{v.who}</cite></blockquote>
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
