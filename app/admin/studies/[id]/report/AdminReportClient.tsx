"use client";

import { useState } from "react";

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  profession: string | null;
  profileType: string | null;
  primaryExpertise: string | null;
  applicationStatus: string;
  interviewStatus: string | null;
  interviewDate: string | null;
};

type Study = {
  id: string;
  title: string;
  objective: string;
  brandName: string;
  studyType: string;
  interviewDuration: number;
  targetParticipantCount: number;
  existingReport: { content: string; generatedAt: string } | null;
  participants: Participant[];
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1px solid var(--color-border)", borderRadius: "8px",
  fontSize: "14px", background: "var(--color-background)",
  color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box",
};

const ta: React.CSSProperties = {
  ...inp, resize: "vertical", minHeight: "120px", lineHeight: 1.6, fontFamily: "inherit",
};

// Render the report markdown format (structured and known)
function ReportDisplay({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: "var(--color-text-primary)", lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        // Section headers ### 1. TITLE
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} style={{
              fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 400,
              color: "var(--color-accent)", margin: "36px 0 12px",
              borderBottom: "1px solid var(--color-accent-light)", paddingBottom: "8px",
            }}>
              {line.replace("### ", "")}
            </h3>
          );
        }
        // H2 headers ## TITLE
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 400, color: "var(--color-text-primary)", margin: "28px 0 14px" }}>
              {line.replace("## ", "")}
            </h2>
          );
        }
        // Separator ---
        if (line.trim() === "---") {
          return <hr key={i} style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />;
        }
        // Arrow bullets → text
        if (line.startsWith("→ ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "10px", margin: "8px 0", padding: "10px 14px", background: "var(--color-accent-light)", borderRadius: "6px", borderLeft: "3px solid var(--color-accent)" }}>
              <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered questions 1. or 2. etc
        if (/^\d+\. /.test(line)) {
          return (
            <div key={i} style={{ margin: "8px 0", fontSize: "14px", paddingLeft: "8px" }}>
              {renderInline(line)}
            </div>
          );
        }
        // Bold section headers **INSIGHT N —** or **TENSION N —**
        if (line.startsWith("**INSIGHT ") || line.startsWith("**TENSION ")) {
          const text = line.replace(/\*\*/g, "");
          return (
            <div key={i} style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "20px 0 8px", padding: "10px 16px", background: "var(--color-surface-2)", borderRadius: "8px", borderLeft: "3px solid var(--color-accent)" }}>
              {text}
            </div>
          );
        }
        // Empty line
        if (!line.trim()) return <div key={i} style={{ height: "8px" }} />;
        // Regular paragraph
        return (
          <p key={i} style={{ margin: "6px 0", fontSize: "14px" }}>
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**, *italic*, and verbatim quotes
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // *italic* (but not **)
    const italicMatch = remaining.match(/^([\s\S]*?)\*([^*]+)\*([\s\S]*)/);
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*([^*]+)\*\*([\s\S]*)/);
    const quoteMatch = remaining.match(/^([\s\S]*?)"([^"]+)"([\s\S]*)/);

    // Bold before italic check
    if (boldMatch && (!italicMatch || boldMatch[1].length <= italicMatch[1].length)) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    } else if (italicMatch && (!quoteMatch || italicMatch[1].length <= quoteMatch[1].length)) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++} style={{ color: "var(--color-text-secondary)", fontStyle: "normal", fontWeight: 600 }}>{italicMatch[2]}</em>);
      remaining = italicMatch[3];
    } else if (quoteMatch) {
      if (quoteMatch[1]) parts.push(<span key={key++}>{quoteMatch[1]}</span>);
      parts.push(
        <span key={key++} style={{ fontStyle: "italic", color: "var(--color-text-primary)", background: "var(--color-surface-2)", padding: "1px 6px", borderRadius: "4px", borderLeft: "2px solid var(--color-accent-light)" }}>
          "{quoteMatch[2]}"
        </span>
      );
      remaining = quoteMatch[3];
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  return parts;
}

