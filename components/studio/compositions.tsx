"use client";

import Image from "next/image";
import LoupeMascot from "@/components/brand/LoupeMascot";
import Medallion from "@/components/badges/Medallion";
import { FilmWindow } from "@/components/landing/Film";
import { Flag } from "@/components/landing/Flags";
import type { BadgeId } from "@/lib/participants/badges";
import { backOut, clamp01, easeInOut, easeOut, pop, rise, seg, typed } from "./clock";
import s from "./studio.module.css";

// Les formats du studio. Chacun est une fonction du temps t (en secondes) :
// rien ne bouge tout seul, sauf les petites boucles de la loupe. C'est ce qui
// permet de filmer image par image une vidéo parfaitement fluide.

import { REGISTRY, type Lang } from "./registry";

type Render = (t: number, lang: Lang) => React.ReactNode;

function Brand({ x = 28, y = 30, light = false, story = false }: { x?: number; y?: number; light?: boolean; story?: boolean }) {
  // En story, le haut de l'écran est recouvert par Instagram et TikTok : le
  // logo se place en bas, au-dessus de la zone des légendes.
  const pos: React.CSSProperties = story ? { left: 0, right: 0, top: 792, justifyContent: "center" } : { left: x, top: y };
  return (
    <div className={s.brand} style={{ ...pos, color: light ? "#fff" : "var(--ink)" }}>
      {/* Sur fond sombre, le logo passe en blanc : l'aubergine y disparaîtrait. */}
      <Image src="/brand/logo.png" alt="" width={26} height={26} style={light ? { filter: "brightness(0) invert(1)" } : undefined} />Rarelyst
    </div>
  );
}

function Cta({ t, at, title, sub, url = "rarelyst.co", light = false }: { t: number; at: number; title: string; sub?: string; url?: string; light?: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", justifyItems: "center", gap: 18, padding: 40, textAlign: "center", pointerEvents: "none" }}>
      <div style={pop(t, at)}><LoupeMascot size={110} mood="wow" /></div>
      <h2 className={s.h2} style={{ ...rise(t, at + 0.2), color: light ? "#fff" : undefined, maxWidth: 440 }}>{title}</h2>
      {sub && <p className={s.lead} style={{ ...rise(t, at + 0.35), color: light ? "rgba(255,255,255,.75)" : undefined, maxWidth: 400 }}>{sub}</p>}
      <div className={`${s.btn} ${s.btnAccent}`} style={pop(t, at + 0.55)}>{url} →</div>
    </div>
  );
}

/** Masque tout ce qui précède l'appel à l'action. */
const fadeBefore = (t: number, at: number): React.CSSProperties => ({ opacity: 1 - seg(t, at - 0.35, at) });

// ── 1. Pour les marques : Rarelyst en 16 secondes ─────────────────────
const M = {
  fr: {
    q1: "Qui voulez-vous", q2: "entendre ?", usual: "Ce qu'on vous livre d'habitude",
    boxes: ["Femme", "25–35 ans", "CSP+", "Île-de-France"], here: "Nous, une personne.",
    rows: [
      { i: "C", c: "#c98e68", n: "Camille R.", r: "Acheteuse luxe · Paris", tag: "◆ Initiée", holo: false },
      { i: "I", c: "#8a6bd8", n: "Inès B.", r: "Vendeuse en boutique de luxe · 8 ans", tag: "◆ Rare", holo: false },
      { i: "J", c: "#5d8f7a", n: "Jules M.", r: "Collectionneur d'archives Margiela", tag: "✦ Introuvable", holo: true },
    ],
    film: "Vous menez l'entretien. Le reste se fait seul.", deliv: ["Vidéo", "Transcription", "Synthèse"],
    delivTitle: "Et une synthèse qui répond à vos questions.",
    cta: "Qui voulez-vous entendre ?", ctaSub: "Vos premiers profils vérifiés en quelques jours.",
  },
  en: {
    q1: "Who do you want", q2: "to hear from?", usual: "What you usually get",
    boxes: ["Woman", "25–35", "Upper-middle class", "Paris region"], here: "We give you a person.",
    rows: [
      { i: "C", c: "#c98e68", n: "Camille R.", r: "Luxury shopper · Paris", tag: "◆ Insider", holo: false },
      { i: "I", c: "#8a6bd8", n: "Inès B.", r: "Luxury boutique associate · 8 yrs", tag: "◆ Rare", holo: false },
      { i: "J", c: "#5d8f7a", n: "Jules M.", r: "Margiela archive collector", tag: "✦ Unfindable", holo: true },
    ],
    film: "You run the interview. The rest happens on its own.", deliv: ["Video", "Transcript", "Synthesis"],
    delivTitle: "And a synthesis that answers your questions.",
    cta: "Who do you want to hear from?", ctaSub: "Your first verified profiles within days.",
  },
};

function Marques(t: number, lang: Lang) {
  const c = M[lang];
  const q = `${c.q1} ${c.q2}`;
  const shown = typed(q, t, 0.3, 20);
  const head = 1 - easeInOut(seg(t, 2.4, 3.0));
  const medals: BadgeId[][] = [["verifie", "linkedin"], ["verifie", "emploi"], ["verifie", "portfolio"]];
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 14)}>
        {/* Accroche tapée */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 150 + head * 130, transform: `scale(${0.62 + 0.38 * head})`, transformOrigin: "left top", opacity: 1 - seg(t, 8.3, 8.7) }}>
          <h1 className={s.h1} style={{ fontSize: 64 }}>
            {shown.slice(0, c.q1.length)}
            {shown.length > c.q1.length && <><br /><span className={s.grad}>{shown.slice(c.q1.length + 1)}</span></>}
            {t < 2.4 && <i className={s.caret} />}
          </h1>
        </div>
        <div style={{ position: "absolute", right: 30, top: 560, ...pop(t, 0.8), opacity: (1 - seg(t, 2.6, 3)) * clamp01((t - 0.8) * 3) }}>
          <LoupeMascot size={150} mood="search" />
        </div>

        {/* Les cases habituelles, barrées */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 330, ...rise(t, 2.8), opacity: seg(t, 2.8, 3.2) * (1 - seg(t, 5.0, 5.4)) }}>
          <p className={s.kicker} style={{ color: "var(--ink-3)" }}>{c.usual}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {c.boxes.map((b, i) => (
              <span key={b} className={`${s.chip} ${s.chipDash}`} style={{ position: "relative", ...pop(t, 3.0 + i * 0.15) }}>
                {b}<i className={s.strike} style={{ transform: `scaleX(${easeOut(seg(t, 3.9 + i * 0.12, 4.3 + i * 0.12))})` }} />
              </span>
            ))}
          </div>
        </div>

        {/* Des personnes, prouvées */}
        <div style={{ position: "absolute", left: 30, right: 30, top: 300, opacity: seg(t, 5.2, 5.5) * (1 - seg(t, 8.5, 8.9)) }}>
          <h2 className={s.h2} style={rise(t, 5.2)}><span className={s.grad}>{c.here}</span></h2>
          <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
            {c.rows.map((r, i) => (
              <div key={r.n} className={s.row} style={rise(t, 5.7 + i * 0.35, 0.5, 40)}>
                <span className={s.av} style={{ background: r.c }}>{r.i}</span>
                <span><span className={s.rowName}>{r.n}</span><br /><span className={s.rowRole}>{r.r}</span>
                  <span style={{ display: "flex", gap: 3, marginTop: 6 }}>{medals[i].map((m, k) => <span key={m} style={pop(t, 6.4 + i * 0.35 + k * 0.12)}><Medallion id={m} size={26} /></span>)}</span>
                </span>
                <span className={`${s.tag} ${r.holo ? s.chipHolo : ""}`} style={{ background: r.holo ? undefined : "var(--accent-soft)", color: "var(--g2)" }}>{r.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Le film : la visio */}
        <div style={{ position: "absolute", left: 26, right: 26, top: 190, opacity: seg(t, 8.7, 9.0) * (1 - seg(t, 11.3, 11.6)) }}>
          <h2 className={s.h2} style={{ ...rise(t, 8.7), marginBottom: 26, fontSize: 36 }}>{c.film}</h2>
          <div style={rise(t, 8.9, 0.6, 30)}>
            <div style={{ width: 880, transform: "scale(0.556)", transformOrigin: "left top" }}>
              <FilmWindow lang={lang} sceneIndex={3} t={2 + (t - 8.9) * 1.6} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: -150 }}>
            {(lang === "en" ? ["Recorded", "Transcribed live", "Your guide on screen"] : ["Enregistré", "Transcrit en direct", "Votre guide à l'écran"]).map((x, i) => (
              <span key={x} className={s.chip} style={{ ...pop(t, 9.5 + i * 0.25), fontSize: 15 }}><span className={s.check} style={{ width: 22, height: 22, fontSize: 12 }}>✓</span>{x}</span>
            ))}
          </div>
        </div>

        {/* Le livrable */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 330, opacity: seg(t, 11.6, 11.9) }}>
          <h2 className={s.h2} style={rise(t, 11.6)}>{c.delivTitle}</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            {c.deliv.map((d, i) => <span key={d} className={s.chip} style={{ ...pop(t, 12.0 + i * 0.3), fontSize: 20, padding: "12px 18px" }}><span className={s.check}>✓</span>{d}</span>)}
          </div>
        </div>
      </div>
      <Cta t={t} at={14} title={c.cta} sub={c.ctaSub} />
    </div>
  );
}

// ── 2. Pour les participants : votre œil vaut quelque chose ───────────
const P = {
  fr: {
    who: ["Styliste ?", "Vendeuse en boutique ?", "Collectionneur ?"], title1: "Votre œil", title2: "vaut quelque chose.",
    paySub: "par entretien de 45 min, payé par la marque", proof: "Plus votre profil est prouvé, mieux vous êtes payé.",
    cert: "Profil certifié à 85 %", solde: "Solde disponible", retirer: "Retirer", sent: "C'est parti : arrivée sous 1 à 3 jours",
    cta: "Rejoignez le panel", ctaSub: "Les marques de mode et de luxe paient pour votre regard.",
  },
  en: {
    who: ["Stylist?", "Boutique associate?", "Collector?"], title1: "Your eye", title2: "is worth something.",
    paySub: "per 45-min interview, paid by the brand", proof: "The more proven your profile, the better you're paid.",
    cert: "Profile 85% certified", solde: "Available balance", retirer: "Withdraw", sent: "On its way: arrives in 1 to 3 days",
    cta: "Join the panel", ctaSub: "Fashion and luxury brands pay for your perspective.",
  },
};

function Participants(t: number, lang: Lang) {
  const c = P[lang];
  const pay = Math.round(90 + (350 - 90) * easeOut(seg(t, 4.2, 5.6)));
  const pressed = t > 10.6;
  const medals: BadgeId[] = ["verifie", "linkedin", "emploi", "cv", "portfolio"];
  return (
    <div className={`${s.frame} ${s.bgInk}`} style={{ width: 540, height: 960 }}>
      <Brand light story />
      <div style={fadeBefore(t, 12)}>
        {c.who.map((w, i) => (
          <h1 key={w} className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 400, fontSize: 60, ...rise(t, i * 0.95, 0.4, 30, i * 0.95 + 0.75) }}>{w}</h1>
        ))}
        <div style={{ position: "absolute", left: 36, right: 36, top: 290, opacity: seg(t, 3.0, 3.3) * (1 - seg(t, 5.9, 6.2)) }}>
          <h1 className={s.h1} style={rise(t, 3.0)}>{c.title1}<br /><span className={s.gradGold}>{c.title2}</span></h1>
          <div style={{ marginTop: 44, ...rise(t, 3.8) }}>
            <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>90 – {pay} €</div>
            <p style={{ margin: "10px 0 0", fontSize: 18, color: "rgba(255,255,255,.72)" }}>{c.paySub}</p>
          </div>
        </div>
        <div style={{ position: "absolute", left: 36, right: 36, top: 320, opacity: seg(t, 6.2, 6.5) * (1 - seg(t, 8.9, 9.2)) }}>
          <h2 className={s.h2} style={{ ...rise(t, 6.2), color: "#fff" }}>{c.proof}</h2>
          <div style={{ display: "flex", gap: 6, marginTop: 34 }}>
            {medals.map((m, i) => <span key={m} style={pop(t, 6.8 + i * 0.22)}><Medallion id={m} size={82} /></span>)}
          </div>
          <div style={{ marginTop: 28, ...rise(t, 8.0) }}>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,.75)" }}>{c.cert}</div>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.15)", marginTop: 10, overflow: "hidden" }}>
              <i style={{ display: "block", height: "100%", width: `${85 * easeOut(seg(t, 8.0, 8.8))}%`, borderRadius: 999, background: "linear-gradient(90deg, #c9b8ff, #f2c46d)" }} />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 360, opacity: seg(t, 9.2, 9.5) }}>
          <div className={s.card} style={{ padding: 26, color: "var(--ink)", ...rise(t, 9.2, 0.5, 40) }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{c.solde}</div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", marginTop: 6 }}>180 €</div>
            <div className={s.btn} style={{ width: "100%", marginTop: 18, transform: `scale(${t > 10.4 && t < 10.7 ? 0.96 : 1})`, background: pressed ? "#1f7a4d" : "var(--ink)" }}>
              {pressed ? (lang === "en" ? "✓ Sent" : "✓ Virement envoyé") : `${c.retirer} 180 €`}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--ok)", fontWeight: 600, ...rise(t, 10.8) }}>{c.sent}</p>
          </div>
        </div>
      </div>
      <Cta t={t} at={12} title={c.cta} sub={c.ctaSub} light />
    </div>
  );
}

