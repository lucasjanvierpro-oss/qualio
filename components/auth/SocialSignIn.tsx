"use client";

import { useState, useTransition } from "react";
import { signInWithProvider, type OAuthProvider } from "@/app/actions/auth";

/**
 * Connexion par Google ou LinkedIn.
 *
 * LinkedIn n'est pas là par symétrie : le profil d'un participant se juge sur
 * son parcours professionnel, et c'est justement ce que LinkedIn transmet.
 * Le rôle est passé au départ, parce que le fournisseur ne dira jamais si la
 * personne vient comme marque ou comme participant.
 */
export default function SocialSignIn({
  role,
  label = "ou",
}: {
  role?: "BRAND" | "PARTICIPANT";
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(provider: OAuthProvider) {
    setError(null);
    startTransition(async () => {
      const r = await signInWithProvider(provider, role);
      if (r?.error) setError(r.error);
    });
  }

  const button: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--color-border-base)",
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.6 : 1,
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--color-border-base)" }} />
        <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{label}</span>
        <span style={{ flex: 1, height: 1, background: "var(--color-border-base)" }} />
      </div>

      <button type="button" style={button} disabled={pending} onClick={() => go("google")}>
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
        </svg>
        Continuer avec Google
      </button>

      <button type="button" style={button} disabled={pending} onClick={() => go("linkedin_oidc")}>
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#0A66C2"
            d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
          />
        </svg>
        Continuer avec LinkedIn
      </button>

      {error && (
        <p style={{ fontSize: 12, color: "var(--color-error)", margin: 0 }}>{error}</p>
      )}
    </div>
  );
}
