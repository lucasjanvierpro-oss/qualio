"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptApplication, rejectApplication } from "@/app/actions/studies";

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  city: string | null;
  profession: string | null;
  interests: string[];
  bio: string | null;
  screenerAnswers: unknown;
};

type Application = {
  id: string;
  status: string;
  adminScore: number | null;
  brandAccepted: boolean | null;
  applicationNote: string | null;
  participantProfile: Participant;
};

type Study = {
  id: string;
  title: string;
  status: string;
  studyType: string;
  targetParticipantCount: number;
  confirmedCount: number;
  deadlineAt: Date | null;
  applications: Application[];
};

const MOCK_CANDIDATES = [
  { id: "m1", applicationId: "a1", name: "Amina D.", age: 28, city: "Paris", profession: "Styliste", interests: ["Mode", "Luxe", "Streetwear"], bio: "Passionnée de mode depuis toujours, j'achète régulièrement chez Lacoste, AMI et Jacquemus.", score: 5, status: "SHORTLISTED" },
  { id: "m2", applicationId: "a2", name: "Thomas R.", age: 34, city: "Lyon", profession: "Chef de produit", interests: ["Sport", "Mode", "Tech"], bio: "Early adopter, je suis les tendances lifestyle et achète environ 2 fois par mois.", score: 4, status: "SHORTLISTED" },
  { id: "m3", applicationId: "a3", name: "Céline M.", age: 26, city: "Paris", profession: "Consultante", interests: ["Luxe", "Beauté", "Mode"], bio: "Cliente Lacoste régulière, j'adore la ligne Polo classique et les nouvelles collaborations.", score: 5, status: "SHORTLISTED" },
  { id: "m4", applicationId: "a4", name: "Karim B.", age: 31, city: "Marseille", profession: "Architecte", interests: ["Design", "Mode", "Lifestyle"], bio: "Sensible à l'esthétique et au patrimoine des marques françaises.", score: 4, status: "INVITED" },
];

type CandidateRow = {
  id: string;
  applicationId: string;
  name: string;
  age: number;
  city: string;
  profession: string;
  interests: string[];
  bio: string;
  score: number;
  status: string;
};

