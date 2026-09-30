import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LoupeMascot from "@/components/brand/LoupeMascot";
import { getLang } from "@/lib/i18n/server";
import { locale, pickTT } from "@/lib/i18n/tt";

type TT = (fr: string, en: string) => string;
const TYPE_LABEL = (tt: TT): Record<string, string> => ({
  ONE_ON_ONE: tt("Entretien 1:1", "1:1 interview"),
  FOCUS_GROUP: "Focus group",
});

const STATUS_LABEL = (tt: TT): Record<string, { label: string; bg: string; text: string }> => ({
  SHORTLISTED: { label: tt("Proposée", "Proposed"), bg: "var(--color-info-light)", text: "var(--color-info)" },
  INVITED:     { label: tt("Invitation reçue", "Invitation received"), bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  CONFIRMED:   { label: tt("Confirmée", "Confirmed"), bg: "var(--color-success-light)", text: "var(--color-success)" },
  COMPLETED:   { label: tt("Terminée", "Completed"), bg: "var(--color-surface-2)", text: "var(--color-text-tertiary)" },
  REJECTED:    { label: tt("Non retenu(e)", "Not selected"), bg: "var(--color-error-light)", text: "var(--color-error)" },
});

export default async function ParticipantStudiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const tt = pickTT(lang);
  const loc = locale(lang);
  const TYPES = TYPE_LABEL(tt);
  const STATUSES = STATUS_LABEL(tt);

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        include: {
          applications: {
            where: {
              status: { in: ["SHORTLISTED", "INVITED", "CONFIRMED", "COMPLETED", "REJECTED"] },
            },
            include: {
              study: {
                select: {
                  id: true,
                  title: true,
                  objective: true,
                  studyType: true,
                  rewardAmount: true,
                  rewardType: true,
                  interviewDuration: true,
                  deadlineAt: true,
                  preferredLanguage: true,
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

  const applications = dbUser?.participantProfile?.applications ?? [];
  const active = applications.filter((a) => ["SHORTLISTED", "INVITED", "CONFIRMED"].includes(a.status));
  const past = applications.filter((a) => ["COMPLETED", "REJECTED"].includes(a.status));

  function fmtDate(d: Date | null) {
    if (!d) return null;
    return new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" }).format(new Date(d));
  }

  function fmtReward(amountCents: number, type: string) {
    const euros = (amountCents / 100).toFixed(0);
    return type === "VOUCHER" ? `${euros}€ ${tt("en bon d'achat", "voucher")}` : `${euros}€`;
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 6px" }}>
        {tt("Mes études", "My studies")}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 36px" }}>
        {tt("Les études pour lesquelles vous avez été sélectionné(e).", "The studies you have been selected for.")}
      </p>

      {/* Études actives */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
          {tt("En cours", "Active")} ({active.length})
        </h2>

        {active.length === 0 ? (
          <div style={{ padding: "48px 32px", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
            <LoupeMascot size={64} mood="search" className="rl-empty-mascot" />
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>{tt("Aucune étude pour le moment", "No studies yet")}</div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
              {tt("Complétez votre profil pour augmenter vos chances d'être sélectionné(e).", "Complete your profile to increase your chances of being selected.")}
            </p>
            <Link href="/participant/profile" style={{ display: "inline-block", marginTop: "16px", padding: "9px 20px", background: "var(--color-accent)", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              {tt("Compléter mon profil", "Complete my profile")}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {active.map((app) => {
              const st = STATUSES[app.status] ?? STATUSES.SHORTLISTED;
              const hasInterview = app.interview && app.interview.status === "scheduled";
              return (
                <Link
                  key={app.id}
                  href={`/participant/studies/${app.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", gap: "20px", padding: "20px 24px",
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    borderRadius: "12px", cursor: "pointer",
                    borderLeft: app.status === "INVITED" ? "4px solid var(--color-warning)" : "1px solid var(--color-border)",
                    transition: "border-color 0.15s",
                  }}>
                    {/* Icône type */}
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                      {app.study.studyType === "FOCUS_GROUP" ? "👥" : "💬"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {app.study.title}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: st.bg, color: st.text }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span>{TYPES[app.study.studyType] ?? app.study.studyType}</span>
                        <span>·</span>
                        <span>{app.study.interviewDuration} min</span>
                        {app.study.deadlineAt && <><span>·</span><span>{tt("avant le", "before")} {fmtDate(app.study.deadlineAt)}</span></>}
                      </div>
                      {hasInterview && (
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>
                          📅 {tt("Entretien prévu", "Interview scheduled")} — {new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(app.interview!.scheduledAt))}
                        </div>
                      )}
                    </div>

                    {/* Récompense */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--color-accent)" }}>
                        {fmtReward(app.participantPayCents ?? app.study.rewardAmount, app.study.rewardType)}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>{tt("récompense", "reward")}</div>
                    </div>

                    <div style={{ color: "var(--color-text-tertiary)", fontSize: "18px" }}>›</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            {tt("Historique", "History")} ({past.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {past.map((app) => {
              const st = STATUSES[app.status] ?? STATUSES.COMPLETED;
              return (
                <div
                  key={app.id}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", opacity: 0.7 }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>{app.study.title}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: st.bg, color: st.text }}>
                    {st.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                    {fmtReward(app.participantPayCents ?? app.study.rewardAmount, app.study.rewardType)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