// ── 3. Parrainage ─────────────────────────────────────────────────────
function Parrainage(t: number) {
  const total = t < 4.5 ? Math.round(50 * easeOut(seg(t, 2.2, 3.4))) : 50 + 30 * Math.min(9, Math.floor(seg(t, 4.7, 7.2) * 9.99));
  const filled = t < 4.7 ? (t > 3.4 ? 1 : 0) : 1 + Math.min(9, Math.floor(seg(t, 4.7, 7.2) * 9.99));
  const tilt = 12 * (1 - easeOut(seg(t, 0.4, 1.4)));
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 8.2)}>
        <p className={s.kicker} style={{ position: "absolute", left: 36, top: 130, ...rise(t, 0.1) }}>Parrainage</p>
        <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 160, ...rise(t, 0.2) }}>Invitez les profils rares que vous connaissez.</h1>
        <div className={s.ticket} style={{ position: "absolute", left: 60, right: 60, top: 390, transform: `rotate(${-6 + tilt}deg) translateY(${(1 - easeOut(seg(t, 0.4, 1.4))) * 120}px)`, opacity: seg(t, 0.4, 0.8) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em" }}><span>INVITATION</span><span>RARELYST</span></div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.02em", marginTop: 22 }}>CAMILLE-7F96</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Pour vous<br /><span style={{ fontSize: 30 }}>{total} €</span></span>
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>Pour votre ami<br /><span style={{ fontSize: 22 }}>+20 €</span></span>
          </div>
        </div>
        <div style={{ position: "absolute", left: 36, right: 36, top: 680, ...rise(t, 2.2) }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {t < 4.5 ? "50 € dès son premier entretien" : "+30 € à chacun des suivants, jusqu'à 10"}
          </p>
          <div className={s.dots} style={{ marginTop: 16 }}>
            {Array.from({ length: 10 }, (_, i) => <i key={i} data-on={i < filled} style={{ width: 30, height: 30, background: i < filled ? "linear-gradient(140deg,#fff3cf,#f2c46d)" : undefined, boxShadow: i < filled ? "0 0 0 2px #e9b54c" : undefined }} />)}
          </div>
        </div>
      </div>
      <Cta t={t} at={8.2} title="Jusqu'à 320 € par ami" sub="Seulement quand votre ami fait de vrais entretiens." />
    </div>
  );
}

// ── 4. Le genre de profil que nous trouvons ───────────────────────────
function ProfilRare(t: number) {
  const scanX = 40 + 300 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * seg(t, 1.6, 4.6)));
  const medals: BadgeId[] = ["verifie", "linkedin", "emploi", "portfolio"];
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 8.6)}>
        <p className={s.kicker} style={{ position: "absolute", left: 36, top: 120, ...rise(t, 0.1) }}>Le genre de profil que nous trouvons</p>
        <h2 className={s.h2} style={{ position: "absolute", left: 36, right: 36, top: 148, ...rise(t, 0.25) }}>Introuvable ailleurs. <span className={s.grad}>Vérifié ici.</span></h2>
        <div className={s.cardInk} style={{ position: "absolute", left: 30, right: 30, top: 300, padding: 24, ...rise(t, 0.9, 0.6, 50) }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className={s.av} style={{ width: 64, height: 64, fontSize: 26, background: "linear-gradient(140deg,#8c68f2,#4b2bb5)" }}>J</span>
            <span><div style={{ fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>Jules M.</div><div style={{ fontSize: 15, color: "#b9aecb" }}>Collectionneur d&apos;archives Margiela · Anvers</div></span>
          </div>
          <span className={`${s.tag} ${s.chipHolo}`} style={{ display: "inline-block", marginTop: 16, color: "#1b1128", ...pop(t, 1.6) }}>✦ Introuvable</span>
          <div style={{ display: "flex", gap: 6, marginTop: 18 }}>{medals.map((m, i) => <span key={m} style={pop(t, 4.7 + i * 0.2)}><Medallion id={m} size={56} /></span>)}</div>
          <div style={{ marginTop: 16, fontSize: 15, color: "#e8e4ff", ...rise(t, 5.6) }}>Certifié à 92 % · 14 ans de collection · 300 pièces documentées</div>
          <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,.08)", fontSize: 18, lineHeight: 1.4, color: "#fff", ...rise(t, 6.6) }}>
            « Une pièce d&apos;archive se lit à l&apos;envers : ce sont les coutures qui disent tout. »
          </div>
          <div style={{ position: "absolute", left: scanX, top: 70, opacity: seg(t, 1.4, 1.7) * (1 - seg(t, 4.6, 5.0)), transform: `rotate(${Math.sin(t * 3) * 8}deg)` }}>
            <LoupeMascot size={96} mood="search" />
          </div>
        </div>
      </div>
      <Cta t={t} at={8.6} title="Des profils comme lui, pour vos études." sub="Profil d'exemple. Chaque vrai profil est vérifié à la main." />
    </div>
  );
}

// ── 5. La loupe se présente ───────────────────────────────────────────
function LoupeSePresente(t: number) {
  const lines = [
    { at: 0.5, out: 3.0, text: "Salut ! Moi, c'est la loupe de Rarelyst." },
    { at: 3.2, out: 6.2, text: "Je trouve les personnes que les panels ne trouvent pas." },
    { at: 6.4, out: 9.2, text: "Et je vérifie tout. À la loupe." },
  ];
  const chips = ["Styliste", "Acheteuse luxe", "Collectionneur", "Vendeuse en boutique", "Directrice artistique", "Revendeuse"];
  const mood = t > 6.4 ? "wow" : t > 3.2 ? "search" : "happy";
  const bob = Math.sin(t * 2.2) * 8;
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 9.6)}>
        <div style={{ position: "absolute", left: "50%", top: 470, transform: `translate(-50%, ${bob}px)`, ...{ opacity: seg(t, 0, 0.4) } }}>
          <LoupeMascot size={220} mood={mood as "wow" | "search" | "happy"} look={{ x: t > 3.2 && t < 6.2 ? Math.sin(t * 1.5) * 2.4 : 0, y: t > 6.4 ? -1.5 : 0 }} />
        </div>
        {lines.map((l) => (
          <div key={l.text} className={s.bubble} style={{ position: "absolute", left: 40, right: 60, top: 250, ...rise(t, l.at, 0.45, 20, l.out) }}>{l.text}</div>
        ))}
        {chips.map((ch, i) => {
          const a = (i / chips.length) * Math.PI * 2 + t * 0.6;
          return (
            <span key={ch} className={`${s.chip} ${i % 3 === 2 ? s.chipHolo : s.chipRare}`}
              style={{ position: "absolute", left: 270 + Math.cos(a) * 190 - 70, top: 580 + Math.sin(a) * 150, opacity: seg(t, 3.6 + i * 0.12, 4.0 + i * 0.12) * (1 - seg(t, 6.2, 6.6)), fontSize: 14 }}>
              {ch}
            </span>
          );
        })}
        {(["verifie", "linkedin", "emploi"] as BadgeId[]).map((m, i) => (
          <span key={m} style={{ position: "absolute", left: 110 + i * 120, top: 780, ...pop(t, 6.8 + i * 0.2), opacity: seg(t, 6.8 + i * 0.2, 7.0 + i * 0.2) }}><Medallion id={m} size={80} /></span>
        ))}
      </div>
      <Cta t={t} at={9.6} title="Qui voulez-vous entendre ?" sub="Rarelyst trouve et vérifie les profils rares pour vos études." />
    </div>
  );
}

// ── 6. Avant, après ───────────────────────────────────────────────────
function AvantApres(t: number) {
  const rows = [
    ["Trouver les profils", "Des semaines de relances", "Premiers profils en quelques jours"],
    ["Savoir qu'ils sont réels", "Sur parole", "Identité, emploi, LinkedIn vérifiés"],
    ["Organiser", "E-mails, agendas, liens", "Tout part seul"],
    ["Après l'entretien", "Des heures à retranscrire", "Vidéo, transcription, synthèse"],
    ["Payer", "Recrutement facturé d'avance", "Seulement les profils gardés"],
  ];
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 8.4)}>
        <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 120, fontSize: 52, ...rise(t, 0.1) }}><span className={s.grad}>Moins de relances.</span><br />Plus de réponses.</h1>
        <div style={{ position: "absolute", left: 24, right: 24, top: 300, display: "grid", gap: 12 }}>
          {rows.map(([k, no, yes], i) => {
            const at = 1.0 + i * 1.3;
            const flip = seg(t, at + 0.55, at + 0.85);
            return (
              <div key={k} className={s.card} style={{ padding: "14px 16px", ...rise(t, at, 0.4, 30) }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                <div style={{ position: "relative", height: 34, marginTop: 6 }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "var(--ink-3)", opacity: 1 - flip, transform: `translateY(${-flip * 14}px)` }}><span className={s.cross}>✕</span><span style={{ textDecoration: "line-through" }}>{no}</span></div>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, opacity: flip, transform: `translateY(${(1 - flip) * 14}px)` }}><span className={s.check} style={{ transform: `scale(${0.6 + 0.4 * backOut(flip)})` }}>✓</span>{yes}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Cta t={t} at={8.4} title="Essayez sur une étude pilote." sub="Vous ne payez que les profils que vous gardez." />
    </div>
  );
}

// ── 7. La synthèse qui s'écrit ────────────────────────────────────────
function Synthese(t: number) {
  const answers = [
    { at: 1.4, q: "Trois ou cinq coloris ?", a: "Trois. Le noir porte les ventes ; le reste finirait soldé.", n: 5, conf: "Confiance forte" },
    { at: 4.0, q: "Écrire « recyclé » sur l'étiquette ?", a: "Pas en premier : le mot rassure la seconde main, pas la cliente du neuf.", n: 4, conf: "Confiance moyenne" },
  ];
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 960 }}>
      <Brand story />
      <div style={fadeBefore(t, 7.6)}>
        <h2 className={s.h2} style={{ position: "absolute", left: 36, right: 36, top: 120, ...rise(t, 0.1) }}>Des réponses,<br /><span className={s.grad}>pas un compte rendu.</span></h2>
        <div className={s.card} style={{ position: "absolute", left: 26, right: 26, top: 290, padding: 22, ...rise(t, 0.6, 0.5, 40) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Synthèse · Maroquinerie en cuir recyclé</div>
          {answers.map((x) => (
            <div key={x.q} style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)", ...rise(t, x.at, 0.4, 20) }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{x.q}</div>
              <div style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 6, minHeight: 44 }}>{typed(x.a, t, x.at + 0.3, 40)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <span className={s.dots}>{Array.from({ length: 6 }, (_, k) => <i key={k} data-on={k < Math.floor(x.n * seg(t, x.at + 1.2, x.at + 1.8))} />)}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ok)", opacity: seg(t, x.at + 1.8, x.at + 2.1) }}>{x.n} entretiens sur 6 · {x.conf}</span>
              </div>
            </div>
          ))}
          <blockquote style={{ margin: "18px 0 0", padding: "12px 14px", borderRadius: 12, background: "var(--accent-soft)", fontSize: 17, fontWeight: 600, ...rise(t, 6.4) }}>
            « Si c&apos;est écrit recyclé, je pense seconde main. »<cite style={{ display: "block", fontStyle: "normal", fontWeight: 400, fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>Vendeuse en boutique, 8 ans</cite>
          </blockquote>
        </div>
      </div>
      <Cta t={t} at={7.6} title="Arrivez en comité avec des preuves." sub="Chaque citation est retrouvée dans les entretiens." />
    </div>
  );
}

// ── Visuels fixes ─────────────────────────────────────────────────────
function PostVersus() {
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand />
      <h2 className={s.h2} style={{ marginTop: 70, fontSize: 38 }}><span className={s.grad}>Un panel vous donne une tranche d&apos;âge.</span> Nous, une personne.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 14, marginTop: 30 }}>
        <div style={{ padding: 16, borderRadius: 18, background: "#f1eef5" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>D&apos;habitude</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{["Femme", "25–35 ans", "CSP+", "Île-de-France"].map((b) => <span key={b} className={`${s.chip} ${s.chipDash}`} style={{ fontSize: 13, padding: "6px 10px" }}>{b}</span>)}</div>
        </div>
        <div className={s.card} style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Chez Rarelyst</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <span className={s.av} style={{ background: "#c98e68", width: 40, height: 40, fontSize: 17 }}>C</span>
            <span><b style={{ fontSize: 15 }}>Camille R.</b><br /><span style={{ fontSize: 12, color: "var(--ink-2)" }}>Styliste indépendante · 30 ans</span></span>
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 10 }}>{(["verifie", "linkedin", "emploi", "cv"] as BadgeId[]).map((m) => <Medallion key={m} id={m} size={30} />)}</div>
          <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.4, color: "var(--ink-2)" }}>Ancienne assistante styliste dans une maison parisienne. Achète peu, après avoir essayé.</p>
        </div>
      </div>
      <div className={s.url} style={{ position: "absolute", left: 36, bottom: 30 }}>rarelyst.co</div>
      <div style={{ position: "absolute", right: 24, bottom: 16 }}><LoupeMascot size={84} animated={false} /></div>
    </div>
  );
}

