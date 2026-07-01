"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types du rapport structuré ──────────────────────────────
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

const TONE: Record<Tonalite, { bg: string; color: string; label: string }> = {
  positif: { bg: "var(--color-success-light)", color: "var(--color-success)", label: "Positif" },
  neutre:  { bg: "var(--color-surface-2)", color: "var(--color-text-secondary)", label: "Neutre" },
  negatif: { bg: "var(--color-error-light)", color: "var(--color-error)", label: "Friction" },
};

// ─── Petits blocs réutilisables ──────────────────────────────
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-plum-deep)", margin: 0, letterSpacing: "-0.02em" }}>{children}</h2>
      {sub && <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Verbatim({ content, participant, tone }: { content: string; participant?: string; tone?: Tonalite }) {
  const t = tone ? TONE[tone] : null;
  return (
    <div style={{ borderLeft: `3px solid ${t?.color ?? "var(--color-lavender)"}`, background: "var(--color-surface-2)", borderRadius: "0 12px 12px 0", padding: "12px 16px" }}>
      <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--color-plum)", lineHeight: 1.6 }}>“{content}”</p>
      {participant && <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>— {participant}</div>}
    </div>
  );
}

// ─── Onglets de contenu ──────────────────────────────────────
function TabSynthese({ r }: { r: StructuredReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {r.problematique && (
        <div style={{ background: "linear-gradient(160deg, #fff, #F6EFFC)", border: "1px solid var(--color-lavender)", borderRadius: "16px", padding: "24px 26px" }}>
          <div className="q-label" style={{ color: "var(--color-accent)", marginBottom: "10px" }}>Problématique centrale</div>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.7, color: "var(--color-plum-deep)" }}>{r.problematique}</p>
        </div>
      )}
      {r.syntheseExecutive && (
        <div>
          <SectionTitle>Synthèse exécutive</SectionTitle>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "var(--color-text-primary)" }}>{r.syntheseExecutive}</p>
        </div>
      )}
      {/* Forces / Vigilance */}
      {(r.forces?.length || r.vigilance?.length) ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "8px", background: "var(--color-success-light)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)", fontSize: "13px" }}>✓</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-success)" }}>Forces</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(r.forces ?? []).map((p, i) => (
                <div key={i} style={{ background: "var(--color-success-light)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-plum-deep)", marginBottom: "5px" }}>{i + 1}. {p.titre}</div>
                  <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{p.detail}</p>
                  {p.verbatim && <Verbatim content={p.verbatim} participant={p.participant} tone="positif" />}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "8px", background: "var(--color-error-light)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-error)", fontSize: "13px" }}>!</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-error)" }}>Points de vigilance</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(r.vigilance ?? []).map((p, i) => (
                <div key={i} style={{ background: "var(--color-error-light)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-plum-deep)", marginBottom: "5px" }}>{i + 1}. {p.titre}</div>
                  <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{p.detail}</p>
                  {p.verbatim && <Verbatim content={p.verbatim} participant={p.participant} tone="negatif" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabInsights({ r }: { r: StructuredReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {(r.insights ?? []).map((ins, i) => (
        <div key={i} className="q-card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ width: "28px", height: "28px", borderRadius: "9px", background: "linear-gradient(140deg, #E9DEFA, #C7B4EC)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono-base)", fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{i + 1}</span>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "var(--color-plum-deep)", letterSpacing: "-0.01em" }}>{ins.titre}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: ins.verbatim ? "14px" : 0 }}>
            <div>
              <div className="q-label" style={{ marginBottom: "6px" }}>Ce qui a été observé</div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{ins.observe}</p>
            </div>
            <div>
              <div className="q-label" style={{ marginBottom: "6px", color: "var(--color-accent)" }}>Ce que ça révèle</div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-plum)", lineHeight: 1.6, fontWeight: 500 }}>{ins.revele}</p>
            </div>
          </div>
          {ins.verbatim && <Verbatim content={ins.verbatim} participant={ins.participant} />}
          <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--color-accent-light)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: "13px", color: "var(--color-plum-deep)", fontWeight: 500 }}>{ins.implication}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabThemes({ r }: { r: StructuredReport }) {
  return (
    <div>
      <SectionTitle sub="Les grands sujets qui ont structuré les entretiens, par intensité.">Analyse thématique</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {(r.themes ?? []).map((t, i) => {
          const tone = t.tonalite ? TONE[t.tonalite] : TONE.neutre;
          return (
            <div key={i} className="q-card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-plum-deep)" }}>{t.nom}</span>
                  {t.tonalite && <span className="q-tag" style={{ color: tone.color, background: tone.bg, border: "none" }}>{tone.label}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "3px" }}>
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} style={{ width: "16px", height: "6px", borderRadius: "999px", background: n <= t.intensite ? "var(--color-accent)" : "var(--color-border-base)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono-base)" }}>{t.intensite}/5</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{t.resume}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabVerbatims({ r }: { r: StructuredReport }) {
  const [filter, setFilter] = useState<Tonalite | "all">("all");
  const all = r.verbatims ?? [];
  const shown = filter === "all" ? all : all.filter((v) => (v.tonalite ?? "neutre") === filter);
  return (
    <div>
      <SectionTitle sub={`${all.length} verbatims sélectionnés dans le corpus.`}>Verbatims</SectionTitle>
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
        {([["all","Tous"],["positif","Positifs"],["neutre","Neutres"],["negatif","Frictions"]] as [Tonalite | "all", string][]).map(([k, lbl]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filter === k ? "var(--color-accent)" : "var(--color-border-base)"}`,
            background: filter === k ? "var(--color-accent)" : "var(--color-surface)",
            color: filter === k ? "#fff" : "var(--color-text-secondary)",
          }}>{lbl}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {shown.map((v, i) => (
          <div key={i} className="q-card" style={{ padding: "16px 18px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "13px", fontStyle: "italic", color: "var(--color-plum)", lineHeight: 1.6 }}>“{v.content}”</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>— {v.participant}</span>
              {v.theme && <span className="q-tag" style={{ color: "var(--color-accent)", background: "var(--color-accent-light)", border: "none" }}>{v.theme}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPersonas({ r }: { r: StructuredReport }) {
  return (
    <div>
      <SectionTitle sub="Les figures récurrentes qui émergent du corpus d'entretiens.">Personas</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {(r.personas ?? []).map((p, i) => (
          <div key={i} className="q-card hover-glow" style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: `linear-gradient(140deg, ${["#C7B4EC","#B9C0FF","#EBCBF7"][i % 3]}, #8765D7)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "18px" }}>{p.nom[0]}</div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "var(--color-plum-deep)" }}>{p.nom}</h3>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{p.portrait}</p>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "var(--color-surface-2)", fontSize: "12px", color: "var(--color-plum)", fontWeight: 500 }}>
              <span style={{ color: "var(--color-text-tertiary)", fontWeight: 600 }}>Posture · </span>{p.posture}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabReco({ r }: { r: StructuredReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <SectionTitle sub="Des orientations de réflexion, pas des décisions toutes faites.">Recommandations</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(r.recommandations ?? []).map((rec, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", padding: "16px 18px", borderRadius: "12px", background: "var(--color-accent-light)", border: "1px solid var(--color-lavender)" }}>
              <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>0{i + 1}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-plum-deep)", marginBottom: "4px" }}>{rec.titre}</div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{rec.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {r.signauxFaibles?.length ? (
        <div>
          <div className="q-label" style={{ marginBottom: "10px" }}>Signaux faibles</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {r.signauxFaibles.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-lavender)" }}>◦</span>{s}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {r.questionsOuvertes?.length ? (
        <div>
          <div className="q-label" style={{ marginBottom: "10px" }}>Questions ouvertes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {r.questionsOuvertes.map((q, i) => (
              <div key={i} style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--color-border-base)", fontSize: "13px", color: "var(--color-plum)", fontStyle: "italic" }}>{q}</div>
            ))}
          </div>
        </div>
      ) : null}
      {r.methodologie && (
        <div style={{ paddingTop: "20px", borderTop: "1px solid var(--color-border-base)" }}>
          <div className="q-label" style={{ marginBottom: "8px" }}>Note méthodologique</div>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-tertiary)", lineHeight: 1.7 }}>{r.methodologie}</p>
        </div>
      )}
    </div>
  );
}

// ─── Vue principale ──────────────────────────────────────────
const TABS = [
  { key: "synthese", label: "Synthèse", icon: "◫" },
  { key: "insights", label: "Insights clés", icon: "✦" },
  { key: "themes", label: "Analyse thématique", icon: "◧" },
  { key: "verbatims", label: "Verbatims", icon: "❝" },
  { key: "personas", label: "Personas", icon: "◕" },
  { key: "reco", label: "Recommandations", icon: "→" },
] as const;

export default function StudyReportView({
  report, studyTitle, brandName, generatedAt, studyId, count,
}: {
  report: StructuredReport;
  studyTitle: string;
  brandName: string;
  generatedAt: string;
  studyId: string;
  count?: number;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("synthese");

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 32px 64px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" }}>
        <Link href="/brand/studies" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Mes études</Link>
        <span>›</span>
        <Link href={`/brand/studies/${studyId}`} style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>{studyTitle}</Link>
        <span>›</span>
        <span style={{ color: "var(--color-plum)" }}>Rapport</span>
      </div>

      {/* Header */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "18px", padding: "26px 30px", marginBottom: "12px", boxShadow: "0 4px 18px var(--color-glow-soft)" }}>
        <div className="q-label" style={{ color: "var(--color-accent)", marginBottom: "10px" }}>
          Qualio · Synthèse qualitative · {generatedAt}{count ? ` · ${count} entretiens` : ""}
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 4px", color: "var(--color-plum-deep)", letterSpacing: "-0.025em" }}>
          {report.titre || studyTitle}
        </h1>
        <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>{brandName}</div>
      </div>

      {/* Barre d'onglets */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", padding: "10px 0", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "14px", padding: "6px", overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap",
                padding: "9px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: active ? 700 : 500,
                background: active ? "var(--color-accent)" : "transparent",
                color: active ? "#fff" : "var(--color-text-secondary)",
                transition: "background 0.18s",
              }}>
                <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "18px", padding: "32px 34px", minHeight: "400px" }}>
        {tab === "synthese" && <TabSynthese r={report} />}
        {tab === "insights" && <TabInsights r={report} />}
        {tab === "themes" && <TabThemes r={report} />}
        {tab === "verbatims" && <TabVerbatims r={report} />}
        {tab === "personas" && <TabPersonas r={report} />}
        {tab === "reco" && <TabReco r={report} />}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
        <span>Rapport généré par Qualio · Analyse qualitative assistée par IA · Confidentiel</span>
        <Link href={`/brand/studies/${studyId}`} style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>← Retour à l'étude</Link>
      </div>
    </div>
  );
}
