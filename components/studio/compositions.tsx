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

export type Lang = "fr" | "en";
export type Format = "story" | "post" | "square" | "banner" | "avatar";
export const SIZES: Record<Format, [number, number]> = {
  story: [540, 960], post: [540, 675], square: [540, 540], banner: [792, 198], avatar: [200, 200],
};
export type Composition = {
  id: string; title: string; format: Format;
  /** Durée en secondes ; 0 pour un visuel fixe. */
  duration: number;
  /** Instant affiché pour un visuel fixe. */
  still?: number;
  langs: Lang[];
  render: (t: number, lang: Lang) => React.ReactNode;
};

function Brand({ x = 28, y = 30, light = false }: { x?: number; y?: number; light?: boolean }) {
  return (
    <div className={s.brand} style={{ left: x, top: y, color: light ? "#fff" : "var(--ink)" }}>
      <Image src="/brand/logo.png" alt="" width={26} height={26} />Rarelyst
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
    q1: "Qui voulez-vous", q2: "entendre ?", usual: "Ce qu'on vous livre d'habitude",
    boxes: ["Femme", "25–35 ans", "CSP+", "Île-de-France"], here: "Nous, une personne.",
    rows: [
      { i: "C", c: "#c98e68", n: "Camille R.", r: "Acheteuse luxe · Paris", tag: "◆ Initiée", holo: false },
      { i: "I", c: "#8a6bd8", n: "Inès B.", r: "Vendeuse en boutique de luxe · 8 ans", tag: "◆ Rare", holo: false },
      { i: "J", c: "#5d8f7a", n: "Jules M.", r: "Collectionneur d'archives Margiela", tag: "✦ Introuvable", holo: true },
    ],
    film: "Vous menez l'entretien. Le reste se fait seul.", deliv: ["Vidéo", "Transcription", "Synthèse"],
    delivTitle: "Et une synthèse qui répond à vos questions.",
    cta: "Qui voulez-vous entendre ?", ctaSub: "Vos premiers profils vérifiés en quelques jours.",
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
      <Brand />
      <div style={fadeBefore(t, 14)}>
        {/* Accroche tapée */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 150 + head * 130, transform: `scale(${0.62 + 0.38 * head})`, transformOrigin: "left top" }}>
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
        <div style={{ position: "absolute", left: 26, right: 26, top: 170, opacity: seg(t, 8.7, 9.0) * (1 - seg(t, 12.1, 12.4)) }}>
          <h3 className={s.h3} style={{ ...rise(t, 8.7), marginBottom: 20 }}>{c.film}</h3>
          <div style={rise(t, 8.9, 0.6, 30)}>
            <div style={{ width: 880, transform: "scale(0.556)", transformOrigin: "left top" }}>
              <FilmWindow lang={lang} sceneIndex={3} t={2 + (t - 8.9) * 1.6} />
            </div>
          </div>
        </div>

        {/* Le livrable */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 300, opacity: seg(t, 12.4, 12.7) }}>
          <h2 className={s.h2} style={rise(t, 12.4)}>{c.delivTitle}</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            {c.deliv.map((d, i) => <span key={d} className={s.chip} style={{ ...pop(t, 12.8 + i * 0.25), fontSize: 20, padding: "12px 18px" }}><span className={s.check}>✓</span>{d}</span>)}
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
    who: ["Styliste ?", "Vendeuse en boutique ?", "Collectionneur ?"], title1: "Votre œil", title2: "vaut quelque chose.",
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
      <Brand light />
      <div style={fadeBefore(t, 12)}>
        {c.who.map((w, i) => (
          <h1 key={w} className={s.h1} style={{ position: "absolute", left: 36, right: 36, top: 380, fontSize: 60, ...rise(t, i * 0.95, 0.4, 30, i * 0.95 + 0.75) }}>{w}</h1>
        ))}
        <div style={{ position: "absolute", left: 36, right: 36, top: 250, opacity: seg(t, 3.0, 3.3) * (1 - seg(t, 5.9, 6.2)) }}>
          <h1 className={s.h1} style={rise(t, 3.0)}>{c.title1}<br /><span className={s.gradGold}>{c.title2}</span></h1>
          <div style={{ marginTop: 44, ...rise(t, 3.8) }}>
            <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>90 – {pay} €</div>
            <p style={{ margin: "10px 0 0", fontSize: 18, color: "rgba(255,255,255,.72)" }}>{c.paySub}</p>
          </div>
        </div>
        <div style={{ position: "absolute", left: 36, right: 36, top: 260, opacity: seg(t, 6.2, 6.5) * (1 - seg(t, 8.9, 9.2)) }}>
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
        <div style={{ position: "absolute", left: 30, right: 30, top: 300, opacity: seg(t, 9.2, 9.5) }}>
          <div className={s.card} style={{ padding: 26, color: "var(--ink)", ...rise(t, 9.2, 0.5, 40) }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{c.solde}</div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", marginTop: 6 }}>{pressed ? "0" : "180"} €</div>
            <div className={s.btn} style={{ width: "100%", marginTop: 18, transform: `scale(${t > 10.4 && t < 10.7 ? 0.96 : 1})`, background: pressed ? "#1f7a4d" : "var(--ink)" }}>
              {pressed ? "✓" : `${c.retirer} 180 €`}
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
      <Brand />
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
      <Brand />
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
      <Brand />
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
      <Cta t={t} at={9.6} title="Qui voulez-vous entendre ?" sub="Rarelyst trouve et vérifie les profils rares pour vos études." />
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
      <Brand />
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
    { at: 1.4, q: "Trois ou cinq coloris ?", a: "Trois. Le noir porte les ventes ; le reste finirait soldé.", n: 5, conf: "Confiance forte" },
    { at: 4.0, q: "Écrire « recyclé » sur l'étiquette ?", a: "Pas en premier : le mot rassure la seconde main, pas la cliente du neuf.", n: 4, conf: "Confiance moyenne" },
  ];
  return (
    <div className={`${s.frame} ${s.bgLilac}`} style={{ width: 540, height: 960 }}>
      <Brand />
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
      <Brand />
      <p className={s.kicker} style={{ marginTop: 200 }}>Ce que vos clientes pensent vraiment</p>
      <div style={{ fontSize: 120, lineHeight: 0.6, color: "var(--accent-dim)", marginTop: 30, fontWeight: 700 }}>«</div>
      <h1 className={s.h1} style={{ fontSize: 50, marginTop: 10 }}>Si c&apos;est écrit recyclé, je pense <span className={s.grad}>seconde main.</span></h1>
      <p className={s.lead} style={{ marginTop: 24 }}>Vendeuse en boutique de luxe, 8 ans de métier</p>
      <div className={s.card} style={{ position: "absolute", left: 40, right: 40, bottom: 60, padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
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
      <Brand />
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
      <div className={s.url} style={{ position: "absolute", left: 40, bottom: 50 }}>rarelyst.co</div>
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

export const COMPOSITIONS: Composition[] = [
  { id: "marques", title: "Rarelyst en 16 secondes (marques)", format: "story", duration: 16, langs: ["fr", "en"], render: Marques },
  { id: "participants", title: "Votre œil vaut quelque chose (participants)", format: "story", duration: 14, langs: ["fr", "en"], render: Participants },
  { id: "parrainage", title: "Parrainage : jusqu'à 320 € par ami", format: "story", duration: 10.5, langs: ["fr"], render: (t) => Parrainage(t) },
  { id: "profil-rare", title: "Le genre de profil que nous trouvons", format: "story", duration: 11, langs: ["fr"], render: (t) => ProfilRare(t) },
  { id: "loupe", title: "La loupe se présente", format: "story", duration: 12, langs: ["fr"], render: (t) => LoupeSePresente(t) },
  { id: "avant-apres", title: "Avant, après", format: "story", duration: 10.5, langs: ["fr"], render: (t) => AvantApres(t) },
  { id: "synthese", title: "La synthèse qui s'écrit", format: "story", duration: 10, langs: ["fr"], render: (t) => Synthese(t) },
  { id: "post-versus", title: "Post : une tranche d'âge, une personne", format: "post", duration: 0, langs: ["fr"], render: () => <PostVersus /> },
  { id: "post-introuvables", title: "Post : les profils introuvables", format: "post", duration: 0, langs: ["fr"], render: () => <PostIntrouvables /> },
  { id: "post-remuneration", title: "Post : 90 à 350 € par entretien", format: "post", duration: 0, langs: ["fr"], render: () => <PostRemuneration /> },
  { id: "post-parrainage", title: "Post : parrainage", format: "post", duration: 0, langs: ["fr"], render: () => <PostParrainage /> },
  { id: "story-citation", title: "Story : citation d'entretien", format: "story", duration: 0, langs: ["fr"], render: () => <StoryCitation /> },
  { id: "story-langues", title: "Story : entretiens en anglais", format: "story", duration: 0, langs: ["fr"], render: () => <StoryLangues /> },
  { id: "banniere-linkedin", title: "Bannière de la page LinkedIn", format: "banner", duration: 0, langs: ["fr"], render: () => <BanniereLinkedIn /> },
  { id: "avatar", title: "Photo de profil (loupe)", format: "avatar", duration: 0, langs: ["fr"], render: () => <Avatar /> },
  { id: "carre-logo", title: "Carré logo", format: "square", duration: 0, langs: ["fr"], render: () => <CarreLogo /> },
];

export const findComposition = (id: string) => COMPOSITIONS.find((c) => c.id === id) ?? null;
