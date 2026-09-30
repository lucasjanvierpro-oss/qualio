import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LoupeMascot from "@/components/brand/LoupeMascot";
import { getLang } from "@/lib/i18n/server";
import { locale, pickTT } from "@/lib/i18n/tt";

export default async function ParticipantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const tt = pickTT(lang);
  const loc = locale(lang);

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
    .flatMap((a) => a.interview ? [{ ...a.interview, study: a.study, participantPayCents: a.participantPayCents }] : [])
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

  const firstName = profile?.firstName ?? tt("vous", "there");

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "44px 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
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
          {tt("Bonjour", "Hello")}, {firstName}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "8px" }}>
          {upcomingInterview
            ? tt("Vous avez un entretien à venir", "You have an upcoming interview")
            : tt("Aucun entretien planifié pour le moment", "No interview scheduled yet")}
          {availableStudies.length > 0 &&
            ` · ${availableStudies.length} ${tt(`étude${availableStudies.length > 1 ? "s" : ""} disponible${availableStudies.length > 1 ? "s" : ""}`, `stud${availableStudies.length > 1 ? "ies" : "y"} available`)}`}
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
              {tt("Prochain entretien", "Next interview")}
            </p>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, fontStyle: "normal", color: "#fff", marginBottom: "5px" }}>
              {upcomingInterview.study.title}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              {new Date(upcomingInterview.scheduledAt).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}
              {" "}&middot;{" "}
              {new Date(upcomingInterview.scheduledAt).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })}
              {" "}&middot;{" "}
              {tt("Récompense", "Reward")} : <span style={{ fontFamily: "var(--font-mono-base)", fontWeight: 700 }}>
                {((upcomingInterview.participantPayCents ?? upcomingInterview.study.rewardAmount) / 100).toFixed(0)}€
              </span>
            </div>
          </div>
          {upcomingInterview.videoLink ? (
            <a
              href={`/participant/interview/${upcomingInterview.id}`}
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
              {tt("Rejoindre", "Join")} →
            </a>
          ) : (
            <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: "2px", fontSize: "13px", flexShrink: 0 }}>
              {tt("Lien à venir", "Link coming soon")}
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
            {tt("Vérification de votre identité en cours — généralement 24–48h", "Identity verification in progress, usually 24–48h")}
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
            {tt("Document refusé — veuillez renvoyer votre pièce d'identité", "Document declined, please upload your ID again")}
          </span>
          <Link href="/participant/verification" style={{ fontSize: "12px", color: "var(--color-error)", fontWeight: 700, textDecoration: "none", marginLeft: "16px" }}>
            {tt("Renvoyer", "Upload again")} →
          </Link>
        </div>
      )}

      {/* Profile completeness */}
      {completeness < 100 && (
        <div className="q-card" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{tt("Complétude du profil", "Profile completeness")}</span>
            <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", fontWeight: 700, color: completeness < 60 ? "var(--color-warning)" : "var(--color-accent)" }}>
              {completeness}%
            </span>
          </div>
          <div style={{ height: "3px", background: "var(--color-surface-2)", borderRadius: "2px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: `${completeness}%`, background: "var(--color-accent)", borderRadius: "2px", transition: "width 0.4s" }} />
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: 0 }}>
            {tt("Un profil complet augmente vos chances d'être sélectionné(e) pour les études.", "A complete profile increases your chances of being selected for studies.")}{" "}
            <Link href="/participant/profile" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
              {tt("Compléter", "Complete it")} →
            </Link>
          </p>
        </div>
      )}

      {/* Studies */}
      <div>
        <p className="q-label" style={{ marginBottom: "14px" }}>{tt("Études disponibles pour vous", "Studies available to you")}</p>

        {availableStudies.length === 0 ? (
          <div className="q-card q-empty">
            <LoupeMascot size={64} mood="search" className="rl-empty-mascot" />
            <p className="q-empty-title">{tt("Aucune étude pour le moment", "No studies yet")}</p>
            <p className="q-empty-sub">
              {tt("Complétez votre profil et l'équipe Rarelyst vous sélectionnera pour les études qui correspondent à votre profil.", "Complete your profile and the Rarelyst team will select you for studies that match it.")}
            </p>
            <Link href="/participant/profile" className="q-btn q-btn-outline" style={{ marginTop: "18px" }}>
              {tt("Compléter mon profil", "Complete my profile")}
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
                    {app.study.studyType === "ONE_ON_ONE" ? tt("Entretien individuel", "One-on-one interview") : "Focus group"}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--color-text-tertiary)", flexWrap: "wrap" }}>
                    <span>{app.study.interviewDuration} min</span>
                    {app.study.deadlineAt && (
                      <>
                        <span>·</span>
                        <span>
                          {tt("Avant le", "Before")} {new Date(app.study.deadlineAt).toLocaleDateString(loc, { day: "numeric", month: "short" })}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="q-tag" style={{
                      color: app.status === "INVITED" ? "var(--color-info)" : "var(--color-text-secondary)",
                      borderColor: app.status === "INVITED" ? "var(--color-info)" : "var(--color-border-strong)",
                      fontSize: "10px",
                    }}>
                      {app.status === "INVITED" ? tt("Invitation reçue", "Invitation received") : tt("Présélectionné", "Shortlisted")}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
                      {((app.participantPayCents ?? app.study.rewardAmount) / 100).toFixed(0)}€
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>{tt("récompense", "reward")}</div>
                  </div>
                  <Link
                    // La page attend l'identifiant de la CANDIDATURE, pas celui de l'étude :
                    // un participant peut candidater à plusieurs études, et c'est sa
                    // candidature qui porte ses créneaux et son entretien.
                    href={`/participant/studies/${app.id}`}
                    className="q-btn q-btn-primary"
                    style={{ fontSize: "12px", padding: "8px 16px" }}
                  >
                    {tt("Voir", "View")} →
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
