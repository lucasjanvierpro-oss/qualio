"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoupeMascot from "@/components/brand/LoupeMascot";
import Medallion from "@/components/badges/Medallion";
import type { BadgeId } from "@/lib/participants/badges";
import type { DemoData, DemoTier } from "@/lib/demo/prepare";
import s from "./demo.module.css";

// La démo pour une marque, en six étapes, à dérouler devant elle au clavier
// (flèches, espace) ou à la souris. Profils et entretiens sont des exemples.

type Tiers = Record<DemoTier, { label: string; baseCredits: number }>;
type Reponse = { question: string; reponse: string; confiance?: string; verbatim?: string; participant?: string };
type Reco = { titre: string; detail: string };

const COLORS = ["#c98e68", "#8a6bd8", "#5d8f7a", "#d7609e", "#5b8def", "#e0a43a", "#2fa36b", "#7a5c9e"];
const CONF: Record<string, { label: string; cls: string }> = {
  forte: { label: "Confiance forte", cls: s.tagOk },
  moyenne: { label: "Confiance moyenne", cls: "" },
  faible: { label: "Confiance faible", cls: "" },
};

const T = {
  fr: {
    steps: ["Accueil", "Le brief", "Les profils", "L'entretien", "La synthèse", "Et ensuite"],
    prev: "← Précédent", next: "Suivant →", exit: "Quitter la démo", keys: "Flèches du clavier pour avancer",
    coverKicker: (b: string) => `Démo préparée pour ${b}`, cover1: "Qui voulez-vous", cover2: "entendre ?",
    coverLead: "Vous décrivez la personne. Nous la trouvons, la vérifions, organisons l'entretien et vous rendons une synthèse qui répond à vos questions.",
    briefKicker: "1 · Le brief", briefTitle: "Quelques phrases suffisent.", briefYou: "Ce que vous nous écrivez", briefUs: "Ce que Rarelyst en comprend, en 10 secondes",
    decisions: "Ce que l'étude doit trancher", wanted: "Qui interroger", guide: (n: number) => `Un guide d'entretien de ${n} questions, prêt à relire.`,
    profKicker: "2 · Les profils", profTitle: "Des personnes précises, avec leurs preuves.", profNote: "Profils d'exemple, créés pour cette démo. Chaque vrai profil est vérifié à la main.",
    tier: { averti: "Client·e averti·e", initie: "Initié·e", rare: "Rare" } as Record<DemoTier, string>, cr: "crédits",
    callKicker: "3 · L'entretien", callTitle: "Vous menez l'entretien. Le reste se fait seul.", callGuide: "Votre guide à l'écran",
    callPoints: ["Visio dans Rarelyst, rien à installer", "Enregistrée et transcrite automatiquement", "Aussi en autonomie : le participant répond seul aux questions (bêta)"],
    excerpt: "Sous-titres tirés d'un entretien simulé pour cette démo.",
    synthKicker: "4 · La synthèse", synthTitle: "Une réponse à chaque décision.", synthNote: (v: number, n: number) => `${v} citations sur ${n} retrouvées mot pour mot dans les transcriptions. Entretiens simulés pour cette démo.`,
    recos: "Recommandations", pending: "La synthèse est en cours de préparation : revenez sur cette étape dans une minute.",
    nextKicker: "5 · Et ensuite", nextTitle: (b: string) => `Une étude pilote pour ${b}.`,
    nextLead: "Vous nous envoyez votre brief. Vos premiers profils arrivent sous 72 heures. Vous ne gardez que ceux qui vous servent.",
    per: "par profil, entretien de 45 min", guarantees: ["Rien n'est débité avant de garder un profil", "Participant absent : crédits rendus", "Profil qui ne convient pas : refusé sans frais", "1 crédit = 10 € HT"],
    cta: "Envoyer un brief", ctaSub: "rarelyst.co",
  },
  en: {
    steps: ["Welcome", "The brief", "The profiles", "The interview", "The synthesis", "Next"],
    prev: "← Back", next: "Next →", exit: "Leave demo", keys: "Use the arrow keys to move on",
    coverKicker: (b: string) => `Demo prepared for ${b}`, cover1: "Who do you want", cover2: "to hear from?",
    coverLead: "You describe the person. We find them, verify them, set up the interview and hand you a synthesis that answers your questions.",
    briefKicker: "1 · The brief", briefTitle: "A few sentences will do.", briefYou: "What you send us", briefUs: "What Rarelyst understands, in 10 seconds",
    decisions: "What the study must decide", wanted: "Who to interview", guide: (n: number) => `A ${n}-question interview guide, ready to review.`,
    profKicker: "2 · The profiles", profTitle: "Specific people, with their proof.", profNote: "Example profiles created for this demo. Every real profile is verified by hand.",
    tier: { averti: "Savvy customer", initie: "Insider", rare: "Rare" } as Record<DemoTier, string>, cr: "credits",
    callKicker: "3 · The interview", callTitle: "You run the interview. The rest happens on its own.", callGuide: "Your guide on screen",
    callPoints: ["Video call inside Rarelyst, nothing to install", "Recorded and transcribed automatically", "Also self-guided: the participant answers on their own (beta)"],
    excerpt: "Captions taken from an interview simulated for this demo.",
    synthKicker: "4 · The synthesis", synthTitle: "An answer to every decision.", synthNote: (v: number, n: number) => `${v} of ${n} quotes found word for word in the transcripts. Interviews simulated for this demo.`,
    recos: "Recommendations", pending: "The synthesis is still being prepared: come back to this step in a minute.",
    nextKicker: "5 · Next", nextTitle: (b: string) => `A pilot study for ${b}.`,
    nextLead: "Send us your brief. Your first profiles arrive within 72 hours. You only keep the ones that serve you.",
    per: "per profile, 45-min interview", guarantees: ["Nothing is charged until you keep a profile", "No-show: credits returned", "Profile not a fit: declined at no cost", "1 credit = €10 excl. VAT"],
    cta: "Send a brief", ctaSub: "rarelyst.co",
  },
};

