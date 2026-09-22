"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import s from "@/components/rl/rl.module.css";
import r from "./report.module.css";

// ─── Rapport structuré (généré par lib/reports/generate.ts) ─────────
type Tonalite = "positif" | "neutre" | "negatif";
type Point = { titre: string; detail: string; verbatim?: string; participant?: string };
type Insight = { titre: string; observe: string; revele: string; verbatim?: string; participant?: string; implication: string };
type Theme = { nom: string; resume: string; intensite: number; tonalite?: Tonalite };
type Verbatim = { content: string; participant: string; theme?: string; tonalite?: Tonalite };
type Persona = { nom: string; portrait: string; posture: string };
type Reco = { titre: string; detail: string };

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
const fmtDate = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const fmtShort = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const TONE: Record<Tonalite, { label: string; cls: string }> = {
  positif: { label: "Positif", cls: s.badgeOk },
  neutre: { label: "Neutre", cls: "" },
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
        <Link href="/brand/studies">Mes études</Link><span>›</span>
        <Link href={`/brand/studies/${studyId}`}>{studyTitle}</Link><span>›</span><span>Synthèse</span>
      </nav>

      <header className={s.spread} style={{ alignItems: "flex-end" }}>
        <div>
          <p className={s.eyebrow}>{brandName} · Synthèse qualitative{generatedAt ? ` · ${fmtDate(generatedAt)}` : ""}</p>
          <h1 className={s.h1}>{report?.titre ?? studyTitle}</h1>
          {report?.titre && <p className={s.lead} style={{ marginTop: 6 }}>{studyTitle}</p>}
          <div className={s.meta}>
            <span>{interviews.length} entretien{interviews.length > 1 ? "s" : ""}</span>
            <span>{transcribed} transcrit{transcribed > 1 ? "s" : ""}</span>
          </div>
        </div>
        {(report || legacyText) && (
          <button type="button" className={`${s.btn} ${s.btnGhost} ${r.noPrint}`} onClick={() => window.print()}>Exporter en PDF</button>
        )}
      </header>

      {!report && !legacyText && (
        <section className={`${s.cardDark} ${s.sectionGap}`}>
          <h2 className={s.h1} style={{ fontSize: 28 }}>La synthèse arrive.</h2>
          <p className={s.muted} style={{ margin: "8px 0 0", maxWidth: "56ch" }}>
            Elle est générée automatiquement dès que tous les entretiens sont transcrits. Pour l&apos;instant : {transcribed} sur {expected}.
            Vous recevrez un email. En attendant, les transcriptions disponibles sont ci-dessous.
          </p>
          <div className={r.meter} aria-hidden="true"><i style={{ width: `${expected ? (transcribed / expected) * 100 : 0}%` }} /></div>
        </section>
      )}

      {legacyText && (
        <section className={`${s.card} ${s.sectionGap}`} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{legacyText}</section>
      )}

      <div className={`${r.tabs} ${r.noPrint}`} role="tablist" aria-label="Sections de la synthèse">
        {TABS.filter((t) => report || t.id === "entretiens").map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? r.tabOn : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── Synthèse ── */}
      {report && (
        <section className={r.panel} data-show={show("synthese")} aria-label="Synthèse">
          <h2 className={r.printTitle}>Synthèse</h2>
          {report.syntheseExecutive && <p className={r.exec}>{report.syntheseExecutive}</p>}
          {report.problematique && (
            <div className={s.cardSoft}><h3 className={s.h3}>La vraie question</h3><p className={s.muted} style={{ margin: 0 }}>{report.problematique}</p></div>
          )}
          <div className={s.grid2}>
            {[{ title: "Ce qui porte", items: report.forces, cls: s.badgeOk }, { title: "Points de vigilance", items: report.vigilance, cls: s.badgeBad }].map((col) => (
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
              <h3 className={s.h3}>Pistes de réflexion</h3>
              <ol className={r.recos}>
                {report.recommandations!.map((rc) => <li key={rc.titre}><strong>{rc.titre}</strong><span className={s.muted}>{rc.detail}</span></li>)}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* ── Enseignements ── */}
      {report && (
        <section className={r.panel} data-show={show("enseignements")} aria-label="Enseignements">
          <h2 className={r.printTitle}>Enseignements</h2>
          {(report.insights ?? []).map((ins, i) => (
            <article key={ins.titre} className={s.card} style={{ display: "grid", gap: 12 }}>
              <p className={s.eyebrow} style={{ margin: 0 }}>Enseignement {i + 1}</p>
              <h3 className={s.h2} style={{ margin: 0, textTransform: "none" }}>{ins.titre.charAt(0) + ins.titre.slice(1).toLowerCase()}</h3>
              <div className={s.grid2}>
                <div><p className={`${s.small} ${s.faint}`} style={{ margin: "0 0 4px" }}>Ce qu&apos;on observe</p><p style={{ margin: 0 }}>{ins.observe}</p></div>
                <div><p className={`${s.small} ${s.faint}`} style={{ margin: "0 0 4px" }}>Ce que ça révèle</p><p style={{ margin: 0 }}>{ins.revele}</p></div>
              </div>
              {ins.verbatim && <Quote text={ins.verbatim} who={ins.participant} />}
              <p className={r.implication}><strong>Pour la marque</strong> {ins.implication}</p>
            </article>
          ))}
          {(report.themes ?? []).length > 0 && (
            <div className={s.card}>
              <h3 className={s.h3}>Thèmes, par intensité</h3>
              <div className={r.themes}>
                {[...report.themes!].sort((a, b) => b.intensite - a.intensite).map((t) => (
                  <div key={t.nom} className={r.theme}>
                    <div className={s.spread}><strong>{t.nom}</strong>{t.tonalite && <span className={`${s.badge} ${TONE[t.tonalite].cls}`}>{TONE[t.tonalite].label}</span>}</div>
                    <div className={r.meter}><i style={{ width: `${Math.max(1, Math.min(5, t.intensite)) * 20}%` }} /></div>
                    <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>{t.resume}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={s.grid2}>
            {(report.signauxFaibles ?? []).length > 0 && (
              <div className={s.cardSoft}><h3 className={s.h3}>Signaux faibles</h3><ul className={r.list}>{report.signauxFaibles!.map((x) => <li key={x}>{x}</li>)}</ul></div>
            )}
            {(report.questionsOuvertes ?? []).length > 0 && (
              <div className={s.cardSoft}><h3 className={s.h3}>Questions ouvertes</h3><ul className={r.list}>{report.questionsOuvertes!.map((x) => <li key={x}>{x}</li>)}</ul></div>
            )}
          </div>
        </section>
      )}

      {/* ── Verbatims ── */}
      {report && (
        <section className={r.panel} data-show={show("verbatims")} aria-label="Verbatims">
          <h2 className={r.printTitle}>Verbatims</h2>
          <div className={`${s.row} ${r.noPrint}`}>
            <select className={s.input} style={{ width: "auto" }} value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Filtrer par thème">
              <option value="">Tous les thèmes</option>
              {themeNames.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={s.input} style={{ width: "auto" }} value={tone} onChange={(e) => setTone(e.target.value as Tonalite | "")} aria-label="Filtrer par tonalité">
              <option value="">Toutes les tonalités</option>
              <option value="positif">Positif</option><option value="neutre">Neutre</option><option value="negatif">Friction</option>
            </select>
            <span className={`${s.small} ${s.faint}`}>{verbatims.length} citation{verbatims.length > 1 ? "s" : ""}</span>
          </div>
          <div className={r.masonry}>
            {verbatims.map((v, i) => (
              <div key={i} className={s.card} style={{ display: "grid", gap: 10 }}>
                <Quote text={v.content} who={v.participant} />
                <div className={s.row}>{v.theme && <span className={`${s.badge} ${s.badgePlain}`}>{v.theme}</span>}{v.tonalite && <span className={`${s.badge} ${TONE[v.tonalite].cls}`}>{TONE[v.tonalite].label}</span>}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Profils types ── */}
      {report && (
        <section className={r.panel} data-show={show("profils")} aria-label="Profils types">
          <h2 className={r.printTitle}>Profils types</h2>
          <div className={s.grid2}>
            {(report.personas ?? []).map((p) => (
              <article key={p.nom} className={s.card} style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <h3 className={s.h2} style={{ margin: 0 }}>{p.nom}</h3>
                <p className={s.muted} style={{ margin: 0 }}>{p.portrait}</p>
                <p className={r.implication}><strong>Sa posture</strong> {p.posture}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Entretiens ── */}
      <section className={r.panel} data-show={show("entretiens")} aria-label="Entretiens">
        <h2 className={r.printTitle}>Entretiens</h2>
        {interviews.length === 0 && <p className={s.muted}>Aucun entretien pour le moment.</p>}
        <div className={s.card} style={{ padding: 0 }}>
          {interviews.map((iv, i) => (
            <div key={iv.id} style={{ borderTop: i ? "1px solid var(--line)" : 0 }}>
              <div className={s.spread} style={{ padding: "16px 20px" }}>
                <div>
                  <strong>{iv.person}</strong>
                  <span className={`${s.small} ${s.muted}`} style={{ display: "block", textTransform: "capitalize" }}>{[iv.profession, fmtShort(iv.scheduledAt)].filter(Boolean).join(" · ")}</span>
                </div>
                <div className={`${s.row} ${r.noPrint}`}>
                  {iv.status === "no_show" ? <span className={`${s.badge} ${s.badgeBad}`}>Absent</span> : !iv.transcript && <span className={`${s.badge} ${s.badgeWait}`}>Transcription en cours</span>}
                  {iv.transcript && (
                    <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} aria-expanded={open === iv.id} onClick={() => setOpen(open === iv.id ? null : iv.id)}>
                      {open === iv.id ? "Masquer la transcription" : "Lire la transcription"}
                    </button>
                  )}
                  {iv.hasVideo && <a className={`${s.btn} ${s.btnSm}`} href={`/api/interviews/${iv.id}/recording`} target="_blank" rel="noopener noreferrer">Voir la vidéo</a>}
                  {iv.videoExpired && <span className={`${s.small} ${s.faint}`}>Vidéo retirée après 90 jours</span>}
                </div>
              </div>
              {iv.transcript && open === iv.id && <div style={{ padding: "0 20px 20px" }}><Transcript text={iv.transcript} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Méthodologie ── */}
      {report?.methodologie && (
        <section className={r.panel} data-show={show("methode")} aria-label="Méthodologie">
          <h2 className={r.printTitle}>Méthodologie</h2>
          <div className={s.cardSoft}><p className={s.muted} style={{ margin: 0 }}>{report.methodologie}</p></div>
          <p className={`${s.small} ${s.faint}`}>Synthèse produite à partir des transcriptions des entretiens, avec l&apos;aide d&apos;une IA. Document confidentiel.</p>
        </section>
      )}
    </div>
  );
}
