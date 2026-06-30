import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParticipantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        include: {
          applications: {
            where: { status: { in: ["SHORTLISTED", "INVITED", "CONFIRMED"] } },
            include: {
              study: {
                select: {
                  id: true, title: true, studyType: true,
                  rewardAmount: true, interviewDuration: true, deadlineAt: true,
                },
              },
              interview: true,
            },
            orderBy: { appliedAt: "desc" },
          },
        },
      },
    },
  });

  const profile     = dbUser?.participantProfile;
  const applications = profile?.applications ?? [];

  const upcomingInterview = applications
    .flatMap((a) => a.interview ? [{ ...a.interview, study: a.study }] : [])
    .filter((i) => i.status === "scheduled" && new Date(i.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const availableStudies = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INVITED");

  const fields = [
    profile?.bio, profile?.city, profile?.profession,
    profile?.interests.length, profile?.brandAffinities.length,
    profile?.screenerAnswers,
    profile?.idVerificationStatus === "VERIFIED",
    profile?.languages.length,
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const firstName = profile?.firstName ?? "vous";

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "44px 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
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
          Bonjour, {firstName}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "8px" }}>
          {upcomingInterview
            ? "Vous avez un entretien à venir"
            : "Aucun entretien planifié pour le moment"}
          {availableStudies.length > 0 &&
            ` · ${availableStudies.length} étude${availableStudies.length > 1 ? "s" : ""} disponible${availableStudies.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Upcoming interview — accent band */}
      {upcomingInterview && (
        <div style={{
          background: "var(--color-accent)",
          borderRadius: "3px",
          padding: "22px 26px",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
              Prochain entretien
            </p>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 400, fontStyle: "italic", color: "#fff", marginBottom: "5px" }}>
              {upcomingInterview.study.title}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              {new Date(upcomingInterview.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              {" "}&middot;{" "}
              {new Date(upcomingInterview.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {" "}&middot;{" "}
              Récompense : <span style={{ fontFamily: "var(--font-mono-base)", fontWeight: 700 }}>
                {(upcomingInterview.study.rewardAmount / 100).toFixed(0)}€
              </span>
            </div>
          </div>
          {upcomingInterview.videoLink ? (
            <a
              href={upcomingInterview.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 20px",
                background: "#fff",
                color: "var(--color-accent)",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Rejoindre →
            </a>
          ) : (
            <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: "2px", fontSize: "13px", flexShrink: 0 }}>
              Lien à venir
            </div>
          )}
        </div>
      )}

      {/* Verification banners */}
      {profile?.idVerificationStatus === "PENDING" && profile.idDocumentUrl && (
        <div style={{
          padding: "13px 18px",
          background: "var(--color-warning-light)",
          border: "1px solid var(--color-warning)",
          borderRadius: "3px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "13px", color: "var(--color-warning)", fontWeight: 500 }}>
            Vérification de votre identité en cours — généralement 24–48h
          </span>
        </div>
      )}
      {profile?.idVerificationStatus === "REJECTED" && (
        <div style={{
          padding: "13px 18px",
          background: "var(--color-error-light)",
          border: "1px solid var(--color-error)",
          borderRadius: "3px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "13px", color: "var(--color-error)", fontWeight: 500 }}>
            Document refusé — veuillez renvoyer votre pièce d'identité
          </span>
          <Link href="/participant/verification" style={{ fontSize: "12px", color: "var(--color-error)", fontWeight: 700, textDecoration: "none", marginLeft: "16px" }}>
            Renvoyer →
          </Link>
        </div>
      )}

      {/* Profile completeness */}
      {completeness < 100 && (
        <div className="q-card" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>Complétude du profil</span>
            <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", fontWeight: 700, color: completeness < 60 ? "var(--color-warning)" : "var(--color-accent)" }}>
              {completeness}%
            </span>
          </div>
          <div style={{ height: "3px", background: "var(--color-surface-2)", borderRadius: "2px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: `${completeness}%`, background: "var(--color-accent)", borderRadius: "2px", transition: "width 0.4s" }} />
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: 0 }}>
            Un profil complet augmente vos chances d'être sélectionné(e) pour les études.{" "}
            <Link href="/participant/profile" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
              Compléter →
            </Link>
          </p>
        </div>
      )}

      {/* Studies */}
      <div>
        <p className="q-label" style={{ marginBottom: "14px" }}>Études disponibles pour vous</p>

        {availableStudies.length === 0 ? (
          <div className="q-card q-empty">
            <div style={{ fontSize: "24px", marginBottom: "12px", opacity: 0.25 }}>◎</div>
            <p className="q-empty-title">Aucune étude pour le moment</p>
            <p className="q-empty-sub">
              Complétez votre profil et l'équipe Qualio vous sélectionnera pour les études qui correspondent à votre profil.
            </p>
            <Link href="/participant/profile" className="q-btn q-btn-outline" style={{ marginTop: "18px" }}>
              Compléter mon profil
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {availableStudies.map((app) => (
              <div
                key={app.id}
                className="q-card"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", padding: "18px 20px" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "5px" }}>
                    {app.study.studyType === "ONE_ON_ONE" ? "Entretien individuel" : "Focus group"}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                    <span>{app.study.interviewDuration} min</span>
                    {app.study.deadlineAt && (
                      <>
                        <span>·</span>
                        <span>
                          Avant le {new Date(app.study.deadlineAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="q-tag" style={{
                      color: app.status === "INVITED" ? "var(--color-info)" : "var(--color-text-secondary)",
                      borderColor: app.status === "INVITED" ? "var(--color-info)" : "var(--color-border-strong)",
                      fontSize: "10px",
                    }}>
                      {app.status === "INVITED" ? "Invitation reçue" : "Présélectionné"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
                      {(app.study.rewardAmount / 100).toFixed(0)}€
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>récompense</div>
                  </div>
                  <Link
                    href={`/participant/studies/${app.study.id}`}
                    className="q-btn q-btn-primary"
                    style={{ fontSize: "12px", padding: "8px 16px" }}
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
