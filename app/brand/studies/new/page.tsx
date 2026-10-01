"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import { createStudy } from "@/app/actions/studies";
import { DEFAULT_PRICING } from "@/lib/pricing/config";
import { quote } from "@/lib/pricing/engine";
import { DURATIONS, EMPTY_DRAFT, type BriefDraft } from "@/lib/studies/briefTypes";
import Tour from "@/components/tour/Tour";
import { LoupeScan } from "@/components/brand/LoupeMascot";
import { myBetaFeatures } from "@/app/actions/beta";
import { useLang, useTT } from "@/lib/i18n/client";
import b from "./brief.module.css";

// Nouvelle étude, en deux temps. La marque écrit ce qu'elle cherche ou dépose
// son brief ; l'IA en tire une fiche (profils, format, ce que la synthèse
// devra trancher, guide d'entretien). La marque la relit, corrige, envoie.

type Phase = "write" | "reading" | "review";

const EXAMPLES_EN = [
  { label: "Launch a line", text: "We're launching a recycled-leather leather goods line this autumn. We want to hear luxury shoppers who also buy second-hand, and two or three boutique sales associates. We need to decide the launch price and the number of colourways." },
  { label: "Test a price", text: "We're considering moving our flagship sneaker from €290 to €340. We want to understand how loyal customers and sneaker resellers perceive this increase, and what would make it acceptable." },
  { label: "Understand a clientele", text: "Our 25–35 year-old customers buy less and less in store. We want to understand where and how they discover brands today, with savvy shoppers and a few fashion content creators." },
];

const EXAMPLES = [
  { label: "Lancer une ligne", text: "On lance une ligne de maroquinerie en cuir recyclé à l'automne. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et deux ou trois vendeuses en boutique. Il faut trancher le prix de lancement et le nombre de coloris." },
  { label: "Tester un prix", text: "Nous hésitons à passer notre sneaker phare de 290 à 340 €. Nous voulons comprendre comment nos clients fidèles et des revendeurs sneakers perçoivent cette hausse, et ce qui la rendrait acceptable." },
  { label: "Comprendre une clientèle", text: "Nos clientes de 25-35 ans achètent de moins en moins en boutique. On veut comprendre où et comment elles découvrent les marques aujourd'hui, avec des clientes averties et quelques créatrices de contenu mode." },
];

const MOMENTS = [
  { id: "matin", label: "Matin", en: "Morning" },
  { id: "midi", label: "Midi", en: "Lunchtime" },
  { id: "apres-midi", label: "Après-midi", en: "Afternoon" },
  { id: "soir", label: "Soir", en: "Evening" },
];

const READING_STEPS = ["Qui interroger", "Le format", "Ce que la synthèse devra trancher", "Le guide d'entretien"];
const READING_STEPS_EN = ["Who to interview", "The format", "What the report must decide", "The interview guide"];

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md";
// Même clé que la boîte de brief de la page d'accueil (components/landing/Islands).
const DRAFT_KEY = "rl-brief-draft";
// Entretien en autonomie (bêta) : durée indicative et taille maximale d'une étude.
const ASYNC_MINUTES = 15;
const ASYNC_MAX = 100;

