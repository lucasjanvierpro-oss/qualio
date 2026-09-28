"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Medallion from "@/components/badges/Medallion";
import Hallmark from "@/components/brand/Hallmark";
import type { BadgeId } from "@/lib/participants/badges";
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
export function CountUp({ to, suffix = "", duration = 1200 }: { to: number; suffix?: string; duration?: number }) {
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
  return <span ref={ref}>{value.toLocaleString("fr-FR")}{suffix}</span>;
}

const PROOFS: { id: BadgeId; title: string; text: string }[] = [
  { id: "verifie", title: "Identité vérifiée", text: "Pièce d'identité contrôlée par l'équipe." },
  { id: "linkedin", title: "LinkedIn vérifié", text: "Connexion faite avec son propre compte." },
  { id: "emploi", title: "Emploi vérifié", text: "Code reçu sur son adresse professionnelle." },
  { id: "cv", title: "CV analysé", text: "Parcours lu et résumé avant de vous le proposer." },
  { id: "portfolio", title: "Book vérifié", text: "Travaux publiés, relus un par un." },
  { id: "recommande", title: "Recommandé·e", text: "Bien noté par les marques qui l'ont interrogé." },
];

/** Les médailles qui se frappent une à une quand on arrive dessus. */
export function ProofMedals() {
  return (
    <InView as="ul" className={styles.proofs} threshold={0.3}>
      {PROOFS.map((p, i) => (
        <li key={p.id} style={{ ["--i" as string]: i }}>
          <span className={styles.proofMedal}><Medallion id={p.id} size={76} /></span>
          <b>{p.title}</b>
          <span>{p.text}</span>
        </li>
      ))}
    </InView>
  );
}

/** Le profil tel qu'une marque le reçoit. */
export function SampleProfile() {
  return (
    <InView className={styles.sample}>
      <div className={styles.person}>
        <span className={styles.personAv}>A</span>
        <span>
          <b>Amina D. <span className={`${styles.tag} ${styles.tagRare}`}>◆ Initiée</span></b>
          <span>Styliste indépendante · Paris · 30 ans</span>
        </span>
        <span className={styles.samplePrice}><b>69</b> crédits</span>
      </div>
      <div className={styles.sampleMedals}>
        {(["verifie", "linkedin", "emploi", "cv"] as BadgeId[]).map((id, i) => (
          <span key={id} className={styles.sampleMedal} style={{ ["--i" as string]: i }}><Medallion id={id} size={44} /></span>
        ))}
        <span className={styles.sampleCert}>Certifié à 85 %</span>
      </div>
      <div className={styles.why}>
        <b>Pourquoi elle</b>
        <p>Ancienne assistante styliste dans une maison parisienne, à son compte depuis 2022. Achète peu, après avoir essayé : Lemaire, Céline, Loewe.</p>
      </div>
      <p className={styles.quote}>« Je préfère une pièce de coupe irréprochable tous les six mois qu&apos;un renouvellement permanent. »</p>
    </InView>
  );
}

/** Le poinçon de la maison, frappé au défilement. */
export function HouseSeal() {
  return (
    <InView className={styles.seal}>
      <span className={styles.sealStamp}><Hallmark level={3} size={200} initial="M" /></span>
      <span className={styles.sealCaption}>Ce que voit le participant avant l&apos;entretien</span>
    </InView>
  );
}

/** La carte d'un participant, avec ce qu'il gagne. */
export function MemberCard() {
  return (
    <InView className={styles.member}>
      <div className={styles.memberTop}><span>Rarelyst</span><span>Membre</span></div>
      <div className={styles.memberName}>Camille R.</div>
      <div className={styles.memberRole}>Acheteuse luxe · Paris</div>
      <div className={styles.memberMedals}>
        {(["verifie", "linkedin", "premier", "recommande"] as BadgeId[]).map((id) => <Medallion key={id} id={id} size={40} />)}
      </div>
      <div className={styles.memberRows}>
        <span><small>Prochain entretien</small><b>Jeudi · 180 €</b></span>
        <span><small>Gagné cette année</small><b><CountUp to={1260} suffix=" €" /></b></span>
      </div>
      <span className={styles.memberCoin} aria-hidden="true">+180 €</span>
    </InView>
  );
}

// Le brief tapé ici attend la marque après son inscription (voir la page
// Nouvelle étude, qui le reprend).
export const BRIEF_DRAFT_KEY = "rl-brief-draft";

export function BriefBox() {
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
        placeholder="Ex. : des acheteuses de luxe qui achètent aussi en seconde main, pour tester une ligne de maroquinerie en cuir recyclé."
        aria-label="Qui voulez-vous entendre ?"
      />
      <div className={styles.briefFoot}>
        <span>Gratuit jusqu&apos;à ce que vous gardiez un profil.</span>
        <button type="submit" className={`${styles.btn} ${styles.btnLight}`} disabled={!ok && text.length > 0}>
          Recevoir mes premiers profils <span className={styles.arr}>→</span>
        </button>
      </div>
    </form>
  );
}