function PostIntrouvables() {
  const lanes: [string, string][] = [["Collectionneur d'archives Margiela", "holo"], ["Vendeuse en boutique de luxe", "rare"], ["Acheteuse de grand magasin", "rare"], ["Directrice artistique", "rare"], ["Revendeuse sneakers", ""], ["Styliste indépendante", ""], ["Cliente très importante", "holo"], ["Chineuse de seconde main", ""], ["Visual merchandiser", "rare"], ["Parfumeur indépendant", "holo"]];
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand />
      <h2 className={s.h2} style={{ marginTop: 70 }}>Les profils que <span className={s.grad}>les panels ne trouvent pas.</span></h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 28 }}>
        {lanes.map(([l, k]) => <span key={l} className={`${s.chip} ${k === "holo" ? s.chipHolo : k === "rare" ? s.chipRare : ""}`} style={{ fontSize: 15 }}>{l}</span>)}
      </div>
      <p className={s.lead} style={{ position: "absolute", left: 36, right: 140, bottom: 34, fontSize: 16 }}>Vérifiés à la main. Pour vos études qualitatives. <b style={{ color: "var(--ink)" }}>rarelyst.co</b></p>
      <div style={{ position: "absolute", right: 24, bottom: 16 }}><LoupeMascot size={96} mood="search" animated={false} /></div>
    </div>
  );
}

