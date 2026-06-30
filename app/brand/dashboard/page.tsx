import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:      { label: "Actif",      color: "var(--color-success)" },
  MATCHING:    { label: "Matching",   color: "var(--color-warning)" },
  COMPLETED:   { label: "Terminé",    color: "var(--color-text-tertiary)" },
  DRAFT:       { label: "Brouillon",  color: "var(--color-text-tertiary)" },
  IN_PROGRESS: { label: "En cours",   color: "var(--color-info)" },
  CANCELLED:   { label: "Annulé",     color: "var(--color-error)" },
};

export default async function BrandDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      brandProfile: {
        include: {
          studies: {
            orderBy: { createdAt: "desc" },
            include: { applications: { select: { status: true } } },
          },
        },
      },
    },
  });

  const bp = dbUser?.brandProfile;
  const studies = bp?.studies ?? [];

  const activeStudies    = studies.filter((s) => ["ACTIVE", "MATCHING", "IN_PROGRESS"].includes(s.status));
  const completedStudies = studies.filter((s) => s.status === "COMPLETED");
  const pendingReview    = studies.reduce((n, s) => n + s.applications.filter((a) => a.status === "SHORTLISTED").length, 0);
  const pendingStudy     = studies.find((s) => s.applications.some((a) => a.status === "SHORTLISTED"));

  const companyName = bp?.companyName ?? "vous";

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null;

  return (
    <div style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "44px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <p className="q-label" style={{ marginBottom: "8px" }}>Tableau de bord</p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.1,
          }}>
            Bonjour, {companyName}
          </h1>
        </div>
        <Link href="/brand/studies/new" className="q-btn q-btn-primary">
          + Nouvelle étude
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "36px" }}>
        {[
          {
            label: "Études actives",
            value: activeStudies.length,
            color: activeStudies.length > 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
          },
          {
            label: "Profils à valider",
            value: pendingReview,
            color: pendingReview > 0 ? "var(--color-warning)" : "var(--color-text-tertiary)",
            alert: pendingReview > 0,
          },
          {
            label: "Crédits disponibles",
            value: bp?.credits ?? 0,
            color: (bp?.credits ?? 0) < 3 ? "var(--color-warning)" : "var(--color-text-primary)",
            alert: (bp?.credits ?? 0) < 3,
          },
          {
            label: "Études complétées",
            value: completedStudies.length,
            color: "var(--color-text-primary)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="q-card"
            style={{
              padding: "20px 22px",
              borderColor: stat.alert ? "var(--color-warning)" : undefined,
            }}
          >
            <div style={{
              fontFamily: "var(--font-mono-base)",
              fontSize: "28px",
              fontWeight: 700,
              color: stat.color,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}>
              {stat.value}
            </div>
            <div className="q-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending review alert */}
      {pendingStudy && (
        <div style={{
          padding: "14px 18px",
          background: "var(--color-warning-light)",
          border: "1px solid var(--color-warning)",
          borderRadius: "3px",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: "13px", color: "var(--color-warning)", fontWeight: 500 }}>
            {pendingReview} profil{pendingReview > 1 ? "s" : ""} proposé{pendingReview > 1 ? "s" : ""} par l'équipe Qualio —{" "}
            <span style={{ fontWeight: 400 }}>{pendingStudy.title}</span>
          </div>
          <Link
            href={`/brand/studies/${pendingStudy.id}`}
            style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-warning)", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "16px" }}
          >
            Valider →
          </Link>
        </div>
      )}

      {/* Studies */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p className="q-label">Études récentes</p>
          {studies.length > 5 && (
            <Link href="/brand/studies" style={{ fontSize: "12px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
              Voir toutes →
            </Link>
          )}
        </div>

        {studies.length === 0 ? (
          <div className="q-card q-empty">
            <div style={{ fontSize: "28px", marginBottom: "14px", opacity: 0.3 }}>◫</div>
            <p className="q-empty-title">Aucune étude pour le moment</p>
            <p className="q-empty-sub">Créez votre première étude pour recevoir des profils ciblés sous 72h.</p>
            <Link href="/brand/studies/new" className="q-btn q-btn-primary" style={{ marginTop: "20px" }}>
              Créer une étude →
            </Link>
          </div>
        ) : (
          <div className="q-card" style={{ padding: 0, overflow: "hidden" }}>
            {studies.slice(0, 6).map((study, i) => {
              const meta    = STATUS_META[study.status] ?? STATUS_META.ACTIVE;
              const confirmed = study.applications.filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED").length;
              const deadline  = fmtDate(study.deadlineAt);

              return (
                <Link
                  key={study.id}
                  href={`/brand/studies/${study.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px 60px 80px 40px",
                    gap: "16px",
                    padding: "15px 20px",
                    alignItems: "center",
                    textDecoration: "none",
                    borderTop: i > 0 ? "1px solid var(--color-border-base)" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Title */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                      {study.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      {study.studyType === "ONE_ON_ONE" ? "Entretien 1:1" : "Focus group"}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
                    {deadline ? `Avant ${deadline}` : "—"}
                  </div>

                  {/* Progress */}
                  <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center" }}>
                    {confirmed}<span style={{ color: "var(--color-text-tertiary)" }}>/{study.targetParticipantCount}</span>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: "center" }}>
                    <span className="q-tag" style={{ color: meta.color, borderColor: meta.color, fontSize: "10px" }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "right" }}>→</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
