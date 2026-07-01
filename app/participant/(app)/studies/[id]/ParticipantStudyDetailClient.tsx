"use client";

import { useState } from "react";
import Link from "next/link";

type Slot = { startTime: string; note?: string };
type Interview = { id: string; scheduledAt: string; durationMinutes: number; videoLink: string | null; status: string };
type Reward = { amountCents: number; type: string; status: string };

const STATUS_INFO: Record<string, { label: string; bg: string; text: string; desc: string }> = {
  SHORTLISTED: {
    label: "Vous êtes sélectionné(e)",
    bg: "var(--color-info-light)", text: "var(--color-info)",
    desc: "Votre profil a été retenu. L'équipe Qualio va vous confirmer des créneaux disponibles prochainement.",
  },
  INVITED: {
    label: "Choisissez votre créneau",
    bg: "var(--color-warning-light)", text: "var(--color-warning)",
    desc: "Des créneaux vous ont été proposés. Choisissez celui qui vous convient pour confirmer votre participation.",
  },
  CONFIRMED: {
    label: "Entretien confirmé ✓",
    bg: "var(--color-success-light)", text: "var(--color-success)",
    desc: "Votre participation est confirmée. Le lien de la visio est disponible ci-dessous.",
  },
  COMPLETED: {
    label: "Terminé — merci !",
    bg: "var(--color-surface-2)", text: "var(--color-text-tertiary)",
    desc: "Cette étude est terminée. Merci pour votre participation !",
  },
  REJECTED: {
    label: "Non retenu(e)",
    bg: "var(--color-error-light)", text: "var(--color-error)",
    desc: "Votre profil n'a pas été retenu pour cette étude. D'autres opportunités arrivent bientôt.",
  },
};

