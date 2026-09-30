"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import s from "@/components/rl/rl.module.css";
import { useLang } from "@/lib/i18n/client";
import r from "./report.module.css";

// ─── Rapport structuré (généré par lib/reports/generate.ts) ─────────
type Tonalite = "positif" | "neutre" | "negatif";
type Point = { titre: string; detail: string; verbatim?: string; participant?: string };
type Insight = { titre: string; observe: string; revele: string; verbatim?: string; participant?: string; implication: string };
type Theme = { nom: string; resume: string; intensite: number; tonalite?: Tonalite };
type Verbatim = { content: string; participant: string; theme?: string; tonalite?: Tonalite };
type Persona = { nom: string; portrait: string; posture: string };
type Reco = { titre: string; detail: string };
type Reponse = { question: string; reponse: string; appui?: string; confiance?: "forte" | "moyenne" | "faible"; verbatim?: string; participant?: string };
type Segment = { profil: string; difference: string };
const CONFIANCE: Record<string, string> = { forte: "Confiance forte", moyenne: "Confiance moyenne", faible: "Confiance faible" };
const CONFIANCE_EN: Record<string, string> = { forte: "High confidence", moyenne: "Medium confidence", faible: "Low confidence" };

export type StructuredReport = {
  titre?: string;
  problematique?: string;
  syntheseExecutive?: string;
  forces?: Point[];
  vigilance?: Point[];
  insights?: Insight[];
  themes?: Theme[];
  verbatims?: Verbatim[];
  personas?: Persona[];
  signauxFaibles?: string[];
  questionsOuvertes?: string[];
  recommandations?: Reco[];
  /** Réponses aux questions que la marque voulait trancher (brief). */
  reponses?: Reponse[];
  segments?: Segment[];
  qualite?: { citations: number; verifiees: number; corrigees: number; retirees: number };
  methodologie?: string;
};

export type ReportInterview = {
  id: string;
  person: string;
  profession: string | null;
  scheduledAt: string;
  status: string;
  transcript: string | null;
  hasVideo: boolean;
  videoExpired: boolean;
};

const TZ = "Europe/Paris";
const fmtDate = (iso: string, en = false) => new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const fmtShort = (iso: string, en = false) => new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const TONE: Record<Tonalite, { label: string; cls: string }> = {
  positif: { label: "Positif", cls: s.badgeOk },
  neutre: { label: "Neutre", cls: "" },
  negatif: { label: "Friction", cls: s.badgeBad },
};
const TONE_EN: Record<Tonalite, { label: string; cls: string }> = {
  positif: { label: "Positive", cls: s.badgeOk },
  neutre: { label: "Neutral", cls: "" },
  negatif: { label: "Friction", cls: s.badgeBad },
};

function Quote({ text, who }: { text: string; who?: string }) {
  return (
    <figure className={r.quote}>
      <blockquote>« {text} »</blockquote>
      {who && <figcaption>{who}</figcaption>}
    </figure>
  );
}

// Une transcription Whereby : « [horodatage] Nom: texte » par ligne.
function Transcript({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^\[(.+?)\]\s*([^:]{1,60}):\s*(.*)$/);
    if (!m) return { time: "", who: "", said: l };
    const d = new Date(m[1]);
    const time = Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
    return { time, who: m[2], said: m[3] };
  });
  return (
    <div className={r.transcript}>
      {lines.map((l, i) => (
        <p key={i}>{l.time && <time>{l.time}</time>}{l.who && <strong>{l.who}</strong>}<span>{l.said}</span></p>
      ))}
    </div>
  );
}

