"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { login } from "@/app/actions/auth";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    setServerError(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    const result = await login(formData);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl" style={{ color: "var(--color-text-primary)" }}>
          Connexion
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Accédez à votre espace Qualio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Email
          </label>
          <input
            {...register("email", { required: "Email requis" })}
            type="email"
            placeholder="vous@entreprise.com"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-current"
            style={{
              background: "var(--color-surface)",
              borderColor: errors.email ? "var(--color-error)" : "var(--color-border-base)",
              color: "var(--color-text-primary)",
            }}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Mot de passe
          </label>
          <input
            {...register("password", { required: "Mot de passe requis" })}
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
            style={{
              background: "var(--color-surface)",
              borderColor: errors.password ? "var(--color-error)" : "var(--color-border-base)",
              color: "var(--color-text-primary)",
            }}
          />
          {errors.password && (
            <p className="text-xs" style={{ color: "var(--color-error)" }}>{errors.password.message}</p>
          )}
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
          style={{
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
          }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
        Pas encore de compte ?{" "}
        <Link href="/signup/brand" className="font-medium underline underline-offset-4" style={{ color: "var(--color-text-primary)" }}>
          Marque
        </Link>
        {" ou "}
        <Link href="/signup/participant" className="font-medium underline underline-offset-4" style={{ color: "var(--color-text-primary)" }}>
          Participant
        </Link>
      </p>
    </div>
  );
}
