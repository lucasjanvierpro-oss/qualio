import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import s from "./dashboard.module.css";
import LoupeMascot from "@/components/brand/LoupeMascot";
import { getLang } from "@/lib/i18n/server";
import { locale, pickTT } from "@/lib/i18n/tt";

const STATUS_META = (tt: (fr: string, en: string) => string): Record<string, { label: string; color: string }> => ({
  ACTIVE:      { label: tt("Actif", "Active"),        color: "var(--color-success)" },
  MATCHING:    { label: "Matching",                   color: "var(--color-warning)" },
  COMPLETED:   { label: tt("Terminé", "Completed"),   color: "var(--color-text-tertiary)" },
  DRAFT:       { label: tt("Brouillon", "Draft"),     color: "var(--color-text-tertiary)" },
  IN_PROGRESS: { label: tt("En cours", "In progress"), color: "var(--color-info)" },
  CANCELLED:   { label: tt("Annulé", "Cancelled"),    color: "var(--color-error)" },
});

export default async function BrandDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const tt = pickTT(lang);
  const META = STATUS_META(tt);

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

  const companyName = bp?.companyName ?? tt("vous", "there");

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString(locale(lang), { day: "numeric", month: "short" }) : null;

  return (
    <div style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "44px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <p className="q-label" style={{ marginBottom: "8px" }}>{tt("Tableau de bord", "Dashboard")}</p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.1,
          }}>
            {tt("Bonjour", "Hello")}, {companyName}
          </h1>
        </div>
        <Link href="/brand/studies/new" className="q-btn q-btn-primary">
          + {tt("Nouvelle étude", "New study")}
        </Link>
      </div>

      {/* Stats */}
      <div className={s.stats}>
        {[
          {
            label: tt("Études actives", "Active studies"),
            value: activeStudies.length,
            color: activeStudies.length > 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
          },
          {
            label: tt("Profils à valider", "Profiles to review"),
            value: pendingReview,
            color: pendingReview > 0 ? "var(--color-warning)" : "var(--color-text-tertiary)",
            alert: pendingReview > 0,
          },
          {
            label: tt("Crédits disponibles", "Available credits"),
            value: bp?.credits ?? 0,
            color: (bp?.credits ?? 0) < 3 ? "var(--color-warning)" : "var(--color-text-primary)",
            alert: (bp?.credits ?? 0) < 3,
          },
          {
            label: tt("Études complétées", "Completed studies"),
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
            {pendingReview} {tt(`profil${pendingReview > 1 ? "s" : ""} proposé${pendingReview > 1 ? "s" : ""} par l'équipe Rarelyst`, `profile${pendingReview > 1 ? "s" : ""} suggested by the Rarelyst team`)} —{" "}
            <span style={{ fontWeight: 400 }}>{pendingStudy.title}</span>
          </div>
          <Link
            href={`/brand/studies/${pendingStudy.id}`}
            style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-warning)", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "16px" }}
          >
            {tt("Valider", "Review")} →
          </Link>
        </div>
      )}

      {/* Studies */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p className="q-label">{tt("Études récentes", "Recent studies")}</p>
          {studies.length > 5 && (
            <Link href="/brand/studies" style={{ fontSize: "12px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
              {tt("Voir toutes", "See all")} →
            </Link>
          )}
        </div>

        {studies.length === 0 ? (
          <div className="q-card q-empty">
            <LoupeMascot size={64} mood="search" className="rl-empty-mascot" />
            <p className="q-empty-title">{tt("Aucune étude pour le moment", "No studies yet")}</p>
            <p className="q-empty-sub">{tt("Créez votre première étude pour recevoir des profils ciblés sous 72h.", "Create your first study to receive targeted profiles within 72h.")}</p>
            <Link href="/brand/studies/new" className="q-btn q-btn-primary" style={{ marginTop: "20px" }}>
              {tt("Créer une étude", "Create a study")} →
            </Link>
          </div>
        ) : (
          <div className="q-card" style={{ padding: 0, overflow: "hidden" }}>
            {studies.slice(0, 6).map((study, i) => {
              const meta    = META[study.status] ?? META.ACTIVE;
              const confirmed = study.applications.filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED").length;
              const deadline  = fmtDate(study.deadlineAt);

              return (
                <Link
                  key={study.id}
                  href={`/brand/studies/${study.id}`}
                  className={s.studyRow}
                  style={{ borderTop: i > 0 ? "1px solid var(--color-border-base)" : "none" }}
                >
                  {/* Title */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                      {study.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      {study.studyType === "ONE_ON_ONE" ? tt("Entretien 1:1", "1:1 interview") : "Focus group"}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
                    {deadline ? `${tt("Avant", "Before")} ${deadline}` : "—"}
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
