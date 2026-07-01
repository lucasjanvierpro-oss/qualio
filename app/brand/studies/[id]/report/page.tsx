import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StudyReportView, { type StructuredReport } from "./StudyReportView";

// Render markdown-like report content into JSX (server-side, no library needed)
function ReportDisplay({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: "var(--color-text-primary)", lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} style={{
              fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800,
              color: "var(--color-accent)", margin: "36px 0 12px",
              borderBottom: "1px solid var(--color-accent-light)", paddingBottom: "8px",
            }}>
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: "28px 0 14px" }}>
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.trim() === "---") {
          return <hr key={i} style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />;
        }
        if (line.startsWith("→ ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "10px", margin: "8px 0", padding: "10px 14px", background: "var(--color-accent-light)", borderRadius: "6px", borderLeft: "3px solid var(--color-accent)" }}>
              <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: "14px" }}>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("**INSIGHT ") || line.startsWith("**TENSION ")) {
          const text = line.replace(/\*\*/g, "");
          return (
            <div key={i} style={{ fontSize: "15px", fontWeight: 700, margin: "20px 0 8px", padding: "10px 16px", background: "var(--color-surface-2)", borderRadius: "8px", borderLeft: "3px solid var(--color-accent)" }}>
              {text}
            </div>
          );
        }
        if (line.startsWith("*Ce qui") || line.startsWith("*Ce que") || line.startsWith("*Verbatim") || line.startsWith("*Implication")) {
          const [label, ...rest] = line.split(":*");
          const labelClean = label.replace(/^\*/, "").trim();
          const body = rest.join(":*").trim();
          return (
            <div key={i} style={{ fontSize: "14px", margin: "6px 0 6px 16px", display: "flex", gap: "6px" }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)", flexShrink: 0, minWidth: "140px" }}>{labelClean} :</span>
              <span style={{ fontStyle: body.startsWith('"') ? "italic" : "normal" }}>{body}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          return (
            <div key={i} style={{ margin: "8px 0", fontSize: "14px", paddingLeft: "8px" }}>
              {line}
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: "8px" }} />;
        return (
          <p key={i} style={{ margin: "6px 0", fontSize: "14px" }}>
            {line.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
}

export default async function BrandStudyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { brandProfile: true },
  });

  if (dbUser?.role !== "BRAND") redirect("/login");

  // Verify the study belongs to this brand
  const study = await prisma.study.findFirst({
    where: { id, brandProfileId: dbUser.brandProfile!.id },
    include: {
      report: true,
      brandProfile: { select: { companyName: true } },
    },
  });

  if (!study) notFound();

  const report = study.report;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);

  // Nouveau rapport structuré → interface à onglets
  if (report?.structuredContent) {
    return (
      <StudyReportView
        report={report.structuredContent as StructuredReport}
        studyTitle={study.title}
        brandName={study.brandProfile.companyName}
        generatedAt={fmtDate(report.generatedAt)}
        studyId={id}
      />
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 32px 64px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "24px", display: "flex", gap: "8px", alignItems: "center" }}>
        <Link href="/brand/studies" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Mes études</Link>
        <span>›</span>
        <Link href={`/brand/studies/${id}`} style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>{study.title}</Link>
        <span>›</span>
        <span>Rapport de synthèse</span>
      </div>

      {!report ? (
        <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📋</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, margin: "0 0 10px" }}>
            Rapport en préparation
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto 24px", lineHeight: 1.7 }}>
            L'équipe Qualio est en train de préparer votre rapport de synthèse à partir des entretiens réalisés. Vous recevrez une notification par email dès qu'il sera disponible.
          </p>
          <Link href={`/brand/studies/${id}`} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            Retour à l'étude
          </Link>
        </div>
      ) : (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "48px 56px" }}>
          {/* Report header */}
          <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Qualio · Synthèse qualitative · {fmtDate(report.generatedAt)}
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 800, margin: "0 0 6px", color: "var(--color-text-primary)" }}>
              {study.title}
            </h1>
            <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
              {study.brandProfile.companyName}
            </div>
          </div>

          {/* Report content */}
          <ReportDisplay content={report.markdownContent} />

          {/* Footer */}
          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
              Rapport généré par Qualio · Analyse qualitative assistée par IA<br />
              Confidentiel — usage interne uniquement
            </div>
            <Link href={`/brand/studies/${id}`} style={{ fontSize: "13px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
              ← Retour à l'étude
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
