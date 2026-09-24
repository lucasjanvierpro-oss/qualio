"use client";

import { useState, useTransition } from "react";
import { resendConfirmation } from "@/app/actions/auth";

/**
 * Renvoi du lien de confirmation.
 *
 * Le bouton se verrouille 60 secondes après un envoi : Supabase limite la
 * cadence, et sans ce délai quelqu'un qui clique trois fois d'affilée reçoit une
 * erreur au lieu d'un email.
 */
export default function ResendButton({ email, next }: { email: string; next: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    startTransition(async () => {
      const r = await resendConfirmation(email, next === "brand" ? "BRAND" : "PARTICIPANT");
      if (r?.error) setError(r.error);
      else {
        setSent(true);
        setTimeout(() => setSent(false), 60_000);
      }
    });
  }

  if (!email) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={send}
        disabled={pending || sent}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium"
        style={{
          background: sent ? "var(--color-surface)" : "var(--color-accent)",
          color: sent ? "var(--color-text-secondary)" : "var(--color-accent-text)",
          border: sent ? "1px solid var(--color-border-base)" : "none",
          cursor: pending || sent ? "default" : "pointer",
        }}
      >
        {pending ? "Envoi…" : sent ? "Envoyé — réessayez dans une minute" : "Renvoyer le lien"}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
      )}
    </div>
  );
}