function PostRemuneration() {
  return (
    <div className={`${s.frame} ${s.bgInk}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand light />
      <h2 className={s.h2} style={{ marginTop: 80, color: "#fff" }}>Votre œil <span className={s.gradGold}>vaut quelque chose.</span></h2>
      <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.05em", marginTop: 30, lineHeight: 1 }}>90 – 350 €</div>
      <p style={{ margin: "10px 0 0", fontSize: 17, color: "rgba(255,255,255,.75)" }}>par entretien de 45 min · payé par la marque · retrait dès 50 €</p>
      <div style={{ display: "flex", gap: 6, marginTop: 30 }}>{(["verifie", "linkedin", "emploi", "cv", "portfolio"] as BadgeId[]).map((m) => <Medallion key={m} id={m} size={62} />)}</div>
      <div className={`${s.btn} ${s.btnAccent}`} style={{ position: "absolute", left: 36, bottom: 36 }}>Rejoindre le panel · rarelyst.co</div>
    </div>
  );
}

function PostParrainage() {
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand />
      <h2 className={s.h2} style={{ marginTop: 74 }}>Parrainez un ami,<br /><span className={s.grad}>gagnez jusqu&apos;à 320 €.</span></h2>
      <div className={s.ticket} style={{ marginTop: 34, transform: "rotate(-4deg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em" }}><span>INVITATION</span><span>RARELYST</span></div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 16 }}>50 € + 30 € × 9</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>50 € à son premier entretien, puis 30 € aux suivants. 20 € offerts à votre ami.</div>
      </div>
      <div className={s.url} style={{ position: "absolute", left: 36, bottom: 30 }}>rarelyst.co</div>
      <div style={{ position: "absolute", right: 24, bottom: 16 }}><LoupeMascot size={88} mood="wow" animated={false} /></div>
    </div>
  );
}

function StoryCitation() {
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 960, padding: 40 }}>
      <Brand story />
      <p className={s.kicker} style={{ marginTop: 200 }}>Ce que vos clientes pensent vraiment</p>
      <div style={{ fontSize: 120, lineHeight: 0.6, color: "var(--accent-dim)", marginTop: 30, fontWeight: 700 }}>«</div>
      <h1 className={s.h1} style={{ fontSize: 50, marginTop: 10 }}>Si c&apos;est écrit recyclé, je pense <span className={s.grad}>seconde main.</span></h1>
      <p className={s.lead} style={{ marginTop: 24 }}>Vendeuse en boutique de luxe, 8 ans de métier<br /><span style={{ fontSize: 14, color: "var(--ink-3)" }}>Extrait d&apos;exemple</span></p>
      <div className={s.card} style={{ position: "absolute", left: 40, right: 40, bottom: 200, padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
        <LoupeMascot size={64} animated={false} />
        <span style={{ fontSize: 16, lineHeight: 1.4 }}>Des entretiens avec les bonnes personnes, et une synthèse qui répond à vos questions. <b>rarelyst.co</b></span>
      </div>
    </div>
  );
}

function StoryLangues() {
  const flags = ["fr", "gb", "it", "es", "de", "cn", "jp", "kr", "ae"] as const;
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 960, padding: 40 }}>
      <Brand story />
      <p className={s.kicker} style={{ marginTop: 180 }}>Nouveau</p>
      <h1 className={s.h1} style={{ marginTop: 12 }}>Les entretiens en anglais <span className={s.grad}>sont ouverts.</span></h1>
      <p className={s.lead} style={{ marginTop: 20 }}>Français et anglais aujourd&apos;hui. Les autres langues arrivent, une à une.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 40 }}>
        {flags.map((f, i) => (
          <div key={f} className={s.card} style={{ padding: "16px 8px", display: "grid", justifyItems: "center", gap: 6, opacity: i < 2 ? 1 : 0.55 }}>
            <Flag code={f} size={44} />
            <span style={{ fontSize: 12, fontWeight: 700, color: i < 2 ? "var(--ok)" : "var(--ink-3)" }}>{i < 2 ? "● Disponible" : "Bientôt"}</span>
          </div>
        ))}
      </div>
      <div className={s.url} style={{ position: "absolute", left: 40, bottom: 210 }}>rarelyst.co</div>
    </div>
  );
}

function BanniereLinkedIn() {
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 792, height: 198 }}>
      {/* LinkedIn pose la photo de profil en bas à gauche : le texte reste à droite. */}
      <div style={{ position: "absolute", left: 250, right: 150, top: 44 }}>
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.05 }}>Les profils que <span className={s.grad}>les panels ne trouvent pas.</span></div>
        <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10 }}>Recrutement pour études qualitatives · mode, luxe, beauté · <b style={{ color: "var(--ink)" }}>rarelyst.co</b></div>
      </div>
      <div style={{ position: "absolute", right: 34, top: 36 }}><LoupeMascot size={120} animated={false} /></div>
    </div>
  );
}

function Avatar() {
  return (
    <div className={s.frame} style={{ width: 200, height: 200, display: "grid", placeItems: "center", background: "radial-gradient(80% 80% at 30% 20%, #ffffff, #efe6ff 55%, #e0d2ff)" }}>
      <div style={{ transform: "translate(6px, 6px)" }}><LoupeMascot size={150} animated={false} /></div>
    </div>
  );
}

function CarreLogo() {
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 540, display: "grid", placeContent: "center", justifyItems: "center", gap: 14, textAlign: "center" }}>
      <Image src="/brand/logo.png" alt="" width={120} height={120} />
      <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: "-0.05em" }}>Rarelyst</div>
      <div style={{ fontSize: 18, color: "var(--ink-2)" }}>Les profils que les panels ne trouvent pas.</div>
    </div>
  );
}

// ── Carrousels LinkedIn (une image par diapositive, assemblées en PDF) ──
function Slide({ n, total, light = false, bg = s.bgLight, last = false, children }: { n: number; total: number; light?: boolean; bg?: string; last?: boolean; children: React.ReactNode }) {
  const dim = light ? "rgba(255,255,255,.6)" : "var(--ink-3)";
  return (
    <div className={`${s.frame} ${bg}`} style={{ width: 540, height: 675, padding: "92px 36px 0", color: light ? "#fff" : undefined }}>
      <Brand light={light} />
      <div style={{ position: "absolute", right: 30, top: 34, fontSize: 14, fontWeight: 700, color: dim }}>{n} / {total}</div>
      {children}
      <div className={s.url} style={{ position: "absolute", left: 36, bottom: 28, fontSize: 17, color: dim }}>rarelyst.co</div>
      {!last && <div style={{ position: "absolute", right: 30, bottom: 22, width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, color: "#fff", background: "linear-gradient(140deg, var(--g3), var(--g2))" }}>→</div>}
    </div>
  );
}

function Step({ n, children, light = false }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: light ? "#c9b8ff" : "var(--accent)" }}>{n}</div>
      <h2 className={s.h2} style={{ marginTop: 8, fontSize: 36, color: light ? "#fff" : undefined }}>{children}</h2>
    </>
  );
}

const Note = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={s.lead} style={{ position: "absolute", left: 36, right: 90, bottom: 68, fontSize: 16, color: light ? "rgba(255,255,255,.72)" : undefined }}>{children}</p>
);

const CM = {
  fr: {
    kicker: "Études qualitatives", c1: "Interrogez-vous", c2: "les bonnes personnes ?", cSub: "5 règles pour recruter des profils qui font vraiment avancer une décision.", swipe: "Glissez",
    r1: "Décrivez une personne, pas une cible.", usual: "Ce qu'on écrit d'habitude", boxes: ["Femme", "25–35 ans", "CSP+"], better: "Ce qu'il faut écrire",
    brief: "Une vendeuse en boutique de luxe qui conseille chaque semaine des clientes venues d'Asie.",
    r2: "Allez chercher ceux qui ne répondent jamais aux panels.",
    lanes: [["Vendeuse en boutique de luxe", "rare"], ["Acheteuse de grand magasin", "rare"], ["Collectionneur d'archives", "holo"], ["Styliste indépendante", ""], ["Retoucheuse d'atelier", "rare"], ["Cliente très importante", "holo"], ["Revendeur de seconde main", ""]],
    r2Note: "Ces personnes ne remplissent pas de questionnaires en ligne. On les trouve une par une.",
    r3: "Vérifiez avant l'entretien, pas pendant.", role: "Acheteuse luxe · 11 ans · Paris",
    proofs: ["Identité vérifiée", "LinkedIn relié", "Emploi confirmé", "CV relu"], r3Note: "Chaque preuve devient une médaille, visible sur le profil avant de le garder.",
    r4: "Posez les questions qui tranchent.",
    qs: ["Entre ces deux sacs, lequel achèteriez-vous demain ? Pourquoi ?", "Racontez la dernière fois que vous avez hésité en boutique.", "Qu'est-ce qui vous ferait passer chez un concurrent ?"],
    r4Note: "Des choix, des scènes vécues, des concurrents. Pas « que pensez-vous de… ».",
    r5: "Exigez une synthèse qui répond à vos décisions.", decisionL: "Votre décision", decision: "Lancer la ligne en cuir recyclé à 690 € ?",
    answerL: "La réponse", answer: "Oui, mais sans le mot « recyclé » en vitrine : 5 personnes sur 8 y entendent « seconde main ».",
    conf: "Confiance élevée · 8 entretiens", quote: "« Si c'est écrit recyclé, je pense seconde main. »", verified: "Citation vérifiée dans la transcription",
    e1: "Rarelyst fait", e2: "tout ça pour vous.", points: ["Des profils vérifiés, proposés en quelques jours", "Vous ne payez que ceux que vous gardez", "Vidéo, transcription et synthèse livrées"], eCta: "Réserver une démo · rarelyst.co",
  },
  en: {
    kicker: "Qualitative research", c1: "Are you talking", c2: "to the right people?", cSub: "5 rules for recruiting profiles that actually move a decision forward.", swipe: "Swipe",
    r1: "Describe a person, not a target.", usual: "What people usually write", boxes: ["Woman", "25–35", "Upper-middle class"], better: "What to write instead",
    brief: "A luxury boutique associate who advises Asian clients every week.",
    r2: "Find the people who never answer panels.",
    lanes: [["Luxury boutique associate", "rare"], ["Department store buyer", "rare"], ["Archive collector", "holo"], ["Freelance stylist", ""], ["Atelier seamstress", "rare"], ["Top-tier client", "holo"], ["Resale dealer", ""]],
    r2Note: "These people don't fill in online surveys. We find them one by one.",
    r3: "Verify before the interview, not during it.", role: "Luxury buyer · 11 yrs · Paris",
    proofs: ["Identity verified", "LinkedIn linked", "Job confirmed", "CV reviewed"], r3Note: "Every proof becomes a medal, visible on the profile before you keep it.",
    r4: "Ask the questions that settle things.",
    qs: ["Between these two bags, which would you buy tomorrow? Why?", "Tell me about the last time you hesitated in store.", "What would make you switch to a competitor?"],
    r4Note: "Choices, real moments, competitors. Not “what do you think of…”.",
    r5: "Demand a synthesis that answers your decisions.", decisionL: "Your decision", decision: "Launch the recycled leather line at €690?",
    answerL: "The answer", answer: "Yes, but without the word “recycled” in the window: 5 people out of 8 hear “second-hand”.",
    conf: "High confidence · 8 interviews", quote: "“If it says recycled, I think second-hand.”", verified: "Quote checked against the transcript",
    e1: "Rarelyst does", e2: "all of this for you.", points: ["Verified profiles, suggested within days", "You only pay for the ones you keep", "Video, transcript and synthesis delivered"], eCta: "Book a demo · rarelyst.co",
  },
};

function CarrouselMarques({ i, lang }: { i: number; lang: Lang }) {
  const c = CM[lang];
  const N = 7;
  const medals: BadgeId[] = ["verifie", "linkedin", "emploi", "cv"];
  if (i === 1) return (
    <Slide n={1} total={N} bg={s.bgLilac}>
      <p className={s.kicker}>{c.kicker}</p>
      <h1 className={s.h1} style={{ marginTop: 14, fontSize: 60 }}>{c.c1}<br /><span className={s.grad}>{c.c2}</span></h1>
      <p className={s.lead} style={{ marginTop: 22, maxWidth: 340 }}>{c.cSub}</p>
      <div style={{ position: "absolute", right: 30, bottom: 90 }}><LoupeMascot size={150} mood="search" animated={false} /></div>
      <div style={{ position: "absolute", left: 36, bottom: 80, fontSize: 17, fontWeight: 700, color: "var(--accent)" }}>{c.swipe} →</div>
    </Slide>
  );
  if (i === 2) return (
    <Slide n={2} total={N}>
      <Step n="1">{c.r1}</Step>
      <p className={s.kicker} style={{ marginTop: 30, color: "var(--ink-3)" }}>{c.usual}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {c.boxes.map((b) => <span key={b} className={`${s.chip} ${s.chipDash}`} style={{ position: "relative", fontSize: 15 }}>{b}<i className={s.strike} /></span>)}
      </div>
      <p className={s.kicker} style={{ marginTop: 26 }}>{c.better}</p>
      <div className={s.bubble} style={{ marginTop: 12, fontSize: 22 }}>{c.brief}</div>
    </Slide>
  );
  if (i === 3) return (
    <Slide n={3} total={N} bg={s.bgLilac}>
      <Step n="2">{c.r2}</Step>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 26 }}>
        {c.lanes.map(([l, k]) => <span key={l} className={`${s.chip} ${k === "holo" ? s.chipHolo : k === "rare" ? s.chipRare : ""}`} style={{ fontSize: 15 }}>{l}</span>)}
      </div>
      <Note>{c.r2Note}</Note>
    </Slide>
  );
  if (i === 4) return (
    <Slide n={4} total={N}>
      <Step n="3">{c.r3}</Step>
      <div className={s.card} style={{ marginTop: 26, padding: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className={s.av} style={{ background: "#c98e68" }}>C</span>
          <span><span className={s.rowName}>Camille R.</span><br /><span className={s.rowRole}>{c.role}</span></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginTop: 16 }}>
          {medals.map((m, k) => <span key={m} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 600 }}><Medallion id={m} size={34} />{c.proofs[k]}</span>)}
        </div>
      </div>
      <Note>{c.r3Note}</Note>
    </Slide>
  );
  if (i === 5) return (
    <Slide n={5} total={N} bg={s.bgLilac}>
      <Step n="4">{c.r4}</Step>
      <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
        {c.qs.map((q, k) => <div key={q} className={s.card} style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "baseline", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3 }}><span style={{ color: "var(--accent)" }}>{k + 1}.</span>{q}</div>)}
      </div>
      <Note>{c.r4Note}</Note>
    </Slide>
  );
  if (i === 6) return (
    <Slide n={6} total={N}>
      <Step n="5">{c.r5}</Step>
      <div className={s.card} style={{ marginTop: 22, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.decisionL}</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: "-0.02em" }}>{c.decision}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 14 }}>{c.answerL}</div>
        <div style={{ fontSize: 16, lineHeight: 1.4, marginTop: 4 }}>{c.answer}</div>
        <span className={s.tag} style={{ display: "inline-block", marginTop: 12, background: "var(--ok-soft)", color: "var(--ok)" }}>● {c.conf}</span>
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--soft)", fontSize: 15, fontWeight: 600 }}>{c.quote}
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ok)", marginTop: 6 }}>✓ {c.verified}</div>
        </div>
      </div>
    </Slide>
  );
  return (
    <Slide n={7} total={N} bg={s.bgInk} light last>
      <h1 className={s.h1} style={{ color: "#fff", fontSize: 54 }}>{c.e1}<br /><span className={s.gradGold}>{c.e2}</span></h1>
      <div style={{ display: "grid", gap: 14, marginTop: 34 }}>
        {c.points.map((p) => <span key={p} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 19, fontWeight: 600 }}><span className={s.check}>✓</span>{p}</span>)}
      </div>
      <div className={`${s.btn} ${s.btnAccent}`} style={{ position: "absolute", left: 36, bottom: 80 }}>{c.eCta}</div>
      <div style={{ position: "absolute", right: 26, bottom: 70 }}><LoupeMascot size={110} mood="wow" animated={false} /></div>
    </Slide>
  );
}

const CP = {
  fr: {
    kicker: "Mode, luxe, beauté", c1: "Votre métier", c2: "intéresse les marques.", cSub: "Comment être payé de 90 à 350 € pour un entretien de 45 minutes.", swipe: "Glissez",
    r1: "Créez votre profil en 5 minutes.", fields: [["Métier", "Vendeuse en boutique de luxe"], ["Expérience", "8 ans"], ["Univers", "Maroquinerie, joaillerie"], ["Langues", "Français, anglais"]],
    r1Note: "Pas besoin d'un CV parfait : c'est votre regard qui compte.",
    r2: "Prouvez-le, gagnez des médailles.", proofs: ["Identité", "LinkedIn", "Emploi", "CV", "Book"], r2Note: "Plus votre profil est prouvé, plus vous êtes invité, et mieux vous êtes payé.",
    r3: "Une marque vous invite. Vous choisissez.", inv: "Invitation", invBrand: "Maison de mode parisienne", invWhat: "Entretien en visio · 45 min", accept: "Accepter", later: "Pas cette fois",
    r3Note: "Vous choisissez votre créneau. L'entretien se fait depuis chez vous.",
    r4: "Retirez dès 50 €.", solde: "Solde disponible", sent: "✓ Virement envoyé", arrive: "Arrivée sous 1 à 3 jours ouvrés", r4Note: "Et jusqu'à 320 € par ami parrainé.",
    e1: "Rejoignez", e2: "le panel.", eSub: "Inscription gratuite. Vous n'êtes jamais obligé d'accepter une invitation.", eCta: "S'inscrire · rarelyst.co",
  },
  en: {
    kicker: "Fashion, luxury, beauty", c1: "Brands want", c2: "your expertise.", cSub: "How to get paid €90 to €350 for a 45-minute interview.", swipe: "Swipe",
    r1: "Create your profile in 5 minutes.", fields: [["Job", "Luxury boutique associate"], ["Experience", "8 years"], ["Field", "Leather goods, jewellery"], ["Languages", "French, English"]],
    r1Note: "No need for a perfect CV: your perspective is what matters.",
    r2: "Prove it, earn medals.", proofs: ["Identity", "LinkedIn", "Job", "CV", "Portfolio"], r2Note: "The more proven your profile, the more you're invited, and the better you're paid.",
    r3: "A brand invites you. You decide.", inv: "Invitation", invBrand: "Parisian fashion house", invWhat: "Video interview · 45 min", accept: "Accept", later: "Not this time",
    r3Note: "You pick the time slot. The interview happens from home.",
    r4: "Withdraw from €50.", solde: "Available balance", sent: "✓ Transfer sent", arrive: "Arrives in 1 to 3 business days", r4Note: "Plus up to €320 for every friend you refer.",
    e1: "Join", e2: "the panel.", eSub: "Free to join. You never have to accept an invitation.", eCta: "Sign up · rarelyst.co",
  },
};

function CarrouselParticipants({ i, lang }: { i: number; lang: Lang }) {
  const c = CP[lang];
  const N = 6;
  const eur = (n: number) => (lang === "en" ? `€${n}` : `${n} €`);
  const medals: BadgeId[] = ["verifie", "linkedin", "emploi", "cv", "portfolio"];
  if (i === 1) return (
    <Slide n={1} total={N} bg={s.bgInk} light>
      <p className={s.kicker} style={{ color: "#c9b8ff" }}>{c.kicker}</p>
      <h1 className={s.h1} style={{ marginTop: 14, fontSize: 60, color: "#fff" }}>{c.c1}<br /><span className={s.gradGold}>{c.c2}</span></h1>
      <p style={{ margin: "22px 0 0", fontSize: 18, lineHeight: 1.45, color: "rgba(255,255,255,.75)", maxWidth: 360 }}>{c.cSub}</p>
      <div style={{ position: "absolute", right: 30, bottom: 90 }}><LoupeMascot size={140} mood="happy" animated={false} /></div>
      <div style={{ position: "absolute", left: 36, bottom: 80, fontSize: 17, fontWeight: 700, color: "#c9b8ff" }}>{c.swipe} →</div>
    </Slide>
  );
  if (i === 2) return (
    <Slide n={2} total={N}>
      <Step n="1">{c.r1}</Step>
      <div className={s.card} style={{ marginTop: 26, padding: "6px 18px" }}>
        {c.fields.map(([k, v], j) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "13px 0", borderTop: j ? "1px solid var(--line)" : undefined, fontSize: 16 }}>
            <span style={{ color: "var(--ink-3)", fontWeight: 600 }}>{k}</span><b style={{ textAlign: "right" }}>{v}</b>
          </div>
        ))}
      </div>
      <Note>{c.r1Note}</Note>
    </Slide>
  );
  if (i === 3) return (
    <Slide n={3} total={N} bg={s.bgLilac}>
      <Step n="2">{c.r2}</Step>
      <div style={{ display: "flex", gap: 6, marginTop: 30 }}>
        {medals.map((m, k) => <span key={m} style={{ display: "grid", justifyItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}><Medallion id={m} size={80} />{c.proofs[k]}</span>)}
      </div>
      <Note>{c.r2Note}</Note>
    </Slide>
  );
  if (i === 4) return (
    <Slide n={4} total={N}>
      <Step n="3">{c.r3}</Step>
      <div className={s.card} style={{ marginTop: 24, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className={s.tag} style={{ background: "var(--accent-soft)", color: "var(--g2)" }}>{c.inv}</span>
          <b style={{ fontSize: 26, letterSpacing: "-0.03em" }}>{eur(180)}</b>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12, letterSpacing: "-0.02em" }}>{c.invBrand}</div>
        <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 4 }}>{c.invWhat}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 10, marginTop: 18 }}>
          <span className={`${s.btn} ${s.btnAccent}`} style={{ fontSize: 16, padding: "13px 16px" }}>{c.accept}</span>
          <span className={s.btn} style={{ fontSize: 16, padding: "13px 16px", background: "var(--soft)", color: "var(--ink-2)" }}>{c.later}</span>
        </div>
      </div>
      <Note>{c.r3Note}</Note>
    </Slide>
  );
  if (i === 5) return (
    <Slide n={5} total={N} bg={s.bgLilac}>
      <Step n="4">{c.r4}</Step>
      <div className={s.card} style={{ marginTop: 24, padding: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{c.solde}</div>
        <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.04em", marginTop: 4 }}>{eur(180)}</div>
        <div className={s.btn} style={{ width: "100%", marginTop: 14, background: "#1f7a4d" }}>{c.sent}</div>
        <p style={{ margin: "12px 0 0", fontSize: 15, color: "var(--ok)", fontWeight: 600 }}>{c.arrive}</p>
      </div>
      <Note>{c.r4Note}</Note>
    </Slide>
  );
  return (
    <Slide n={6} total={N} bg={s.bgInk} light last>
      <h1 className={s.h1} style={{ color: "#fff", fontSize: 64 }}>{c.e1}<br /><span className={s.gradGold}>{c.e2}</span></h1>
      <p style={{ margin: "22px 0 0", fontSize: 18, lineHeight: 1.45, color: "rgba(255,255,255,.75)", maxWidth: 330 }}>{c.eSub}</p>
      <div style={{ display: "flex", gap: 6, marginTop: 30 }}>{medals.map((m) => <Medallion key={m} id={m} size={52} />)}</div>
      <div className={`${s.btn} ${s.btnAccent}`} style={{ position: "absolute", left: 36, bottom: 80 }}>{c.eCta}</div>
      <div style={{ position: "absolute", right: 26, bottom: 70 }}><LoupeMascot size={110} mood="wow" animated={false} /></div>
    </Slide>
  );
}

// ── Posts supplémentaires ─────────────────────────────────────────────
const PG = {
  fr: { t1: "Vous ne payez que", t2: "les profils que vous gardez.", rows: ["Rien n'est débité avant d'avoir gardé un profil", "Participant absent : vos crédits sont rendus", "Profil qui ne convient pas : refusé sans frais"], foot: "Recrutement pour études qualitatives · mode, luxe, beauté" },
  en: { t1: "You only pay", t2: "for the profiles you keep.", rows: ["Nothing is charged until you keep a profile", "Participant no-show: your credits come back", "Profile not a fit: declined at no cost"], foot: "Recruitment for qualitative research · fashion, luxury, beauty" },
};

function PostGaranties({ lang }: { lang: Lang }) {
  const c = PG[lang];
  return (
    <div className={`${s.frame} ${s.bgLight}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand />
      <h2 className={s.h2} style={{ marginTop: 74 }}>{c.t1}<br /><span className={s.grad}>{c.t2}</span></h2>
      <div style={{ display: "grid", gap: 12, marginTop: 34 }}>
        {c.rows.map((r) => <div key={r} className={s.card} style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em" }}><span className={s.check}>✓</span>{r}</div>)}
      </div>
      <p className={s.lead} style={{ position: "absolute", left: 36, right: 150, bottom: 30, fontSize: 15 }}>{c.foot} · <b style={{ color: "var(--ink)" }}>rarelyst.co</b></p>
      <div style={{ position: "absolute", right: 24, bottom: 16 }}><LoupeMascot size={96} mood="happy" animated={false} /></div>
    </div>
  );
}

const PQ = {
  fr: { k: "Une question", t: "Si vous pouviez interroger n'importe qui pour votre prochaine collection, ce serait qui ?", a: ["Une retoucheuse de maison de couture", "Un revendeur de sneakers rares", "Une cliente qui a arrêté d'acheter chez nous"], foot: "Dites-le en commentaire. On vous dit si on sait la trouver." },
  en: { k: "A question", t: "If you could interview anyone for your next collection, who would it be?", a: ["A couture house seamstress", "A rare sneaker reseller", "A client who stopped buying from us"], foot: "Tell us in the comments. We'll tell you if we can find them." },
};

function PostQuestion({ lang }: { lang: Lang }) {
  const c = PQ[lang];
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 675, padding: 36 }}>
      <Brand />
      <p className={s.kicker} style={{ marginTop: 74 }}>{c.k}</p>
      <h2 className={s.h2} style={{ marginTop: 10, fontSize: 36 }}>{c.t}</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 28, justifyItems: "start" }}>
        {c.a.map((a, i) => <div key={a} className={s.bubble} style={{ fontSize: 18, marginLeft: i === 1 ? 40 : 0 }}>{a}</div>)}
      </div>
      <p className={s.lead} style={{ position: "absolute", left: 36, right: 150, bottom: 30, fontSize: 15 }}>{c.foot}</p>
      <div style={{ position: "absolute", right: 24, bottom: 16 }}><LoupeMascot size={100} mood="puzzled" animated={false} /></div>
    </div>
  );
}

