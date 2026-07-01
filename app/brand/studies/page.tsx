import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT:       { label: "Brouillon",   color: "var(--color-text-tertiary)" },
  ACTIVE:      { label: "Active",      color: "var(--color-success)" },
  MATCHING:    { label: "En matching", color: "var(--color-warning)" },
  IN_PROGRESS: { label: "En cours",    color: "var(--color-info)" },
  COMPLETED:   { label: "Terminée",    color: "var(--color-text-secondary)" },
  CANCELLED:   { label: "Annulée",     color: "var(--color-error)" },
};

export default async function BrandStudiesPage() {
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

  const studies = dbUser?.brandProfile?.studies ?? [];

  return (
    <div style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "44px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
        <div>
          <p className="q-label" style={{ marginBottom: "8px" }}>Études</p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "30px",
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.1,
          }}>
            Mes études
          </h1>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>
            {studies.length} étude{studies.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/brand/studies/new" className="q-btn q-btn-primary">
          + Nouvelle étude
        </Link>
      </div>

      {studies.length === 0 ? (
        <div className="q-card q-empty">
          <div style={{ fontSize: "24px", marginBottom: "14px", opacity: 0.2 }}>◫</div>
          <p className="q-empty-title">Aucune étude pour le moment</p>
          <p className="q-empty-sub">Créez votre première étude pour recevoir des profils ciblés sous 72h.</p>
          <Link href="/brand/studies/new" className="q-btn q-btn-primary" style={{ marginTop: "20px" }}>
            Créer une étude →
          </Link>
        </div>
      ) : (
        <div className="q-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 90px 90px 50px",
            gap: "16px",
            padding: "10px 20px",
            background: "var(--color-surface-2)",
            borderBottom: "1px solid var(--color-border-base)",
          }}>
            {["Étude", "Statut", "Deadline", "Participants", ""].map((col) => (
              <div key={col} className="q-label">{col}</div>
            ))}
          </div>

          {studies.map((s, i) => {
            const meta      = STATUS_META[s.status] ?? STATUS_META.ACTIVE;
            const confirmed = s.applications.filter((a) => ["CONFIRMED", "COMPLETED"].includes(a.status)).length;
            const pending   = s.applications.filter((a) => a.status === "SHORTLISTED").length;
            const dl        = s.deadlineAt
              ? Math.ceil((new Date(s.deadlineAt).getTime() - Date.now()) / 86_400_000)
              : null;
            const urgent = dl !== null && dl <= 3;

            return (
              <Link
                key={s.id}
                href={`/brand/studies/${s.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 90px 90px 50px",
                  gap: "16px",
                  padding: "16px 20px",
                  alignItems: "center",
                  textDecoration: "none",
                  borderTop: i > 0 ? "1px solid var(--color-border-base)" : "none",
                  borderLeft: pending > 0 ? "2px solid var(--color-warning)" : "2px solid transparent",
                }}
              >
                {/* Title */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "3px" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", display: "flex", gap: "10px" }}>
                    <span>{s.studyType === "ONE_ON_ONE" ? "Entretien 1:1" : "Focus group"}</span>
                    {pending > 0 && (
                      <span style={{ color: "var(--color-warning)", fontWeight: 600 }}>
                        {pending} profil{pending > 1 ? "s" : ""} à valider
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className="q-tag" style={{ color: meta.color, borderColor: meta.color, fontSize: "10px" }}>
                    {meta.label}
                  </span>
                </div>

                {/* Deadline */}
                <div>
                  {s.deadlineAt ? (
                    <>
                      <div style={{ fontSize: "12px", color: urgent ? "var(--color-error)" : "var(--color-text-secondary)", fontWeight: urgent ? 600 : 400 }}>
                        {new Date(s.deadlineAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </div>
                      {dl !== null && (
                        <div style={{ fontSize: "10px", color: urgent ? "var(--color-error)" : "var(--color-text-tertiary)", fontFamily: "var(--font-mono-base)" }}>
                          {dl > 0 ? `J−${dl}` : "Aujourd'hui"}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>—</span>
                  )}
                </div>

                {/* Progress */}
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "14px", color: confirmed >= s.targetParticipantCount ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                  {confirmed}<span style={{ color: "var(--color-text-tertiary)" }}>/{s.targetParticipantCount}</span>
                </div>

                {/* Arrow */}
                <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "right" }}>→</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
