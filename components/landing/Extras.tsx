"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n/detect";
import { requestDemo } from "@/app/actions/demo";
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

export function Loupe({ lang }: { lang: Lang }) {
  const c = LANDING_COPY[lang];
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);
  const ref = useRef<HTMLDivElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const [say, setSay] = useState<{ id: string; n: number } | null>(null);
  const [away, setAway] = useState(false);
  const current = useRef<string>("top");

  // Position et inclinaison, avec un léger ressort.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let y = -1;
    let lastScroll = window.scrollY;
    let look = 0;
    const target = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const top = 96;
      const bottom = window.innerHeight - 140;
      return top + p * (bottom - top);
    };
    const step = () => {
      const t = target();
      if (y < 0) y = t;
      const dy = t - y;
      y += dy * 0.12;
      const tilt = Math.max(-22, Math.min(22, dy * 0.35));
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
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Un mot en arrivant sur chaque section.
  useEffect(() => {
    if (reduced) return;
    let n = 0;
    const hello = setTimeout(() => { if (current.current === "top") setSay({ id: "top", n: ++n }); }, 1800);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = e.target.id;
        if (id === "fin") { setAway(true); continue; }
        if (id === current.current) continue;
        current.current = id;
        setAway(false);
        setSay({ id, n: ++n });
      }
      if (entries.some((e) => e.target.id === "fin" && !e.isIntersecting)) setAway(false);
    }, { rootMargin: "-38% 0px -52% 0px" });
    for (const id of [...SECTIONS, "fin"]) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => { clearTimeout(hello); io.disconnect(); };
  }, [reduced]);

  // La bulle s'efface d'elle-même.
  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay((s) => (s?.n === say.n ? null : s)), 3800);
    return () => clearTimeout(t);
  }, [say]);

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
      <button type="button" className={x.lens} onClick={next} aria-label={c.loupeAria} key={`lens-${say?.n ?? 0}`}>
        <svg viewBox="0 0 64 64" width="58" height="58" aria-hidden="true">
          <defs>
            <radialGradient id="rl-glass" cx=".36" cy=".3" r=".85"><stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#f1ebff" /><stop offset="1" stopColor="#d6c8ff" /></radialGradient>
            <linearGradient id="rl-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a585ff" /><stop offset="1" stopColor="#4b2bb5" /></linearGradient>
            <clipPath id="rl-lens"><circle cx="26" cy="26" r="16.5" /></clipPath>
          </defs>
          <rect x="37.5" y="38" width="9.5" height="24" rx="4.75" transform="rotate(-45 42 50)" fill="#1c1624" />
          <rect x="39.5" y="38.5" width="5.5" height="6" rx="2" transform="rotate(-45 42 50)" fill="#6a43db" />
          <circle cx="26" cy="26" r="20.5" fill="url(#rl-rim)" />
          <circle cx="26" cy="26" r="16.5" fill="url(#rl-glass)" />
          <g clipPath="url(#rl-lens)">
            <g ref={eyes}>
              <g className={x.eyes}>
                <ellipse cx="20.5" cy="25.5" rx="2.6" ry="3.4" fill="#1c1624" />
                <ellipse cx="31.5" cy="25.5" rx="2.6" ry="3.4" fill="#1c1624" />
                <circle cx="21.3" cy="24.4" r=".9" fill="#fff" />
                <circle cx="32.3" cy="24.4" r=".9" fill="#fff" />
              </g>
            </g>
            <circle cx="16.5" cy="31" r="2.4" fill="#ff9dc4" opacity=".55" />
            <circle cx="35.5" cy="31" r="2.4" fill="#ff9dc4" opacity=".55" />
            <path d="M22 32.5q4 3.4 8 0" fill="none" stroke="#1c1624" strokeWidth="1.7" strokeLinecap="round" />
            <rect className={x.glint} x="2" y="-10" width="7" height="80" fill="#fff" opacity=".75" />
          </g>
          <ellipse cx="18.5" cy="16.5" rx="5" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-32 18.5 16.5)" />
        </svg>
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