// ── Bannières LinkedIn, version noire ─────────────────────────────────
// Inspirées des plateformes d'études les plus soignées (fond noir, trame de
// points, un seul accent de couleur) et centrées sur des profils très précis.
// LinkedIn pose la photo (ou le logo de la page) en bas à gauche : le texte
// commence à x = 232, rien d'important sous x < 200 dans la moitié basse.
const BNN = {
  fr: {
    c1: "Le casting de vos", c2: "études qualitatives.", cSub: "Des profils très précis, vérifiés un par un. Premiers profils sous 72 h.",
    cast: [["L", "#c98e68", "Styliste de stars", "Paris"], ["M", "#d7609e", "Micro-influenceuse", "Beauté · 40 k"], ["E", "#5b8def", "Early adopter", "Mode et tech"], ["Z", "#2fa36b", "Gen Z · 19 ans", "Revendeuse Vinted"], ["B", "#8a6bd8", "Maquilleuse", "Backstage défilés"], ["V", "#e0a43a", "Cliente VIC", "Maison de luxe"]],
    tk: "Qui voulez-vous entendre ?", t1: "Parlez aux gens", t2: "qu'aucun panel", t3: "ne touche.",
    ticker: ["Personal shopper", "Early adopter mode", "Styliste de stars", "Micro-influenceuse beauté", "Gen Z · 19 ans"],
    q1: "Qui voulez-vous", q2: "entendre ?", qSub: "Décrivez la personne. Nous la trouvons, la vérifions et organisons l'entretien.",
    brief: "Brief d'une marque", briefText: "Des stylistes qui habillent des célébrités pour les tapis rouges.", match: "profils correspondent", close: "Très proche",
    rows: [["L", "#c98e68", "Léa M.", "Styliste de célébrités · Paris"], ["H", "#8a6bd8", "Hugo T.", "Styliste clips et plateaux TV"]],
    p1: "Des profils", p2: "très précis.", pSub: "Vérifiés un par un, pour vos études qualitatives · mode, luxe, beauté",
    chips: [["Styliste de stars", "holo"], ["Micro-influenceuse · 40 k", ""], ["Early adopter", ""], ["Gen Z · 19 ans", ""], ["Cliente VIC", "holo"], ["Maquilleuse backstage", ""], ["Personal shopper", ""], ["Collectionneur de sneakers", ""], ["Revendeuse Vinted", ""]],
    tagline: "Les profils que les panels ne trouvent pas.", sectors: "Mode · Luxe · Beauté",
  },
  en: {
    c1: "Casting for your", c2: "qualitative research.", cSub: "Very specific profiles, verified one by one. First profiles within 72 h.",
    cast: [["L", "#c98e68", "Celebrity stylist", "Paris"], ["M", "#d7609e", "Micro-influencer", "Beauty · 40k"], ["E", "#5b8def", "Early adopter", "Fashion and tech"], ["Z", "#2fa36b", "Gen Z · 19", "Vinted reseller"], ["B", "#8a6bd8", "Makeup artist", "Runway backstage"], ["V", "#e0a43a", "VIC client", "Luxury house"]],
    tk: "Who do you want to hear from?", t1: "Talk to the people", t2: "no panel", t3: "can reach.",
    ticker: ["Personal shopper", "Fashion early adopter", "Celebrity stylist", "Beauty micro-influencer", "Gen Z · 19"],
    q1: "Who do you want", q2: "to hear from?", qSub: "Describe the person. We find them, verify them and set up the interview.",
    brief: "A brand's brief", briefText: "Stylists who dress celebrities for the red carpet.", match: "matching profiles", close: "Very close",
    rows: [["L", "#c98e68", "Léa M.", "Celebrity stylist · Paris"], ["H", "#8a6bd8", "Hugo T.", "Music video and TV stylist"]],
    p1: "Very specific", p2: "profiles.", pSub: "Verified one by one, for your qualitative research · fashion, luxury, beauty",
    chips: [["Celebrity stylist", "holo"], ["Micro-influencer · 40k", ""], ["Early adopter", ""], ["Gen Z · 19", ""], ["VIC client", "holo"], ["Backstage makeup artist", ""], ["Personal shopper", ""], ["Sneaker collector", ""], ["Vinted reseller", ""]],
    tagline: "The profiles panels can't find.", sectors: "Fashion · Luxury · Beauty",
  },
};

const NIGHT_TEXT: React.CSSProperties = { background: "linear-gradient(100deg, #b9a2ff 0%, #d9a6f5 45%, #f5a3cb 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const glass: React.CSSProperties = { background: "rgba(255,255,255,.045)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)" };

/** Fond noir : lueur violette discrète et trame de points qui s'efface vers la gauche. */
// Page entreprise LinkedIn : couverture de 1128×191, que LinkedIn recadre sur
// les côtés sur mobile, avec le logo de la page en bas à gauche. Le contenu du
// format 792×198 y est recentré, sans le petit logo (la page l'affiche déjà).
const COVER = { w: 1128, h: 191, dx: 58, dy: -4 };

function Night({ children, glowAt = "88% 0%", brand = true, cover = false }: { children: React.ReactNode; glowAt?: string; brand?: boolean; cover?: boolean }) {
  return (
    <div className={s.frame} style={{ width: cover ? COVER.w : 792, height: cover ? COVER.h : 198, color: "#f4f1f8", background: `radial-gradient(55% 130% at ${glowAt}, rgba(106,67,219,.34), transparent 70%), radial-gradient(35% 90% at 100% 100%, rgba(215,96,158,.16), transparent 70%), #0a090d` }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.13) 0.8px, transparent 1.1px)", backgroundSize: "12px 12px", WebkitMaskImage: "linear-gradient(90deg, transparent 20%, #000 75%)", maskImage: "linear-gradient(90deg, transparent 20%, #000 75%)" }} />
      {cover ? (
        <div style={{ position: "absolute", left: COVER.dx, top: COVER.dy, width: 792, height: 198 }}>{children}</div>
      ) : (
        <>{brand && <Brand x={24} y={20} light />}{children}</>
      )}
    </div>
  );
}

function BanniereNoirCasting({ lang, cover = false }: { lang: Lang; cover?: boolean }) {
  const c = BNN[lang];
  return (
    <Night cover={cover}>
      <h2 className={s.h2} style={{ position: "absolute", left: 232, top: 38, fontSize: 31, lineHeight: 1.02, color: "#fff" }}>{c.c1}<br /><span style={NIGHT_TEXT}>{c.c2}</span></h2>
      <p style={{ position: "absolute", left: 232, top: 122, width: 225, margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "rgba(244,241,248,.62)" }}>{c.cSub}</p>
      <div style={{ position: "absolute", left: 478, top: 20, display: "grid", gridTemplateColumns: "150px 150px", gap: 7 }}>
        {c.cast.map(([i, col, role, detail], k) => (
          <div key={role} style={{ ...glass, display: "flex", alignItems: "center", gap: 7, height: 46, padding: "0 9px", borderRadius: 12, boxShadow: k === 0 ? "inset 0 0 0 1px rgba(185,162,255,.6), 0 0 24px -6px rgba(140,104,242,.6)" : glass.boxShadow }}>
            <span className={s.av} style={{ width: 26, height: 26, borderRadius: "50%", fontSize: 11, flexShrink: 0, background: `linear-gradient(140deg, ${col}, #1b1128)` }}>{i}</span>
            <span style={{ lineHeight: 1.2, minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 11, whiteSpace: "nowrap" }}>{role}</b>
              <span style={{ fontSize: 10, color: "rgba(244,241,248,.55)", whiteSpace: "nowrap" }}>✓ {detail}</span>
            </span>
          </div>
        ))}
      </div>
    </Night>
  );
}

function BanniereNoirTicker({ lang, cover = false }: { lang: Lang; cover?: boolean }) {
  const c = BNN[lang];
  return (
    <Night glowAt="75% 50%" cover={cover}>
      <p style={{ position: "absolute", left: 232, top: 30, margin: 0, fontSize: 12, fontWeight: 700, color: "#b9a2ff" }}>{c.tk}</p>
      <h2 className={s.h2} style={{ position: "absolute", left: 232, top: 50, fontSize: 30, lineHeight: 1.02, color: "#fff" }}>{c.t1}<br />{c.t2}<br /><span style={NIGHT_TEXT}>{c.t3}</span></h2>
      <div style={{ position: "absolute", left: 520, right: 0, top: 0, bottom: 0, WebkitMaskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)" }}>
        {c.ticker.map((r, k) => (
          <div key={r} style={{ position: "absolute", left: k === 2 ? 0 : 22, top: 14 + k * 36, fontSize: k === 2 ? 25 : 19, fontWeight: 600, letterSpacing: "-0.035em", whiteSpace: "nowrap", color: k === 2 ? undefined : "rgba(244,241,248,.28)", ...(k === 2 ? NIGHT_TEXT : {}) }}>{k === 2 ? `✦ ${r}` : r}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 448, top: 86, transform: "rotate(-12deg)" }}><LoupeMascot size={56} mood="search" animated={false} /></div>
    </Night>
  );
}

function BanniereNoirBrief({ lang, cover = false }: { lang: Lang; cover?: boolean }) {
  const c = BNN[lang];
  return (
    <Night cover={cover}>
      <h2 className={s.h2} style={{ position: "absolute", left: 232, top: 34, fontSize: 36, lineHeight: 1, color: "#fff" }}>{c.q1}<br /><span style={NIGHT_TEXT}>{c.q2}</span></h2>
      <p style={{ position: "absolute", left: 232, top: 124, width: 235, margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "rgba(244,241,248,.62)" }}>{c.qSub}</p>
      <div style={{ ...glass, position: "absolute", left: 494, right: 20, top: 18, bottom: 18, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12), 0 30px 60px -30px rgba(0,0,0,.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 600, color: "rgba(244,241,248,.5)" }}><span>{c.brief}</span><span><b style={{ color: "#fff" }}>2</b> {c.match}</span></div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: 6, color: "#fff" }}>{c.briefText}<i className={s.caret} style={{ background: "#b9a2ff", width: 3 }} /></div>
        <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
          {c.rows.map(([i, col, n, r]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 10, background: "rgba(255,255,255,.06)" }}>
              <span className={s.av} style={{ width: 26, height: 26, borderRadius: "50%", fontSize: 11, background: `linear-gradient(140deg, ${col}, #1b1128)` }}>{i}</span>
              <span style={{ fontSize: 11.5, lineHeight: 1.2, flex: 1, color: "#fff" }}><b>{n}</b><br /><span style={{ fontSize: 10.5, color: "rgba(244,241,248,.55)" }}>{r}</span></span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999, color: "#8fe0b4", background: "rgba(47,163,107,.16)" }}>{c.close}</span>
            </div>
          ))}
        </div>
      </div>
    </Night>
  );
}

