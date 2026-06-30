import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:       { bg: "#2A2926", color: "#6B6760", label: "Brouillon" },
  ACTIVE:      { bg: "#1A3D2A", color: "#4ADE80", label: "Active" },
  MATCHING:    { bg: "#3D2E0A", color: "#FBBF24", label: "En matching" },
  IN_PROGRESS: { bg: "#1E2A3D", color: "#60A5FA", label: "En cours" },
  COMPLETED:   { bg: "#2A2926", color: "#9E9B95", label: "Terminée" },
  CANCELLED:   { bg: "#3D1A1A", color: "#F87171", label: "Annulée" },
};

function daysLeft(deadline: Date | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function AdminStudiesPage() {
  const studies = await prisma.study.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brandProfile: { select: { companyName: true } },
      applications: { select: { id: true, status: true } },
    },
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, color: "#F9F8F6", margin: "0 0 4px" }}>
            Toutes les études
          </h1>
          <p style={{ fontSize: "13px", color: "#6B6760", margin: 0 }}>{studies.length} étude{studies.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {studies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#6B6760" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "#9E9B95", marginBottom: "6px" }}>Aucune étude pour le moment</div>
          <div style={{ fontSize: "13px" }}>Les études soumises par les marques apparaîtront ici.</div>
        </div>
      ) : (
        <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "12px", overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 80px 100px 90px 60px", gap: "12px", padding: "10px 20px", borderBottom: "1px solid #2A2926" }}>
            {["Étude", "Marque", "Type", "Profils", "Statut", "Deadline", ""].map((h) => (
              <div key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          {studies.map((study, i) => {
            const sc = STATUS_COLORS[study.status] ?? STATUS_COLORS.DRAFT;
            const confirmed = study.applications.filter((a) => a.status === "CONFIRMED").length;
            const shortlisted = study.applications.filter((a) => ["SHORTLISTED", "INVITED", "CONFIRMED"].includes(a.status)).length;
            const dl = daysLeft(study.deadlineAt);
            const isUrgent = dl !== null && dl <= 3 && study.status !== "COMPLETED";

            return (
              <div
                key={study.id}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 80px 100px 90px 60px",
                  gap: "12px", padding: "14px 20px", alignItems: "center",
                  borderTop: i > 0 ? "1px solid #2A2926" : "none",
                  background: isUrgent ? "#1A0E00" : "transparent",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#F9F8F6", marginBottom: "2px" }}>{study.title}</div>
                  <div style={{ fontSize: "11px", color: "#6B6760" }}>
                    {new Date(study.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#9E9B95" }}>{study.brandProfile.companyName}</div>
                <div style={{ fontSize: "12px", color: "#9E9B95" }}>{study.studyType === "ONE_ON_ONE" ? "1:1" : "Focus"}</div>
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", color: shortlisted > 0 ? "#F9F8F6" : "#6B6760" }}>
                  {confirmed}/{study.targetParticipantCount}
                  {shortlisted > confirmed && <span style={{ color: "#FBBF24", fontSize: "11px" }}> +{shortlisted - confirmed}</span>}
                </div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: isUrgent ? "#FBBF24" : "#9E9B95", fontWeight: isUrgent ? 600 : 400 }}>
                  {dl === null ? "—" : dl < 0 ? "Dépassée" : dl === 0 ? "Aujourd'hui" : `J-${dl}`}
                </div>
                <Link href={`/admin/studies/${study.id}`} style={{ fontSize: "12px", color: "#4ADE80", textDecoration: "none", fontWeight: 500 }}>
                  Gérer →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
