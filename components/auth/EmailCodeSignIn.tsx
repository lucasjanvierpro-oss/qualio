"use client";

import { useState, useTransition } from "react";
import { sendEmailCode, verifyEmailCode } from "@/app/actions/auth";

/**
 * Connexion par code à six chiffres reçu par email.
 *
 * Utile pour un participant qui revient six mois après son inscription et ne
 * se souvient plus de son mot de passe : il reçoit un code, il entre, sans
 * passer par une réinitialisation.
 *
 * L'envoi ne dit jamais si l'adresse est connue — ce serait un moyen de
 * savoir qui est inscrit sur Rarelyst. Un email inconnu ne reçoit simplement
 * rien, et l'écran affiche le même message.
 */
export default function EmailCodeSignIn() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const field: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--color-border-base)",
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none", border: 0, padding: 0, cursor: "pointer",
          fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "underline",
        }}
      >
        Recevoir un code par email
      </button>
    );
  }

  function request() {
    setError(null);
    startTransition(async () => {
      const r = await sendEmailCode(email);
      if (r?.error) setError(r.error);
      else setSent(true);
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const r = await verifyEmailCode(email, code);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {!sent ? (
        <>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && request()}
            style={field}
          />
          <button
            type="button"
            className="q-btn q-btn-primary"
            disabled={pending || !email}
            onClick={request}
          >
            {pending ? "Envoi…" : "M'envoyer un code"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Si un compte existe pour <strong>{email}</strong>, un code à six chiffres vient
            d&apos;y être envoyé. Il est valable une heure.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && code.length === 6 && confirm()}
            style={{ ...field, letterSpacing: "0.35em", textAlign: "center", fontSize: 18 }}
          />
          <button
            type="button"
            className="q-btn q-btn-primary"
            disabled={pending || code.length !== 6}
            onClick={confirm}
          >
            {pending ? "Vérification…" : "Me connecter"}
          </button>
          <button
            type="button"
            onClick={() => { setSent(false); setCode(""); setError(null); }}
            style={{
              background: "none", border: 0, padding: 0, cursor: "pointer",
              fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "underline",
            }}
          >
            Changer d&apos;adresse
          </button>
        </>
      )}
      {error && <p style={{ fontSize: 12, color: "var(--color-error)", margin: 0 }}>{error}</p>}
    </div>
  );
}