function BanniereNoirProfils({ lang, cover = false }: { lang: Lang; cover?: boolean }) {
  const c = BNN[lang];
  return (
    <Night glowAt="70% 20%" cover={cover}>
      <h2 className={s.h2} style={{ position: "absolute", left: 232, top: 34, fontSize: 36, lineHeight: 1, color: "#fff" }}>{c.p1}<br /><span style={NIGHT_TEXT}>{c.p2}</span></h2>
      <p style={{ position: "absolute", left: 232, top: 124, width: 215, margin: 0, fontSize: 12, lineHeight: 1.45, color: "rgba(244,241,248,.62)" }}>{c.pSub}</p>
      <div style={{ position: "absolute", left: 462, right: 18, top: 22, display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-end" }}>
        {c.chips.map(([l, k]) => (
          <span key={l} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", ...(k === "holo"
            ? { color: "#1b1128", background: "linear-gradient(110deg, #f1e2ff, #d9ccff 35%, #cdeeff 60%, #ffdcef)", boxShadow: "0 0 22px -6px rgba(185,162,255,.7)" }
            : glass) }}>{k === "holo" ? `✦ ${l}` : l}</span>
        ))}
      </div>
    </Night>
  );
}

function BanniereNoirLogo({ lang, cover = false }: { lang: Lang; cover?: boolean }) {
  const c = BNN[lang];
  return (
    <Night glowAt="85% 50%" brand={false} cover={cover}>
      <div style={{ position: "absolute", left: 232, top: 40, display: "flex", alignItems: "center", gap: 14 }}>
        <Image src="/brand/logo.png" alt="" width={56} height={56} style={{ filter: "brightness(0) invert(1)" }} />
        <span style={{ fontSize: 60, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1, color: "#fff" }}>Rarelyst</span>
      </div>
      <div style={{ position: "absolute", left: 234, top: 116, width: 300, height: 1, background: "linear-gradient(90deg, rgba(185,162,255,.7), transparent)" }} />
      <p style={{ position: "absolute", left: 234, top: 126, margin: 0, fontSize: 14, color: "rgba(244,241,248,.72)" }}>{c.tagline}</p>
      <p style={{ position: "absolute", left: 234, top: 150, margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b9a2ff" }}>{c.sectors}</p>
      <div style={{ position: "absolute", right: 40, top: 40, transform: "rotate(-10deg)", filter: "drop-shadow(0 0 30px rgba(140,104,242,.55))" }}><LoupeMascot size={116} animated={false} /></div>
    </Night>
  );
}

// ── Série de 4 stories : l'outil, en quatre temps ─────────────────────
const SS = {
  fr: {
    k: ["01 · Le brief", "02 · Les profils", "03 · L'entretien", "04 · La synthèse"],
    s1: ["Qui voulez-vous", "entendre\u00a0?"], label: "Votre brief", brief: "Des acheteuses de luxe discrètes, qui savent parler matière et savoir-faire.", chips: ["Acheteuse luxe", "Matières", "Paris"],
    f1: "Quelques phrases suffisent. Nous en faisons une fiche précise en 10 secondes.",
    s2: ["Nous la trouvons.", "Et nous la prouvons."], role: "Acheteuse luxe · 11 ans · Paris", close: "Très proche", near: "Proche", cert: "Certifiée à 92 %",
    why: "Pourquoi elle", whyText: "Ancienne acheteuse d'un grand magasin parisien, elle suit les matières depuis 11 ans.",
    others: [["I", "#8a6bd8", "Inès B.", "Vendeuse en boutique de luxe"], ["J", "#5d8f7a", "Jules M.", "Collectionneur d'archives"]], f2: "Vous ne gardez que les profils qui vous servent.",
    s3: ["Vous menez l'entretien.", "Le reste se fait seul."], chips3: ["Enregistré", "Transcrit en direct", "Votre guide à l'écran"], f3: "La visio se passe dans Rarelyst. Rien à installer.",
    s4: ["Une synthèse", "qui tranche."], decisionL: "Votre décision", decision: "Trois ou cinq coloris pour le lancement\u00a0?", answerL: "La réponse", answer: "Trois. Le noir porte les ventes ; le reste finirait soldé.",
    conf: "Confiance élevée · 6 personnes sur 8", quote: "« Le noir, je le rachète. Le vert, je l'admire en vitrine. »", verified: "Citation vérifiée dans la transcription", cta: "Réserver une démo · rarelyst.co",
  },
  en: {
    k: ["01 · The brief", "02 · The profiles", "03 · The interview", "04 · The synthesis"],
    s1: ["Who do you want", "to hear from?"], label: "Your brief", brief: "Discreet luxury buyers who can talk about materials and craft.", chips: ["Luxury buyer", "Materials", "Paris"],
    f1: "A few sentences will do. We turn them into a precise brief in 10 seconds.",
    s2: ["We find her.", "And we prove it."], role: "Luxury buyer · 11 yrs · Paris", close: "Very close", near: "Close", cert: "92% certified",
    why: "Why her", whyText: "A former buyer at a Paris department store, she has followed materials for 11 years.",
    others: [["I", "#8a6bd8", "Inès B.", "Luxury boutique associate"], ["J", "#5d8f7a", "Jules M.", "Archive collector"]], f2: "You only keep the profiles that serve you.",
    s3: ["You run the interview.", "The rest happens on its own."], chips3: ["Recorded", "Transcribed live", "Your guide on screen"], f3: "The video call happens inside Rarelyst. Nothing to install.",
    s4: ["A synthesis", "that decides."], decisionL: "Your decision", decision: "Three or five colourways for the launch?", answerL: "The answer", answer: "Three. Black drives sales; the rest would end up on sale.",
    conf: "High confidence · 6 people out of 8", quote: "“Black, I buy again. Green, I admire in the window.”", verified: "Quote checked against the transcript", cta: "Book a demo · rarelyst.co",
  },
};

function SerieFrame({ i, t, light = false, bg, children }: { i: number; t: number; light?: boolean; bg: string; children: React.ReactNode }) {
  return (
    <div className={`${s.frame} ${bg}`} style={{ width: 540, height: 960 }}>
      {/* Le grand numéro en filigrane, et la progression de la série. */}
      <div style={{ position: "absolute", right: -18, top: 96, fontSize: 300, fontWeight: 700, letterSpacing: "-0.08em", lineHeight: 1, color: light ? "rgba(255,255,255,.05)" : "rgba(106,67,219,.07)", ...rise(t, 0, 0.8, 40) }}>0{i}</div>
      <div style={{ position: "absolute", left: 36, right: 36, top: 758, display: "flex", gap: 6 }}>
        {[1, 2, 3, 4].map((k) => <i key={k} style={{ flex: 1, height: 3, borderRadius: 3, background: k === i ? (light ? "#fff" : "var(--accent)") : light ? "rgba(255,255,255,.2)" : "rgba(106,67,219,.18)" }} />)}
      </div>
      <Brand story light={light} />
      {children}
    </div>
  );
}

function Serie(i: number, t: number, lang: Lang) {
  const c = SS[lang];
  const kicker = (light = false) => <p className={s.kicker} style={{ position: "absolute", left: 36, top: 150, color: light ? "#c9b8ff" : undefined, ...rise(t, 0.1) }}>{c.k[i - 1]}</p>;
  if (i === 1) {
    const shown = typed(c.brief, t, 1.0, 34);
    return (
      <SerieFrame i={1} t={t} bg={s.bgLilac}>
        {kicker()}
        <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 180, fontSize: 60, ...rise(t, 0.25) }}>{c.s1[0]}<br /><span className={s.grad}>{c.s1[1]}</span></h1>
        <div className={s.cardInk} style={{ position: "absolute", left: 30, right: 30, top: 350, padding: 24, ...rise(t, 0.6, 0.6, 40) }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.55)" }}>{c.label}</div>
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.18, marginTop: 10, minHeight: 96, color: "#fff" }}>{shown}<i className={s.caret} style={{ background: "#c9b8ff", opacity: Math.floor(t * 2) % 2 || t < 3.4 ? 1 : 0 }} /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {c.chips.map((x, k) => <span key={x} className={s.chip} style={{ fontSize: 14, padding: "7px 12px", background: "rgba(255,255,255,.1)", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)", ...pop(t, 3.3 + k * 0.15) }}>{x}</span>)}
          </div>
        </div>
        <p className={s.lead} style={{ position: "absolute", left: 36, right: 150, top: 620, fontSize: 18, ...rise(t, 4.0) }}>{c.f1}</p>
        <div style={{ position: "absolute", right: 28, top: 600, ...pop(t, 0.8), transform: `${pop(t, 0.8).transform} rotate(${Math.sin(t * 2) * 6}deg)` }}><LoupeMascot size={110} mood="search" /></div>
      </SerieFrame>
    );
  }
  if (i === 2) {
    const medals: BadgeId[] = ["verifie", "linkedin", "emploi", "cv"];
    const scanX = 250 + 150 * Math.sin(seg(t, 0.9, 3.2) * Math.PI);
    return (
      <SerieFrame i={2} t={t} bg={s.bgLight}>
        {kicker()}
        <h2 className={s.h2} style={{ position: "absolute", left: 36, right: 36, top: 180, fontSize: 44, ...rise(t, 0.25) }}>{c.s2[0]}<br /><span className={s.grad}>{c.s2[1]}</span></h2>
        <div className={s.cardInk} style={{ position: "absolute", left: 30, right: 30, top: 300, padding: 22, ...rise(t, 0.6, 0.6, 40) }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className={s.av} style={{ width: 60, height: 60, fontSize: 25, background: "#c98e68" }}>C</span>
            <span style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>Camille R.</div><div style={{ fontSize: 14.5, color: "#b9aecb" }}>{c.role}</div></span>
            <span className={s.tag} style={{ color: "#8fe0b4", background: "rgba(47,163,107,.2)", ...pop(t, 1.4) }}>● {c.close}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 16 }}>
            {medals.map((m, k) => <span key={m} style={pop(t, 1.6 + k * 0.15)}><Medallion id={m} size={50} /></span>)}
            <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "#e8e4ff", ...rise(t, 2.3) }}>{c.cert}</span>
          </div>
          <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,.08)", color: "#fff", ...rise(t, 2.6) }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c9b8ff" }}>{c.why}</div>
            <div style={{ fontSize: 16, lineHeight: 1.4, marginTop: 4 }}>{c.whyText}</div>
          </div>
          <div style={{ position: "absolute", left: scanX, top: -40, opacity: seg(t, 0.8, 1.1) * (1 - seg(t, 3.2, 3.6)) }}><LoupeMascot size={80} mood="search" /></div>
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 574, display: "grid", gap: 8 }}>
          {c.others.map(([a, col, n, r], k) => (
            <div key={n} className={s.row} style={{ gridTemplateColumns: "38px 1fr auto", padding: "8px 12px", ...rise(t, 3.0 + k * 0.2) }}>
              <span className={s.av} style={{ width: 38, height: 38, borderRadius: 11, fontSize: 16, background: col }}>{a}</span>
              <span><span className={s.rowName} style={{ fontSize: 15 }}>{n}</span><br /><span className={s.rowRole} style={{ fontSize: 12.5 }}>{r}</span></span>
              <span className={s.tag} style={{ background: "var(--accent-soft)", color: "var(--g2)" }}>{k ? c.near : c.close}</span>
            </div>
          ))}
        </div>
        <p style={{ position: "absolute", left: 36, right: 36, top: 718, margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink-2)", ...rise(t, 3.6) }}>{c.f2}</p>
      </SerieFrame>
    );
  }
  if (i === 3) {
    return (
      <SerieFrame i={3} t={t} bg={s.bgInk} light>
        {kicker(true)}
        <h2 className={s.h2} style={{ position: "absolute", left: 36, right: 36, top: 180, fontSize: 42, color: "#fff", ...rise(t, 0.25) }}>{c.s3[0]}<br /><span className={s.gradGold}>{c.s3[1]}</span></h2>
        <div style={{ position: "absolute", left: 26, right: 26, top: 300, height: 312, borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(0,0,0,.8)", ...rise(t, 0.6, 0.6, 40) }}>
          <div style={{ width: 880, transform: "scale(0.557)", transformOrigin: "left top" }}>
            <FilmWindow lang={lang} sceneIndex={3} t={1.2 + t * 1.3} reduced />
          </div>
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, top: 634, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {c.chips3.map((x, k) => <span key={x} className={s.chip} style={{ fontSize: 13.5, padding: "7px 11px 7px 7px", color: "var(--ink)", ...pop(t, 1.6 + k * 0.2) }}><span className={s.check} style={{ width: 20, height: 20, fontSize: 11 }}>✓</span>{x}</span>)}
        </div>
        <p style={{ position: "absolute", left: 36, right: 36, top: 722, margin: 0, fontSize: 14.5, color: "rgba(255,255,255,.72)", ...rise(t, 2.4) }}>{c.f3}</p>
      </SerieFrame>
    );
  }
  return (
    <SerieFrame i={4} t={t} bg={s.bgLilac}>
      {kicker()}
      <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 180, fontSize: 60, ...rise(t, 0.25) }}>{c.s4[0]}<br /><span className={s.grad}>{c.s4[1]}</span></h1>
      <div className={s.card} style={{ position: "absolute", left: 30, right: 30, top: 340, padding: 22, ...rise(t, 0.6, 0.6, 40) }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.decisionL}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, letterSpacing: "-0.025em" }}>{c.decision}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 16, ...rise(t, 1.1) }}>{c.answerL}</div>
        <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.025em", marginTop: 4, ...rise(t, 1.2) }}>{c.answer}</div>
        <div style={{ marginTop: 14, ...rise(t, 1.7) }}>
          <div style={{ display: "flex", gap: 4 }}>{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ flex: 1, height: 8, borderRadius: 4, background: k < 6 ? "linear-gradient(90deg, var(--g3), var(--g2))" : "var(--line)", opacity: seg(t, 1.8 + k * 0.08, 2.0 + k * 0.08) * 0.8 + 0.2 }} />)}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)", marginTop: 8 }}>● {c.conf}</div>
        </div>
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--soft)", fontSize: 16, fontWeight: 600, lineHeight: 1.35, ...rise(t, 2.5) }}>{c.quote}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ok)", marginTop: 6 }}>✓ {c.verified}</div>
        </div>
      </div>
      <div className={`${s.btn} ${s.btnAccent}`} style={{ position: "absolute", left: 36, top: 690, ...pop(t, 3.2) }}>{c.cta}</div>
      <div style={{ position: "absolute", right: 26, top: 660, ...pop(t, 3.5) }}><LoupeMascot size={90} mood="wow" /></div>
    </SerieFrame>
  );
}