export default function NewStudyPage() {
  const router = useRouter();
  const tt = useTT();
  const en = useLang() === "en";
  const [phase, setPhase] = useState<Phase>("write");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(EMPTY_DRAFT);
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [moments, setMoments] = useState<string[]>(["matin", "apres-midi"]);
  // "async" (bêta) : le participant répond seul, face caméra, aux questions.
  const [mode, setMode] = useState<"live" | "async">("live");
  // Le format choisi d'entrée ; il s'impose à ce que l'IA lit dans le brief.
  const [format, setFormat] = useState<"one" | "group" | "async">("one");
  const [asyncAllowed, setAsyncAllowed] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Brief tapé sur la page d'accueil avant l'inscription : il attend ici.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(DRAFT_KEY); } catch { /* stockage indisponible */ }
    // Le brouillon vit dans le navigateur : le lire au rendu serveur casserait l'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setText((t) => t || saved);
  }, []);

  // Les fonctions bêta ouvertes à cette marque (l'entretien en autonomie).
  useEffect(() => {
    myBetaFeatures().then((f) => setAsyncAllowed(f.includes("async"))).catch(() => {});
  }, []);

  const canRead = text.trim().length >= 20 || !!file;

  function pick(f: File | undefined | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "pptx", "txt", "md"].includes(ext)) { setError(tt("Format non pris en charge : PDF, Word (.docx), PowerPoint (.pptx) ou texte.", "Unsupported format: PDF, Word (.docx), PowerPoint (.pptx) or text.")); return; }
    if (f.size > 10 * 1024 * 1024) { setError(tt("Document trop lourd : 10 Mo au maximum.", "Document too large: 10 MB max.")); return; }
    setError(null);
    setFile(f);
  }

  function applyFormat(d: BriefDraft): BriefDraft {
    setMode(format === "async" ? "async" : "live");
    return { ...d, studyType: format === "group" ? "FOCUS_GROUP" : "ONE_ON_ONE" };
  }

  async function read() {
    if (!canRead) return;
    setPhase("reading");
    setError(null);
    const fd = new FormData();
    fd.set("text", text);
    if (file) fd.set("file", file);
    try {
      const res = await fetch("/api/studies/read-brief", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.draft) throw new Error(json.error ?? tt("La lecture a échoué. Réessayez, ou remplissez la fiche à la main.", "Reading failed. Try again, or fill in the sheet by hand."));
      setDraft(applyFormat(json.draft));
      setSource(json.source ?? text);
      setFileName(json.fileName ?? null);
      setPhase("review");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : tt("La lecture a échoué.", "Reading failed."));
      setPhase("write");
    }
  }

  function manual() {
    setDraft(applyFormat({ ...EMPTY_DRAFT, objective: text.trim() }));
    setSource(text);
    setFileName(null);
    setPhase("review");
    window.scrollTo({ top: 0 });
  }

  async function send() {
    setSending(true);
    setError(null);
    const r = await createStudy({
      brief: source,
      briefFileName: fileName,
      title: draft.title,
      objective: draft.objective,
      profiles: draft.profiles,
      studyType: draft.studyType,
      duration: draft.duration,
      language: draft.language,
      ageMin: draft.ageMin,
      ageMax: draft.ageMax,
      cities: draft.cities,
      brandAffinities: draft.brandAffinities,
      exclusions: draft.exclusions,
      decisions: draft.decisions,
      guide: draft.guide,
      deadlineAt: draft.deadline,
      availability: mode === "async" ? [] : moments,
      mode,
    }).catch(() => ({ error: tt("L'envoi a échoué. Réessayez.", "Sending failed. Please try again.") }));
    if ("studyId" in r) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* rien à nettoyer */ }
      router.push(`/brand/studies/${r.studyId}?nouveau=1`);
      return;
    }
    if (r.error === "preview_mode") { router.push("/brand/account"); return; }
    if (r.error === "session_expired") { setError(tt("Votre session a expiré : reconnectez-vous dans un autre onglet, puis renvoyez.", "Your session expired: log in again in another tab, then resend.")); setSending(false); return; }
    setError(r.error);
    setSending(false);
  }

  if (phase === "review") {
    return <Review draft={draft} setDraft={setDraft} moments={moments} setMoments={setMoments} fileName={fileName}
      mode={mode} setMode={setMode} asyncAllowed={asyncAllowed}
      onBack={() => setPhase("write")} onSend={send} sending={sending} error={error} />;
  }

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <p className={s.eyebrow}>{tt("Nouvelle étude", "New study")}</p>
      <h1 className={s.h1}>{tt("Qui voulez-vous entendre\u00a0?", "Who do you want to hear?")}</h1>
      <p className={s.lead}>{tt("Écrivez ce que vous cherchez comme à un collègue, ou déposez votre brief. Nous en tirons la fiche de l'étude ; vous la relisez avant de l'envoyer.", "Write what you're looking for as you would to a colleague, or upload your brief. We turn it into a study sheet; you review it before sending.")}</p>

      <div className={b.formats} role="radiogroup" aria-label={tt("Format de l'étude", "Study format")}>
        <button type="button" role="radio" aria-checked={format === "one"} data-on={format === "one"} onClick={() => setFormat("one")}>
          <b>{tt("Entretiens individuels", "One-on-one interviews")}</b>
          <span>{tt("Vous interrogez chaque personne en visio, 30 à 60 minutes. Le format le plus riche.", "You interview each person by video, 30 to 60 minutes. The richest format.")}</span>
        </button>
        <button type="button" role="radio" aria-checked={format === "group"} data-on={format === "group"} onClick={() => setFormat("group")}>
          <b>Focus group</b>
          <span>{tt("Plusieurs participants ensemble en visio, pour les voir réagir les uns aux autres.", "Several participants together by video, to see them react to each other.")}</span>
        </button>
        <button type="button" role="radio" aria-checked={format === "async"} data-on={format === "async"} disabled={!asyncAllowed}
          onClick={() => asyncAllowed && setFormat("async")}>
          <b>{tt("Réponses vidéo", "Video answers")}<em>{tt("bêta", "beta")}</em></b>
          <span>{asyncAllowed
            ? tt("Chacun répond seul, face caméra, à vos questions, quand il veut. Rapide, jusqu'à 100 personnes, environ 3 fois moins cher.", "Each person answers your questions alone, on camera, whenever they like. Fast, up to 100 people, about 3 times cheaper.")
            : tt("Chacun répond seul, face caméra, à vos questions. Ouvert sur demande : écrivez-nous.", "Each person answers your questions alone, on camera. Available on request: write to us.")}</span>
        </button>
      </div>

      <div className={b.writeGrid}>
        <section className={b.composer} data-busy={phase === "reading"}>
          {phase === "reading" ? (
            <Reading withFile={!!file} />
          ) : (
            <>
              <textarea
                data-tour="brief-text"
                className={b.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder={tt("Ex. : on lance une ligne de maroquinerie en cuir recyclé. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et quelques vendeuses en boutique. Il faut décider du prix et du nombre de coloris.", "E.g.: we're launching a recycled-leather leather goods line. We want to hear luxury shoppers who also buy second-hand, and a few boutique sales associates. We need to decide the price and the number of colourways.")}
                aria-label={tt("Votre brief", "Your brief")}
              />
              <div className={b.examples} data-tour="brief-examples">
                <span>{tt("Exemples :", "Examples:")}</span>
                {(en ? EXAMPLES_EN : EXAMPLES).map((x) => <button key={x.label} type="button" onClick={() => setText(x.text)}>{x.label}</button>)}
              </div>

              <div
                data-tour="brief-drop"
                className={b.drop}
                data-over={dragging}
                data-filled={!!file}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
              >
                {file ? (
                  <span className={b.file}>
                    <span className={b.fileIcon}>{file.name.split(".").pop()?.toUpperCase()}</span>
                    <span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toLocaleString(en ? "en-GB" : "fr-FR", { maximumFractionDigits: 1 })} {tt("Mo", "MB")}</small></span>
                    <button type="button" className={b.remove} onClick={() => setFile(null)} aria-label={tt("Retirer le document", "Remove the document")}>×</button>
                  </span>
                ) : (
                  <button type="button" className={b.dropBtn} onClick={() => fileInput.current?.click()}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4" /></svg>
                    <span><b>{tt("Déposer un document", "Upload a document")}</b><small>{tt("PDF, Word ou PowerPoint · 10 Mo au maximum", "PDF, Word or PowerPoint · 10 MB max")}</small></span>
                  </button>
                )}
                <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              </div>

              {error && <p className={s.error}>{error}</p>}

              <div className={b.composerFoot}>
                <button type="button" className={b.linkBtn} onClick={manual}>{tt("Remplir la fiche à la main", "Fill in the sheet by hand")}</button>
                <button type="button" className={s.btn} disabled={!canRead} onClick={read} data-tour="brief-read">{tt("Lire mon brief", "Read my brief")} <span aria-hidden="true">→</span></button>
              </div>
            </>
          )}
        </section>

        <aside className={b.howto} data-tour="brief-next">
          <h2 className={s.h3}>{tt("Et ensuite", "What happens next")}</h2>
          <ol>
            <li><b>{tt("Vous relisez la fiche", "You review the sheet")}</b><span>{tt("Profils, format, questions à trancher, guide d'entretien : tout se corrige.", "Profiles, format, questions to decide, interview guide: everything can be edited.")}</span></li>
            <li><b>{tt("Des profils sous 24 h", "Profiles within 24h")}</b><span>{tt("Proposés par le moteur, revus un par un par l'équipe.", "Suggested by the engine, reviewed one by one by the team.")}</span></li>
            <li><b>{tt("Vous gardez qui vous voulez", "You keep who you want")}</b><span>{tt("Chaque profil affiche son prix en crédits. Rien n'est débité avant.", "Each profile shows its price in credits. Nothing is charged before.")}</span></li>
            <li><b>{tt("Ils proposent leurs créneaux", "They suggest their slots")}</b><span>{tt("Vous choisissez ; salle de visio et rappels partent seuls.", "You choose; the video room and reminders are sent automatically.")}</span></li>
            <li><b>{tt("Vidéo, transcription, synthèse", "Video, transcript, report")}</b><span>{tt("Après chaque entretien, puis la synthèse de l'étude.", "After each interview, then the study report.")}</span></li>
          </ol>
          <p className={`${s.small} ${s.muted}`} style={{ margin: "14px 0 0" }}>
            {tt("Votre brief reste confidentiel : les participants signent un accord de confidentialité et ne voient pas le nom de votre maison.", "Your brief stays confidential: participants sign a confidentiality agreement and don't see your house's name.")}{" "}
            <Link href="/garanties" target="_blank">{tt("Nos garanties", "Our guarantees")} →</Link>
          </p>
        </aside>
      </div>
      <Tour id="brief" steps={[
        { target: "brief-text", title: tt("Dites qui vous voulez entendre", "Say who you want to hear"), text: tt("Écrivez comme à un collègue : le projet, les personnes à interroger, ce qu'il faudra décider. Deux ou trois phrases suffisent.", "Write as you would to a colleague: the project, the people to interview, what needs deciding. Two or three sentences are enough.") },
        { target: "brief-examples", title: tt("Pas d'inspiration ?", "No inspiration?"), text: tt("Un exemple remplit le champ : vous n'avez plus qu'à l'adapter.", "An example fills in the field: you just adapt it.") },
        { target: "brief-drop", title: tt("Ou déposez votre brief", "Or upload your brief"), text: tt("PDF, Word ou PowerPoint : nous le lisons pour vous, rien n'est envoyé à la marque ou aux participants.", "PDF, Word or PowerPoint: we read it for you, nothing is sent to participants.") },
        { target: "brief-read", title: tt("Lisez-le avec nous", "Read it with us"), text: tt("En une dizaine de secondes, nous en tirons une fiche : profils, format, questions à trancher, guide d'entretien. Vous la corrigez avant d'envoyer.", "In about ten seconds, we turn it into a sheet: profiles, format, questions to decide, interview guide. You edit it before sending.") },
        { target: "brief-next", title: tt("Et ensuite", "What happens next"), text: tt("Vos premiers profils sous 24 h, chacun avec son prix. Rien n'est débité avant que vous gardiez quelqu'un.", "Your first profiles within 24h, each with its price. Nothing is charged until you keep someone.") },
      ]} />
    </div>
  );
}

