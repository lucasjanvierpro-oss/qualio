"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { verifyParticipant } from "@/app/actions/studies";

type QueueItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  idDocumentUrl: string;
  submittedAt: string;
  interests: string[];
  bio: string | null;
};

type ProcessedItem = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  idVerifiedAt: string | null;
  blacklistReason: string | null;
};

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

function DocumentViewer({ path }: { path: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setSignedUrl(null);
    fetch(`/api/admin/document-url?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((data: { url?: string; error?: string }) => {
        if (data.url) setSignedUrl(data.url);
        else setError(data.error ?? "Erreur");
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [path]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "280px", color: "#4A4845" }}>
      Chargement du document…
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", gap: "8px" }}>
      <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 600 }}>
        Impossible de charger le document
      </span>
      <span style={{ fontSize: "11px", color: "#5A5754" }}>{error}</span>
      <span style={{ fontSize: "10px", color: "#3A3835" }}>
        Chemin : {path}
      </span>
    </div>
  );

  const isPdf = path.toLowerCase().endsWith(".pdf");

  if (isPdf && signedUrl) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", gap: "14px" }}>
      <div style={{ fontSize: "42px", opacity: 0.5 }}>📄</div>
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: "13px", fontWeight: 700, color: "#8765D7", textDecoration: "none", border: "1px solid #6B4FA8", padding: "8px 16px", borderRadius: "2px" }}
      >
        Ouvrir le PDF →
      </a>
    </div>
  );

  return signedUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={signedUrl}
      alt="Document d'identité"
      style={{ maxWidth: "100%", maxHeight: "380px", objectFit: "contain", display: "block", margin: "0 auto" }}
    />
  ) : null;
}

export default function AdminVerificationsClient({
  queue: initialQueue,
  processed,
}: {
  queue: QueueItem[];
  processed: ProcessedItem[];
}) {
  const [queue, setQueue]             = useState(initialQueue);
  const [active, setActive]           = useState<QueueItem | null>(initialQueue[0] ?? null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason]       = useState("");
  const [localProcessed, setLocalProcessed]   = useState(processed);
  const [isPending, startTransition]  = useTransition();

  const card = { background: "#1A1917", border: "1px solid #252320", borderRadius: "3px" };

  function decide(decision: "VERIFIED" | "REJECTED", reason?: string) {
    if (!active) return;
    const current  = active;
    const remaining = queue.filter((q) => q.id !== current.id);
    setQueue(remaining);
    setActive(remaining[0] ?? null);
    setShowRejectInput(false);
    setRejectReason("");
    setLocalProcessed((prev) => [
      {
        id: current.id,
        firstName: current.firstName,
        lastName: current.lastName,
        status: decision,
        idVerifiedAt: new Date().toISOString(),
        blacklistReason: reason ?? null,
      },
      ...prev.slice(0, 9),
    ]);
    startTransition(async () => {
      await verifyParticipant(current.id, decision, reason);
    });
  }

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "44px 40px", color: "#F2F0EC" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#4A4845", marginBottom: "10px" }}>
          Vérifications
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px", fontWeight: 800, fontStyle: "normal",
          letterSpacing: "-0.02em", color: "#F8F7F4", margin: 0,
        }}>
          Pièces d'identité
        </h1>
        <p style={{ fontSize: "12px", color: "#4A4845", marginTop: "6px" }}>
          {queue.length > 0
            ? `${queue.length} document${queue.length > 1 ? "s" : ""} en attente de validation`
            : "File vide — aucun document à traiter"}
        </p>
      </div>

      {queue.length === 0 ? (
        <div style={{ ...card, padding: "64px", textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>✓</div>
          <div style={{ fontSize: "15px", fontWeight: 500, color: "#F0EDE8", marginBottom: "6px" }}>Tout est traité</div>
          <p style={{ fontSize: "13px", color: "#4A4845", margin: 0 }}>
            Aucun document en attente.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "16px", marginBottom: "40px" }}>

          {/* Queue list */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A4845", marginBottom: "10px" }}>
              File d'attente
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActive(item); setShowRejectInput(false); setRejectReason(""); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "10px 12px",
                    background: active?.id === item.id ? "#573E69" : "#1A1917",
                    border: `1px solid ${active?.id === item.id ? "#6B4FA8" : "#252320"}`,
                    borderRadius: "2px",
                    cursor: "pointer", textAlign: "left", width: "100%",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#F0EDE8" }}>
                    {item.firstName} {item.lastName}
                  </span>
                  <span style={{ fontSize: "10px", color: "#4A4845", marginTop: "2px" }}>
                    {fmtDate(item.submittedAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main panel */}
          {active && (
            <div style={{ ...card, overflow: "hidden" }}>
              {/* Document preview zone */}
              <div style={{
                background: "#141210",
                minHeight: "300px",
                borderBottom: "1px solid #252320",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                padding: "20px",
              }}>
                <DocumentViewer key={active.id} path={active.idDocumentUrl} />
              </div>

              {/* Participant info */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#F0EDE8", marginBottom: "4px" }}>
                      {active.firstName} {active.lastName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#5A5754", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span>{active.email}</span>
                      {active.age && <span>· {active.age} ans</span>}
                      {active.city && <span>· {active.city}</span>}
                      {active.profession && <span>· {active.profession}</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3A3835", marginTop: "4px" }}>
                      Soumis le {fmtDate(active.submittedAt)}
                    </div>
                  </div>
                  <Link
                    href={`/admin/participants/${active.id}`}
                    style={{ fontSize: "12px", fontWeight: 600, color: "#8765D7", textDecoration: "none", whiteSpace: "nowrap" }}
                  >
                    Profil complet →
                  </Link>
                </div>

                {active.bio && (
                  <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#141210", borderRadius: "2px", fontSize: "12px", color: "#5A5754", lineHeight: 1.6, border: "1px solid #252320" }}>
                    {active.bio}
                  </div>
                )}

                {active.interests.length > 0 && (
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {active.interests.map((i) => (
                      <span key={i} style={{
                        fontSize: "10px", fontWeight: 700,
                        padding: "2px 8px", borderRadius: "2px",
                        border: "1px solid #6B4FA8", color: "#8765D7",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {i}
                      </span>
                    ))}
                  </div>
                )}

                {/* Decision buttons */}
                {!showRejectInput ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => decide("VERIFIED")}
                      disabled={isPending}
                      style={{
                        flex: 1, padding: "11px",
                        background: "#573E69", color: "#fff",
                        border: "1px solid #6B4FA8", borderRadius: "2px",
                        fontSize: "13px", fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      ✓ Valider l'identité
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={isPending}
                      style={{
                        flex: 1, padding: "11px",
                        background: "transparent", color: "#D97706",
                        border: "1px solid #5E4A1A", borderRadius: "2px",
                        fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      ✗ Refuser
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Raison du refus (document illisible, mauvais document, etc.)…"
                      rows={2}
                      style={{
                        width: "100%", padding: "9px 12px",
                        border: "1px solid #5E4A1A", borderRadius: "2px",
                        fontSize: "13px", resize: "none", boxSizing: "border-box",
                        marginBottom: "8px",
                        background: "#141210", color: "#F0EDE8", outline: "none",
                        fontFamily: "var(--font-body)",
                      }}
                    />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => setShowRejectInput(false)}
                        style={{ padding: "9px 16px", background: "transparent", border: "1px solid #252320", borderRadius: "2px", fontSize: "12px", cursor: "pointer", color: "#7A7875" }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => decide("REJECTED", rejectReason)}
                        disabled={isPending || !rejectReason.trim()}
                        style={{
                          flex: 1, padding: "9px",
                          background: "#7A1A1A", color: "#fff",
                          border: "none", borderRadius: "2px",
                          fontSize: "13px", fontWeight: 700,
                          cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                          opacity: rejectReason.trim() ? 1 : 0.5,
                        }}
                      >
                        Confirmer le refus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent decisions log */}
      {localProcessed.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A4845", marginBottom: "10px" }}>
            Décisions récentes
          </p>
          <div style={{ ...card, overflow: "hidden" }}>
            {localProcessed.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "12px 18px",
                  borderTop: i > 0 ? "1px solid #252320" : "none",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#F0EDE8", flex: 1 }}>
                  {p.firstName} {p.lastName}
                </span>
                {p.idVerifiedAt && (
                  <span style={{ fontSize: "11px", color: "#3A3835", fontFamily: "var(--font-mono-base)" }}>
                    {fmtDate(p.idVerifiedAt)}
                  </span>
                )}
                <span style={{
                  fontSize: "10px", fontWeight: 700,
                  padding: "3px 8px", borderRadius: "2px",
                  border: `1px solid ${p.status === "VERIFIED" ? "#6B4FA8" : "#5E4A1A"}`,
                  color: p.status === "VERIFIED" ? "#8765D7" : "#D97706",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  {p.status === "VERIFIED" ? "Validé" : "Refusé"}
                </span>
                <Link href={`/admin/participants/${p.id}`} style={{ fontSize: "11px", color: "#4A4845", textDecoration: "none" }}>
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
