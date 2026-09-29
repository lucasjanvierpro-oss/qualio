"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n/detect";
import { requestDemo } from "@/app/actions/demo";
import LoupeMascot, { type LoupeMood } from "@/components/brand/LoupeMascot";
import { getReducedMotion, getReducedMotionServer, subscribeReducedMotion } from "./Film";
import { LANDING_COPY } from "./copy";
import x from "./extras.module.css";

// Les îlots ajoutés à la page d'accueil : la loupe qui accompagne la lecture,
// le bandeau d'annonce, les apparitions au défilement et le formulaire de démo.

// ── Apparitions au défilement ───────────────────────────────────
/**
 * Fait apparaître les éléments `selector` quand ils entrent à l'écran, dans
 * tous les navigateurs. Ceux qui arrivent ensemble se suivent de près.
 */
export function ScrollReveal({ selector }: { selector: string }) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const io = new IntersectionObserver((entries) => {
      let k = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.style.setProperty("--d", String(k++));
        el.dataset.shown = "1";
        io.unobserve(el);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [selector]);
  return null;
}

// ── Bandeau d'annonce ───────────────────────────────────────────
const ANNOUNCE_KEY = "rl-announce-langues";

export function Announce({ lang }: { lang: Lang }) {
  const c = LANDING_COPY[lang].announce;
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lu une fois, après le rendu serveur
    try { if (localStorage.getItem(ANNOUNCE_KEY) === "1") setHidden(true); } catch { /* stockage bloqué */ }
  }, []);
  if (hidden) return null;
  return (
    <div className={x.announce}>
      <a href="#langues"><span className={x.announceDot} aria-hidden="true" />{c.text} <b>{c.link} →</b></a>
      <button type="button" aria-label={c.close} onClick={() => { setHidden(true); try { localStorage.setItem(ANNOUNCE_KEY, "1"); } catch { /* rien */ } }}>×</button>
    </div>
  );
}

// ── La loupe ────────────────────────────────────────────────────
// Elle descend le long de la page au rythme du défilement, penche quand on va
// vite, regarde dans le sens de la lecture et dit un mot en arrivant sur
// chaque section. Un clic mène à la section suivante. Grand écran seulement :
// sur téléphone, elle couvrirait le texte.

const SECTIONS = ["comment", "profils", "livrable", "avec", "tarifs", "confidentialite", "langues", "participer", "demo", "questions"];
// Son humeur selon la section : elle cherche sur les profils, s'émerveille
// devant les prix, se gratte la tête devant les questions.
const MOODS: Record<string, LoupeMood> = { profils: "search", tarifs: "wow", demo: "wow", questions: "puzzled" };

