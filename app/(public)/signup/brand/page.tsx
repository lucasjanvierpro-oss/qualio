"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { signupBrand } from "@/app/actions/auth";

type BrandForm = {
  companyName: string;
  industry: string;
  contactFirstName: string;
  contactLastName: string;
  contactTitle: string;
  email: string;
  password: string;
};

const INDUSTRIES = [
  { value: "fashion", label: "Mode & Vêtements" },
  { value: "beauty", label: "Beauté & Cosmétiques" },
  { value: "lifestyle", label: "Lifestyle & Maison" },
  { value: "luxury", label: "Luxe & Haute couture" },
  { value: "sport", label: "Sport & Outdoor" },
  { value: "other", label: "Autre" },
];

export default function BrandSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandForm>();

  async function onSubmit(data: BrandForm) {
    setLoading(true);
    setServerError(null);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.set(k, v));
    const result = await signupBrand(formData);
    if (result?.error) {
      setServerError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl" style={{ color: "var(--color-text-primary)" }}>
          Créer un compte marque
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Recrutez vos participants en 72h
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Company */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Nom de l'entreprise
          </label>
          <input
            {...register("companyName", { required: "Requis" })}
            placeholder="Lacoste, Jacquemus…"
            className={inputClass(!!errors.companyName)}
            style={inputStyle(!!errors.companyName)}
          />
          <FieldError msg={errors.companyName?.message} />
        </div>

        {/* Industry */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Secteur
          </label>
          <select
            {...register("industry", { required: "Requis" })}
            className={inputClass(!!errors.industry)}
            style={inputStyle(!!errors.industry)}
          >
            <option value="">Sélectionnez un secteur</option>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
          <FieldError msg={errors.industry?.message} />
        </div>

        {/* Contact name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Prénom</label>
            <input
              {...register("contactFirstName", { required: "Requis" })}
              placeholder="Sophie"
              className={inputClass(!!errors.contactFirstName)}
              style={inputStyle(!!errors.contactFirstName)}
            />
            <FieldError msg={errors.contactFirstName?.message} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Nom</label>
            <input
              {...register("contactLastName", { required: "Requis" })}
              placeholder="Martin"
              className={inputClass(!!errors.contactLastName)}
              style={inputStyle(!!errors.contactLastName)}
            />
            <FieldError msg={errors.contactLastName?.message} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Poste
          </label>
          <input
            {...register("contactTitle", { required: "Requis" })}
            placeholder="Consumer Insights Director"
            className={inputClass(!!errors.contactTitle)}
            style={inputStyle(!!errors.contactTitle)}
          />
          <FieldError msg={errors.contactTitle?.message} />
        </div>

        {/* Divider */}
        <div className="border-t pt-2" style={{ borderColor: "var(--color-border-base)" }} />

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Email professionnel</label>
          <input
            {...register("email", { required: "Requis" })}
            type="email"
            placeholder="sophie@lacoste.com"
            className={inputClass(!!errors.email)}
            style={inputStyle(!!errors.email)}
          />
          <FieldError msg={errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Mot de passe</label>
          <input
            {...register("password", { required: "Requis", minLength: { value: 8, message: "8 caractères minimum" } })}
            type="password"
            placeholder="••••••••"
            className={inputClass(!!errors.password)}
            style={inputStyle(!!errors.password)}
          />
          <FieldError msg={errors.password?.message} />
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
          {loading ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium underline underline-offset-4" style={{ color: "var(--color-text-primary)" }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors bg-white ${hasError ? "border-red-400" : ""}`;
}

function inputStyle(hasError: boolean) {
  return {
    background: "var(--color-surface)",
    borderColor: hasError ? "var(--color-error)" : "var(--color-border-base)",
    color: "var(--color-text-primary)",
  };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs" style={{ color: "var(--color-error)" }}>{msg}</p>;
}
