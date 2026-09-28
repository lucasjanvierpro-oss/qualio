"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import { createStudy } from "@/app/actions/studies";
import { DEFAULT_PRICING } from "@/lib/pricing/config";
import { quote } from "@/lib/pricing/engine";
import { DURATIONS, EMPTY_DRAFT, type BriefDraft } from "@/lib/studies/briefTypes";
import b from "./brief.module.css";

// Nouvelle étude, en deux temps. La marque écrit ce qu'elle cherche ou dépose
// son brief ; l'IA en tire une fiche (profils, format, ce que la synthèse
// devra trancher, guide d'entretien). La marque la relit, corrige, envoie.

type Phase = "write" | "reading" | "review";

const EXAMPLES = [
  { label: "Lancer une ligne", text: "On lance une ligne de maroquinerie en cuir recyclé à l'automne. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et deux ou trois vendeuses en boutique. Il faut trancher le prix de lancement et le nombre de coloris." },
  { label: "Tester un prix", text: "Nous hésitons à passer notre sneaker phare de 290 à 340 €. Nous voulons comprendre comment nos clients fidèles et des revendeurs sneakers perçoivent cette hausse, et ce qui la rendrait acceptable." },
  { label: "Comprendre une clientèle", text: "Nos clientes de 25-35 ans achètent de moins en moins en boutique. On veut comprendre où et comment elles découvrent les marques aujourd'hui, avec des clientes averties et quelques créatrices de contenu mode." },
];

const MOMENTS = [
  { id: "matin", label: "Matin" },
  { id: "midi", label: "Midi" },
  { id: "apres-midi", label: "Après-midi" },
  { id: "soir", label: "Soir" },
];

const READING_STEPS = ["Qui interroger", "Le format", "Ce que la synthèse devra trancher", "Le guide d'entretien"];

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md";

export default function NewStudyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("write");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BriefDraft>(EMPTY_DRAFT);
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [moments, setMoments] = useState<string[]>(["matin", "apres-midi"]);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const canRead = text.trim().length >= 20 || !!file;

  function pick(f: File | undefined | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "pptx", "txt", "md"].includes(ext)) { setError("Format non pris en charge : PDF, Word (.docx), PowerPoint (.pptx) ou texte."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Document trop lourd : 10 Mo au maximum."); return; }
    setError(null);
    setFile(f);
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
      if (!res.ok || !json.draft) throw new Error(json.error ?? "La lecture a échoué. Réessayez, ou remplissez la fiche à la main.");
      setDraft(json.draft);
      setSource(json.source ?? text);
      setFileName(json.fileName ?? null);
      setPhase("review");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "La lecture a échoué.");
      setPhase("write");
    }
  }

  function manual() {
    setDraft({ ...EMPTY_DRAFT, objective: text.trim() });
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
      availability: moments,
    }).catch(() => ({ error: "L'envoi a échoué. Réessayez." }));
    if ("studyId" in r) { router.push(`/brand/studies/${r.studyId}?nouveau=1`); return; }
    if (r.error === "preview_mode") { router.push("/brand/account"); return; }
    if (r.error === "session_expired") { setError("Votre session a expiré : reconnectez-vous dans un autre onglet, puis renvoyez."); setSending(false); return; }
    setError(r.error);
    setSending(false);
  }

  if (phase === "review") {
    return <Review draft={draft} setDraft={setDraft} moments={moments} setMoments={setMoments} fileName={fileName}
      onBack={() => setPhase("write")} onSend={send} sending={sending} error={error} />;
  }

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <p className={s.eyebrow}>Nouvelle étude</p>
      <h1 className={s.h1}>Qui voulez-vous entendre&nbsp;?</h1>
      <p className={s.lead}>Écrivez ce que vous cherchez comme à un collègue, ou déposez votre brief. Nous en tirons la fiche de l&apos;étude ; vous la relisez avant de l&apos;envoyer.</p>

      <div className={b.writeGrid}>
        <section className={b.composer} data-busy={phase === "reading"}>
          {phase === "reading" ? (
            <Reading withFile={!!file} />
          ) : (
            <>
              <textarea
                className={b.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Ex. : on lance une ligne de maroquinerie en cuir recyclé. On veut entendre des acheteuses de luxe qui achètent aussi en seconde main, et quelques vendeuses en boutique. Il faut décider du prix et du nombre de coloris."
                aria-label="Votre brief"
              />
              <div className={b.examples}>
                <span>Exemples :</span>
                {EXAMPLES.map((x) => <button key={x.label} type="button" onClick={() => setText(x.text)}>{x.label}</button>)}
              </div>

              <div
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
                    <span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo</small></span>
                    <button type="button" className={b.remove} onClick={() => setFile(null)} aria-label="Retirer le document">×</button>
                  </span>
                ) : (
                  <button type="button" className={b.dropBtn} onClick={() => fileInput.current?.click()}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4" /></svg>
                    <span><b>Déposer un document</b><small>PDF, Word ou PowerPoint · 10 Mo au maximum</small></span>
                  </button>
                )}
                <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              </div>

              {error && <p className={s.error}>{error}</p>}

              <div className={b.composerFoot}>
                <button type="button" className={b.linkBtn} onClick={manual}>Remplir la fiche à la main</button>
                <button type="button" className={s.btn} disabled={!canRead} onClick={read}>Lire mon brief <span aria-hidden="true">→</span></button>
              </div>
            </>
          )}
        </section>

        <aside className={b.howto}>
          <h2 className={s.h3}>Et ensuite</h2>
          <ol>
            <li><b>Vous relisez la fiche</b><span>Profils, format, questions à trancher, guide d&apos;entretien : tout se corrige.</span></li>
            <li><b>Des profils sous 24 h</b><span>Proposés par le moteur, revus un par un par l&apos;équipe.</span></li>
            <li><b>Vous gardez qui vous voulez</b><span>Chaque profil affiche son prix en crédits. Rien n&apos;est débité avant.</span></li>
            <li><b>Ils proposent leurs créneaux</b><span>Vous choisissez ; salle de visio et rappels partent seuls.</span></li>
            <li><b>Vidéo, transcription, synthèse</b><span>Après chaque entretien, puis la synthèse de l&apos;étude.</span></li>
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Reading({ withFile }: { withFile: boolean }) {
  return (
    <div className={b.reading} role="status" aria-live="polite">
      <span className={b.spinner} aria-hidden="true" />
      <b>{withFile ? "Lecture de votre document…" : "Lecture de votre brief…"}</b>
      <ul>
        {READING_STEPS.map((step, i) => <li key={step} style={{ animationDelay: `${0.9 + i * 1.6}s` }}>{step}</li>)}
      </ul>
      <small>Une dizaine de secondes, un peu plus pour un long document.</small>
    </div>
  );
}