function getAge(dob: Date | null): number {
  if (!dob) return 0;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function mapApplications(apps: Application[]): CandidateRow[] {
  return apps.map((a) => ({
    id: a.participantProfile.id,
    applicationId: a.id,
    name: `${a.participantProfile.firstName} ${a.participantProfile.lastName[0]}.`,
    age: getAge(a.participantProfile.dateOfBirth),
    city: a.participantProfile.city ?? "",
    profession: a.participantProfile.profession ?? "",
    interests: a.participantProfile.interests,
    bio: a.participantProfile.bio ?? "",
    score: a.adminScore ?? 3,
    status: a.status,
  }));
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:      { label: "Actif",      color: "var(--color-success)" },
  MATCHING:    { label: "Matching",   color: "var(--color-warning)" },
  IN_PROGRESS: { label: "En cours",   color: "var(--color-info)" },
  COMPLETED:   { label: "Terminé",    color: "var(--color-text-secondary)" },
  DRAFT:       { label: "Brouillon",  color: "var(--color-text-tertiary)" },
  CANCELLED:   { label: "Annulé",     color: "var(--color-error)" },
};

export default function StudyDetailClient({
  study,
  studyId,
  credits,
}: {
  study: Study | null;
  studyId: string;
  credits: number;
}) {
  const isMock = !study;
  const candidates: CandidateRow[] = isMock ? MOCK_CANDIDATES : mapApplications(study.applications);

  const [rows, setRows]             = useState(candidates);
  const [tab, setTab]               = useState<"pending" | "accepted" | "confirmed" | "rejected">("pending");
  const [loading, setLoading]       = useState<string | null>(null);
  const [noCreditsModal, setNoCreditsModal] = useState(false);
  const [localCredits, setLocalCredits]     = useState(credits);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const pending   = rows.filter((c) => c.status === "SHORTLISTED" || c.status === "PENDING");
  const accepted  = rows.filter((c) => c.status === "INVITED");
  const confirmed = rows.filter((c) => c.status === "CONFIRMED");
  const rejected  = rows.filter((c) => c.status === "REJECTED");

  const tabs = [
    { key: "pending"   as const, label: "À valider",  count: pending.length },
    { key: "accepted"  as const, label: "Acceptés",   count: accepted.length },
    { key: "confirmed" as const, label: "Confirmés",  count: confirmed.length },
    { key: "rejected"  as const, label: "Refusés",    count: rejected.length },
  ];

  const shown = { pending, accepted, confirmed, rejected }[tab];

  const title          = study?.title ?? "Perceptions Lacoste Heritage";
  const status         = study?.status ?? "MATCHING";
  const target         = study?.targetParticipantCount ?? 6;
  const confirmedCount = confirmed.length;
  const deadline       = study?.deadlineAt
    ? new Date(study.deadlineAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "12 juin";
  const studyType      = study?.studyType === "FOCUS_GROUP" ? "Focus group" : "Entretien 1:1";
  const meta           = STATUS_META[status] ?? STATUS_META.ACTIVE;
  const progress       = Math.min((confirmedCount / target) * 100, 100);

  async function handleAccept(row: CandidateRow) {
    if (localCredits < 1) { setNoCreditsModal(true); return; }
    setLoading(row.applicationId);
    if (!isMock) {
      const result = await acceptApplication(row.applicationId);
      if (result?.error === "not_enough_credits") {
        setNoCreditsModal(true);
        setLoading(null);
        return;
      }
    }
    setRows((prev) => prev.map((r) => r.applicationId === row.applicationId ? { ...r, status: "INVITED" } : r));
    setLocalCredits((c) => c - 1);
    setLoading(null);
  }

  async function handleReject(row: CandidateRow) {
    setLoading(row.applicationId);
    if (!isMock) await rejectApplication(row.applicationId);
    setRows((prev) => prev.map((r) => r.applicationId === row.applicationId ? { ...r, status: "REJECTED" } : r));
    setLoading(null);
  }

  return (
    <div style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "44px 40px" }}>

      {/* No credits modal */}
      {noCreditsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,18,14,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "4px", padding: "36px", maxWidth: "400px", width: "90%" }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: "0 0 10px",
            }}>
              Crédits insuffisants
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 24px", lineHeight: 1.65 }}>
              Il vous faut au moins 1 crédit pour confirmer un participant. Rechargez votre compte pour continuer.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setNoCreditsModal(false)} className="q-btn q-btn-outline" style={{ fontSize: "13px" }}>
                Annuler
              </button>
              <a href="/brand/account?tab=credits" className="q-btn q-btn-primary" style={{ fontSize: "13px", textDecoration: "none" }}>
                Acheter des crédits →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <Link href="/brand/studies" style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "20px" }}>
        ← Mes études
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.025em",
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.1,
            }}>
              {title}
            </h1>
            <span className="q-tag" style={{ color: meta.color, borderColor: meta.color, fontSize: "10px" }}>
              {meta.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            <span>{studyType}</span>
            <span>·</span>
            <span>{target} participants</span>
            <span>·</span>
            <span>Deadline {deadline}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
          {status === "COMPLETED" && (
            <Link href={`/brand/studies/${study?.id ?? studyId}/report`} className="q-btn q-btn-outline" style={{ fontSize: "12px" }}>
              Voir le rapport ✨
            </Link>
          )}
          <div style={{ textAlign: "right" }}>
            <p className="q-label" style={{ marginBottom: "4px" }}>Crédits</p>
            <span style={{
              fontFamily: "var(--font-mono-base)",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: localCredits < 3 ? "var(--color-warning)" : "var(--color-text-primary)",
            }}>
              {localCredits}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Participants confirmés</span>
          <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {confirmedCount}<span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>/{target}</span>
          </span>
        </div>
        <div style={{ height: "2px", background: "var(--color-border-base)" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-accent)", transition: "width 0.4s" }} />
        </div>
      </div>

      {localCredits < 3 && (
        <div style={{ padding: "12px 16px", background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "2px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-warning)" }}>
            {localCredits} crédit{localCredits !== 1 ? "s" : ""} restant{localCredits !== 1 ? "s" : ""} — rechargez pour continuer à valider des profils
          </span>
          <Link href="/brand/account" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-warning)", textDecoration: "none", marginLeft: "16px" }}>
            Recharger →
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-base)", marginBottom: "24px", gap: "0" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
              marginBottom: "-1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono-base)",
                fontWeight: 700,
                padding: "1px 5px",
                background: tab === t.key ? "var(--color-text-primary)" : "var(--color-surface-2)",
                color: tab === t.key ? "#fff" : "var(--color-text-secondary)",
                borderRadius: "2px",
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Candidates */}
      {shown.length === 0 ? (
        <div className="q-empty">
          <div style={{ fontSize: "20px", opacity: 0.2, marginBottom: "12px" }}>◎</div>
          <p className="q-empty-title" style={{ fontSize: "18px" }}>Aucun profil ici</p>
          <p className="q-empty-sub">
            {tab === "pending"
              ? "L'équipe Qualio prépare des profils qui correspondent à vos critères."
              : "Pas de profils dans cette catégorie pour le moment."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {shown.map((c) => {
            const isOpen = expanded === c.applicationId;
            const screener = c.bio;

            return (
              <div
                key={c.id}
                className="q-card"
                style={{ padding: "0", overflow: "hidden", borderColor: tab === "pending" && c.score >= 4 ? "var(--color-accent-light)" : undefined }}
              >
                {/* Card header */}
                <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    {/* Avatar */}
                    <div style={{
                      width: "38px",
                      height: "38px",
                      background: "var(--color-accent-light)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontStyle: "italic",
                      color: "var(--color-accent)",
                      flexShrink: 0,
                    }}>
                      {c.name[0]}
                    </div>

                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "3px" }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                        {[c.age > 0 ? `${c.age} ans` : null, c.city, c.profession].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    {/* Score dots */}
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[1,2,3,4,5].map((n) => (
                        <div key={n} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: n <= c.score ? "var(--color-accent)" : "var(--color-border-base)",
                        }} />
                      ))}
                    </div>

                    {/* Actions */}
                    {tab === "pending" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleAccept(c)}
                          disabled={!!loading}
                          className="q-btn q-btn-primary"
                          style={{ fontSize: "12px", padding: "6px 14px" }}
                        >
                          {loading === c.applicationId ? "…" : "Accepter"}
                          <span style={{ opacity: 0.7, fontWeight: 400 }}> −1cr</span>
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          disabled={!!loading}
                          className="q-btn q-btn-ghost"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          Refuser
                        </button>
                      </div>
                    )}

                    {tab === "accepted" && (
                      <span style={{ fontSize: "12px", color: "var(--color-info)", fontWeight: 500 }}>
                        Invitation envoyée
                      </span>
                    )}
                    {tab === "confirmed" && (
                      <span style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>
                        ✓ Confirmé
                      </span>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.applicationId)}
                      style={{
                        width: "28px", height: "28px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "none", border: "1px solid var(--color-border-base)",
                        borderRadius: "2px", cursor: "pointer",
                        fontSize: "12px", color: "var(--color-text-tertiary)",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* Interests */}
                <div style={{ padding: "0 20px 14px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {c.interests.map((interest) => (
                    <span key={interest} className="q-tag" style={{ color: "var(--color-text-tertiary)", borderColor: "var(--color-border-base)", fontSize: "10px" }}>
                      {interest}
                    </span>
                  ))}
                </div>

                {/* Expanded bio */}
                {isOpen && screener && (
                  <div style={{
                    padding: "16px 20px",
                    background: "var(--color-surface-2)",
                    borderTop: "1px solid var(--color-border-base)",
                  }}>
                    <p className="q-label" style={{ marginBottom: "8px" }}>Profil</p>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.65 }}>
                      {screener}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
