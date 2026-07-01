"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { signupParticipant, signInWithLinkedIn } from "@/app/actions/auth";

type ParticipantForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// Passe à true une fois LinkedIn configuré dans Supabase (Auth → Providers → LinkedIn)
const LINKEDIN_ENABLED = false;

export default function ParticipantSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [mode, setMode] = useState<"choice" | "email">("choice");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantForm>();

  async function onSubmit(data: ParticipantForm) {
    setLoading(true);
    setServerError(null);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.set(k, v));
    const result = await signupParticipant(formData);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    }
  }

  async function handleLinkedIn() {
    setLinkedinLoading(true);
    await signInWithLinkedIn();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl" style={{ color: "var(--color-text-primary)" }}>
          Rejoindre Qualio
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Participez à des études, et soyez récompensé(e)
        </p>
      </div>

      {mode === "choice" && (
        <div className="space-y-3">
          {LINKEDIN_ENABLED && (
            <>
              {/* LinkedIn */}
              <button
                onClick={handleLinkedIn}
                disabled={linkedinLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border-base)",
                  color: "var(--color-text-primary)",
                }}
              >
                <LinkedInIcon />
                {linkedinLoading ? "Redirection…" : "Continuer avec LinkedIn"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t" style={{ borderColor: "var(--color-border-base)" }} />
                <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>ou</span>
                <div className="flex-1 border-t" style={{ borderColor: "var(--color-border-base)" }} />
              </div>
            </>
          )}

          {/* Email option */}
          <button
            onClick={() => setMode("email")}
            className="w-full py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border-base)",
              color: "var(--color-text-primary)",
            }}
          >
            Continuer avec email
          </button>
        </div>
      )}

      {mode === "email" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Prénom</label>
              <input
                {...register("firstName", { required: "Requis" })}
                placeholder="Alex"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ background: "var(--color-surface)", borderColor: errors.firstName ? "var(--color-error)" : "var(--color-border-base)", color: "var(--color-text-primary)" }}
              />
              {errors.firstName && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Nom</label>
              <input
                {...register("lastName", { required: "Requis" })}
                placeholder="Dupont"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ background: "var(--color-surface)", borderColor: errors.lastName ? "var(--color-error)" : "var(--color-border-base)", color: "var(--color-text-primary)" }}
              />
              {errors.lastName && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Email</label>
            <input
              {...register("email", { required: "Requis" })}
              type="email"
              placeholder="alex@email.com"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "var(--color-surface)", borderColor: errors.email ? "var(--color-error)" : "var(--color-border-base)", color: "var(--color-text-primary)" }}
            />
            {errors.email && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Mot de passe</label>
            <input
              {...register("password", { required: "Requis", minLength: { value: 8, message: "8 caractères minimum" } })}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "var(--color-surface)", borderColor: errors.password ? "var(--color-error)" : "var(--color-border-base)", color: "var(--color-text-primary)" }}
            />
            {errors.password && <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-center px-3 py-2 rounded-lg" style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: "var(--color-accent)", color: "var(--color-accent-text)" }}
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>

          <button
            type="button"
            onClick={() => setMode("choice")}
            className="w-full text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ← Retour
          </button>
        </form>
      )}

      <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium underline underline-offset-4" style={{ color: "var(--color-text-primary)" }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