// ── Relecture de la fiche ──────────────────────────────────────
function Review(p: {
  draft: BriefDraft; setDraft: (d: BriefDraft) => void; moments: string[]; setMoments: (m: string[]) => void;
  fileName: string | null; onBack: () => void; onSend: () => void; sending: boolean; error: string | null;
}) {
  const d = p.draft;
  const set = (patch: Partial<BriefDraft>) => p.setDraft({ ...d, ...patch });
  const total = d.profiles.reduce((n, x) => n + (x.count || 0), 0);
  const credits = (tier: "averti" | "initie") => quote(DEFAULT_PRICING, {
    tier, durationMin: d.duration, focusGroup: d.studyType === "FOCUS_GROUP",
    certScore: 50, ratings: [], signals: { brandsAccepted90d: 0, shortlisted90d: 0, peers: 30, panelSize: 0 }, overrideCredits: null,
  }).credits;
  const low = credits("averti") * total;
  const high = credits("initie") * total;
  const ready = d.title.trim().length >= 3 && d.objective.trim().length >= 10 && d.profiles.some((x) => x.label.trim()) && total > 0 && total <= 30;

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <button type="button" className={b.back} onClick={p.onBack}>← Revenir au brief</button>
      <p className={s.eyebrow}>Nouvelle étude · relecture</p>
      <h1 className={s.h1}>Voici ce que nous avons compris</h1>
      <p className={s.lead}>Corrigez ce qui ne va pas : c&apos;est cette fiche que l&apos;équipe suivra pour vous proposer des profils{p.fileName ? `, avec votre document « ${p.fileName} »` : ""}.</p>

      {d.missing.length > 0 && (
        <div className={b.missing}>
          <b>À préciser si vous le savez</b>
          <ul>{d.missing.map((m) => <li key={m}>{m}</li>)}</ul>
          <small>Répondez directement dans la fiche, par exemple dans « Qui écarter » ou dans la description d&apos;un profil.</small>
        </div>
      )}

      <div className={b.reviewGrid}>
        <div className={b.sections}>
          <section className={s.card}>
            <h2 className={s.h3}>L&apos;étude</h2>
            <label className={s.label} htmlFor="title">Titre</label>
            <input id="title" className={s.input} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Maroquinerie en cuir recyclé" />
            <label className={s.label} htmlFor="objective" style={{ marginTop: 14 }}>Ce que vous voulez comprendre</label>
            <textarea id="objective" className={s.input} rows={3} value={d.objective} onChange={(e) => set({ objective: e.target.value })} style={{ resize: "vertical" }} />
          </section>

          <section className={s.card}>
            <div className={s.spread}><h2 className={s.h3}>Qui interroger</h2><span className={`${s.small} ${s.muted}`}>{total} entretien{total > 1 ? "s" : ""} au total</span></div>
            <div className={b.profiles}>
              {d.profiles.map((x, i) => (
                <div key={i} className={b.profile}>
                  <div className={b.profileTop}>
                    <input className={s.input} value={x.label} placeholder="Acheteuses de luxe en seconde main" aria-label="Profil"
                      onChange={(e) => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)) })} />
                    <span className={b.stepper}>
                      <button type="button" aria-label="Un de moins" onClick={() => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, count: Math.max(1, y.count - 1) } : y)) })}>−</button>
                      <b>{x.count}</b>
                      <button type="button" aria-label="Un de plus" onClick={() => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, count: Math.min(20, y.count + 1) } : y)) })}>+</button>
                    </span>
                    {d.profiles.length > 1 && <button type="button" className={b.remove} aria-label="Retirer ce profil" onClick={() => set({ profiles: d.profiles.filter((_, j) => j !== i) })}>×</button>}
                  </div>
                  <input className={`${s.input} ${b.details}`} value={x.details} placeholder="Ce qui fait qu'une personne correspond"
                    aria-label="Précisions sur ce profil"
                    onChange={(e) => set({ profiles: d.profiles.map((y, j) => (j === i ? { ...y, details: e.target.value } : y)) })} />
                </div>
              ))}
            </div>
            {d.profiles.length < 4 && <button type="button" className={b.add} onClick={() => set({ profiles: [...d.profiles, { label: "", count: 2, details: "" }] })}>+ Ajouter un profil</button>}

            <div className={b.inline3}>
              <div>
                <label className={s.label}>Âge</label>
                <span className={b.ages}>
                  <input className={s.input} inputMode="numeric" value={d.ageMin ?? ""} placeholder="18" aria-label="Âge minimum"
                    onChange={(e) => set({ ageMin: e.target.value ? Number(e.target.value.replace(/\D/g, "")) || null : null })} />
                  <span>à</span>
                  <input className={s.input} inputMode="numeric" value={d.ageMax ?? ""} placeholder="65" aria-label="Âge maximum"
                    onChange={(e) => set({ ageMax: e.target.value ? Number(e.target.value.replace(/\D/g, "")) || null : null })} />
                </span>
              </div>
              <div>
                <label className={s.label} htmlFor="cities">Villes ou pays</label>
                <input id="cities" className={s.input} value={d.cities.join(", ")} placeholder="Partout en France"
                  onChange={(e) => set({ cities: e.target.value.split(",").map((x) => x.trimStart()) })} />
              </div>
              <div>
                <label className={s.label} htmlFor="brands">Marques qu&apos;ils connaissent</label>
                <input id="brands" className={s.input} value={d.brandAffinities.join(", ")} placeholder="Facultatif"
                  onChange={(e) => set({ brandAffinities: e.target.value.split(",").map((x) => x.trimStart()) })} />
              </div>
            </div>
            <label className={s.label} htmlFor="excl" style={{ marginTop: 14 }}>Qui écarter</label>
            <input id="excl" className={s.input} value={d.exclusions} placeholder="Ex. : personnes travaillant pour une marque concurrente" onChange={(e) => set({ exclusions: e.target.value })} />
          </section>

          <section className={s.card}>
            <h2 className={s.h3}>Le format</h2>
            <div className={b.segment} role="radiogroup" aria-label="Type d'étude">
              {[{ v: "ONE_ON_ONE", l: "Entretiens individuels" }, { v: "FOCUS_GROUP", l: "Focus group" }].map((o) => (
                <button key={o.v} type="button" role="radio" aria-checked={d.studyType === o.v} data-on={d.studyType === o.v}
                  onClick={() => set({ studyType: o.v as BriefDraft["studyType"] })}>{o.l}</button>
              ))}
            </div>
            <div className={b.inline3} style={{ marginTop: 14 }}>
              <div>
                <label className={s.label}>Durée</label>
                <div className={b.segment} role="radiogroup" aria-label="Durée">
                  {DURATIONS.map((m) => <button key={m} type="button" role="radio" aria-checked={d.duration === m} data-on={d.duration === m} onClick={() => set({ duration: m })}>{m} min</button>)}
                </div>
              </div>
              <div>
                <label className={s.label} htmlFor="deadline">Terminé avant le</label>
                <input id="deadline" type="date" className={s.input} value={d.deadline ?? ""} onChange={(e) => set({ deadline: e.target.value || null })} />
              </div>
              <div>
                <label className={s.label}>Langue</label>
                <div className={b.segment} role="radiogroup" aria-label="Langue">
                  {[{ v: "fr", l: "Français" }, { v: "en", l: "Anglais" }].map((o) => <button key={o.v} type="button" role="radio" aria-checked={d.language === o.v} data-on={d.language === o.v} onClick={() => set({ language: o.v as "fr" | "en" })}>{o.l}</button>)}
                </div>
              </div>
            </div>
            <label className={s.label} style={{ marginTop: 14 }}>Quand pouvez-vous mener les entretiens ?</label>
            <div className={b.chips}>
              {MOMENTS.map((m) => {
                const on = p.moments.includes(m.id);
                return <button key={m.id} type="button" data-on={on} aria-pressed={on} onClick={() => p.setMoments(on ? p.moments.filter((x) => x !== m.id) : [...p.moments, m.id])}>{m.label}</button>;
              })}
            </div>
            <p className={`${s.small} ${s.faint}`} style={{ margin: "8px 0 0" }}>Les participants proposeront leurs créneaux dans ces moments-là ; vous choisirez.</p>
          </section>

          <ListCard
            title="Ce que la synthèse devra trancher"
            hint="La synthèse de l'étude sera construite pour répondre à ces questions."
            items={d.decisions} placeholder="Faut-il lancer en trois ou cinq coloris ?" max={5}
            onChange={(decisions) => set({ decisions })}
          />
          <ListCard
            title="Guide d'entretien"
            hint="Il s'affichera à côté de la visio. Vous restez libre de vos questions."
            items={d.guide} placeholder="Parlez-moi de votre dernier achat de maroquinerie." max={12} numbered
            onChange={(guide) => set({ guide })}
          />
        </div>

        <aside className={b.summary}>
          <div className={b.summaryCard}>
            <h2 className={s.h3}>Votre étude</h2>
            <dl>
              <div><dt>Entretiens</dt><dd>{total} × {d.duration} min{d.studyType === "FOCUS_GROUP" ? " · focus group" : ""}</dd></div>
              <div><dt>Profils</dt><dd>{d.profiles.filter((x) => x.label.trim()).map((x) => `${x.count} ${x.label.trim()}`).join(" · ") || "À décrire"}</dd></div>
              <div><dt>Budget estimé</dt><dd>{low} à {high} crédits<small>soit {(low * 10).toLocaleString("fr-FR")} à {(high * 10).toLocaleString("fr-FR")} € HT, selon les profils retenus</small></dd></div>
            </dl>
            <p className={b.promise}>Vos premiers profils sous 24 h, revus un par un par l&apos;équipe. Rien n&apos;est débité avant que vous gardiez un profil.</p>
            {p.error && <p className={s.error}>{p.error}</p>}
            <button type="button" className={`${s.btn} ${s.btnBlock}`} disabled={!ready || p.sending} onClick={p.onSend}>
              {p.sending ? "Envoi…" : "Envoyer le brief →"}
            </button>
            {!ready && <p className={`${s.small} ${s.faint}`} style={{ margin: "8px 0 0" }}>Il manque un titre, l&apos;objectif ou au moins un profil.</p>}
            <p className={`${s.small} ${s.faint}`} style={{ margin: "10px 0 0" }}>Une question ? <Link href="/brand/messages">Écrivez-nous</Link>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ListCard(p: { title: string; hint: string; items: string[]; placeholder: string; max: number; numbered?: boolean; onChange: (v: string[]) => void }) {
  return (
    <section className={s.card}>
      <h2 className={s.h3}>{p.title}</h2>
      <p className={`${s.small} ${s.muted}`} style={{ margin: "0 0 12px" }}>{p.hint}</p>
      <ol className={b.list} data-numbered={!!p.numbered}>
        {p.items.map((item, i) => (
          <li key={i}>
            {p.numbered && <span className={b.num}>{i + 1}</span>}
            <textarea className={`${s.input} ${b.listInput}`} rows={1} value={item} placeholder={p.placeholder} aria-label={`${p.title} ${i + 1}`}
              onChange={(e) => p.onChange(p.items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className={b.remove} aria-label="Retirer" onClick={() => p.onChange(p.items.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ol>
      {p.items.length < p.max && <button type="button" className={b.add} onClick={() => p.onChange([...p.items, ""])}>+ Ajouter</button>}
    </section>
  );
}
