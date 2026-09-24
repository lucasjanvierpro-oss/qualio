"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth/guards";
import { mergePricing, TIERS, type PricingConfig, type Tier } from "@/lib/pricing/config";
import { savePricingConfig } from "@/lib/pricing/quotes";
import { generateGhostFile } from "@/lib/participants/ghostFile";

// Actions de l'espace admin. Chacune vérifie elle-même que l'appelant est
// admin : une server action est un point d'entrée public.

/** Enregistre les réglages du moteur de prix, après contrôle des valeurs. */
export async function saveAdminPricing(input: PricingConfig) {
  await assertAdmin();
  const cfg = mergePricing(input);
  const bad = (n: unknown, min: number, max: number) => typeof n !== "number" || !Number.isFinite(n) || n < min || n > max;
  if (bad(cfg.creditValueCents, 100, 100_000)) return { error: "Valeur du crédit invalide." };
  for (const t of TIERS) {
    if (bad(cfg.tiers[t].baseCredits, 1, 10_000)) return { error: `Prix de base invalide (${cfg.tiers[t].label}).` };
    if (bad(cfg.tiers[t].participantPayCents, 0, 1_000_000)) return { error: `Rémunération invalide (${cfg.tiers[t].label}).` };
    if (cfg.tiers[t].participantPayCents >= cfg.tiers[t].baseCredits * cfg.creditValueCents) {
      return { error: `${cfg.tiers[t].label} : la rémunération dépasse le prix, la marge serait négative.` };
    }
  }
  if (bad(cfg.bounds.min, 0.1, 5) || bad(cfg.bounds.max, cfg.bounds.min, 10)) return { error: "Bornes du coefficient invalides." };
  if (cfg.packs.some((p) => bad(p.credits, 1, 1_000_000) || bad(p.priceCents, 100, 100_000_000) || !p.id)) {
    return { error: "Un pack est invalide." };
  }
  await savePricingConfig(cfg);
  revalidatePath("/admin/prix");
  revalidatePath("/pricing");
  return { ok: true as const };
}

/** Palier imposé et prix fixé à la main pour un profil ; null rend la main au calcul. */
export async function setProfilePricing(profileId: string, tier: Tier | null, credits: number | null) {
  await assertAdmin();
  if (tier !== null && !TIERS.includes(tier)) return { error: "Palier inconnu." };
  if (credits !== null && (!Number.isInteger(credits) || credits < 1 || credits > 10_000)) return { error: "Prix invalide." };
  await prisma.participantProfile.update({
    where: { id: profileId },
    data: { priceTier: tier, priceOverrideCredits: credits },
  });
  revalidatePath("/admin/prix");
  return { ok: true as const };
}

/** Relance l'analyse IA d'un profil (portrait, traits confirmés, tags). */
export async function rerunGhostFile(profileId: string) {
  await assertAdmin();
  after(async () => { await generateGhostFile(profileId).catch(() => null); });
  return { ok: true as const };
}

/** Réponse de l'équipe à une demande de profil sur demande. */
export async function answerProfileRequest(requestId: string, status: "accepted" | "declined", reply: string) {
  await assertAdmin();
  await prisma.profileRequest.update({
    where: { id: requestId },
    data: { status, adminReply: reply.trim() || null },
  });
  revalidatePath("/admin");
  return { ok: true as const };
}
