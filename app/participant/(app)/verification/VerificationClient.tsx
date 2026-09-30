"use client";

import { useState, useRef } from "react";
import { useLang } from "@/lib/i18n/client";

type TT = (fr: string, en: string) => string;
const STATUS_CONFIG = (tt: TT) => ({
  PENDING: {
    bg: "var(--color-warning-light)",
    border: "var(--color-warning)",
    color: "var(--color-warning)",
    icon: "⏳",
    title: tt("Vérification en cours", "Verification in progress"),
    body: tt("Votre document a bien été reçu. Notre équipe le vérifie généralement sous 24–48h. Vous serez notifié(e) par email.", "Your document has been received. Our team usually checks it within 24–48h. You will be notified by email."),
  },
  VERIFIED: {
    bg: "var(--color-success-light)",
    border: "var(--color-success)",
    color: "var(--color-success)",
    icon: "✓",
    title: tt("Identité vérifiée", "Identity verified"),
    body: tt("Votre identité a été confirmée. Vous pouvez maintenant participer à toutes les études Rarelyst.", "Your identity is confirmed. You can now take part in every Rarelyst study."),
  },
  REJECTED: {
    bg: "var(--color-error-light)",
    border: "var(--color-error)",
    color: "var(--color-error)",
    icon: "✗",
    title: tt("Document refusé", "Document declined"),
    body: tt("Votre document n'a pas pu être validé (document illisible, expiré, ou mauvais format). Veuillez renvoyer une pièce d'identité valide.", "Your document could not be validated (unreadable, expired or wrong format). Please upload a valid ID."),
  },
});

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
  const en = useLang() === "en";
  const tt: TT = (fr, e) => (en ? e : fr);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const configs = STATUS_CONFIG(tt);
  const cfg = configs[currentStatus as keyof typeof configs] ?? configs.PENDING;

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
        if (data.error === "too_large") setUploadError(tt("Fichier trop volumineux (max 10 Mo)", "File too large (10 MB max)"));
        else if (data.error === "invalid_type") setUploadError(tt("Format non supporté — utilisez JPG, PNG ou PDF", "Unsupported format, use JPG, PNG or PDF"));
        else setUploadError(tt("Erreur lors de l'envoi. Réessayez.", "Upload error. Please try again."));
      }
    } catch {
      setUploadError(tt("Erreur réseau. Vérifiez votre connexion.", "Network error. Check your connection."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div style={{ maxWidth: "580px", margin: "0 auto", padding: "48px 32px" }}>

      {/* Header */}
      <p className="q-label" style={{ marginBottom: "10px" }}>{tt("Vérification", "Verification")}</p>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "28px", fontWeight: 800, fontStyle: "normal",
        letterSpacing: "-0.02em",
        color: "var(--color-text-primary)",
        margin: "0 0 6px",
      }}>
        {tt("Votre pièce d'identité", "Your ID")}
      </h1>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "32px" }}>
        {tt("La vérification est requise pour participer aux études et recevoir vos récompenses.", "Verification is required to take part in studies and receive your rewards.")}
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
              {tt("Vérifié le", "Verified on")} {new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(verifiedAt))}
            </div>
          )}
        </div>
      </div>

      {uploadSuccess && (
        <div style={{ padding: "12px 16px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "4px", fontSize: "13px", color: "var(--color-success)", marginBottom: "20px", fontWeight: 500 }}>
          ✓ {tt("Document envoyé avec succès — vérification sous 24–48h.", "Document uploaded, verification within 24–48h.")}
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
                ? tt("Renvoyer un document", "Upload another document")
                : currentStatus === "REJECTED"
                ? tt("Renvoyer votre document", "Upload your document again")
                : tt("Envoyer votre document", "Upload your document")}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {tt("Carte d'identité nationale (recto) ou passeport. Le document doit être en cours de validité, lisible et non découpé.", "National ID card (front) or passport. The document must be valid, readable and uncropped.")}
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
              <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>{tt("Envoi en cours…", "Uploading…")}</div>
            ) : (
              <>
                <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.4 }}>📄</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  {tt("Cliquez pour choisir un fichier", "Click to choose a file")}
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  {tt("JPG, PNG ou PDF · Max 10 Mo", "JPG, PNG or PDF · 10 MB max")}
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
            🔒 {tt("Votre document est chiffré et stocké de manière sécurisée. Il n'est jamais partagé avec les marques. Seule l'équipe Rarelyst y a accès pour vérification.", "Your document is encrypted and stored securely. It is never shared with brands. Only the Rarelyst team can access it, to verify it.")}
          </p>
        </div>
      )}

      {/* Already verified — info block */}
      {currentStatus === "VERIFIED" && (
        <div className="q-card" style={{ marginTop: "8px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            {tt("Votre identité est confirmée. Si vous souhaitez mettre à jour votre document (document expiré, changement de nom), contactez-nous à", "Your identity is confirmed. To update your document (expired, change of name), contact us at")}{" "}
            <a href="mailto:support@rarelyst.co" style={{ color: "var(--color-accent)", textDecoration: "none" }}>
              support@rarelyst.co
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}
