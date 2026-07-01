import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeStudies, pendingVerifications, recentParticipants, shortlistedCount, actionStudies] =
    await Promise.all([
      prisma.study.findMany({
        where: { status: { in: ["ACTIVE", "MATCHING"] } },
        orderBy: { deadlineAt: "asc" },
        include: { brandProfile: { select: { companyName: true } }, applications: { select: { status: true } } },
        take: 6,
      }),
      prisma.participantProfile.count({ where: { idVerificationStatus: "PENDING", idDocumentUrl: { not: null } } }),
      prisma.participantProfile.findMany({
        where: { createdAt: { gte: today } },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.application.count({ where: { status: "SHORTLISTED" } }),
      prisma.study.findMany({
        where: { status: { in: ["ACTIVE", "MATCHING"] } },
        orderBy: { deadlineAt: "asc" },
        include: { brandProfile: { select: { companyName: true } }, applications: { select: { status: true } } },
        take: 5,
      }),
    ]);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const card = {
    background: "#1A1917",
    border: "1px solid #252320",
    borderRadius: "3px",
  };

  return (
    <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "44px 40px", color: "#F2F0EC" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#4A4845", marginBottom: "10px" }}>
          Vue d'ensemble
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "30px",
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "-0.02em",
          color: "#F8F7F4",
          margin: 0,
          lineHeight: 1.1,
        }}>
          Bonjour, Lucas
        </h1>
        <p style={{ fontSize: "12px", color: "#4A4845", marginTop: "6px", textTransform: "capitalize" }}>
          {dateStr}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "44px" }}>
        {[
          { label: "Études actives", value: activeStudies.length, alert: false },
          { label: "Shortlistés (marques)", value: shortlistedCount, alert: shortlistedCount > 0 },
          { label: "Vérifications ID en attente", value: pendingVerifications, alert: pendingVerifications > 0 },
          { label: "Inscrits aujourd'hui", value: recentParticipants.length, alert: false },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
            <div style={{
              fontFamily: "var(--font-mono-base)",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: s.alert ? "#D97706" : "#F8F7F4",
              lineHeight: 1,
              marginBottom: "8px",
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A4845" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Studies requiring action */}
      <div style={{ marginBottom: "44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#4A4845", margin: 0 }}>
            Études en cours · action requise
          </p>
          <Link href="/admin/studies" style={{ fontSize: "12px", color: "#5A8A6A", textDecoration: "none", fontWeight: 500 }}>
            Voir tout →
          </Link>
        </div>

        {actionStudies.length === 0 ? (
          <div style={{ ...card, padding: "28px", textAlign: "center", color: "#4A4845", fontSize: "14px" }}>
            Toutes les études sont à jour ✓
          </div>
        ) : (
          <div style={{ ...card, overflow: "hidden" }}>
            {actionStudies.map((s, i) => {
              const confirmed = s.applications.filter((a) => ["CONFIRMED", "COMPLETED"].includes(a.status)).length;
              const dl = s.deadlineAt
                ? Math.ceil((new Date(s.deadlineAt).getTime() - Date.now()) / 86_400_000)
                : null;
              const urgent = dl !== null && dl <= 3;

              return (
                <Link
                  key={s.id}
                  href={`/admin/studies/${s.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "8px 1fr auto auto auto",
                    gap: "18px",
                    padding: "15px 20px",
                    alignItems: "center",
                    textDecoration: "none",
                    borderTop: i > 0 ? "1px solid #252320" : "none",
                  }}
                >
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: urgent ? "#D97706" : "#3B7A55", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#F0EDE8" }}>{s.title}</div>
                    <div style={{ fontSize: "11px", color: "#5A5754", marginTop: "2px" }}>{s.brandProfile.companyName}</div>
                  </div>
                  <div style={{ fontSize: "11px", color: urgent ? "#D97706" : "#5A5754", fontFamily: "var(--font-mono-base)" }}>
                    {dl !== null ? `J−${dl}` : "—"}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", color: "#7A7875" }}>
                    {confirmed}<span style={{ color: "#3A3835" }}>/{s.targetParticipantCount}</span>
                  </div>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    border: "1px solid #2B5E3A",
                    color: "#5A9A6A",
                    borderRadius: "2px",
                  }}>
                    Gérer →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent signups */}
      <div>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#4A4845", marginBottom: "14px" }}>
          Nouveaux participants · aujourd'hui
        </p>

        {recentParticipants.length === 0 ? (
          <div style={{ ...card, padding: "24px", textAlign: "center", color: "#4A4845", fontSize: "14px" }}>
            Aucune inscription aujourd'hui
          </div>
        ) : (
          <div style={{ ...card, overflow: "hidden" }}>
            {recentParticipants.map((p, i) => (
              <Link
                key={p.id}
                href={`/admin/participants/${p.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "13px 20px",
                  textDecoration: "none",
                  borderTop: i > 0 ? "1px solid #252320" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#252320",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#7A7875",
                    flexShrink: 0,
                  }}>
                    {p.firstName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#F0EDE8" }}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#5A5754" }}>
                      {p.city ?? p.user.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "2px",
                    border: `1px solid ${p.idVerificationStatus === "VERIFIED" ? "#2B5E3A" : "#5E4A1A"}`,
                    color: p.idVerificationStatus === "VERIFIED" ? "#5A9A6A" : "#D97706",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    {p.idVerificationStatus === "VERIFIED" ? "Vérifié" : "À vérifier"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#4A4845", fontFamily: "var(--font-mono-base)" }}>
                    {new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
