"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { verifyParticipant, blacklistParticipant, unblacklistParticipant, addAdminNote } from "@/app/actions/studies";

type Application = {
  id: string;
  status: string;
  studyId: string;
  studyTitle: string;
  studyType: string;
  studyStatus: string;
  adminScore: number | null;
  brandAccepted: boolean | null;
  appliedAt: string;
  interview: { scheduledAt: string; status: string; brandRating: number | null } | null;
  reward: { type: string; amountCents: number; status: string } | null;
};

type AdminNote = { id: string; note: string; createdAt: string };

type GhostFile = {
  expertiseScore: number | null;
  vocabularyScore: number | null;
  consistencyScore: number | null;
  earlyAdopterScore: number | null;
  influenceScore: number | null;
  authenticityScore: number | null;
  overallQualityScore: number | null;
  profileType: string | null;
  primaryExpertise: string | null;
  secondaryExpertises: string[];
  generationTag: string | null;
  influenceTier: string | null;
  redFlags: string[];
  aiProfileSummary: string;
  aiStrengths: string[];
  aiWeaknesses: string[];
  aiBestStudyTypes: string[];
  aiRecommendedBrands: string[];
  processingStatus: string;
  generatedAt: string;
};

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  dateOfBirth: string | null;
  city: string | null;
  country: string;
  profession: string | null;
  bio: string | null;
  languages: string[];
  interests: string[];
  brandAffinities: string[];
  shoppingFrequency: string | null;
  isEarlyAdopter: boolean | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  screenerAnswers: Record<string, string> | null;
  availability: Record<string, string[]> | null;
  idVerificationStatus: string;
  idVerifiedAt: string | null;
  idDocumentUrl: string | null;
  participationCount: number;
  averageRating: number | null;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  stripeConnectStatus: string | null;
  createdAt: string;
  applications: Application[];
  adminNotes: AdminNote[];
};

const VERIFICATION_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:  { label: "En attente", bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  VERIFIED: { label: "Vérifié", bg: "var(--color-success-light)", text: "var(--color-success)" },
  REJECTED: { label: "Refusé", bg: "var(--color-error-light)", text: "var(--color-error)" },
};

const APP_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente", SHORTLISTED: "Shortlisté", INVITED: "Invité",
  CONFIRMED: "Confirmé", REJECTED: "Rejeté", COMPLETED: "Terminé", NO_SHOW: "Absent",
};

// SCREENER_LABELS replaced by SCREENER_LABELS_NEW above