function fmt(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", opts ?? { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default function ParticipantStudyDetailClient({
  applicationId,
  status: initialStatus,
  study,
  proposedSlots,
  interview: initialInterview,
  reward,
}: {
  applicationId: string;
  status: string;
  study: {
    id: string; title: string; objective: string; studyType: string;
    interviewDuration: number; preferredLanguage: string;
    rewardAmount: number; rewardType: string; deadlineAt: string | null;
  };
  proposedSlots: Slot[];
  interview: Interview | null;
  reward: Reward | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [interview, setInterview] = useState<Interview | null>(initialInterview);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.SHORTLISTED;
  const isUpcoming = interview && new Date(interview.scheduledAt) > new Date();

  async function confirmSlot() {
    if (selectedSlot === null) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/confirm-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotIndex: selectedSlot }),
      });
      const data = await res.json() as { ok?: boolean; interview?: Interview; videoLink?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Erreur");
      setStatus("CONFIRMED");
      setInterview(data.interview ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la confirmation");
    } finally {
      setConfirming(false);
    }
  }

  function fmtReward(cents: number, type: string) {
    return type === "VOUCHER" ? `${(cents / 100).toFixed(0)}€ en bon d'achat` : `${(cents / 100).toFixed(0)}€ en virement`;
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 32px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "24px" }}>
        <Link href="/participant/studies" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Mes études</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span>{study.title}</span>
      </div>

      {/* Status banner */}
      <div style={{ padding: "16px 20px", background: statusInfo.bg, border: `1px solid ${statusInfo.text}33`, borderRadius: "12px", marginBottom: "28px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: statusInfo.text, marginBottom: "4px" }}>{statusInfo.label}</div>
        <div style={{ fontSize: "13px", color: statusInfo.text, opacity: 0.85 }}>{statusInfo.desc}</div>
      </div>

      {/* VIDEO LINK — CONFIRMED */}
      {status === "CONFIRMED" && interview?.videoLink && (
        <div style={{ padding: "22px 26px", background: "var(--color-accent)", borderRadius: "14px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isUpcoming ? `${fmt(interview.scheduledAt, { weekday: "long", day: "numeric", month: "long" })} à ${fmt(interview.scheduledAt, { hour: "2-digit", minute: "2-digit" })}` : "Entretien"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Rejoindre votre entretien vidéo</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>Durée : {interview.durationMinutes} minutes · Whereby</div>
          </div>
          <a
            href={interview.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "13px 24px", background: "#fff", color: "var(--color-accent)", borderRadius: "9px", fontSize: "15px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            🎥 Rejoindre
          </a>
        </div>
      )}

      {/* SLOT PICKER — INVITED */}
      {status === "INVITED" && proposedSlots.length > 0 && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-accent)", borderRadius: "14px", padding: "22px 24px", marginBottom: "28px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>
            Choisissez votre créneau
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {proposedSlots.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlot(idx)}
                style={{
                  padding: "14px 18px", borderRadius: "10px", border: `2px solid ${selectedSlot === idx ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: selectedSlot === idx ? "var(--color-accent-light)" : "var(--color-background)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "14px",
                }}
              >
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `2px solid ${selectedSlot === idx ? "var(--color-accent)" : "var(--color-border)"}`, background: selectedSlot === idx ? "var(--color-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selectedSlot === idx && <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: selectedSlot === idx ? 700 : 500, color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                    {fmt(slot.startTime, { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    {fmt(slot.startTime, { hour: "2-digit", minute: "2-digit" })} · {study.interviewDuration} minutes
                  </div>
                  {slot.note && <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>{slot.note}</div>}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-error-light)", borderRadius: "8px", fontSize: "13px", color: "var(--color-error)", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          <button
            onClick={confirmSlot}
            disabled={selectedSlot === null || confirming}
            style={{
              width: "100%", padding: "14px", background: selectedSlot !== null && !confirming ? "var(--color-accent)" : "var(--color-border-strong)",
              color: selectedSlot !== null && !confirming ? "#fff" : "var(--color-text-tertiary)",
              border: "none", borderRadius: "9px", fontSize: "15px", fontWeight: 700,
              cursor: selectedSlot !== null && !confirming ? "pointer" : "default",
            }}
          >
            {confirming ? "Confirmation en cours…" : selectedSlot !== null ? `Confirmer ce créneau — ${fmt(proposedSlots[selectedSlot].startTime, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Sélectionnez un créneau"}
          </button>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center", marginTop: "8px" }}>
            Vous recevrez un email de confirmation avec le lien vidéo
          </div>
        </div>
      )}

      {/* Study details */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 20px" }}>
          {study.title}
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
          {[
            { label: "Format", value: study.studyType },
            { label: "Durée", value: `${study.interviewDuration} minutes` },
            { label: "Langue", value: study.preferredLanguage === "fr" ? "Français" : study.preferredLanguage === "en" ? "Anglais" : "Fr / En" },
            { label: "Récompense", value: fmtReward(study.rewardAmount, study.rewardType) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "14px", color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Sujet</div>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{study.objective}</p>
        </div>
      </div>

      {/* Confirmed interview info */}
      {interview && status === "CONFIRMED" && (
        <div style={{ background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-success)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Créneau confirmé</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" }}>
            {fmt(interview.scheduledAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}

      {/* Reward */}
      {reward && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Votre récompense</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-accent)" }}>
              {fmtReward(reward.amountCents, reward.type)}
            </span>
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "999px", background: reward.status === "PAID" || reward.status === "REVEALED" ? "var(--color-success-light)" : "var(--color-warning-light)", color: reward.status === "PAID" || reward.status === "REVEALED" ? "var(--color-success)" : "var(--color-warning)", fontWeight: 600 }}>
              {reward.status === "PAID" ? "Disponible" : reward.status === "REVEALED" ? "Révélé" : reward.status === "PROCESSING" ? "En cours" : "En attente"}
            </span>
          </div>
          {(reward.status === "PAID" || reward.status === "REVEALED") && (
            <Link href="/participant/wallet" style={{ display: "inline-block", marginTop: "10px", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", textDecoration: "none" }}>
              Accéder à mon wallet →
            </Link>
          )}
        </div>
      )}

      <Link href="/participant/studies" style={{ fontSize: "13px", color: "var(--color-text-secondary)", textDecoration: "none" }}>
        ← Retour à mes études
      </Link>
    </div>
  );
}
