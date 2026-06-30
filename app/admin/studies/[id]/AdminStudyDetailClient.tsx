"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { shortlistParticipant, updateStudyStatus } from "@/app/actions/studies";
import { useMessages } from "@/hooks/useMessages";

type Criteria = {
  ageMin?: number;
  ageMax?: number;
  cities?: string[];
  interests?: string[];
  brandAffinities?: string[];
  profession?: string;
  custom?: string;
};

type ParticipantProfile = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  interests: string[];
  brandAffinities: string[];
  bio: string | null;
  screenerAnswers: Record<string, string> | null;
  idVerificationStatus: string;
};

type Interview = {
  id: string;
  scheduledAt: string;
  status: string;
  videoLink: string | null;
};

type Application = {
  id: string;
  status: string;
  adminScore: number | null;
  adminMatchNote: string | null;
  brandAccepted: boolean | null;
  interview: Interview | null;
  participantProfile: ParticipantProfile;
};

type Study = {
  id: string;
  title: string;
  brand: string;
  contactEmail: string;
  studyType: string;
  status: string;
  target: number;
  objective: string;
  deadline: string | null;
  duration: number;
  rewardAmount: number;
  rewardType: string;
  criteria: Criteria;
  exclusionCriteria: string | null;
  adminNotes: string | null;
  applications: Application[];
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  interests: string[];
  brandAffinities: string[];
  bio: string | null;
  screenerAnswers: Record<string, string> | null;
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:      { label: "Brouillon", bg: "var(--color-surface-2)", text: "var(--color-text-secondary)" },
  ACTIVE:     { label: "Actif", bg: "var(--color-success-light)", text: "var(--color-success)" },
  MATCHING:   { label: "Matching", bg: "var(--color-warning-light)", text: "var(--color-warning)" },
  IN_PROGRESS: { label: "En cours", bg: "var(--color-info-light)", text: "var(--color-info)" },
  COMPLETED:  { label: "Terminé", bg: "var(--color-surface-2)", text: "var(--color-text-secondary)" },
  CANCELLED:  { label: "Annulé", bg: "var(--color-error-light)", text: "var(--color-error)" },
};

function matchScore(p: Participant, criteria: Criteria): number {
  let score = 0;
  if (criteria.ageMin && p.age && p.age >= criteria.ageMin) score++;
  if (criteria.ageMax && p.age && p.age <= criteria.ageMax) score++;
  if (criteria.cities?.length && p.city && criteria.cities.some((c) => p.city!.toLowerCase().includes(c.toLowerCase()))) score++;
  const interestMatch = criteria.interests?.filter((i) => p.interests.some((pi) => pi.toLowerCase().includes(i.toLowerCase()))) ?? [];
  score += Math.min(2, interestMatch.length);
  const brandMatch = criteria.brandAffinities?.filter((b) => p.brandAffinities.some((pb) => pb.toLowerCase().includes(b.toLowerCase()))) ?? [];
  score += Math.min(2, brandMatch.length);
  return Math.min(5, score);
}