const SCREENER_LABELS_NEW: Record<string, string> = {
  careerPath: "Parcours professionnel",
  styleRelationship: "Rapport au style",
  shoppingChannels: "Canaux d'achat",
  expertise: "Expertise déclarée",
  marketVision: "Vision du marché",
  lastPurchase: "Dernier achat",
  socialDescription: "Description audience",
  // Legacy labels (old onboarding)
  q1: "Dernier achat",
  q2: "Style personnel",
  q3: "Découvertes récentes",
  q4: "Exemple early adopter",
  budget: "Budget moyen",
};

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score ? (score / 10) * 100 : 0;
  const color = score && score >= 7 ? "#1A7A4A" : score && score >= 5 ? "#9A6700" : "#B91C1C";
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color }}>{score ?? "—"}/10</span>
      </div>
      <div style={{ height: "6px", background: "var(--color-surface-2)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export default function AdminParticipantDetailClient({ profile, ghostFile }: { profile: Profile; ghostFile: GhostFile | null }) {
  const [tab, setTab] = useState<"profile" | "history" | "notes" | "ghost">("profile");
  const [ghostStatus, setGhostStatus] = useState(ghostFile?.processingStatus ?? null);
  const [localGhost, setLocalGhost] = useState<GhostFile | null>(ghostFile);
  const [verificationStatus, setVerificationStatus] = useState(profile.idVerificationStatus);
  const [isBlacklisted, setIsBlacklisted] = useState(profile.isBlacklisted);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [localNotes, setLocalNotes] = useState<AdminNote[]>(profile.adminNotes);
  const [isPending, startTransition] = useTransition();

  const vs = VERIFICATION_STYLE[verificationStatus] ?? VERIFICATION_STYLE.PENDING;

  function doVerify() {
    setVerificationStatus("VERIFIED");
    startTransition(async () => { await verifyParticipant(profile.id, "VERIFIED"); });
  }

  function doReject() {
    setVerificationStatus("REJECTED");
    setShowRejectModal(false);
    startTransition(async () => { await verifyParticipant(profile.id, "REJECTED", rejectReason); });
  }

  function doBlacklist() {
    setIsBlacklisted(true);
    setShowBlacklistModal(false);
    startTransition(async () => { await blacklistParticipant(profile.id, blacklistReason); });
  }

  function doUnblacklist() {
    setIsBlacklisted(false);
    startTransition(async () => { await unblacklistParticipant(profile.id); });
  }

  function doAddNote() {
    if (!noteInput.trim()) return;
    const optimistic: AdminNote = { id: Date.now().toString(), note: noteInput.trim(), createdAt: new Date().toISOString() };
    setLocalNotes((prev) => [optimistic, ...prev]);
    setNoteInput("");
    startTransition(async () => { await addAdminNote(profile.id, optimistic.note); });
  }

  const completedApps = profile.applications.filter((a) => a.status === "COMPLETED").length;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "20px" }}>
        <Link href="/admin/participants" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Participants</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span>{profile.firstName} {profile.lastName}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "28px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>
          {profile.firstName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
              {profile.firstName} {profile.lastName}
            </h1>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: vs.bg, color: vs.text }}>{vs.label}</span>
            {isBlacklisted && (
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: "var(--color-error-light)", color: "var(--color-error)" }}>Blacklisté</span>
            )}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span>{profile.email}</span>
            {profile.age && <span>· {profile.age} ans</span>}
            {profile.city && <span>· {profile.city}</span>}
            {profile.profession && <span>· {profile.profession}</span>}
            <span>· {completedApps} étude{completedApps > 1 ? "s" : ""} complétée{completedApps > 1 ? "s" : ""}</span>
          </div>
        </div>
        {/* Actions rapides */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          {verificationStatus === "PENDING" && (
            <>
              <button onClick={doVerify} disabled={isPending} style={{ padding: "8px 16px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                ✓ Vérifier
              </button>
              <button onClick={() => setShowRejectModal(true)} disabled={isPending} style={{ padding: "8px 16px", background: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Refuser
              </button>
            </>
          )}
          {!isBlacklisted ? (
            <button onClick={() => setShowBlacklistModal(true)} style={{ padding: "8px 16px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer" }}>
              Blacklister
            </button>
          ) : (
            <button onClick={doUnblacklist} disabled={isPending} style={{ padding: "8px 16px", background: "var(--color-surface-2)", color: "var(--color-success)", border: "1px solid var(--color-success)", borderRadius: "7px", fontSize: "13px", cursor: "pointer" }}>
              Retirer du blacklist
            </button>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Candidatures", value: profile.applications.length },
          { label: "Études complétées", value: completedApps },
          { label: "Note moyenne", value: profile.averageRating ? `${profile.averageRating.toFixed(1)}/5` : "—" },
          { label: "Stripe Connect", value: profile.stripeConnectStatus ?? "Non connecté" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "0" }}>
        {(["profile", "ghost", "history", "notes"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "var(--color-accent)" : "transparent"}`, fontSize: "14px", fontWeight: tab === t ? 600 : 400, color: tab === t ? "var(--color-accent)" : "var(--color-text-secondary)", cursor: "pointer", marginBottom: "-1px" }}>
            {t === "profile" ? "Profil" : t === "ghost" ? "Ghost File IA" : t === "history" ? `Historique (${profile.applications.length})` : `Notes (${localNotes.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Profil */}
      {tab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Bio */}
          {profile.bio && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Bio</div>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {/* Intérêts + marques */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Intérêts</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {profile.interests.length > 0 ? profile.interests.map((i) => (
                  <span key={i} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>{i}</span>
                )) : <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Non renseigné</span>}
              </div>
            </div>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Affinités marques</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {profile.brandAffinities.length > 0 ? profile.brandAffinities.map((b) => (
                  <span key={b} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{b}</span>
                )) : <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Non renseigné</span>}
              </div>
            </div>
          </div>

          {/* Réponses screener */}
          {profile.screenerAnswers && Object.keys(profile.screenerAnswers).length > 0 && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>Réponses screener</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(profile.screenerAnswers).map(([key, value]) => (
                  <div key={key}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      {SCREENER_LABELS_NEW[key] ?? key}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.6, padding: "10px 14px", background: "var(--color-surface-2)", borderRadius: "8px" }}>
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infos complémentaires */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Infos complémentaires</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", fontSize: "13px" }}>
              {[
                ["Fréquence d'achat", profile.shoppingFrequency ?? "—"],
                ["Early adopter", profile.isEarlyAdopter === true ? "Oui" : profile.isEarlyAdopter === false ? "Non" : "—"],
                ["Langues", profile.languages.join(", ") || "—"],
                ["Pays", profile.country],
                ["LinkedIn", profile.linkedinUrl ?? "—"],
                ["Instagram", profile.instagramUrl ?? "—"],
                ["TikTok", profile.tiktokUrl ?? "—"],
                ["Inscrit le", new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.createdAt))],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>{label} : </span>
                  <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document ID */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "18px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Vérification d'identité</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: vs.bg, color: vs.text }}>{vs.label}</span>
              {profile.idVerifiedAt && (
                <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  le {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.idVerifiedAt))}
                </span>
              )}
              {profile.idDocumentUrl && (
                <a href={profile.idDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
                  Voir le document →
                </a>
              )}
              {!profile.idDocumentUrl && <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Aucun document fourni</span>}
            </div>
            {verificationStatus === "PENDING" && profile.idDocumentUrl && (
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={doVerify} disabled={isPending} style={{ padding: "8px 16px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  ✓ Valider l'identité
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={isPending} style={{ padding: "8px 16px", background: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Refuser le document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Ghost File IA */}
      {tab === "ghost" && (
        <div>
          {/* Generate / Regenerate button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
            <button
              onClick={async () => {
                setGhostStatus("processing");
                const res = await fetch(`/api/participants/${profile.id}/generate-ghost-file`, { method: "POST" });
                if (res.ok) {
                  setGhostStatus("done");
                  window.location.reload();
                } else {
                  setGhostStatus("error");
                }
              }}
              disabled={ghostStatus === "processing"}
              style={{ padding: "9px 18px", background: ghostStatus === "processing" ? "var(--color-surface-2)" : "var(--color-accent)", color: ghostStatus === "processing" ? "var(--color-text-secondary)" : "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: ghostStatus === "processing" ? "default" : "pointer" }}
            >
              {ghostStatus === "processing" ? "⏳ Analyse en cours…" : localGhost ? "↻ Régénérer l'analyse" : "✨ Générer le Ghost File"}
            </button>
          </div>

          {ghostStatus === "processing" && !localGhost && (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
              Analyse en cours… cela prend 10–20 secondes.
            </div>
          )}

          {ghostStatus === "error" && (
            <div style={{ padding: "16px 20px", background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "10px", fontSize: "14px", color: "var(--color-error)", marginBottom: "16px" }}>
              Erreur lors de la génération. Vérifiez que le profil est complet.
            </div>
          )}

          {localGhost && localGhost.processingStatus === "done" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Score global + classification */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ textAlign: "center", paddingRight: "20px", borderRight: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Score global</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "52px", fontWeight: 700, lineHeight: 1, color: (localGhost.overallQualityScore ?? 0) >= 7 ? "#1A7A4A" : (localGhost.overallQualityScore ?? 0) >= 5 ? "#9A6700" : "#B91C1C" }}>
                    {localGhost.overallQualityScore ?? "—"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>/10</div>
                </div>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    {localGhost.profileType && (
                      <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "#fff" }}>{localGhost.profileType}</span>
                    )}
                    {localGhost.primaryExpertise && (
                      <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>{localGhost.primaryExpertise}</span>
                    )}
                    {localGhost.generationTag && (
                      <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>{localGhost.generationTag}</span>
                    )}
                    {localGhost.influenceTier && localGhost.influenceTier !== "none" && (
                      <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #1D4ED8" }}>{localGhost.influenceTier}</span>
                    )}
                  </div>
                  {localGhost.secondaryExpertises.length > 0 && (
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      Expertises secondaires : {localGhost.secondaryExpertises.join(", ")}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "8px" }}>
                    Généré le {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(localGhost.generatedAt))}
                  </div>
                </div>
              </div>

              {/* Scores détaillés */}
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Scores détaillés</div>
                <ScoreBar label="Expertise métier" score={localGhost.expertiseScore} />
                <ScoreBar label="Qualité du vocabulaire" score={localGhost.vocabularyScore} />
                <ScoreBar label="Cohérence du profil" score={localGhost.consistencyScore} />
                <ScoreBar label="Profil early adopter" score={localGhost.earlyAdopterScore} />
                <ScoreBar label="Influence" score={localGhost.influenceScore} />
                <ScoreBar label="Authenticité" score={localGhost.authenticityScore} />
              </div>

              {/* Note de l'équipe (AI summary) */}
              {localGhost.aiProfileSummary && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px 24px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Note de l'équipe Qualio</div>
                  <p style={{ fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.7, margin: 0 }}>{localGhost.aiProfileSummary}</p>
                </div>
              )}

              {/* Forces & faiblesses */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {localGhost.aiStrengths.length > 0 && (
                  <div style={{ background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "12px", padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Forces</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {localGhost.aiStrengths.map((s, i) => <li key={i} style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {localGhost.aiWeaknesses.length > 0 && (
                  <div style={{ background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "12px", padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Points de vigilance</div>
                    <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {localGhost.aiWeaknesses.map((w, i) => <li key={i} style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Red flags */}
              {localGhost.redFlags.length > 0 && (
                <div style={{ background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "12px", padding: "18px 20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-error)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Red Flags</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {localGhost.redFlags.map((f, i) => <li key={i} style={{ fontSize: "13px", color: "var(--color-error)", lineHeight: 1.5 }}>{f}</li>)}
                  </ul>
                </div>
              )}

              {/* Meilleures études + marques recommandées */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {localGhost.aiBestStudyTypes.length > 0 && (
                  <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Types d'études idéaux</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {localGhost.aiBestStudyTypes.map((s, i) => (
                        <div key={i} style={{ fontSize: "13px", color: "var(--color-text-primary)", padding: "6px 10px", background: "var(--color-surface-2)", borderRadius: "6px" }}>{s}</div>
                      ))}
                    </div>
                  </div>
                )}
                {localGhost.aiRecommendedBrands.length > 0 && (
                  <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "18px 20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Marques recommandées</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {localGhost.aiRecommendedBrands.map((b, i) => (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!localGhost && ghostStatus !== "processing" && ghostStatus !== "error" && (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>👻</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>Aucun Ghost File généré</div>
              <div style={{ fontSize: "13px" }}>Cliquez sur "Générer" pour analyser le profil avec Claude.</div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Historique */}
      {tab === "history" && (
        <div>
          {profile.applications.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
              Aucune candidature pour l'instant.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.applications.map((app) => (
                <div key={app.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <Link href={`/admin/studies/${app.studyId}`} style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none" }}>
                      {app.studyTitle}
                    </Link>
                    {app.interview && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                        {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(app.interview.scheduledAt))}
                        {app.interview.brandRating && ` · Note marque : ${app.interview.brandRating}/5`}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "999px", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                    {APP_STATUS_LABEL[app.status] ?? app.status}
                  </span>
                  {app.reward && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: app.reward.status === "PAID" ? "var(--color-success)" : "var(--color-text-tertiary)" }}>
                      {(app.reward.amountCents / 100).toFixed(0)}€
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Notes admin */}
      {tab === "notes" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doAddNote(); } }}
              placeholder="Ajouter une note interne…"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none" }}
            />
            <button onClick={doAddNote} disabled={isPending || !noteInput.trim()} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: !noteInput.trim() ? 0.5 : 1 }}>
              Ajouter
            </button>
          </div>
          {localNotes.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
              Aucune note pour ce participant.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {localNotes.map((note) => (
                <div key={note.id} style={{ padding: "14px 18px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
                  <p style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: "0 0 6px", lineHeight: 1.6 }}>{note.note}</p>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                    {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(note.createdAt))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Refus document */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "12px", padding: "28px", width: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px" }}>Refuser le document</h3>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 16px" }}>Indiquez la raison (optionnel — sera visible par le participant).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ex : Document illisible, pièce expirée…"
              rows={3}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", marginBottom: "16px", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowRejectModal(false)} style={{ padding: "9px 18px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "14px", cursor: "pointer" }}>Annuler</button>
              <button onClick={doReject} style={{ padding: "9px 18px", background: "var(--color-error)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Confirmer le refus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Blacklist */}
      {showBlacklistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "12px", padding: "28px", width: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px" }}>Blacklister ce participant</h3>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 16px" }}>Cette action est réversible. Indiquez la raison.</p>
            <textarea
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              placeholder="ex : Profil fake, no-show répété, comportement problématique…"
              rows={3}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", marginBottom: "16px", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowBlacklistModal(false)} style={{ padding: "9px 18px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "14px", cursor: "pointer" }}>Annuler</button>
              <button onClick={doBlacklist} disabled={!blacklistReason.trim()} style={{ padding: "9px 18px", background: "var(--color-error)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: !blacklistReason.trim() ? 0.5 : 1 }}>Blacklister</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