function Reading({ withFile }: { withFile: boolean }) {
  const tt = useTT();
  const en = useLang() === "en";
  return (
    <div className={b.reading} role="status" aria-live="polite">
      <LoupeScan variant="doc" />
      <b>{withFile ? tt("Lecture de votre document…", "Reading your document…") : tt("Lecture de votre brief…", "Reading your brief…")}</b>
      <ul>
        {(en ? READING_STEPS_EN : READING_STEPS).map((step, i) => <li key={step} style={{ animationDelay: `${0.9 + i * 1.6}s` }}>{step}</li>)}
      </ul>
      <small>{tt("Une dizaine de secondes, un peu plus pour un long document.", "About ten seconds, a little more for a long document.")}</small>
    </div>
  );
}

// ── Relecture de la fiche ──────────────────────────────────────
function Review(p: {
  draft: BriefDraft; setDraft: (d: BriefDraft) => void; moments: string[]; setMoments: (m: string[]) => void;
  fileName: string | null; onBack: () => void; onSend: () => void; sending: boolean; error: string | null;
  mode: "live" | "async"; setMode: (m: "live" | "async") => void; asyncAllowed: boolean;
}) {
  const tt = useTT();
  const en = useLang() === "en";
  const d = p.draft;
  const set = (patch: Partial<BriefDraft>) => p.setDraft({ ...d, ...patch });
  const isAsync = p.mode === "async";
  const total = d.profiles.reduce((n, x) => n + (x.count || 0), 0);
  const maxTotal = isAsync ? ASYNC_MAX : 30;
  const maxPerProfile = isAsync ? 50 : 20;
  const questions = d.guide.filter((q) => q.trim()).length;
  const credits = (tier: "averti" | "initie") => quote(DEFAULT_PRICING, {
    tier, durationMin: isAsync ? ASYNC_MINUTES : d.duration, focusGroup: !isAsync && d.studyType === "FOCUS_GROUP", asyncMode: isAsync,
    certScore: 50, ratings: [], signals: { brandsAccepted90d: 0, shortlisted90d: 0, peers: 30, panelSize: 0 }, overrideCredits: null,
  }).credits;
  const low = credits("averti") * total;
  const high = credits("initie") * total;
  const ready = d.title.trim().length >= 3 && d.objective.trim().length >= 10 && d.profiles.some((x) => x.label.trim()) && total > 0 && total <= maxTotal
    && (!isAsync || questions >= 3);

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <button type="button" className={b.back} onClick={p.onBack}>← {tt("Revenir au brief", "Back to the brief")}</button>
      <p className={s.eyebrow}>{tt("Nouvelle étude · relecture", "New study · review")}</p>
      <h1 className={s.h1}>{tt("Voici ce que nous avons compris", "Here is what we understood")}</h1>
      <p className={s.lead}>{en
        ? `Fix anything that's off: this is the sheet the team will follow to suggest profiles${p.fileName ? `, along with your document “${p.fileName}”` : ""}.`
        : `Corrigez ce qui ne va pas : c'est cette fiche que l'équipe suivra pour vous proposer des profils${p.fileName ? `, avec votre document « ${p.fileName} »` : ""}.`}</p>

      {d.missing.length > 0 && (
        <div className={b.missing}>
          <b>{tt("À préciser si vous le savez", "To clarify if you know")}</b>
          <ul>{d.missing.map((m) => <li key={m}>{m}</li>)}</ul>
          <small>{tt("Répondez directement dans la fiche, par exemple dans « Qui écarter » ou dans la description d'un profil.", "Answer directly in the sheet, for example under “Who to exclude” or in a profile description.")}</small>
        </div>
      )}

      <div className={b.reviewGrid}>
        <div className={b.sections}>
          <section className={s.card}>
            <h2 className={s.h3}>{tt("L'étude", "The study")}</h2>
            <label className={s.label} htmlFor="title">{tt("Titre", "Title")}</label>
            <input id="title" className={s.input} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder={tt("Maroquinerie en cuir recyclé", "Recycled-leather leather goods")} />
            <label className={s.label} htmlFor="objective" style={{ marginTop: 14 }}>{tt("Ce que vous voulez comprendre", "What you want to understand")}</label>
            <textarea id="objective" className={s.input} rows={3} value={d.objective} onChange={(e) => set({ objective: e.target.value })} style={{ resize: "vertical" }} />
          </section>

          <section className={s.card} data-tour="review-profiles">
            <div className={s.spread}><h2 className={s.h3}>{tt("Qui interroger", "Who to interview")}</h2><span className={`${s.small} ${s.muted}`}>{tt(`${total} entretien${total > 1 ? "s" : ""} au total`, `${total} interview${total > 1 ? "s" : ""} in total`)}</span></div>
            <div className={b.profiles}>
              {d.profiles.map((x, i) => (
                <div key={i} className={b.profile}>
                  <div className={b.profileTop}>
                    <input className={s.input} value={x.label} placeholder={tt("Acheteuses de luxe en seconde main", "Second-hand luxury shoppers")} aria-label={tt("Profil", "Profile")}
                      onChange={(e) => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)) })} />
                    <span className={b.stepper}>
                      <button type="button" aria-label={tt("Un de moins", "One less")} onClick={() => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, count: Math.max(1, y.count - 1) } : y)) })}>−</button>
                      <b>{x.count}</b>
                      <button type="button" aria-label={tt("Un de plus", "One more")} onClick={() => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, count: Math.min(maxPerProfile, y.count + 1) } : y)) })}>+</button>
                    </span>
                    {d.profiles.length > 1 && <button type="button" className={b.remove} aria-label={tt("Retirer ce profil", "Remove this profile")} onClick={() => set({ profiles: d.profiles.filter((_, j) => j !== i) })}>×</button>}
                  </div>
                  <input className={`${s.input} ${b.details}`} value={x.details} placeholder={tt("Ce qui fait qu'une personne correspond", "What makes someone a match")}
                    aria-label={tt("Précisions sur ce profil", "Details about this profile")}
                    onChange={(e) => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, details: e.target.value } : y)) })} />
                </div>
              ))}
            </div>
            {d.profiles.length < 4 && <button type="button" className={b.add} onClick={() => set({ profiles: [...d.profiles, { label: "", count: 2, details: "" }] })}>+ {tt("Ajouter un profil", "Add a profile")}</button>}

            <div className={b.inline3}>
              <div>
                <label className={s.label}>{tt("Âge", "Age")}</label>
                <span className={b.ages}>
                  <input className={s.input} inputMode="numeric" value={d.ageMin ?? ""} placeholder="18" aria-label={tt("Âge minimum", "Minimum age")}
                    onChange={(e) => set({ ageMin: e.target.value ? Number(e.target.value.replace(/\D/g, "")) || null : null })} />
                  <span>{tt("à", "to")}</span>
                  <input className={s.input} inputMode="numeric" value={d.ageMax ?? ""} placeholder="65" aria-label={tt("Âge maximum", "Maximum age")}
                    onChange={(e) => set({ ageMax: e.target.value ? Number(e.target.value.replace(/\D/g, "")) || null : null })} />
                </span>
              </div>
              <div>
                <label className={s.label} htmlFor="cities">{tt("Villes ou pays", "Cities or countries")}</label>
                <input id="cities" className={s.input} value={d.cities.join(", ")} placeholder={tt("Partout en France", "Anywhere in France")}
                  onChange={(e) => set({ cities: e.target.value.split(",").map((x) => x.trimStart()) })} />
              </div>
              <div>
                <label className={s.label} htmlFor="brands">{tt("Marques qu'ils connaissent", "Brands they know")}</label>
                <input id="brands" className={s.input} value={d.brandAffinities.join(", ")} placeholder={tt("Facultatif", "Optional")}
                  onChange={(e) => set({ brandAffinities: e.target.value.split(",").map((x) => x.trimStart()) })} />
              </div>
            </div>
            <label className={s.label} htmlFor="excl" style={{ marginTop: 14 }}>{tt("Qui écarter", "Who to exclude")}</label>
            <input id="excl" className={s.input} value={d.exclusions} placeholder={tt("Ex. : personnes travaillant pour une marque concurrente", "E.g.: people working for a competing brand")} onChange={(e) => set({ exclusions: e.target.value })} />
          </section>

          <section className={s.card} data-tour="review-format">
            <h2 className={s.h3}>{tt("Le format", "The format")}</h2>
            {p.asyncAllowed && (
              <div className={b.modes} role="radiogroup" aria-label={tt("Déroulé", "Format")}>
                <button type="button" role="radio" aria-checked={!isAsync} data-on={!isAsync} onClick={() => p.setMode("live")}>
                  <b>{tt("En direct, en visio", "Live, by video")}</b><span>{tt("Vous menez chaque entretien vous-même.", "You run each interview yourself.")}</span>
                </button>
                <button type="button" role="radio" aria-checked={isAsync} data-on={isAsync} onClick={() => { p.setMode("async"); set({ studyType: "ONE_ON_ONE" }); }}>
                  <b>{tt("En autonomie", "Self-paced")} <em>{tt("bêta", "beta")}</em></b><span>{tt(`Chacun répond seul, face caméra, à vos questions. Jusqu'à ${ASYNC_MAX} personnes, environ 3 fois moins cher.`, `Each person answers your questions alone, on camera. Up to ${ASYNC_MAX} people, about 3 times cheaper.`)}</span>
                </button>
              </div>
            )}
            {!isAsync && (
              <div className={b.segment} role="radiogroup" aria-label={tt("Type d'étude", "Study type")} style={p.asyncAllowed ? { marginTop: 14 } : undefined}>
                {[{ v: "ONE_ON_ONE", l: tt("Entretiens individuels", "One-on-one interviews") }, { v: "FOCUS_GROUP", l: "Focus group" }].map((o) => (
                  <button key={o.v} type="button" role="radio" aria-checked={d.studyType === o.v} data-on={d.studyType === o.v}
                    onClick={() => set({ studyType: o.v as BriefDraft["studyType"] })}>{o.l}</button>
                ))}
              </div>
            )}
            <div className={`${b.inline3} ${b.formatRow}`} style={{ marginTop: 14 }}>
              <div>
                <label className={s.label}>{tt("Durée", "Duration")}</label>
                {isAsync ? (
                  <p className={`${s.small} ${s.muted}`} style={{ margin: "6px 0 0" }}>{tt(`Environ ${ASYNC_MINUTES} min, à leur rythme.`, `About ${ASYNC_MINUTES} min, at their own pace.`)}</p>
                ) : (
                  <div className={b.segment} role="radiogroup" aria-label={tt("Durée", "Duration")}>
                    {DURATIONS.map((m) => <button key={m} type="button" role="radio" aria-checked={d.duration === m} data-on={d.duration === m} onClick={() => set({ duration: m })}>{m} min</button>)}
                  </div>
                )}
              </div>
              <div>
                <label className={s.label} htmlFor="deadline">{tt("Terminé avant le", "Done before")}</label>
                <input id="deadline" type="date" className={s.input} value={d.deadline ?? ""} onChange={(e) => set({ deadline: e.target.value || null })} />
              </div>
              <div>
                <label className={s.label}>{tt("Langue", "Language")}</label>
                <div className={b.segment} role="radiogroup" aria-label={tt("Langue", "Language")}>
                  {[{ v: "fr", l: tt("Français", "French") }, { v: "en", l: tt("Anglais", "English") }].map((o) => <button key={o.v} type="button" role="radio" aria-checked={d.language === o.v} data-on={d.language === o.v} onClick={() => set({ language: o.v as "fr" | "en" })}>{o.l}</button>)}
                </div>
              </div>
            </div>
            {!isAsync && (
              <>
                <label className={s.label} style={{ marginTop: 14 }}>{tt("Quand pouvez-vous mener les entretiens ?", "When can you run the interviews?")}</label>
                <div className={b.chips}>
                  {MOMENTS.map((m) => {
                    const on = p.moments.includes(m.id);
                    return <button key={m.id} type="button" data-on={on} aria-pressed={on} onClick={() => p.setMoments(on ? p.moments.filter((x) => x !== m.id) : [...p.moments, m.id])}>{en ? m.en : m.label}</button>;
                  })}
                </div>
                <p className={`${s.small} ${s.faint}`} style={{ margin: "8px 0 0" }}>{tt("Les participants proposeront leurs créneaux dans ces moments-là ; vous choisirez.", "Participants will suggest slots within these times; you choose.")}</p>
              </>
            )}
            {isAsync && <p className={`${s.small} ${s.faint}`} style={{ margin: "12px 0 0" }}>{tt("Aucun créneau à caler : chacun répond quand il veut, avant la date limite. Vous recevez la vidéo et la transcription de chaque réponse.", "No slots to arrange: everyone answers when they want, before the deadline. You get the video and transcript of each answer.")}</p>}
          </section>

          <ListCard
            tour="review-decisions"
            title={tt("Ce que la synthèse devra trancher", "What the report must decide")}
            hint={tt("La synthèse de l'étude sera construite pour répondre à ces questions.", "The study report will be built to answer these questions.")}
            items={d.decisions} placeholder={tt("Faut-il lancer en trois ou cinq coloris ?", "Should we launch in three or five colourways?")} max={5}
            onChange={(decisions) => set({ decisions })}
          />
          <ListCard
            tour="review-guide"
            title={isAsync ? tt("Les questions", "The questions") : tt("Guide d'entretien", "Interview guide")}
            hint={isAsync
              ? (en
                ? `They will appear one by one, black on white; the participant moves on once they have answered. At least three${questions < 3 ? ` (${3 - questions} more)` : ""}.`
                : `Elles s'afficheront une par une, en noir sur fond blanc ; le participant passe à la suivante quand il a répondu. Trois au minimum${questions < 3 ? ` (encore ${3 - questions})` : ""}.`)
              : tt("Il s'affichera à côté de la visio. Vous restez libre de vos questions.", "It will show next to the video. You remain free to ask what you want.")}
            items={d.guide} placeholder={tt("Parlez-moi de votre dernier achat de maroquinerie.", "Tell me about your last leather goods purchase.")} max={12} numbered
            onChange={(guide) => set({ guide })}
          />
        </div>

        <aside className={b.summary}>
          <div className={b.summaryCard} data-tour="review-send">
            <h2 className={s.h3}>{tt("Votre étude", "Your study")}</h2>
            <dl>
              <div><dt>{isAsync ? tt("Réponses vidéo", "Video answers") : tt("Entretiens", "Interviews")}</dt><dd>{isAsync ? tt(`${total} × environ ${ASYNC_MINUTES} min · en autonomie`, `${total} × about ${ASYNC_MINUTES} min · self-paced`) : `${total} × ${d.duration} min${d.studyType === "FOCUS_GROUP" ? " · focus group" : ""}`}</dd></div>
              <div><dt>{tt("Profils", "Profiles")}</dt><dd>{d.profiles.filter((x) => x.label.trim()).map((x) => `${x.count} ${x.label.trim()}`).join(" · ") || tt("À décrire", "To describe")}</dd></div>
              <div><dt>{tt("Budget estimé", "Estimated budget")}</dt><dd>{tt(`${low} à ${high} crédits`, `${low} to ${high} credits`)}<small>{en
                ? `i.e. €${(low * 10).toLocaleString("en-GB")} to €${(high * 10).toLocaleString("en-GB")} excl. VAT, depending on the profiles you keep`
                : `soit ${(low * 10).toLocaleString("fr-FR")} à ${(high * 10).toLocaleString("fr-FR")} € HT, selon les profils retenus`}</small></dd></div>
            </dl>
            <p className={b.promise}>{tt("Vos premiers profils sous 24 h, revus un par un par l'équipe. Rien n'est débité avant que vous gardiez un profil.", "Your first profiles within 24h, reviewed one by one by the team. Nothing is charged until you keep a profile.")}</p>
            {p.error && <p className={s.error}>{p.error}</p>}
            <button type="button" className={`${s.btn} ${s.btnBlock}`} disabled={!ready || p.sending} onClick={p.onSend}>
              {p.sending ? tt("Envoi…", "Sending…") : tt("Envoyer le brief →", "Send the brief →")}
            </button>
            {!ready && <p className={`${s.small} ${s.faint}`} style={{ margin: "8px 0 0" }}>
              {total > maxTotal ? tt(`${maxTotal} personnes au maximum par étude.`, `${maxTotal} people max per study.`) : isAsync && questions < 3 ? tt("Écrivez au moins trois questions.", "Write at least three questions.") : tt("Il manque un titre, l'objectif ou au moins un profil.", "A title, the objective or at least one profile is missing.")}
            </p>}
            <p className={`${s.small} ${s.faint}`} style={{ margin: "10px 0 0" }}>{tt("Une question ?", "A question?")} <Link href="/brand/messages">{tt("Écrivez-nous", "Write to us")}</Link>.</p>
          </div>
        </aside>
      </div>
      <Tour id="brief-review" steps={[
        { target: "review-profiles", title: tt("Qui nous allons chercher", "Who we will look for"), text: tt("Chaque groupe de profils, avec le nombre d'entretiens. Précisez ce qui fait qu'une personne correspond : c'est ce que l'équipe suivra.", "Each group of profiles, with the number of interviews. Say what makes someone a match: that is what the team will follow.") },
        { target: "review-format", title: tt("Le format", "The format"), text: tt("Durée, date limite, et les moments où vous pouvez mener les entretiens : les participants proposeront leurs créneaux dedans.", "Duration, deadline, and when you can run interviews: participants will suggest slots within them.") },
        { target: "review-decisions", title: tt("Ce que la synthèse devra trancher", "What the report must decide"), text: tt("Les choix que vous aurez à faire après l'étude. La synthèse y répondra directement, citations à l'appui.", "The choices you'll have to make after the study. The report will answer them directly, with quotes.") },
        { target: "review-guide", title: tt("Votre guide d'entretien", "Your interview guide"), text: tt("Il s'affichera à côté de la visio. Modifiez, ajoutez, supprimez : vous restez libre pendant l'entretien.", "It will show next to the video. Edit, add, delete: you stay free during the interview.") },
        { target: "review-send", title: tt("Envoyez", "Send"), text: tt("Le budget est une estimation : le prix exact s'affiche sur chaque profil proposé.", "The budget is an estimate: the exact price shows on each suggested profile.") },
      ]} />
    </div>
  );
}

function ListCard(p: { title: string; hint: string; items: string[]; placeholder: string; max: number; numbered?: boolean; tour?: string; onChange: (v: string[]) => void }) {
  const tt = useTT();
  return (
    <section className={s.card} data-tour={p.tour}>
      <h2 className={s.h3}>{p.title}</h2>
      <p className={`${s.small} ${s.muted}`} style={{ margin: "0 0 12px" }}>{p.hint}</p>
      <ol className={b.list} data-numbered={!!p.numbered}>
        {p.items.map((item, i) => (
          <li key={i}>
            {p.numbered && <span className={b.num}>{i + 1}</span>}
            <textarea className={`${s.input} ${b.listInput}`} rows={1} value={item} placeholder={p.placeholder} aria-label={`${p.title} ${i + 1}`}
              onChange={(e) => p.onChange(p.items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className={b.remove} aria-label={tt("Retirer", "Remove")} onClick={() => p.onChange(p.items.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ol>
      {p.items.length < p.max && <button type="button" className={b.add} onClick={() => p.onChange([...p.items, ""])}>+ {tt("Ajouter", "Add")}</button>}
    </section>
  );
}