function useLoopTime(active: boolean, period: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => { setT(((now - start) / 1000) % period); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, period]);
  return t;
}

/** La visio, avec le premier profil de la démo et ses mots en sous-titres (entretien simulé). */
function Call({ profile, lines, t, lang }: { profile?: DemoData["profiles"][number]; lines: string[]; t: number; lang: "fr" | "en" }) {
  const i = lines.length ? Math.floor(t / 4) % lines.length : 0;
  const line = lines[i] ?? "";
  const [who, ...rest] = line.split(/\s*:\s*/);
  const speaker = /intervieweu|interviewer/i.test(who) ? (lang === "en" ? "You" : "Vous") : profile?.firstName ?? "";
  const mm = String(12 + Math.floor(t / 60)).padStart(2, "0"), ss = String(Math.floor(t) % 60).padStart(2, "0");
  return (
    <div className={s.callWin} style={{ position: "relative", aspectRatio: "16 / 10", background: "radial-gradient(80% 90% at 50% 30%, #3a2b52, #140d1f)", color: "#fff" }}>
      <span style={{ position: "absolute", left: 16, top: 14, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: "rgba(0,0,0,.45)" }}><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ff4d5e", marginRight: 6, opacity: Math.floor(t * 2) % 2 ? 1 : 0.4 }} />REC 00:{mm}:{ss}</span>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <span style={{ width: "22%", aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 700, background: `linear-gradient(140deg, ${COLORS[0]}, #4b2bb5)`, boxShadow: speaker !== "Vous" && speaker !== "You" ? "0 0 0 6px rgba(140,104,242,.35), 0 0 0 12px rgba(140,104,242,.15)" : "none" }}>{profile?.firstName[0]}</span>
      </div>
      <span style={{ position: "absolute", right: 14, top: 14, width: "22%", aspectRatio: "4 / 3", borderRadius: 12, display: "grid", placeItems: "center", background: "#241a33", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)", fontSize: 12, fontWeight: 700 }}>{lang === "en" ? "You" : "Vous"}</span>
      <span style={{ position: "absolute", left: 16, bottom: 72, fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,.45)" }}>{profile?.firstName} {profile?.initial} · {profile?.role}</span>
      {line && <p style={{ position: "absolute", left: 16, right: 16, bottom: 14, margin: 0, padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,.55)", fontSize: 14, lineHeight: 1.4 }}><b style={{ color: "#c9b8ff" }}>{speaker}</b> {rest.join(" : ").slice(0, 170)}{rest.join(" : ").length > 170 ? "…" : ""}</p>}
    </div>
  );
}

export default function DemoDeck({ brandName, lang, data, tiers }: { brandName: string; lang: "fr" | "en"; data: DemoData; tiers: Tiers }) {
  const c = T[lang];
  const [step, setStep] = useState(0);
  const last = c.steps.length - 1;
  const go = useCallback((d: number) => setStep((x) => Math.max(0, Math.min(last, x + d))), [last]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);
  const t = useLoopTime(step === 3, 60);

  const draft = data.draft;
  const report = data.report as { syntheseExecutive?: string; reponses?: Reponse[]; recommandations?: Reco[] } | undefined;
  const lines = (data.interviews?.[0]?.transcript ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 14);

  return (
    <div className={s.deck}>
      <header className={s.top}>
        <span className={s.brand}><Image src="/brand/logo.png" alt="" width={26} height={26} />Rarelyst <span className={s.x}>× {brandName}</span></span>
        <nav className={s.steps} aria-label="Étapes">
          {c.steps.map((label, i) => <button key={label} type="button" aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)}>{label}</button>)}
        </nav>
        <Link className={s.exit} href="/admin/demo">{c.exit}</Link>
      </header>

      <main className={s.stage}>
        <div className={s.inner}>
          {step === 0 && (
            <div className={s.cover}>
              <div style={{ display: "grid", gap: 22 }}>
                <p className={s.kicker}>{c.coverKicker(brandName)}</p>
                <h1 className={s.h1}>{c.cover1}<br /><span className={s.grad}>{c.cover2}</span></h1>
                <p className={s.lead}>{c.coverLead}</p>
                {data.topic && <p className={s.chip} style={{ justifySelf: "start", fontSize: 15 }}>{data.topic}</p>}
              </div>
              <span className={s.coverLoupe}><LoupeMascot size={220} mood="search" /></span>
            </div>
          )}

          {step === 1 && (
            <>
              <div style={{ display: "grid", gap: 10 }}><p className={s.kicker}>{c.briefKicker}</p><h2 className={s.h2}>{c.briefTitle}</h2></div>
              <div className={s.two}>
                <div className={s.card}><p className={s.label}>{c.briefYou}</p><p className={s.briefText}>{data.brief}</p></div>
                <div className={s.cardInk} style={{ display: "grid", gap: 18 }}>
                  <div><p className={s.label}>{c.briefUs}</p><div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{draft?.title}</div><p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "rgba(241,237,246,.75)" }}>{draft?.objective}</p></div>
                  {!!draft?.decisions.length && <div><p className={s.label}>{c.decisions}</p><ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 15, lineHeight: 1.4 }}>{draft.decisions.map((d) => <li key={d}>{d}</li>)}</ol></div>}
                  {!!draft?.profiles.length && <div><p className={s.label}>{c.wanted}</p><div className={s.chips}>{draft.profiles.map((p) => <span key={p.label} className={s.chip} style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}>{p.count} × {p.label}</span>)}</div></div>}
                  {!!draft?.guide.length && <p style={{ margin: 0, fontSize: 14, color: "#c9b8ff", fontWeight: 600 }}>✓ {c.guide(draft.guide.length)}</p>}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "grid", gap: 10 }}><p className={s.kicker}>{c.profKicker}</p><h2 className={s.h2}>{c.profTitle}</h2></div>
              <div className={s.profiles}>
                {data.profiles.map((p, i) => (
                  <article key={`${p.firstName}-${i}`} className={s.profile}>
                    <div className={s.pHead}>
                      <span className={s.av} style={{ background: COLORS[i % COLORS.length] }}>{p.firstName[0]}</span>
                      <span><div className={s.pName}>{p.firstName} {p.initial}</div><div className={s.pRole}>{p.role}</div></span>
                    </div>
                    <div className={s.tags}>
                      <span className={`${s.tag} ${s.tagOk}`}>● {p.match}</span>
                      <span className={`${s.tag} ${p.tier === "rare" ? s.tagRare : ""}`}>{p.tier === "rare" ? "✦ " : ""}{c.tier[p.tier]}</span>
                      <span className={s.tag}>{p.age} · {p.city}</span>
                    </div>
                    <div className={s.medals}>{p.proofs.map((m) => <Medallion key={m} id={m as BadgeId} size={30} lang={lang} />)}</div>
                    <p className={s.why}><b style={{ color: "var(--ink)" }}>{p.highlight}.</b> {p.why}</p>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{tiers[p.tier].baseCredits} {c.cr}</div>
                  </article>
                ))}
              </div>
              <p className={s.note}>{c.profNote}</p>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "grid", gap: 10 }}><p className={s.kicker}>{c.callKicker}</p><h2 className={s.h2}>{c.callTitle}</h2></div>
              <div className={s.call}>
                <Call profile={data.profiles[0]} lines={lines} t={t} lang={lang} />
                <div style={{ display: "grid", gap: 14 }}>
                  {!!draft?.guide.length && <div className={s.card}><p className={s.label}>{c.callGuide}</p><ol className={s.list}>{draft.guide.slice(0, 5).map((q, i) => <li key={q} style={{ opacity: i === Math.floor(t / 6) % Math.min(5, draft.guide.length) ? 1 : 0.55 }}>{q}</li>)}</ol></div>}
                  <ul className={s.checks}>{c.callPoints.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              </div>
              <p className={s.note}>{c.excerpt}</p>
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ display: "grid", gap: 10 }}><p className={s.kicker}>{c.synthKicker}</p><h2 className={s.h2}>{c.synthTitle}</h2></div>
              {!report ? <div className={s.card}><p className={s.lead}>{c.pending}</p></div> : (
                <>
                  {report.syntheseExecutive && <div className={s.cardInk}><p style={{ margin: 0, fontSize: 17, lineHeight: 1.55 }}>{report.syntheseExecutive}</p></div>}
                  <div className={s.two}>
                    <div className={s.answers}>
                      {(report.reponses ?? []).slice(0, 3).map((r) => (
                        <div key={r.question} className={`${s.card} ${s.answer}`}>
                          <p className={s.q}>{r.question}</p>
                          <p className={s.a}>{r.reponse}</p>
                          {r.confiance && CONF[r.confiance] && <span className={`${s.conf} ${CONF[r.confiance].cls}`} style={{ background: r.confiance === "forte" ? undefined : "var(--soft)" }}>{CONF[r.confiance].label}</span>}
                          {r.verbatim && <blockquote className={s.quote}>« {r.verbatim} »{r.participant && <cite>{r.participant}</cite>}</blockquote>}
                        </div>
                      ))}
                    </div>
                    {!!report.recommandations?.length && (
                      <div className={s.card}><p className={s.label}>{c.recos}</p>
                        <ol className={s.list}>{report.recommandations.slice(0, 4).map((r) => <li key={r.titre}><span><b>{r.titre}</b><br /><span style={{ color: "var(--ink-2)", fontSize: 14 }}>{r.detail}</span></span></li>)}</ol>
                      </div>
                    )}
                  </div>
                  {data.quality && <p className={s.note}>✓ {c.synthNote(data.quality.verifiees + data.quality.corrigees, data.quality.citations)}</p>}
                </>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <div style={{ display: "grid", gap: 12 }}><p className={s.kicker}>{c.nextKicker}</p><h2 className={s.h2}>{c.nextTitle(brandName)}</h2><p className={s.lead}>{c.nextLead}</p></div>
              <div className={s.tiers}>
                {(["averti", "initie", "rare"] as DemoTier[]).map((k) => (
                  <div key={k} className={k === "rare" ? s.cardInk : s.card}>
                    <p className={s.label}>{c.tier[k]}</p>
                    <div className={s.price}>{tiers[k].baseCredits} {c.cr}</div>
                    <p className={s.note} style={{ color: k === "rare" ? "rgba(241,237,246,.6)" : undefined }}>{c.per}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24, alignItems: "center" }}>
                <ul className={s.checks}>{c.guarantees.map((g) => <li key={g}>{g}</li>)}</ul>
                <div style={{ display: "grid", justifyItems: "center", gap: 10 }}>
                  <LoupeMascot size={110} mood="wow" />
                  <span className={s.chip} style={{ fontSize: 16, padding: "12px 20px", background: "linear-gradient(110deg, #4b2bb5, #8c68f2)", color: "#fff" }}>{c.cta} · {c.ctaSub}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className={s.foot}>
        <span>{c.keys}</span>
        <div className={s.nav}>
          <button type="button" onClick={() => go(-1)} disabled={step === 0}>{c.prev}</button>
          <button type="button" onClick={() => go(1)} disabled={step === last}>{c.next}</button>
        </div>
      </footer>
    </div>
  );
}