// ── Vidéos « casting » : un profil pointu, trouvé vite, payé seulement s'il sert ──
// Le style de la bannière noire (liste de profils qui défile), animé. La liste
// tourne comme une machine à sous et s'arrête sur le profil demandé.
const CAST_ROLES = {
  fr: ["Personal shopper", "Early adopter mode", "Styliste de stars", "Micro-influenceuse beauté", "Gen Z · revendeuse Vinted", "Cliente VIC", "Maquilleuse backstage", "Collectionneur de sneakers", "Acheteuse de grand magasin", "Vendeuse en boutique de luxe"],
  en: ["Personal shopper", "Fashion early adopter", "Celebrity stylist", "Beauty micro-influencer", "Gen Z · Vinted reseller", "VIC client", "Backstage makeup artist", "Sneaker collector", "Department store buyer", "Luxury boutique associate"],
};
const CAST = {
  fr: {
    kicker: "Qui voulez-vous entendre ?",
    hooks: { stars: "Il vous faut une styliste de stars ?", influence: "Il vous faut des micro-influenceuses beauté ?", genz: "Il vous faut des Gen Z qui revendent sur Vinted ?" },
    found: { stars: "Trouvée. Vérifiée.", influence: "Trouvées. Vérifiées.", genz: "Trouvées. Vérifiées." },
    fast1: "Sous 72 h.", fast2: "Pas en plusieurs semaines de relances.",
    pay: { stars: "Payée seulement si vous la gardez.", influence: "Payées seulement si vous les gardez.", genz: "Payées seulement si vous les gardez." },
    price: "Dès 390 € HT le profil, rémunération comprise.",
    end1: "Des profils très précis.", end2: "Plus vite.", end3: "Sans rien payer d'avance.",
  },
  en: {
    kicker: "Who do you want to hear from?",
    hooks: { stars: "Need a celebrity stylist?", influence: "Need beauty micro-influencers?", genz: "Need Gen Z Vinted resellers?" },
    found: { stars: "Found. Verified.", influence: "Found. Verified.", genz: "Found. Verified." },
    fast1: "Within 72 h.", fast2: "Not after weeks of chasing.",
    pay: { stars: "Paid only if you keep her.", influence: "Paid only if you keep them.", genz: "Paid only if you keep them." },
    price: "From €390 per profile, incentive included.",
    end1: "Very specific profiles.", end2: "Faster.", end3: "Nothing paid upfront.",
  },
};
type CastVariant = keyof typeof CAST.fr.hooks;
const CAST_TARGET: Record<CastVariant, number> = { stars: 2, influence: 3, genz: 4 };