export function Loupe({ lang }: { lang: Lang }) {
  const c = LANDING_COPY[lang];
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const ref = useRef<HTMLDivElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const [say, setSay] = useState<{ id: string; n: number } | null>(null);
  const [away, setAway] = useState(false);
  // Un saut par changement de section (pas quand la bulle s'efface).
  const [hop, setHop] = useState(0);
  const current = useRef<string>("top");
  const count = useRef(0);

  // Une seule boucle suit le défilement. La section en cours est celle dont le
  // haut a passé la ligne de lecture (42 % de l'écran) : pas d'entre-deux, on
  // est toujours dans une section et une seule. La loupe se place par paliers,
  // un palier par section, et dérive à peine à l'intérieur de la section : elle
  // saute d'une section à l'autre au lieu de glisser sans repère.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let y = -1;
    let lastScroll = window.scrollY;
    let look = 0;
    const els = SECTIONS.map((id) => document.getElementById(id));
    const fin = document.getElementById("fin");

    const locate = () => {
      const line = window.innerHeight * 0.42;
      let idx = -1;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      }
      let within = 0.5;
      if (idx >= 0) {
        const r = els[idx]!.getBoundingClientRect();
        within = Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height)));
      }
      return { idx, within };
    };

    const step = () => {
      const { idx, within } = locate();
      const id = idx < 0 ? "top" : SECTIONS[idx];
      if (id !== current.current) {
        current.current = id;
        setSay({ id, n: ++count.current });
        setHop((h) => h + 1);
      }
      setAway(!!fin && fin.getBoundingClientRect().top < window.innerHeight * 0.75);

      const top = 96;
      const bottom = window.innerHeight - 140;
      const slot = (idx + 1) / SECTIONS.length;
      const t = top + slot * (bottom - top) + (within - 0.5) * 18;
      if (y < 0) y = t;
      const dy = t - y;
      y += dy * 0.14;
      const tilt = Math.max(-22, Math.min(22, dy * 0.3));
      const el = ref.current;
      if (el) el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
      const sc = window.scrollY;
      look += ((Math.sign(sc - lastScroll) * 2.2) - look) * 0.15;
      lastScroll = sc;
      if (eyes.current) eyes.current.style.transform = `translate(-1.2px, ${look.toFixed(2)}px)`;
      raf = Math.abs(dy) > 0.2 || Math.abs(look) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    kick();
    // Bonjour, si l'on est encore en haut de page.
    const hello = setTimeout(() => { if (current.current === "top") setSay({ id: "top", n: ++count.current }); }, 1600);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      clearTimeout(hello);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // La bulle s'efface d'elle-même ; survoler la loupe la fait reparler.
  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay((s) => (s?.n === say.n ? null : s)), 4500);
    return () => clearTimeout(t);
  }, [say]);
  const repeat = () => { if (!say) setSay({ id: current.current, n: ++count.current }); };

  // La section suivante se cherche d'après la position réelle de la page,
  // pas d'après la dernière bulle : on a pu remonter entre-temps.
  function next() {
    const y = window.scrollY + 120;
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top + window.scrollY > y) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (reduced) return null;
  const line = say ? c.loupe[say.id] : null;

  return (
    <div className={x.loupe} ref={ref} data-away={away}>
      {line && <p key={`say-${say!.n}`} className={x.bubble} role="status">{line}</p>}
      <button type="button" className={x.lens} onClick={next} onMouseEnter={repeat} onFocus={repeat} aria-label={c.loupeAria} key={`lens-${hop}`}>
        <LoupeMascot size={58} eyesRef={eyes} mood={say ? MOODS[say.id] ?? "happy" : "happy"} />
      </button>
    </div>
  );
}

// ── Formulaire de démo ──────────────────────────────────────────
export function DemoForm({ lang }: { lang: Lang }) {
  const f = LANDING_COPY[lang].demo.form;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    if (!get("firstName") || !get("email") || !get("company")) { setMsg(f.required); return; }
    setState("sending");
    setMsg(null);
    const r = await requestDemo({
      firstName: get("firstName"), lastName: get("lastName"), email: get("email"), company: get("company"),
      role: get("role"), topic: get("topic"), timing: get("timing"), website: get("website"), lang,
    }).catch(() => ({ error: "network" }));
    if ("error" in r) { setState("error"); setMsg(f.error); return; }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className={x.formCard} data-sent="true">
        <span className={x.sentIcon} aria-hidden="true">✓</span>
        <p className={x.sentText} role="status">{f.sent}</p>
      </div>
    );
  }

  return (
    <form className={x.formCard} onSubmit={submit} noValidate>
      <div className={x.row2}>
        <label>{f.first}<input name="firstName" autoComplete="given-name" required maxLength={80} /></label>
        <label>{f.last}<input name="lastName" autoComplete="family-name" maxLength={80} /></label>
      </div>
      <label>{f.email}<input name="email" type="email" autoComplete="email" required maxLength={160} /></label>
      <div className={x.row2}>
        <label>{f.company}<input name="company" autoComplete="organization" required maxLength={120} /></label>
        <label>{f.role}<input name="role" autoComplete="organization-title" maxLength={120} /></label>
      </div>
      <label>{f.topic}<textarea name="topic" rows={2} maxLength={600} /></label>
      <fieldset className={x.when}>
        <legend>{f.when}</legend>
        {f.whenOpts.map((o, i) => (
          <label key={o}><input type="radio" name="timing" value={o} defaultChecked={i === 0} /><span>{o}</span></label>
        ))}
      </fieldset>
      {/* Champ piège : invisible pour les personnes, rempli par les robots. */}
      <input className={x.trap} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" className={x.submit} disabled={state === "sending"}>{state === "sending" ? f.sending : f.submit} <span aria-hidden="true">→</span></button>
      {msg && <p className={x.formMsg} role="alert">{msg}</p>}
      <p className={x.consent}>{f.consent}</p>
    </form>
  );
}
