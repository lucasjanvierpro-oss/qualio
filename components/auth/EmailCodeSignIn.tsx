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
const T = {
  fr: { open: "Recevoir un code par email", placeholder: "vous@exemple.com", send: "M'envoyer un code", sending: "Envoi…",
    sent: (e: string) => <>Si un compte existe pour <strong>{e}</strong>, un code à six chiffres vient d&apos;y être envoyé. Il est valable une heure.</>,
    verify: "Me connecter", verifying: "Vérification…", change: "Changer d'adresse" },
  en: { open: "Get a code by email", placeholder: "you@example.com", send: "Send me a code", sending: "Sending…",
    sent: (e: string) => <>If an account exists for <strong>{e}</strong>, a six-digit code has just been sent. It is valid for one hour.</>,
    verify: "Log in", verifying: "Checking…", change: "Use another address" },
};

export default function EmailCodeSignIn({ lang = "fr" }: { lang?: "fr" | "en" }) {
  const t = T[lang];
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
        {t.open}
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
            placeholder={t.placeholder}
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
            {pending ? t.sending : t.send}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            {t.sent(email)}
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
            {pending ? t.verifying : t.verify}
          </button>
          <button
            type="button"
            onClick={() => { setSent(false); setCode(""); setError(null); }}
            style={{
              background: "none", border: 0, padding: 0, cursor: "pointer",
              fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "underline",
            }}
          >
            {t.change}
          </button>
        </>
      )}
      {error && <p style={{ fontSize: 12, color: "var(--color-error)", margin: 0 }}>{error}</p>}
    </div>
  );
}