function Casting(t: number, lang: Lang, v: CastVariant, post: boolean) {
  const c = CAST[lang];
  const roles = CAST_ROLES[lang];
  const N = roles.length;
  const W = 540, H = post ? 675 : 960;
  // Mise en page : vertical (stories, reels) ou 4:5 (fil LinkedIn et Instagram).
  const L = post
    ? { kicker: 74, hook: 98, hookSize: 38, center: 330, gap: 44, size: 25, found: 470, block: 150, end: 160 }
    : { kicker: 150, hook: 178, hookSize: 46, center: 470, gap: 54, size: 29, found: 660, block: 300, end: 270 };
  // La liste : dérive lente, puis tour rapide qui ralentit jusqu'au profil voulu.
  const target = CAST_TARGET[v] + N * 2;
  const spin = easeOut(seg(t, 2.3, 4.9));
  const pos = t < 2.3 ? t * 0.35 : 2.3 * 0.35 + (target - 2.3 * 0.35) * spin;
  const landed = t >= 4.9;
  const hookShown = typed(c.hooks[v], t, 0.45, 28);
  const phase1 = 1 - seg(t, 5.9, 6.3);
  const phase2 = seg(t, 6.2, 6.5) * (1 - seg(t, 9.3, 9.7));
  const grid: React.CSSProperties = { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.12) 0.8px, transparent 1.1px)", backgroundSize: "14px 14px", WebkitMaskImage: "radial-gradient(80% 60% at 70% 50%, #000, transparent)", maskImage: "radial-gradient(80% 60% at 70% 50%, #000, transparent)" };
  return (
    <div className={s.frame} style={{ width: W, height: H, color: "#f4f1f8", background: "radial-gradient(70% 45% at 80% 45%, rgba(106,67,219,.38), transparent 70%), radial-gradient(50% 35% at 0% 100%, rgba(215,96,158,.16), transparent 70%), #0a090d" }}>
      <div style={grid} />
      {post ? <Brand x={28} y={28} light /> : <Brand story light />}

      <div style={{ opacity: phase1 }}>
        <p className={s.kicker} style={{ position: "absolute", left: 36, top: L.kicker, color: "#b9a2ff", ...rise(t, 0.1) }}>{c.kicker}</p>
        <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: L.hook, fontSize: L.hookSize, lineHeight: 1.04, color: "#fff" }}>
          {hookShown}{t < 2.4 && <i className={s.caret} style={{ background: "#b9a2ff" }} />}
        </h1>
        {/* La liste qui défile */}
        <div style={{ position: "absolute", left: 0, right: 0, top: L.center - L.gap * 2.6, height: L.gap * 5.2, overflow: "hidden", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 28%, #000 72%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 28%, #000 72%, transparent)", ...rise(t, 0.5, 0.6, 30) }}>
          {Array.from({ length: 7 }, (_, k) => {
            const base = Math.floor(pos) - 3 + k;
            const d = base - pos;
            const role = roles[((base % N) + N) % N];
            const on = landed && Math.abs(d) < 0.5;
            const near = 1 - Math.min(1, Math.abs(d) / 2.5);
            return (
              <div key={k} style={{ position: "absolute", left: 36, right: 36, top: L.gap * 2.6 + d * L.gap - L.gap / 2, height: L.gap, display: "flex", alignItems: "center", gap: 10, fontSize: on ? L.size * 1.18 : L.size, fontWeight: 600, letterSpacing: "-0.035em", whiteSpace: "nowrap", color: on ? undefined : `rgba(244,241,248,${0.18 + 0.5 * near})`, ...(on ? NIGHT_TEXT : {}) }}>
                {on && <span style={{ ...NIGHT_TEXT, ...pop(t, 4.9, 0.35) }}>✦</span>}{role}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 36, top: L.found, display: "flex", gap: 8, ...pop(t, 5.0) }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, fontSize: 16, fontWeight: 700, color: "#8fe0b4", background: "rgba(47,163,107,.16)", boxShadow: "inset 0 0 0 1px rgba(143,224,180,.3)" }}>✓ {c.found[v]}</span>
        </div>
      </div>

      {/* Vite, et payé seulement s'il sert */}
      <div style={{ position: "absolute", left: 36, right: 36, top: L.block, opacity: phase2 }}>
        <h1 className={s.h1} style={{ fontSize: post ? 64 : 76, ...NIGHT_TEXT, ...rise(t, 6.2) }}>{c.fast1}</h1>
        <p style={{ margin: "12px 0 0", fontSize: post ? 20 : 23, fontWeight: 600, letterSpacing: "-0.02em", color: "rgba(244,241,248,.7)", ...rise(t, 6.5) }}>{c.fast2}</p>
        <div style={{ height: 1, margin: post ? "26px 0" : "34px 0", background: "linear-gradient(90deg, rgba(185,162,255,.6), transparent)", transformOrigin: "left", transform: `scaleX(${easeOut(seg(t, 7.0, 7.6))})` }} />
        <h2 className={s.h2} style={{ fontSize: post ? 32 : 38, color: "#fff", ...rise(t, 7.4) }}>{c.pay[v]}</h2>
        <p style={{ margin: "14px 0 0", fontSize: post ? 17 : 19, color: "rgba(244,241,248,.7)", ...rise(t, 8.1) }}>{c.price}</p>
      </div>

      {/* Fin */}
      <div style={{ position: "absolute", left: 30, right: 30, top: L.end, display: "grid", justifyItems: "center", gap: 18, textAlign: "center", opacity: seg(t, 9.6, 9.9) }}>
        <div style={{ ...pop(t, 9.6), filter: "drop-shadow(0 0 30px rgba(140,104,242,.55))" }}><LoupeMascot size={post ? 96 : 118} mood="wow" /></div>
        <h2 className={s.h2} style={{ fontSize: post ? 32 : 38, color: "#fff", ...rise(t, 9.8) }}>{c.end1}<br /><span style={NIGHT_TEXT}>{c.end2}<br />{c.end3}</span></h2>
        <div className={`${s.btn} ${s.btnAccent}`} style={pop(t, 10.3)}>rarelyst.co →</div>
      </div>
    </div>
  );
}

// ── Vidéos « panel » : donner envie aux experts, influenceurs et clients de rejoindre ──
// Même style que « casting », mais la liste montre ce que chaque profil gagne
// (paliers réels du barème pour 45 min ; jusqu'à 560 € pour un profil rare, long et très demandé).
const PANEL_ROLES = {
  fr: [["Client·e passionné·e", "90 €"], ["Vendeuse en boutique de luxe", "180 €"], ["Styliste de stars", "350 €"], ["Micro-influenceuse beauté", "180 €"], ["Gen Z · revendeuse Vinted", "90 €"], ["Acheteuse de grand magasin", "180 €"], ["Collectionneur reconnu", "350 €"], ["Maquilleuse backstage", "180 €"]],
  en: [["Passionate customer", "€90"], ["Luxury boutique associate", "€180"], ["Celebrity stylist", "€350"], ["Beauty micro-influencer", "€180"], ["Gen Z · Vinted reseller", "€90"], ["Department store buyer", "€180"], ["Renowned collector", "€350"], ["Backstage makeup artist", "€180"]],
};
const PANEL = {
  fr: {
    kicker: "Rejoignez le panel Rarelyst",
    hooks: { expert: "Pas le temps ? 45 minutes suffisent.", influence: "Vos abonnés vous écoutent. Les marques aussi.", conso: "Vous connaissez les marques mieux que leurs équipes ?" },
    chip: "✓ Par entretien de 45 min, en visio",
    b1: "Quand vous voulez.", b2: "Vous proposez vos créneaux. La marque choisit.",
    b3: "Payé par virement.", b4: "Retrait dès 50 €. Jusqu'à 560 € pour les profils les plus rares.",
    end1: "Votre regard a de la valeur.", end2: "Faites-le payer.",
  },
  en: {
    kicker: "Join the Rarelyst panel",
    hooks: { expert: "No time? 45 minutes is enough.", influence: "Your followers listen to you. So do brands.", conso: "Do you know brands better than their own teams?" },
    chip: "✓ Per 45-min video interview",
    b1: "Whenever you want.", b2: "You suggest time slots. The brand picks one.",
    b3: "Paid by bank transfer.", b4: "Withdraw from €50. Up to €560 for the rarest profiles.",
    end1: "Your perspective is worth something.", end2: "Get paid for it.",
  },
};
type PanelVariant = keyof typeof PANEL.fr.hooks;
const PANEL_TARGET: Record<PanelVariant, number> = { expert: 2, influence: 3, conso: 4 };

function PanelVideo(t: number, lang: Lang, v: PanelVariant, post: boolean) {
  const c = PANEL[lang];
  const roles = PANEL_ROLES[lang];
  const N = roles.length;
  const W = 540, H = post ? 675 : 960;
  const L = post
    ? { kicker: 74, hook: 98, hookSize: 38, center: 330, gap: 44, size: 23, found: 470, block: 150, end: 170 }
    : { kicker: 150, hook: 178, hookSize: 46, center: 470, gap: 54, size: 26, found: 660, block: 300, end: 280 };
  const target = PANEL_TARGET[v] + N * 2;
  const spin = easeOut(seg(t, 2.3, 4.9));
  const pos = t < 2.3 ? t * 0.35 : 2.3 * 0.35 + (target - 2.3 * 0.35) * spin;
  const landed = t >= 4.9;
  const phase1 = 1 - seg(t, 5.9, 6.3);
  const phase2 = seg(t, 6.2, 6.5) * (1 - seg(t, 9.3, 9.7));
  const grid: React.CSSProperties = { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.12) 0.8px, transparent 1.1px)", backgroundSize: "14px 14px", WebkitMaskImage: "radial-gradient(80% 60% at 70% 50%, #000, transparent)", maskImage: "radial-gradient(80% 60% at 70% 50%, #000, transparent)" };
  const gold: React.CSSProperties = { background: "linear-gradient(100deg, #f7d58b, #fff3cf 45%, #f2c46d)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
  return (
    <div className={s.frame} style={{ width: W, height: H, color: "#f4f1f8", background: "radial-gradient(70% 45% at 80% 45%, rgba(106,67,219,.34), transparent 70%), radial-gradient(50% 35% at 0% 100%, rgba(242,196,109,.12), transparent 70%), #0a090d" }}>
      <div style={grid} />
      {post ? <Brand x={28} y={28} light /> : <Brand story light />}

      <div style={{ opacity: phase1 }}>
        <p className={s.kicker} style={{ position: "absolute", left: 36, top: L.kicker, color: "#f2c46d", ...rise(t, 0.1) }}>{c.kicker}</p>
        <h1 className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: L.hook, fontSize: L.hookSize, lineHeight: 1.04, color: "#fff" }}>
          {typed(c.hooks[v], t, 0.45, 28)}{t < 2.4 && <i className={s.caret} style={{ background: "#f2c46d" }} />}
        </h1>
        <div style={{ position: "absolute", left: 0, right: 0, top: L.center - L.gap * 2.6, height: L.gap * 5.2, overflow: "hidden", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 28%, #000 72%, transparent)", maskImage: "linear-gradient(180deg, transparent, #000 28%, #000 72%, transparent)", ...rise(t, 0.5, 0.6, 30) }}>
          {Array.from({ length: 7 }, (_, k) => {
            const base = Math.floor(pos) - 3 + k;
            const d = base - pos;
            const [role, pay] = roles[((base % N) + N) % N];
            const on = landed && Math.abs(d) < 0.5;
            const near = 1 - Math.min(1, Math.abs(d) / 2.5);
            const dim = `rgba(244,241,248,${0.18 + 0.5 * near})`;
            return (
              <div key={k} style={{ position: "absolute", left: 36, right: 36, top: L.gap * 2.6 + d * L.gap - L.gap / 2, height: L.gap, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: on ? L.size * 1.15 : L.size, fontWeight: 600, letterSpacing: "-0.035em", whiteSpace: "nowrap" }}>
                <span style={on ? NIGHT_TEXT : { color: dim }}>{on && "✦ "}{role}</span>
                <span style={on ? { ...gold, fontWeight: 700 } : { color: dim }}>{pay}</span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 36, top: L.found, ...pop(t, 5.0) }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, fontSize: 15, fontWeight: 700, color: "#f7d58b", background: "rgba(242,196,109,.12)", boxShadow: "inset 0 0 0 1px rgba(242,196,109,.3)" }}>{c.chip}</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 36, right: 36, top: L.block, opacity: phase2 }}>
        <h1 className={s.h1} style={{ fontSize: post ? 50 : 58, ...NIGHT_TEXT, ...rise(t, 6.2) }}>{c.b1}</h1>
        <p style={{ margin: "12px 0 0", fontSize: post ? 19 : 22, fontWeight: 600, letterSpacing: "-0.02em", color: "rgba(244,241,248,.7)", ...rise(t, 6.5) }}>{c.b2}</p>
        <div style={{ height: 1, margin: post ? "26px 0" : "34px 0", background: "linear-gradient(90deg, rgba(242,196,109,.6), transparent)", transformOrigin: "left", transform: `scaleX(${easeOut(seg(t, 7.0, 7.6))})` }} />
        <h2 className={s.h2} style={{ fontSize: post ? 40 : 48, ...gold, ...rise(t, 7.4) }}>{c.b3}</h2>
        <p style={{ margin: "14px 0 0", fontSize: post ? 17 : 19, color: "rgba(244,241,248,.7)", ...rise(t, 8.1) }}>{c.b4}</p>
      </div>

      <div style={{ position: "absolute", left: 30, right: 30, top: L.end, display: "grid", justifyItems: "center", gap: 18, textAlign: "center", opacity: seg(t, 9.6, 9.9) }}>
        <div style={{ ...pop(t, 9.6), filter: "drop-shadow(0 0 30px rgba(242,196,109,.35))" }}><LoupeMascot size={post ? 96 : 118} mood="happy" /></div>
        <h2 className={s.h2} style={{ fontSize: post ? 32 : 38, color: "#fff", ...rise(t, 9.8) }}>{c.end1}<br /><span style={gold}>{c.end2}</span></h2>
        <div className={`${s.btn} ${s.btnAccent}`} style={pop(t, 10.3)}>rarelyst.co →</div>
      </div>
    </div>
  );
}

// ── Image de partage du site (aperçu des liens : LinkedIn, WhatsApp, iMessage) ──
const OG = {
  fr: { h1: "Qui voulez-vous", h2: "entendre ?", sub: "Profils vérifiés pour les études qualitatives des marques de mode, luxe et beauté.", pill: "Premiers profils sous 72 h",
    people: [["amina", "Amina D.", "Styliste de célébrités"], ["yuki", "Yuki T.", "Acheteuse luxe · Tokyo"], ["kwame", "Kwame A.", "Reseller sneakers"]] },
  en: { h1: "Who do you want", h2: "to hear from?", sub: "Verified participants for qualitative research by fashion, luxury and beauty brands.", pill: "First profiles within 72 h",
    people: [["amina", "Amina D.", "Celebrity stylist"], ["yuki", "Yuki T.", "Luxury buyer · Tokyo"], ["kwame", "Kwame A.", "Sneaker reseller"]] },
};

function Partage({ lang }: { lang: Lang }) {
  const c = OG[lang];
  return (
    <div className={s.frame} style={{ width: 600, height: 315, color: "#f4f1f8", background: "radial-gradient(60% 90% at 85% 20%, rgba(106,67,219,.4), transparent 70%), radial-gradient(40% 60% at 100% 100%, rgba(215,96,158,.18), transparent 70%), #0a090d" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.12) 0.8px, transparent 1.1px)", backgroundSize: "12px 12px", WebkitMaskImage: "linear-gradient(90deg, transparent 30%, #000 80%)", maskImage: "linear-gradient(90deg, transparent 30%, #000 80%)" }} />
      <Brand x={30} y={28} light />
      <h1 className={s.h1} style={{ position: "absolute", left: 30, top: 78, fontSize: 44, lineHeight: 0.98, color: "#fff" }}>{c.h1}<br /><span style={NIGHT_TEXT}>{c.h2}</span></h1>
      <p style={{ position: "absolute", left: 30, top: 186, width: 270, margin: 0, fontSize: 13.5, lineHeight: 1.45, color: "rgba(244,241,248,.7)" }}>{c.sub}</p>
      <span style={{ position: "absolute", left: 30, top: 250, padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, color: "#8fe0b4", background: "rgba(47,163,107,.16)", boxShadow: "inset 0 0 0 1px rgba(143,224,180,.3)" }}>✓ {c.pill}</span>
      <div style={{ position: "absolute", left: 336, right: 24, top: 56, display: "grid", gap: 9 }}>
        {c.people.map(([img, n, r], k) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 14, background: "rgba(255,255,255,.05)", boxShadow: k === 0 ? "inset 0 0 0 1px rgba(185,162,255,.55), 0 0 26px -8px rgba(140,104,242,.6)" : "inset 0 0 0 1px rgba(255,255,255,.1)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/avatars/${img}.svg`} alt="" width={40} height={40} style={{ borderRadius: 12, boxShadow: "0 0 0 2px rgba(255,255,255,.14)" }} />
            <span style={{ flex: 1, lineHeight: 1.2 }}><b style={{ fontSize: 13.5 }}>{n}</b><br /><span style={{ fontSize: 11.5, color: "rgba(244,241,248,.6)" }}>{r}</span></span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: k === 0 ? "#8fe0b4" : "rgba(244,241,248,.75)", background: k === 0 ? "rgba(47,163,107,.16)" : "rgba(255,255,255,.08)" }}>{lang === "fr" ? (k === 0 ? "Très proche" : "Proche") : (k === 0 ? "Very close" : "Close")}</span>
          </div>
        ))}
        <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "rgba(244,241,248,.8)", marginTop: 4 }}>rarelyst.co</div>
      </div>
    </div>
  );
}

const RENDERS: Record<string, Render> = {
  marques: Marques,
  participants: Participants,
  parrainage: (t) => Parrainage(t),
  "profil-rare": (t) => ProfilRare(t),
  loupe: (t) => LoupeSePresente(t),
  "avant-apres": (t) => AvantApres(t),
  synthese: (t) => Synthese(t),
  "post-versus": () => <PostVersus />,
  "post-introuvables": () => <PostIntrouvables />,
  "post-remuneration": () => <PostRemuneration />,
  "post-parrainage": () => <PostParrainage />,
  "story-citation": () => <StoryCitation />,
  "story-langues": () => <StoryLangues />,
  "banniere-linkedin": () => <BanniereLinkedIn />,
  avatar: () => <Avatar />,
  "carre-logo": () => <CarreLogo />,
  "post-garanties": (_t, lang) => <PostGaranties lang={lang} />,
  "banniere-noir-casting": (_t, lang) => <BanniereNoirCasting lang={lang} />,
  "banniere-noir-ticker": (_t, lang) => <BanniereNoirTicker lang={lang} />,
  "banniere-noir-brief": (_t, lang) => <BanniereNoirBrief lang={lang} />,
  "banniere-noir-profils": (_t, lang) => <BanniereNoirProfils lang={lang} />,
  "banniere-noir-logo": (_t, lang) => <BanniereNoirLogo lang={lang} />,
  partage: (_t, lang) => <Partage lang={lang} />,
  "page-noir-casting": (_t, lang) => <BanniereNoirCasting lang={lang} cover />,
  "page-noir-ticker": (_t, lang) => <BanniereNoirTicker lang={lang} cover />,
  "page-noir-brief": (_t, lang) => <BanniereNoirBrief lang={lang} cover />,
  "page-noir-profils": (_t, lang) => <BanniereNoirProfils lang={lang} cover />,
  "page-noir-logo": (_t, lang) => <BanniereNoirLogo lang={lang} cover />,
  ...Object.fromEntries((["expert", "influence", "conso"] as PanelVariant[]).flatMap((v) => [
    [`panel-${v}`, (t: number, lang: Lang) => PanelVideo(t, lang, v, false)],
    [`panel-${v}-post`, (t: number, lang: Lang) => PanelVideo(t, lang, v, true)],
  ])),
  ...Object.fromEntries((["stars", "influence", "genz"] as CastVariant[]).flatMap((v) => [
    [`casting-${v}`, (t: number, lang: Lang) => Casting(t, lang, v, false)],
    [`casting-${v}-post`, (t: number, lang: Lang) => Casting(t, lang, v, true)],
  ])),
  ...Object.fromEntries([1, 2, 3, 4].map((i) => [`serie-${i}`, (t: number, lang: Lang) => Serie(i, t, lang)])),
  "post-question": (_t, lang) => <PostQuestion lang={lang} />,
  ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`carrousel-marques-${i + 1}`, (_t: number, lang: Lang) => <CarrouselMarques i={i + 1} lang={lang} />])),
  ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`carrousel-participants-${i + 1}`, (_t: number, lang: Lang) => <CarrouselParticipants i={i + 1} lang={lang} />])),
};

/** Le rendu d'un format à l'instant t. */
export function renderComposition(id: string, t: number, lang: Lang) {
  const meta = REGISTRY.find((c) => c.id === id);
  const r = RENDERS[id];
  if (!meta || !r) return null;
  return r(meta.duration ? t : meta.still ?? 99, lang);
}