const TABS = [
  { id: "synthese", label: "Synthèse" },
  { id: "enseignements", label: "Enseignements" },
  { id: "verbatims", label: "Verbatims" },
  { id: "profils", label: "Profils types" },
  { id: "entretiens", label: "Entretiens" },
  { id: "methode", label: "Méthodologie" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const TABS_EN: Record<TabId, string> = { synthese: "Summary", enseignements: "Insights", verbatims: "Quotes", profils: "Personas", entretiens: "Interviews", methode: "Methodology" };

export default function StudyReportView({
  studyId, studyTitle, brandName, generatedAt, report, legacyText, interviews,
}: {
  studyId: string;
  studyTitle: string;
  brandName: string;
  generatedAt: string | null;
  report: StructuredReport | null;
  legacyText: string | null;
  interviews: ReportInterview[];
}) {
  const en = useLang() === "en";
  const tt = (fr: string, e: string) => (en ? e : fr);
  const TONES = en ? TONE_EN : TONE;
  const [tab, setTab] = useState<TabId>(report ? "synthese" : "entretiens");
  const [theme, setTheme] = useState<string>("");
  const [tone, setTone] = useState<Tonalite | "">("");
  const [open, setOpen] = useState<string | null>(null);

  const transcribed = interviews.filter((i) => i.transcript).length;
  const expected = interviews.filter((i) => i.status !== "no_show").length;
  const verbatims = useMemo(
    () => (report?.verbatims ?? []).filter((v) => (!theme || v.theme === theme) && (!tone || v.tonalite === tone)),
    [report, theme, tone],
  );
  const themeNames = [...new Set((report?.verbatims ?? []).map((v) => v.theme).filter(Boolean))] as string[];
  const show = (id: TabId) => tab === id;

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <nav className={`${s.crumbs} ${r.noPrint}`}>
        <Link href="/brand/studies">{tt("Mes études", "My studies")}</Link><span>›</span>
        <Link href={`/brand/studies/${studyId}`}>{studyTitle}</Link><span>›</span><span>{tt("Synthèse", "Report")}</span>
      </nav>

      <header className={s.spread} style={{ alignItems: "flex-end" }}>
        <div>
          <p className={s.eyebrow}>{brandName} · {tt("Synthèse qualitative", "Qualitative report")}{generatedAt ? ` · ${fmtDate(generatedAt, en)}` : ""}</p>
          <h1 className={s.h1}>{report?.titre ?? studyTitle}</h1>
          {report?.titre && <p className={s.lead} style={{ marginTop: 6 }}>{studyTitle}</p>}
          <div className={s.meta}>
            <span>{interviews.length} {tt(`entretien${interviews.length > 1 ? "s" : ""}`, `interview${interviews.length > 1 ? "s" : ""}`)}</span>
            <span>{transcribed} {tt(`transcrit${transcribed > 1 ? "s" : ""}`, "transcribed")}</span>
          </div>
        </div>
        {(report || legacyText) && (
          <button type="button" className={`${s.btn} ${s.btnGhost} ${r.noPrint}`} onClick={() => window.print()}>{tt("Exporter en PDF", "Export as PDF")}</button>
        )}
      </header>

      {!report && !legacyText && (
        <section className={`${s.cardDark} ${s.sectionGap}`}>
          <h2 className={s.h1} style={{ fontSize: 28 }}>{tt("La synthèse arrive.", "The report is on its way.")}</h2>
          <p className={s.muted} style={{ margin: "8px 0 0", maxWidth: "56ch" }}>
            {en
              ? `It is generated automatically once every interview is transcribed. So far: ${transcribed} of ${expected}. You will get an email. Meanwhile, the available transcripts are below.`
              : `Elle est générée automatiquement dès que tous les entretiens sont transcrits. Pour l'instant : ${transcribed} sur ${expected}. Vous recevrez un email. En attendant, les transcriptions disponibles sont ci-dessous.`}
          </p>
          <div className={r.meter} aria-hidden="true"><i style={{ width: `${expected ? (transcribed / expected) * 100 : 0}%` }} /></div>
        </section>
      )}

      {legacyText && (
        <section className={`${s.card} ${s.sectionGap}`} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{legacyText}</section>
      )}

      <div className={`${r.tabs} ${r.noPrint}`} role="tablist" aria-label={tt("Sections de la synthèse", "Report sections")}>
        {TABS.filter((t) => report || t.id === "entretiens").map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? r.tabOn : ""} onClick={() => setTab(t.id)}>{en ? TABS_EN[t.id] : t.label}</button>
        ))}
      </div>

      {/* ── Synthèse ── */}
      {report && (
        <section className={r.panel} data-show={show("synthese")} aria-label={tt("Synthèse", "Summary")}>
          <h2 className={r.printTitle}>{tt("Synthèse", "Summary")}</h2>
          {report.syntheseExecutive && <p className={r.exec}>{report.syntheseExecutive}</p>}
          {(report.reponses ?? []).length > 0 && (
            <div className={s.card}>
              <h3 className={s.h3}>{tt("Vos questions, ce qu'en disent les entretiens", "Your questions, what the interviews say")}</h3>
              <ol className={r.recos}>
                {report.reponses!.map((rp) => (
                  <li key={rp.question}>
                    <strong>{rp.question}</strong>
                    {rp.confiance && <span className={`${s.badge} ${rp.confiance === "forte" ? s.badgeOk : rp.confiance === "moyenne" ? s.badgeWait : s.badgePlain}`} style={{ justifySelf: "start" }}>{(en ? CONFIANCE_EN : CONFIANCE)[rp.confiance] ?? rp.confiance}</span>}
                    <span className={s.muted}>{rp.reponse}{rp.appui ? ` · ${rp.appui}` : ""}</span>
                    {rp.verbatim && <Quote text={rp.verbatim} who={rp.participant} />}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(report.segments ?? []).length > 0 && (
            <div className={s.card}>
              <h3 className={s.h3}>{tt("Ce que chaque profil voit autrement", "What each profile sees differently")}</h3>
              <ul className={r.list}>
                {report.segments!.map((sg) => <li key={sg.profil}><strong>{sg.profil}</strong> — {sg.difference}</li>)}
              </ul>
            </div>
          )}
          {report.problematique && (
            <div className={s.cardSoft}><h3 className={s.h3}>{tt("La vraie question", "The real question")}</h3><p className={s.muted} style={{ margin: 0 }}>{report.problematique}</p></div>
          )}
          <div className={s.grid2}>
            {[{ title: tt("Ce qui porte", "What works"), items: report.forces, cls: s.badgeOk }, { title: tt("Points de vigilance", "Watch-outs"), items: report.vigilance, cls: s.badgeBad }].map((col) => (
              <div key={col.title} className={s.card} style={{ display: "grid", gap: 16, alignContent: "start" }}>
                <span className={`${s.badge} ${col.cls}`} style={{ justifySelf: "start" }}>{col.title}</span>
                {(col.items ?? []).map((pt) => (
                  <div key={pt.titre}>
                    <h3 className={s.h3}>{pt.titre}</h3>
                    <p className={s.muted} style={{ margin: "0 0 8px" }}>{pt.detail}</p>
                    {pt.verbatim && <Quote text={pt.verbatim} who={pt.participant} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {(report.recommandations ?? []).length > 0 && (
            <div className={s.card}>
              <h3 className={s.h3}>{tt("Pistes de réflexion", "Ideas to consider")}</h3>
              <ol className={r.recos}>
                {report.recommandations!.map((rc) => <li key={rc.titre}><strong>{rc.titre}</strong><span className={s.muted}>{rc.detail}</span></li>)}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* ── Enseignements ── */}
      {report && (
        <section className={r.panel} data-show={show("enseignements")} aria-label={tt("Enseignements", "Insights")}>
          <h2 className={r.printTitle}>{tt("Enseignements", "Insights")}</h2>
          {(report.insights ?? []).map((ins, i) => (
            <article key={ins.titre} className={s.card} style={{ display: "grid", gap: 12 }}>
              <p className={s.eyebrow} style={{ margin: 0 }}>{tt("Enseignement", "Insight")} {i + 1}</p>
              <h3 className={s.h2} style={{ margin: 0, textTransform: "none" }}>{ins.titre.charAt(0) + ins.titre.slice(1).toLowerCase()}</h3>
              <div className={s.grid2}>
                <div><p className={`${s.small} ${s.faint}`} style={{ margin: "0 0 4px" }}>{tt("Ce qu'on observe", "What we observe")}</p><p style={{ margin: 0 }}>{ins.observe}</p></div>
                <div><p className={`${s.small} ${s.faint}`} style={{ margin: "0 0 4px" }}>{tt("Ce que ça révèle", "What it reveals")}</p><p style={{ margin: 0 }}>{ins.revele}</p></div>
              </div>
              {ins.verbatim && <Quote text={ins.verbatim} who={ins.participant} />}
              <p className={r.implication}><strong>{tt("Pour la marque", "For the brand")}</strong> {ins.implication}</p>
            </article>
          ))}
          {(report.themes ?? []).length > 0 && (
            <div className={s.card}>
              <h3 className={s.h3}>{tt("Thèmes, par intensité", "Themes, by intensity")}</h3>
              <div className={r.themes}>
                {[...report.themes!].sort((a, b) => b.intensite - a.intensite).map((t) => (
                  <div key={t.nom} className={r.theme}>
                    <div className={s.spread}><strong>{t.nom}</strong>{t.tonalite && <span className={`${s.badge} ${TONES[t.tonalite].cls}`}>{TONES[t.tonalite].label}</span>}</div>
                    <div className={r.meter}><i style={{ width: `${Math.max(1, Math.min(5, t.intensite)) * 20}%` }} /></div>
                    <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>{t.resume}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={s.grid2}>
            {(report.signauxFaibles ?? []).length > 0 && (
              <div className={s.cardSoft}><h3 className={s.h3}>{tt("Signaux faibles", "Weak signals")}</h3><ul className={r.list}>{report.signauxFaibles!.map((x) => <li key={x}>{x}</li>)}</ul></div>
            )}
            {(report.questionsOuvertes ?? []).length > 0 && (
              <div className={s.cardSoft}><h3 className={s.h3}>{tt("Questions ouvertes", "Open questions")}</h3><ul className={r.list}>{report.questionsOuvertes!.map((x) => <li key={x}>{x}</li>)}</ul></div>
            )}
          </div>
        </section>
      )}

      {/* ── Verbatims ── */}
      {report && (
        <section className={r.panel} data-show={show("verbatims")} aria-label={tt("Verbatims", "Quotes")}>
          <h2 className={r.printTitle}>{tt("Verbatims", "Quotes")}</h2>
          <div className={`${s.row} ${r.noPrint}`}>
            <select className={s.input} style={{ width: "auto" }} value={theme} onChange={(e) => setTheme(e.target.value)} aria-label={tt("Filtrer par thème", "Filter by theme")}>
              <option value="">{tt("Tous les thèmes", "All themes")}</option>
              {themeNames.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={s.input} style={{ width: "auto" }} value={tone} onChange={(e) => setTone(e.target.value as Tonalite | "")} aria-label={tt("Filtrer par tonalité", "Filter by tone")}>
              <option value="">{tt("Toutes les tonalités", "All tones")}</option>
              <option value="positif">{TONES.positif.label}</option><option value="neutre">{TONES.neutre.label}</option><option value="negatif">Friction</option>
            </select>
            <span className={`${s.small} ${s.faint}`}>{verbatims.length} {tt(`citation${verbatims.length > 1 ? "s" : ""}`, `quote${verbatims.length > 1 ? "s" : ""}`)}</span>
          </div>
          <div className={r.masonry}>
            {verbatims.map((v, i) => (
              <div key={i} className={s.card} style={{ display: "grid", gap: 10 }}>
                <Quote text={v.content} who={v.participant} />
                <div className={s.row}>{v.theme && <span className={`${s.badge} ${s.badgePlain}`}>{v.theme}</span>}{v.tonalite && <span className={`${s.badge} ${TONES[v.tonalite].cls}`}>{TONES[v.tonalite].label}</span>}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Profils types ── */}
      {report && (
        <section className={r.panel} data-show={show("profils")} aria-label={tt("Profils types", "Personas")}>
          <h2 className={r.printTitle}>{tt("Profils types", "Personas")}</h2>
          <div className={s.grid2}>
            {(report.personas ?? []).map((p) => (
              <article key={p.nom} className={s.card} style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <h3 className={s.h2} style={{ margin: 0 }}>{p.nom}</h3>
                <p className={s.muted} style={{ margin: 0 }}>{p.portrait}</p>
                <p className={r.implication}><strong>{tt("Sa posture", "Their stance")}</strong> {p.posture}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Entretiens ── */}
      <section className={r.panel} data-show={show("entretiens")} aria-label={tt("Entretiens", "Interviews")}>
        <h2 className={r.printTitle}>{tt("Entretiens", "Interviews")}</h2>
        {interviews.length === 0 && <p className={s.muted}>{tt("Aucun entretien pour le moment.", "No interviews yet.")}</p>}
        <div className={s.card} style={{ padding: 0 }}>
          {interviews.map((iv, i) => (
            <div key={iv.id} style={{ borderTop: i ? "1px solid var(--line)" : 0 }}>
              <div className={s.spread} style={{ padding: "16px 20px" }}>
                <div>
                  <strong>{iv.person}</strong>
                  <span className={`${s.small} ${s.muted}`} style={{ display: "block", textTransform: "capitalize" }}>{[iv.profession, fmtShort(iv.scheduledAt, en)].filter(Boolean).join(" · ")}</span>
                </div>
                <div className={`${s.row} ${r.noPrint}`}>
                  {iv.status === "no_show" ? <span className={`${s.badge} ${s.badgeBad}`}>{tt("Absent", "No-show")}</span> : !iv.transcript && <span className={`${s.badge} ${s.badgeWait}`}>{tt("Transcription en cours", "Transcript in progress")}</span>}
                  {iv.transcript && (
                    <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} aria-expanded={open === iv.id} onClick={() => setOpen(open === iv.id ? null : iv.id)}>
                      {open === iv.id ? tt("Masquer la transcription", "Hide the transcript") : tt("Lire la transcription", "Read the transcript")}
                    </button>
                  )}
                  {iv.hasVideo && <a className={`${s.btn} ${s.btnSm}`} href={`/api/interviews/${iv.id}/recording`} target="_blank" rel="noopener noreferrer">{tt("Voir la vidéo", "Watch the video")}</a>}
                  {iv.videoExpired && <span className={`${s.small} ${s.faint}`}>{tt("Vidéo retirée après 90 jours", "Video removed after 90 days")}</span>}
                </div>
              </div>
              {iv.transcript && open === iv.id && <div style={{ padding: "0 20px 20px" }}><Transcript text={iv.transcript} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Méthodologie ── */}
      {report?.methodologie && (
        <section className={r.panel} data-show={show("methode")} aria-label={tt("Méthodologie", "Methodology")}>
          <h2 className={r.printTitle}>{tt("Méthodologie", "Methodology")}</h2>
          <div className={s.cardSoft}><p className={s.muted} style={{ margin: 0 }}>{report.methodologie}</p></div>
          <p className={`${s.small} ${s.faint}`}>
            {tt("Synthèse produite à partir des transcriptions des entretiens, avec l'aide d'une IA. Document confidentiel.", "Report produced from the interview transcripts, with the help of AI. Confidential document.")}
            {report.qualite && report.qualite.citations > 0 && (en
              ? ` Every quote was found in the transcripts (${report.qualite.citations - report.qualite.retirees} of ${report.qualite.citations}${report.qualite.retirees ? `; ${report.qualite.retirees} removed for lack of evidence` : ""}).`
              : ` Chaque citation a été retrouvée dans les transcriptions (${report.qualite.citations - report.qualite.retirees} sur ${report.qualite.citations}${report.qualite.retirees ? ` ; ${report.qualite.retirees} retirée${report.qualite.retirees > 1 ? "s" : ""} faute de preuve` : ""}).`)}
          </p>
        </section>
      )}
    </div>
  );
}
