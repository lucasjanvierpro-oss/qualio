"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Medallion from "@/components/badges/Medallion";
import Hallmark from "@/components/brand/Hallmark";
import type { BadgeId } from "@/lib/participants/badges";
import type { Lang } from "@/lib/i18n/detect";
import styles from "./landing.module.css";

// Les pièces interactives de la page d'accueil. Le reste de la page est rendu
// par le serveur : ces îlots ne chargent que ce qui bouge.

/** Marque son contenu `data-in="true"` quand il entre à l'écran (une fois). */
export function InView({ children, className, as: Tag = "div", threshold = 0.25 }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "ul" | "ol"; threshold?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return <Tag ref={ref as never} className={className} data-in={inView}>{children}</Tag>;
}

/** Un nombre qui monte jusqu'à sa valeur quand il apparaît. */
export function CountUp({ to, suffix = "", duration = 1200, locale = "fr-FR" }: { to: number; suffix?: string; duration?: number; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      setValue(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{value.toLocaleString(locale)}{suffix}</span>;
}

const PROOF_IDS: BadgeId[] = ["verifie", "linkedin", "emploi", "cv", "portfolio", "recommande"];

const T = {
  fr: {
    proofs: [
      ["Identité vérifiée", "Pièce d'identité contrôlée par l'équipe."],
      ["LinkedIn vérifié", "Connexion faite avec son propre compte."],
      ["Emploi vérifié", "Code reçu sur son adresse professionnelle."],
      ["CV analysé", "Parcours lu et résumé avant de vous le proposer."],
      ["Book vérifié", "Travaux publiés, relus un par un."],
      ["Recommandé·e", "Bien noté par les marques qui l'ont interrogé."],
    ],
    sample: {
      tier: "◆ Initiée", role: "Styliste indépendante · Paris · 30 ans", credits: "crédits", cert: "Certifiée à 85 %", why: "Pourquoi elle",
      whyText: "Ancienne assistante styliste dans une maison parisienne, à son compte depuis 2022. Achète peu, après avoir essayé : Lemaire, Céline, Loewe.",
      quote: "« Je préfère une pièce de coupe irréprochable tous les six mois qu'un renouvellement permanent. »",
    },
    seal: "Ce que voit le participant avant l'entretien",
    member: { top: "Membre", role: "Acheteuse luxe · Paris", next: "Prochain entretien", nextV: "Jeudi · 180 €", year: "Gagné cette année", coin: "+180 €", suffix: " €", locale: "fr-FR" },
    brief: {
      placeholder: "Ex. : des acheteuses de luxe qui achètent aussi en seconde main, pour tester une ligne de maroquinerie en cuir recyclé.",
      aria: "Qui voulez-vous entendre ?", free: "Gratuit jusqu'à ce que vous gardiez un profil.", cta: "Recevoir mes premiers profils",
    },
  },
  en: {
    proofs: [
      ["Verified ID", "Identity document checked by our team."],
      ["Verified LinkedIn", "Signed in with their own account."],
      ["Verified employment", "Code received at their work email."],
      ["CV reviewed", "Background read and summarised before we suggest them."],
      ["Verified portfolio", "Published work, reviewed piece by piece."],
      ["Recommended", "Rated highly by the brands who interviewed them."],
    ],
    sample: {
      tier: "◆ Insider", role: "Freelance stylist · Paris · 30", credits: "credits", cert: "85% certified", why: "Why her",
      whyText: "Former assistant stylist at a Paris fashion house, freelance since 2022. Buys little, and only after trying on: Lemaire, Celine, Loewe.",
      quote: "“I'd rather have one perfectly cut piece every six months than constant renewal.”",
    },
    seal: "What the participant sees before the interview",
    member: { top: "Member", role: "Luxury shopper · Paris", next: "Next interview", nextV: "Thursday · €180", year: "Earned this year", coin: "+€180", suffix: "", locale: "en-GB" },
    brief: {
      placeholder: "E.g. luxury shoppers who also buy second-hand, to test a recycled-leather handbag line.",
      aria: "Who do you want to hear from?", free: "Free until you keep a profile.", cta: "Get my first profiles",
    },
  },
} as const;

/** Les médailles qui se frappent une à une quand on arrive dessus. */
export function ProofMedals({ lang = "fr" }: { lang?: Lang }) {
  const proofs = T[lang].proofs;
  return (
    <InView as="ul" className={styles.proofs} threshold={0.3}>
      {PROOF_IDS.map((id, i) => ({ id, title: proofs[i][0], text: proofs[i][1] })).map((p, i) => (
        <li key={p.id} style={{ ["--i" as string]: i }}>
          <span className={styles.proofMedal}><Medallion id={p.id} size={76} lang={lang} /></span>
          <b>{p.title}</b>
          <span>{p.text}</span>
        </li>
      ))}
    </InView>
  );
}

/** Le profil tel qu'une marque le reçoit. */
export function SampleProfile({ lang = "fr" }: { lang?: Lang }) {
  const t = T[lang].sample;
  return (
    <InView className={styles.sample}>
      <div className={styles.person}>
        <span className={styles.personAv}>A</span>
        <span>
          <b>Amina D. <span className={`${styles.tag} ${styles.tagRare}`}>{t.tier}</span></b>
          <span>{t.role}</span>
        </span>
        <span className={styles.samplePrice}><b>69</b> {t.credits}</span>
      </div>
      <div className={styles.sampleMedals}>
        {(["verifie", "linkedin", "emploi", "cv"] as BadgeId[]).map((id, i) => (
          <span key={id} className={styles.sampleMedal} style={{ ["--i" as string]: i }}><Medallion id={id} size={44} lang={lang} /></span>
        ))}
        <span className={styles.sampleCert}>{t.cert}</span>
      </div>
      <div className={styles.why}>
        <b>{t.why}</b>
        <p>{t.whyText}</p>
      </div>
      <p className={styles.quote}>{t.quote}</p>
    </InView>
  );
}

/** Le poinçon de la maison, frappé au défilement. */
export function HouseSeal({ lang = "fr" }: { lang?: Lang }) {
  return (
    <InView className={styles.seal}>
      <span className={styles.sealStamp}><Hallmark level={3} size={200} initial="M" /></span>
      <span className={styles.sealCaption}>{T[lang].seal}</span>
    </InView>
  );
}

/** La carte d'un participant, avec ce qu'il gagne. */
export function MemberCard({ lang = "fr" }: { lang?: Lang }) {
  const t = T[lang].member;
  return (
    <InView className={styles.member}>
      <div className={styles.memberTop}><span>Rarelyst</span><span>{t.top}</span></div>
      <div className={styles.memberName}>Camille R.</div>
      <div className={styles.memberRole}>{t.role}</div>
      <div className={styles.memberMedals}>
        {(["verifie", "linkedin", "premier", "recommande"] as BadgeId[]).map((id) => <Medallion key={id} id={id} size={40} lang={lang} />)}
      </div>
      <div className={styles.memberRows}>
        <span><small>{t.next}</small><b>{t.nextV}</b></span>
        <span><small>{t.year}</small><b>{lang === "en" ? "€" : ""}<CountUp to={1260} suffix={t.suffix} locale={t.locale} /></b></span>
      </div>
      <span className={styles.memberCoin} aria-hidden="true">{t.coin}</span>
    </InView>
  );
}

// Le brief tapé ici attend la marque après son inscription (voir la page
// Nouvelle étude, qui le reprend).
export const BRIEF_DRAFT_KEY = "rl-brief-draft";

export function BriefBox({ lang = "fr" }: { lang?: Lang }) {
  const t = T[lang].brief;
  const router = useRouter();
  const [text, setText] = useState("");
  const ok = text.trim().length >= 12;
  function go(e: React.FormEvent) {
    e.preventDefault();
    try { if (text.trim()) localStorage.setItem(BRIEF_DRAFT_KEY, text.trim()); } catch { /* sans stockage, le brief se réécrit après l'inscription */ }
    router.push("/signup/brand");
  }
  return (
    <form className={styles.briefBox} onSubmit={go}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t.placeholder}
        aria-label={t.aria}
      />
      <div className={styles.briefFoot}>
        <span>{t.free}</span>
        <button type="submit" className={`${styles.btn} ${styles.btnLight}`} disabled={!ok && text.length > 0}>
          {t.cta} <span className={styles.arr}>→</span>
        </button>
      </div>
    </form>
  );
}
