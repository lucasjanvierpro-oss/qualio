"use client";

import { useState, useRef } from "react";

const STATUS_CONFIG = {
  PENDING: {
    bg: "var(--color-warning-light)",
    border: "var(--color-warning)",
    color: "var(--color-warning)",
    icon: "⏳",
    title: "Vérification en cours",
    body: "Votre document a bien été reçu. Notre équipe le vérifie généralement sous 24–48h. Vous serez notifié(e) par email.",
  },
  VERIFIED: {
    bg: "var(--color-success-light)",
    border: "var(--color-success)",
    color: "var(--color-success)",
    icon: "✓",
    title: "Identité vérifiée",
    body: "Votre identité a été confirmée. Vous pouvez maintenant participer à toutes les études Qualio.",
  },
  REJECTED: {
    bg: "var(--color-error-light)",
    border: "var(--color-error)",
    color: "var(--color-error)",
    icon: "✗",
    title: "Document refusé",
    body: "Votre document n'a pas pu être validé (document illisible, expiré, ou mauvais format). Veuillez renvoyer une pièce d'identité valide.",
  },
} as const;

export default function VerificationClient({
  profileId,
  status,
  hasDocument,
  verifiedAt,
  firstName,
}: {
  profileId: string;
  status: string;
  hasDocument: boolean;
  verifiedAt: string | null;
  firstName: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfg = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/participant/upload-id", { method: "POST", body: fd });
      if (res.ok) {
        setCurrentStatus("PENDING");
        setUploadSuccess(true);
      } else {
        const data = await res.json() as { error: string };
        if (data.error === "too_large") setUploadError("Fichier trop volumineux (max 10 Mo)");
        else if (data.error === "invalid_type") setUploadError("Format non supporté — utilisez JPG, PNG ou PDF");
        else setUploadError("Erreur lors de l'envoi. Réessayez.");
      }
    } catch {
      setUploadError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div style={{ maxWidth: "580px", margin: "0 auto", padding: "48px 32px" }}>

      {/* Header */}
      <p className="q-label" style={{ marginBottom: "10px" }}>Vérification</p>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "28px", fontWeight: 400, fontStyle: "italic",
        letterSpacing: "-0.02em",
        color: "var(--color-text-primary)",
        margin: "0 0 6px",
      }}>
        Votre pièce d'identité
      </h1>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "32px" }}>
        La vérification est requise pour participer aux études et recevoir vos récompenses.
      </p>

      {/* Status card */}
      <div style={{
        padding: "20px 22px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "4px",
        marginBottom: "28px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.2 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: cfg.color, marginBottom: "5px" }}>
            {cfg.title}
          </div>
          <div style={{ fontSize: "13px", color: cfg.color, opacity: 0.85, lineHeight: 1.6 }}>
            {cfg.body}
          </div>
          {verifiedAt && currentStatus === "VERIFIED" && (
            <div style={{ fontSize: "11px", color: cfg.color, opacity: 0.6, marginTop: "8px" }}>
              Vérifié le {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(verifiedAt))}
            </div>
          )}
        </div>
      </div>

      {uploadSuccess && (
        <div style={{ padding: "12px 16px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "4px", fontSize: "13px", color: "var(--color-success)", marginBottom: "20px", fontWeight: 500 }}>
          ✓ Document envoyé avec succès — vérification sous 24–48h.
        </div>
      )}
      {uploadError && (
        <div style={{ padding: "12px 16px", background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "4px", fontSize: "13px", color: "var(--color-error)", marginBottom: "20px" }}>
          {uploadError}
        </div>
      )}

      {/* Upload zone */}
      {currentStatus !== "VERIFIED" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
              {hasDocument && currentStatus === "PENDING"
                ? "Renvoyer un document"
                : currentStatus === "REJECTED"
                ? "Renvoyer votre document"
                : "Envoyer votre document"}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Carte d'identité nationale (recto) ou passeport. Le document doit être en cours de validité, lisible et non découpé.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed var(--color-border-strong)",
              borderRadius: "4px",
              padding: "40px 20px",
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: "var(--color-surface)",
              transition: "border-color 0.15s, background 0.15s",
              marginBottom: "12px",
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-strong)"; }}
          >
            {uploading ? (
              <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Envoi en cours…</div>
            ) : (
              <>
                <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.4 }}>📄</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  Cliquez pour choisir un fichier
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  JPG, PNG ou PDF · Max 10 Mo
                </div>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleUpload}
            style={{ display: "none" }}
          />

          <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
            🔒 Votre document est chiffré et stocké de manière sécurisée. Il n'est jamais partagé avec les marques. Seule l'équipe Qualio y a accès pour vérification.
          </p>
        </div>
      )}

      {/* Already verified — info block */}
      {currentStatus === "VERIFIED" && (
        <div className="q-card" style={{ marginTop: "8px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            Votre identité est confirmée. Si vous souhaitez mettre à jour votre document (document expiré, changement de nom), contactez-nous à{" "}
            <a href="mailto:support@qualio.io" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
              support@qualio.io
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}
