"use client";

import { useSearchParams } from "next/navigation";

/**
 * Explique pourquoi on atterrit sur la page de connexion quand un retour de
 * Google, de LinkedIn ou d'un lien reçu par email a échoué (voir /auth/callback
 * et /auth/confirm). Sans lui, la personne revient ici sans savoir pourquoi.
 */
const MESSAGES: Record<string, string> = {
  lien_invalide:
    "Ce lien n'est plus valable : il a sans doute déjà servi. Si votre adresse est confirmée, connectez-vous ci-dessous.",
  auth_failed: "La connexion n'a pas abouti. Réessayez.",
  no_code: "La connexion n'a pas abouti. Réessayez.",
  no_email:
    "Votre compte LinkedIn ne transmet pas d'adresse email vérifiée. Utilisez une autre méthode de connexion.",
  account_conflict: "Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe.",
};

const MESSAGES_EN: Record<string, string> = {
  lien_invalide: "This link is no longer valid: it has probably been used already. If your address is confirmed, log in below.",
  auth_failed: "Sign-in didn't go through. Please try again.",
  no_code: "Sign-in didn't go through. Please try again.",
  no_email: "Your LinkedIn account doesn't share a verified email address. Please use another sign-in method.",
  account_conflict: "An account already exists with this address. Log in with your password.",
};

export default function LoginNotice({ lang = "fr", className }: { lang?: "fr" | "en"; className?: string }) {
  const error = useSearchParams().get("error");
  const message = error ? (lang === "en" ? MESSAGES_EN : MESSAGES)[error] : undefined;
  if (!message) return null;

  return (
    <p
      className={className ?? "text-sm text-center px-3 py-2 rounded-lg"}
      style={className ? undefined : { background: "var(--color-error-light)", color: "var(--color-error)" }}
    >
      {message}
    </p>
  );
}