function AdminChatPanel({ studyId, brandName, contactEmail }: { studyId: string; brandName: string; contactEmail: string }) {
  const { messages, sendMessage } = useMessages(studyId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text, "ADMIN");
  }

  return (
    <div style={{ maxWidth: "660px", display: "flex", flexDirection: "column", height: "calc(100vh - 260px)", minHeight: "400px" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", background: "var(--color-surface-2)", borderRadius: "10px 10px 0 0", border: "1px solid var(--color-border)", borderBottom: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)" }}>
          {brandName[0]}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{brandName}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{contactEmail}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderTop: "none", borderBottom: "none" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-tertiary)", fontSize: "14px" }}>
            Aucun message. Démarrez la conversation avec la marque.
          </div>
        )}
        {messages.map((m) => {
          const isAdmin = m.sender_type === "ADMIN";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
              {!isAdmin && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>
                  {brandName[0]}
                </div>
              )}
              <div style={{
                maxWidth: "65%", padding: "9px 13px",
                borderRadius: isAdmin ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: isAdmin ? "var(--color-accent)" : "var(--color-surface-2)",
                border: isAdmin ? "none" : "1px solid var(--color-border)",
                color: isAdmin ? "#fff" : "var(--color-text-primary)",
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "14px", lineHeight: 1.5 }}>{m.content}</p>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.65, textAlign: "right" }}>
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {isAdmin && " · Admin"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "14px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "0 0 10px 10px", display: "flex", gap: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder={`Écrire à ${brandName}…`}
          style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", background: "var(--color-background)", color: "var(--color-text-primary)", outline: "none" }}
        />
        <button onClick={handleSend} disabled={!input.trim()} style={{ padding: "9px 18px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: !input.trim() ? 0.5 : 1 }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

function ShortlistedSection({
  apps,
  studyDuration,
}: {
  apps: Application[];
  studyDuration: number;
}) {
  const [proposingFor, setProposingFor] = useState<string | null>(null);
  // Per-app: array of datetimes (up to 3)
  const [proposedSlots, setProposedSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [localApps, setLocalApps] = useState(apps);
  const [completingId, setCompletingId] = useState<string | null>(null);

  function addSlot(appId: string) {
    setProposedSlots((prev) => ({ ...prev, [appId]: [...(prev[appId] ?? []), ""] }));
  }

  function updateSlot(appId: string, idx: number, value: string) {
    setProposedSlots((prev) => {
      const slots = [...(prev[appId] ?? [])];
      slots[idx] = value;
      return { ...prev, [appId]: slots };
    });
  }

  function removeSlot(appId: string, idx: number) {
    setProposedSlots((prev) => {
      const slots = [...(prev[appId] ?? [])];
      slots.splice(idx, 1);
      return { ...prev, [appId]: slots };
    });
  }

  async function proposeSlots(app: Application) {
    const slots = (proposedSlots[app.id] ?? []).filter(Boolean);
    if (!slots.length) return;
    setLoading(app.id);
    try {
      const res = await fetch(`/api/applications/${app.id}/propose-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slots.map((s) => ({ startTime: new Date(s).toISOString() })) }),
      });
      if (!res.ok) throw new Error("Erreur");
      setLocalApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "INVITED" } : a));
      setProposingFor(null);
    } catch {
      alert("Erreur lors de l'envoi des créneaux");
    } finally {
      setLoading(null);
    }
  }

  async function markCompleted(app: Application) {
    if (!app.interview) return;
    setCompletingId(app.id);
    try {
      await fetch(`/api/interviews/${app.interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      setLocalApps((prev) => prev.map((a) => a.id === app.id ? {
        ...a,
        status: "COMPLETED",
        interview: a.interview ? { ...a.interview, status: "completed" } : null,
      } : a));
    } catch {
      alert("Erreur");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
        Shortlistés — {localApps.length} profil{localApps.length > 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {localApps.map((app) => {
          const p = app.participantProfile;
          const isShortlisted = app.status === "SHORTLISTED";
          const isInvited = app.status === "INVITED";
          const isConfirmed = app.status === "CONFIRMED";
          const isCompleted = app.status === "COMPLETED";
          const isProposingThis = proposingFor === app.id;
          const slots = proposedSlots[app.id] ?? [];
          const filledSlots = slots.filter(Boolean);

          const borderColor = isCompleted ? "var(--color-border)" : isConfirmed ? "var(--color-success)" : isInvited ? "var(--color-accent)" : "var(--color-border)";
          const bgColor = isCompleted ? "var(--color-surface-2)" : isConfirmed ? "var(--color-success-light)" : "var(--color-surface)";

          return (
            <div key={app.id} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "10px", overflow: "hidden" }}>
              {/* Main row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>
                  {p.firstName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {p.firstName} {p.lastName}
                    {p.age ? <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: "6px" }}>{p.age} ans</span> : null}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{p.city} · {p.profession}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {app.brandAccepted === true && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)", fontWeight: 600 }}>Marque ✓</span>}
                  {app.brandAccepted === false && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "var(--color-error-light)", color: "var(--color-error)", fontWeight: 600 }}>Refusé</span>}
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, background: isCompleted ? "var(--color-surface-2)" : isConfirmed ? "var(--color-success-light)" : isInvited ? "var(--color-accent-light)" : "var(--color-surface-2)", color: isCompleted ? "var(--color-text-secondary)" : isConfirmed ? "var(--color-success)" : isInvited ? "var(--color-accent)" : "var(--color-text-tertiary)", border: `1px solid ${borderColor}` }}>
                    {isCompleted ? "Terminé" : isConfirmed ? "Confirmé ✓" : isInvited ? "Créneaux envoyés — en attente" : "Shortlisté"}
                  </span>
                  <Link href={`/admin/participants/${p.id}`} style={{ fontSize: "12px", color: "var(--color-accent)", textDecoration: "none" }}>Profil →</Link>
                </div>
              </div>

              {/* CONFIRMED: show interview info */}
              {isConfirmed && app.interview && (
                <div style={{ padding: "10px 16px 12px", borderTop: "1px solid var(--color-success)", background: "rgba(26,122,74,0.04)", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    📅 {new Date(app.interview.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {new Date(app.interview.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {app.interview.videoLink && (
                    <a href={app.interview.videoLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", padding: "5px 12px", background: "var(--color-accent)", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: 600 }}>
                      🎥 Rejoindre la visio
                    </a>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => markCompleted(app)}
                      disabled={completingId === app.id}
                      style={{ fontSize: "12px", padding: "5px 12px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                    >
                      {completingId === app.id ? "…" : "✓ Marquer terminé"}
                    </button>
                  </div>
                </div>
              )}

              {/* SHORTLISTED or INVITED (already proposed): show "Proposer créneaux" button */}
              {(isShortlisted || isInvited) && !isProposingThis && (
                <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: "10px" }}>
                  {isInvited && (
                    <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                      Créneaux envoyés — en attente de confirmation du participant
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setProposingFor(app.id);
                      if (!slots.length) addSlot(app.id);
                    }}
                    style={{ fontSize: "13px", padding: "7px 14px", background: isInvited ? "none" : "var(--color-accent)", color: isInvited ? "var(--color-accent)" : "#fff", border: `1px solid var(--color-accent)`, borderRadius: "7px", cursor: "pointer", fontWeight: 600, marginLeft: "auto" }}
                  >
                    {isInvited ? "Modifier les créneaux" : "Proposer des créneaux"}
                  </button>
                </div>
              )}

              {/* Slot proposal panel */}
              {isProposingThis && (
                <div style={{ padding: "14px 16px 16px", borderTop: `1px solid var(--color-accent)`, background: "var(--color-accent-light)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>
                    Proposer jusqu'à 3 créneaux — le participant choisira
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    {slots.map((slot, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", minWidth: "20px" }}>#{idx + 1}</span>
                        <input
                          type="datetime-local"
                          value={slot}
                          onChange={(e) => updateSlot(app.id, idx, e.target.value)}
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--color-accent)", borderRadius: "7px", fontSize: "14px", background: "#fff", color: "var(--color-text-primary)" }}
                        />
                        <button
                          onClick={() => removeSlot(app.id, idx)}
                          style={{ padding: "8px", background: "none", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-tertiary)" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {slots.length < 3 && (
                      <button
                        onClick={() => addSlot(app.id)}
                        style={{ padding: "7px 14px", background: "none", border: "1px dashed var(--color-accent)", borderRadius: "7px", cursor: "pointer", fontSize: "13px", color: "var(--color-accent)", fontWeight: 600, textAlign: "left" }}
                      >
                        + Ajouter un créneau
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-accent)", marginBottom: "12px" }}>
                    Le participant reçoit un email et choisit son créneau → la room Whereby est créée automatiquement
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setProposingFor(null)}
                      style={{ padding: "8px 16px", background: "none", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "13px", cursor: "pointer", color: "var(--color-text-secondary)" }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => proposeSlots(app)}
                      disabled={!filledSlots.length || loading === app.id}
                      style={{ padding: "8px 18px", background: filledSlots.length && loading !== app.id ? "var(--color-accent)" : "var(--color-border-strong)", color: filledSlots.length && loading !== app.id ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: !filledSlots.length || loading === app.id ? "default" : "pointer" }}
                    >
                      {loading === app.id ? "Envoi…" : `Envoyer ${filledSlots.length} créneau${filledSlots.length > 1 ? "x" : ""} au participant`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminStudyDetailClient({
  study,
  availableParticipants,
}: {
  study: Study;
  availableParticipants: Participant[];
}) {
  type AiResult = { id: string; score: number; reason: string };
  const SCORE_COLOR: Record<number, { text: string; bg: string }> = {
    5: { text: "var(--color-success)", bg: "var(--color-success-light)" },
    4: { text: "var(--color-success)", bg: "var(--color-success-light)" },
    3: { text: "var(--color-warning)", bg: "var(--color-warning-light)" },
    2: { text: "var(--color-error)", bg: "var(--color-error-light)" },
    1: { text: "var(--color-text-tertiary)", bg: "var(--color-surface-2)" },
  };

  const [status, setStatus] = useState(study.status);
  const [tab, setTab] = useState<"brief" | "matching" | "messages">("brief");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [localShortlisted, setLocalShortlisted] = useState<string[]>(
    study.applications.filter((a) => ["SHORTLISTED", "INVITED", "CONFIRMED"].includes(a.status)).map((a) => a.participantProfile.id)
  );
  const [isPending, startTransition] = useTransition();
  const [aiScores, setAiScores] = useState<Record<string, AiResult>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRanked, setAiRanked] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const s = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;
  const confirmed = study.applications.filter((a) => a.status === "CONFIRMED").length;

  function doShortlist(participantId: string) {
    setLocalShortlisted((prev) => [...prev, participantId]);
    setSelectedParticipant(null);
    startTransition(async () => {
      await shortlistParticipant(study.id, participantId);
    });
  }

  async function runBatchMatch() {
    setAiLoading(true);
    setAiError(null);
    try {
      const available = availableParticipants.filter((p) => !localShortlisted.includes(p.id));
      const res = await fetch("/api/admin/ai-batch-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study: { title: study.title, objective: study.objective, criteria: study.criteria }, participants: available }),
      });
      const data = await res.json();
      const map: Record<string, AiResult> = {};
      for (const r of (data.results ?? [])) map[r.id] = r;
      setAiScores(map);
      setAiRanked(true);
    } catch {
      setAiError("Erreur lors de l'analyse — vérifiez votre clé API Anthropic.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateStudyStatus(study.id, newStatus);
    });
  }

  const shortlistedApps = study.applications.filter((a) => ["SHORTLISTED", "INVITED", "CONFIRMED"].includes(a.status));
  const available = availableParticipants.filter((p) => !localShortlisted.includes(p.id));
  const scoredAvailable = [...available]
    .map((p) => ({ ...p, score: aiRanked ? (aiScores[p.id]?.score ?? 0) : matchScore(p, study.criteria) }))
    .sort((a, b) => b.score - a.score);
  const matched = aiRanked ? scoredAvailable.filter((p) => p.score >= 3) : scoredAvailable;
  const weak = aiRanked ? scoredAvailable.filter((p) => p.score < 3) : [];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "20px" }}>
        <Link href="/admin/studies" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Études</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span>{study.title}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, color: "var(--color-text-primary)", margin: 0 }}>
              {study.title}
            </h1>
            <span style={{ padding: "3px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: s.bg, color: s.text }}>
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {study.brand} · {study.contactEmail}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href={`/admin/studies/${study.id}/report`}
            style={{ padding: "8px 16px", background: "var(--color-accent-light)", border: "1px solid var(--color-accent)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}
          >
            Rapport de synthèse ✨
          </Link>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            style={{ padding: "8px 12px", border: "1px solid var(--color-border-base)", borderRadius: "8px", fontSize: "13px", background: "var(--color-surface)", color: "var(--color-text-primary)", cursor: "pointer" }}
          >
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {[
          { label: "Participants cible", value: `${confirmed}/${study.target}` },
          { label: "Date limite", value: study.deadline ? new Date(study.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—" },
          { label: "Durée entretien", value: `${study.duration} min` },
          { label: "Récompense", value: `${(study.rewardAmount / 100).toFixed(0)}€ ${study.rewardType === "CASH" ? "cash" : "voucher"}` },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "8px", padding: "14px 18px" }}>
            <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
          <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{confirmed} confirmés</span>
          <span style={{ color: "var(--color-text-secondary)" }}>Objectif : {study.target}</span>
        </div>
        <div style={{ height: "8px", background: "var(--color-surface-2)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (confirmed / study.target) * 100)}%`, height: "100%", background: "var(--color-accent)", borderRadius: "999px" }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border-base)", marginBottom: "24px" }}>
        {(["brief", "matching", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: "14px", fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "brief" ? "Brief complet" : t === "matching" ? `Matching (${localShortlisted.length} shortlistés)` : "Messages"}
          </button>
        ))}
      </div>

      {/* Brief tab */}
      {tab === "brief" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Objectif</h3>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "8px", padding: "16px", fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.6 }}>
              {study.objective}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Critères cible</h3>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "8px", padding: "16px", fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.8 }}>
              {study.criteria.ageMin && <div><strong>Âge :</strong> {study.criteria.ageMin}–{study.criteria.ageMax} ans</div>}
              {study.criteria.cities?.length ? <div><strong>Villes :</strong> {study.criteria.cities.join(", ")}</div> : null}
              {study.criteria.interests?.length ? <div><strong>Intérêts :</strong> {study.criteria.interests.join(", ")}</div> : null}
              {study.criteria.brandAffinities?.length ? <div><strong>Affinités :</strong> {study.criteria.brandAffinities.join(", ")}</div> : null}
              {study.criteria.profession && <div><strong>Profil :</strong> {study.criteria.profession}</div>}
              {study.criteria.custom && (
                <div style={{ marginTop: "8px", padding: "10px", background: "var(--color-accent-light)", borderRadius: "6px", fontSize: "13px" }}>
                  {study.criteria.custom}
                </div>
              )}
            </div>
          </div>
          {study.exclusionCriteria && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Critères d'exclusion</h3>
              <div style={{ background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "8px", padding: "14px", fontSize: "14px", color: "var(--color-text-primary)" }}>
                {study.exclusionCriteria}
              </div>
            </div>
          )}
          {study.adminNotes && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Note interne</h3>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "8px", padding: "14px", fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                {study.adminNotes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matching tab */}
      {tab === "matching" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedParticipant ? "1fr 380px" : "1fr", gap: "20px" }}>
          <div>
            {/* Already shortlisted */}
            {shortlistedApps.length > 0 && (
              <ShortlistedSection apps={shortlistedApps} studyDuration={study.duration} />
            )}

            {/* AI button + status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {aiRanked ? `${matched.length} correspondances IA` : `${available.length} profils disponibles`}
              </span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {aiError && <span style={{ fontSize: "12px", color: "var(--color-error)" }}>Erreur API</span>}
                {aiRanked && (
                  <button onClick={() => { setAiRanked(false); setAiScores({}); }} style={{ background: "none", border: "none", fontSize: "12px", color: "var(--color-text-tertiary)", cursor: "pointer" }}>
                    ✕ Effacer
                  </button>
                )}
                <button
                  onClick={runBatchMatch}
                  disabled={aiLoading}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 16px", background: aiRanked ? "var(--color-accent)" : "var(--color-accent-light)", color: aiRanked ? "#fff" : "var(--color-accent)", border: `1px solid var(--color-accent)`, borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.7 : 1 }}
                >
                  {aiLoading ? "⟳ Analyse…" : aiRanked ? "✨ Re-analyser" : "✨ Top matching IA"}
                </button>
              </div>
            </div>

            {/* AI notice */}
            {aiRanked && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", color: "var(--color-success)" }}>
                ✨ <strong>{matched.length} profil{matched.length > 1 ? "s" : ""}</strong> correspondants trouvés par Claude
                {weak.length > 0 && <span style={{ color: "var(--color-text-tertiary)" }}> · {weak.length} faibles</span>}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {matched.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)", background: "var(--color-surface)", borderRadius: "8px", border: "1px solid var(--color-border-base)" }}>
                  {aiRanked ? "Aucun profil ne correspond suffisamment aux critères." : "Tous les participants ont été shortlistés pour cette étude."}
                </div>
              ) : (
                matched.map((p) => {
                  const ai = aiScores[p.id];
                  const sc = p.score;
                  const colors = SCORE_COLOR[sc] ?? SCORE_COLOR[1];
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedParticipant(selectedParticipant?.id === p.id ? null : p)}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px",
                        background: selectedParticipant?.id === p.id ? "var(--color-accent-light)" : "var(--color-surface)",
                        border: `1px solid ${selectedParticipant?.id === p.id ? "var(--color-accent)" : "var(--color-border-base)"}`,
                        borderRadius: "10px", cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0 }}>
                        {p.firstName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          {p.age ? `${p.age} ans` : ""}{p.city ? ` · ${p.city}` : ""}{p.profession ? ` · ${p.profession}` : ""}
                        </div>
                        {ai?.reason ? (
                          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "3px", fontStyle: "italic" }}>"{ai.reason}"</div>
                        ) : (
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                            {p.interests.slice(0, 4).map((interest) => (
                              <span key={interest} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "999px", background: study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent-light)" : "var(--color-surface-2)", border: `1px solid ${study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent)" : "var(--color-border-base)"}`, color: study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent)" : "var(--color-text-secondary)" }}>{interest}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Score badge */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: colors.text, background: colors.bg, padding: "3px 8px", borderRadius: "6px", minWidth: "32px", textAlign: "center" }}>
                          {sc}/5
                        </span>
                        {ai && <span style={{ fontSize: "9px", color: "var(--color-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>IA</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); doShortlist(p.id); }}
                        disabled={isPending}
                        style={{ padding: "6px 14px", border: "1px solid var(--color-border-base)", background: "var(--color-surface-2)", color: "var(--color-text-secondary)", borderRadius: "7px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: isPending ? 0.7 : 1 }}
                      >
                        Shortlister
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Weak matches */}
            {aiRanked && weak.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingTop: "12px", borderTop: "1px solid var(--color-border-base)" }}>
                  Faibles correspondances ({weak.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", opacity: 0.6 }}>
                  {weak.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", flexShrink: 0 }}>{p.firstName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{p.firstName} {p.lastName}</span>
                        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginLeft: "8px" }}>{p.city}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--color-text-tertiary)" }}>{p.score}/5</span>
                      <button onClick={(e) => { e.stopPropagation(); doShortlist(p.id); }} disabled={isPending} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--color-border-base)", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", cursor: "pointer" }}>
                        Shortlister quand même
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          {selectedParticipant && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "12px", padding: "24px", position: "sticky", top: "20px", alignSelf: "start", maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{selectedParticipant.firstName} {selectedParticipant.lastName}</h3>
                  {aiScores[selectedParticipant.id] && (() => {
                    const sc = aiScores[selectedParticipant.id].score;
                    const colors = SCORE_COLOR[sc] ?? SCORE_COLOR[1];
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: colors.text, background: colors.bg, padding: "3px 10px", borderRadius: "6px" }}>
                          {sc}/5 IA
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>"{aiScores[selectedParticipant.id].reason}"</span>
                      </div>
                    );
                  })()}
                </div>
                <button onClick={() => setSelectedParticipant(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--color-text-tertiary)" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                  {selectedParticipant.age && <div><strong>Âge :</strong> {selectedParticipant.age} ans</div>}
                  {selectedParticipant.city && <div><strong>Ville :</strong> {selectedParticipant.city}</div>}
                  {selectedParticipant.profession && <div><strong>Profession :</strong> {selectedParticipant.profession}</div>}
                </div>
                {selectedParticipant.bio && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Bio</div>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{selectedParticipant.bio}</p>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Intérêts</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedParticipant.interests.map((interest) => (
                      <span key={interest} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", background: study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent-light)" : "var(--color-surface-2)", border: `1px solid ${study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent)" : "var(--color-border-base)"}`, color: study.criteria.interests?.some((i) => interest.toLowerCase().includes(i.toLowerCase())) ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedParticipant.brandAffinities.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Affinités marques</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selectedParticipant.brandAffinities.map((b) => (
                        <span key={b} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", background: study.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? "var(--color-accent)" : "var(--color-surface-2)", color: study.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? "#fff" : "var(--color-text-secondary)", fontWeight: study.criteria.brandAffinities?.some((cb) => b.toLowerCase().includes(cb.toLowerCase())) ? 600 : 400 }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedParticipant.screenerAnswers && Object.keys(selectedParticipant.screenerAnswers).length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Réponses screener</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {Object.values(selectedParticipant.screenerAnswers).map((answer, idx) => (
                        <div key={idx} style={{ padding: "10px 12px", background: "var(--color-surface-2)", borderRadius: "8px", fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                          {String(answer)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => doShortlist(selectedParticipant.id)}
                    disabled={isPending}
                    style={{ flex: 1, padding: "10px", border: "none", background: "var(--color-accent)", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: isPending ? 0.7 : 1 }}
                  >
                    Shortlister →
                  </button>
                  <Link
                    href={`/admin/participants/${selectedParticipant.id}`}
                    style={{ padding: "10px 16px", border: "1px solid var(--color-border-base)", background: "var(--color-surface)", color: "var(--color-text-primary)", borderRadius: "8px", fontSize: "14px", textDecoration: "none", textAlign: "center" }}
                  >
                    Profil complet
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages tab */}
      {tab === "messages" && (
        <AdminChatPanel studyId={study.id} brandName={study.brand} contactEmail={study.contactEmail} />
      )}
    </div>
  );
}
