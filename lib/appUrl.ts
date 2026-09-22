/**
 * URL publique de l'application, utilisée dans les emails, les liens d'entretien
 * et les redirections Stripe.
 *
 * On ne fait jamais confiance à NEXT_PUBLIC_APP_URL si elle pointe vers
 * localhost alors qu'on tourne en production : un lien « localhost:3000 » envoyé
 * dans un email de confirmation d'entretien est invisible et irrattrapable.
 * On retombe alors sur le domaine fourni par Vercel, puis sur le domaine public.
 *
 * Serveur uniquement : VERCEL_* n'existe pas dans les bundles client.
 */
const PUBLIC_DOMAIN = "https://www.rarelyst.co";

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);

export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configured && !(process.env.NODE_ENV === "production" && isLocal(configured))) {
    return configured;
  }

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host.replace(/\/+$/, "")}`;

  return PUBLIC_DOMAIN;
}
