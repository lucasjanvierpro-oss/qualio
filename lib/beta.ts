import { prisma } from "@/lib/prisma";

// Fonctions en bêta, ouvertes marque par marque depuis /admin/access.
// Une marque sans l'accès ne voit rien : ni l'option, ni le prix.
export const BETA_FEATURES = {
  async: { label: "Entretiens en autonomie", text: "Le participant répond seul, face caméra, aux questions du guide." },
} as const;

export type BetaFeature = keyof typeof BETA_FEATURES;

export const isBetaFeature = (f: string): f is BetaFeature => f in BETA_FEATURES;

export async function brandHasBeta(brandProfileId: string, feature: BetaFeature): Promise<boolean> {
  const b = await prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { betaFeatures: true } });
  return !!b?.betaFeatures.includes(feature);
}
