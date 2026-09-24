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

export default function LoginNotice() {
  const error = useSearchParams().get("error");
  const message = error ? MESSAGES[error] : undefined;
  if (!message) return null;

  return (
    <p
      className="text-sm text-center px-3 py-2 rounded-lg"
      style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}
    >
      {message}
    </p>
  );
}