export default function AdminReportClient({ study }: { study: Study }) {
  const [brandContext, setBrandContext] = useState(
    `Étude menée pour ${study.brandName}. Objectif : ${study.objective.slice(0, 200)}${study.objective.length > 200 ? "…" : ""}`
  );
  const [verbatims, setVerbatims] = useState<Record<string, string>>(
    Object.fromEntries(study.participants.map((p) => [p.id, ""]))
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(study.existingReport?.content ?? null);
  const [reportDate, setReportDate] = useState<string | null>(study.existingReport?.generatedAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"form" | "report">(study.existingReport ? "report" : "form");

  function updateVerbatim(participantId: string, value: string) {
    setVerbatims((prev) => ({ ...prev, [participantId]: value }));
  }

  const filledVerbatims = Object.entries(verbatims).filter(([, v]) => v.trim().length > 0);
  const canGenerate = filledVerbatims.length > 0 && brandContext.trim().length > 0;

  async function generate() {
    setGenerating(true);
    setError(null);

    const participantProfiles = study.participants
      .filter((p) => verbatims[p.id]?.trim())
      .map((p) => ({
        type: p.profileType ?? p.profession ?? "Expert mode",
        age: p.age,
        profession: p.profession,
        expertise: p.primaryExpertise,
      }));

    const verbatimsPayload = study.participants
      .filter((p) => verbatims[p.id]?.trim())
      .map((p) => ({
        participantType: `${p.profileType ?? "Participant"} — ${p.profession ?? ""}${p.age ? `, ${p.age} ans` : ""}`,
        content: verbatims[p.id].trim(),
      }));

    try {
      const res = await fetch(`/api/studies/${study.id}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyObjective: study.objective,
          brandContext,
          participantProfiles,
          verbatims: verbatimsPayload,
          studyFormat: `${filledVerbatims.length} entretiens ${study.studyType === "ONE_ON_ONE" ? "1:1" : "focus group"} de ${study.interviewDuration} minutes, format semi-directif en visio`,
          additionalContext,
        }),
      });

      const data = await res.json() as { ok?: boolean; content?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Erreur inconnue");

      setReport(data.content ?? null);
      setReportDate(new Date().toISOString());
      setView("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  }

  function copyReport() {
    if (report) navigator.clipboard.writeText(report);
  }

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 400, margin: "0 0 4px" }}>
            Rapport de synthèse
          </h1>
          <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            {study.title} · {study.brandName}
          </div>
          {reportDate && (
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
              Dernière génération : {fmtDate(reportDate)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {report && (
            <>
              <button onClick={() => setView(view === "form" ? "report" : "form")} style={{ padding: "9px 16px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer" }}>
                {view === "form" ? "Voir le rapport" : "Modifier les verbatims"}
              </button>
              <button onClick={copyReport} style={{ padding: "9px 16px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer" }}>
                Copier le texte
              </button>
            </>
          )}
        </div>
      </div>

      {/* View: Form */}
      {view === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "flex-start" }}>
          {/* Left: Context */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "22px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-text-primary)" }}>Contexte marque</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                    Contexte & angle de l'étude
                  </label>
                  <textarea
                    style={{ ...ta, minHeight: "90px" }}
                    value={brandContext}
                    onChange={(e) => setBrandContext(e.target.value)}
                    placeholder="Ex: Lacoste cherche à comprendre sa perception chez les early adopters Gen Z parisiens dans le contexte de sa remontée en gamme"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                    Notes additionnelles (optionnel)
                  </label>
                  <textarea
                    style={{ ...ta, minHeight: "70px" }}
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Points saillants observés pendant les entretiens, hypothèses à vérifier, contexte interne..."
                  />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div style={{ padding: "16px 18px", background: "var(--color-accent-light)", border: "1px solid var(--color-accent)", borderRadius: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "6px" }}>Comment ça fonctionne</div>
              <div style={{ fontSize: "12px", color: "var(--color-accent)", lineHeight: 1.7 }}>
                Collez les notes ou verbatims de chaque entretien. L'IA les analyse de manière transversale pour produire un rapport analytique — pas une transcription. Le rapport cible 900-1400 mots structurés en 7 sections.
              </div>
            </div>

            {/* Generate button */}
            {error && (
              <div style={{ padding: "12px 16px", background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "8px", fontSize: "13px", color: "var(--color-error)" }}>
                {error}
              </div>
            )}
            <button
              onClick={generate}
              disabled={!canGenerate || generating}
              style={{
                padding: "14px", background: canGenerate && !generating ? "var(--color-accent)" : "var(--color-border-strong)",
                color: canGenerate && !generating ? "#fff" : "var(--color-text-tertiary)",
                border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600,
                cursor: canGenerate && !generating ? "pointer" : "default",
              }}
            >
              {generating ? "⏳ Analyse en cours (20–40 secondes)…" : `✨ Générer le rapport (${filledVerbatims.length} entretien${filledVerbatims.length > 1 ? "s" : ""})`}
            </button>
          </div>

          {/* Right: Verbatims per participant */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
              Verbatims par participant
              <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 400, color: "var(--color-text-tertiary)" }}>
                ({study.participants.length} profil{study.participants.length > 1 ? "s" : ""} confirmé{study.participants.length > 1 ? "s" : ""})
              </span>
            </div>

            {study.participants.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                Aucun participant confirmé pour cette étude.
              </div>
            )}

            {study.participants.map((p) => (
              <div key={p.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {p.firstName} {p.lastName}{p.age ? `, ${p.age} ans` : ""}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px", display: "flex", gap: "6px" }}>
                      {p.profession && <span>{p.profession}</span>}
                      {p.profileType && <span style={{ padding: "1px 7px", borderRadius: "999px", background: "var(--color-accent)", color: "#fff", fontSize: "10px", fontWeight: 600 }}>{p.profileType}</span>}
                      {p.primaryExpertise && <span style={{ padding: "1px 7px", borderRadius: "999px", background: "var(--color-accent-light)", color: "var(--color-accent)", fontSize: "10px", border: "1px solid var(--color-accent)" }}>{p.primaryExpertise}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: p.interviewStatus === "completed" ? "var(--color-success-light)" : "var(--color-surface-2)", color: p.interviewStatus === "completed" ? "var(--color-success)" : "var(--color-text-tertiary)", border: "1px solid", borderColor: p.interviewStatus === "completed" ? "var(--color-success)" : "var(--color-border)" }}>
                    {p.interviewStatus === "completed" ? "Entretien terminé" : p.interviewStatus === "scheduled" ? "Entretien prévu" : "Confirmé"}
                  </span>
                </div>
                <textarea
                  style={{ ...ta, minHeight: "110px", fontSize: "13px" }}
                  value={verbatims[p.id] ?? ""}
                  onChange={(e) => updateVerbatim(p.id, e.target.value)}
                  placeholder={`Notes / verbatims de l'entretien avec ${p.firstName}.\n\nCollez ici : vos notes prises pendant l'entretien, les citations importantes, les thèmes abordés, les réactions notables...`}
                />
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                  {verbatims[p.id]?.trim().length ?? 0} caractères · Plus il y a de matière, meilleur est le rapport
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View: Report */}
      {view === "report" && report && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "flex-start" }}>
          {/* Report content */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "36px 40px" }}>
            <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Qualio · Synthèse qualitative
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 400, margin: "0 0 4px" }}>{study.title}</h1>
              <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>{study.brandName}</div>
            </div>
            <ReportDisplay content={report} />
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "sticky", top: "24px" }}>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={copyReport}
                  style={{ padding: "10px 14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                >
                  Copier le rapport
                </button>
                <button
                  onClick={() => setView("form")}
                  style={{ padding: "10px 14px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer", textAlign: "left" }}
                >
                  Régénérer avec nouveaux verbatims
                </button>
              </div>
            </div>

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ce rapport</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                <div>Modèle : Claude Sonnet 4.6</div>
                <div style={{ marginTop: "4px" }}>Généré : {reportDate ? fmtDate(reportDate) : "—"}</div>
                <div style={{ marginTop: "4px" }}>Entretiens : {study.participants.length} participant{study.participants.length > 1 ? "s" : ""}</div>
              </div>
            </div>

            <div style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-accent)", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "6px" }}>Partager avec la marque</div>
              <div style={{ fontSize: "12px", color: "var(--color-accent)", lineHeight: 1.6 }}>
                La marque peut accéder au rapport sur : <br />/brand/studies/{study.id}/report
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
