import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { emailDomain, isProDomain } from "@/lib/brands/certification";
import { emailConfirmationRequired } from "@/lib/auth/emailConfirmation";

/**
 * Titre II du poinçon : la marque a prouvé qu'elle contrôle son adresse pro.
 * Google et LinkedIn ne transmettent qu'une adresse vérifiée ; un lien de
 * confirmation reçu par email prouve la même chose — mais seulement quand la
 * confirmation est réellement exigée, sinon le compte a été confirmé d'office.
 *
 * Appelé au retour de Google/LinkedIn (/auth/callback) et au clic sur le lien
 * de confirmation (/auth/confirm).
 */
export async function markDomainVerified(user: User) {
  const email = user.email ?? "";
  if (!isProDomain(emailDomain(email))) return;
  const provider = String(user.app_metadata?.provider ?? "email");
  const proven = provider === "google" || provider === "linkedin_oidc" ||
    (provider === "email" && !!user.email_confirmed_at && emailConfirmationRequired());
  if (!proven) return;
  await prisma.brandProfile.updateMany({
    where: { user: { supabaseId: user.id }, domainVerifiedAt: null },
    data: { domainVerifiedAt: new Date() },
  }).catch(() => {});
}
