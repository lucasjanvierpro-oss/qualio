"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin, getSessionUser } from "@/lib/auth/guards";
import { isBetaFeature, type BetaFeature } from "@/lib/beta";

/** Admin : ouvre ou ferme une fonction bêta pour une marque. */
export async function setBrandBeta(brandProfileId: string, feature: string, on: boolean) {
  await assertAdmin();
  if (!isBetaFeature(feature)) return { error: "Fonction inconnue." };
  const b = await prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { betaFeatures: true } });
  if (!b) return { error: "Marque introuvable." };
  const next = on ? Array.from(new Set([...b.betaFeatures, feature])) : b.betaFeatures.filter((f) => f !== feature);
  await prisma.brandProfile.update({ where: { id: brandProfileId }, data: { betaFeatures: next } });
  revalidatePath("/admin/access");
  return { ok: true as const };
}

/** Marque connectée : les fonctions bêta qui lui sont ouvertes. */
export async function myBetaFeatures(): Promise<BetaFeature[]> {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return [];
  const b = await prisma.brandProfile.findUnique({ where: { id: me.brandProfileId }, select: { betaFeatures: true } });
  return (b?.betaFeatures ?? []).filter(isBetaFeature);
}
