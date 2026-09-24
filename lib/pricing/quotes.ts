import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING, mergePricing, type PricingConfig } from "./config";
import { quote, resolveTier, type MarketSignals, type PriceQuote, type TierDecision } from "./engine";
import { BADGE_PROFILE_SELECT, TRUST_SELECT, trustFrom, badgesOf, traitsOf } from "@/lib/participants/trust";
import { certificationScore, proofsFromProfile, type EarnedBadge, type TraitState } from "@/lib/participants/badges";
import { normalizeTag } from "@/lib/participants/ghostFilePrompt";

// Côté serveur : lit les réglages et les signaux de marché, puis appelle le
// moteur pur (engine.ts).

export const getPricingConfig = cache(async (): Promise<PricingConfig> => {
  const row = await prisma.pricingConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  return row ? mergePricing(row.data) : DEFAULT_PRICING;
});

export async function savePricingConfig(cfg: PricingConfig) {
  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    create: { id: "default", data: cfg },
    update: { data: cfg },
  });
}

const DAY = 86_400_000;
const ACCEPTED = ["INVITED", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;

/** Demande et rareté pour une liste de profils, en trois requêtes. */
async function marketSignals(ids: string[]): Promise<Map<string, MarketSignals>> {
  const since = new Date(Date.now() - 90 * DAY);
  const [apps, ghosts, pool] = await Promise.all([
    prisma.application.findMany({
      where: { participantProfileId: { in: ids }, updatedAt: { gte: since } },
      select: { participantProfileId: true, status: true, study: { select: { brandProfileId: true } } },
    }),
    prisma.participantGhostFile.findMany({
      where: { participantProfileId: { in: ids } },
      select: { participantProfileId: true, primaryExpertise: true },
    }),
    // Le panel actif, pour compter les profils comparables.
    prisma.participantGhostFile.findMany({
      where: {
        processingStatus: "done",
        participantProfile: { isBlacklisted: false, onboardingStatus: "complete" },
      },
      select: { primaryExpertise: true },
    }),
  ]);

  const byExpertise = new Map<string, number>();
  for (const g of pool) {
    const k = normalizeTag(g.primaryExpertise ?? "");
    if (k) byExpertise.set(k, (byExpertise.get(k) ?? 0) + 1);
  }

  const out = new Map<string, MarketSignals>();
  for (const id of ids) {
    const mine = apps.filter((a) => a.participantProfileId === id);
    const brands = new Set(mine.filter((a) => (ACCEPTED as readonly string[]).includes(a.status)).map((a) => a.study.brandProfileId));
    const g = ghosts.find((x) => x.participantProfileId === id);
    const k = normalizeTag(g?.primaryExpertise ?? "");
    out.set(id, {
      brandsAccepted90d: brands.size,
      shortlisted90d: mine.length,
      // Sans expertise connue, on ne peut pas juger de la rareté : profil courant.
      peers: k ? Math.max(1, byExpertise.get(k) ?? 1) : 99,
      panelSize: pool.length,
    });
  }
  return out;
}

export type ProfilePricing = {
  quote: PriceQuote;
  tier: TierDecision;
  certScore: number;
  badges: EarnedBadge[];
  traits: TraitState[];
};

/**
 * Prix de chaque profil pour une étude donnée (durée, format). Sans étude,
 * le prix d'un entretien individuel de 45 minutes.
 */
export async function priceProfiles(
  ids: string[],
  study: { durationMin: number; focusGroup: boolean } = { durationMin: 45, focusGroup: false },
): Promise<Map<string, ProfilePricing>> {
  const out = new Map<string, ProfilePricing>();
  if (!ids.length) return out;

  const [cfg, profiles, signals] = await Promise.all([
    getPricingConfig(),
    prisma.participantProfile.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, ...BADGE_PROFILE_SELECT,
        applications: { select: TRUST_SELECT },
        ghostFile: { select: { behaviours: true, processingStatus: true, profileType: true } },
      },
    }),
    marketSignals(ids),
  ]);

  for (const p of profiles) {
    const trust = trustFrom(p.applications);
    const behaviours = p.ghostFile?.processingStatus === "done" ? p.ghostFile.behaviours : null;
    const badges = badgesOf(p, trust);
    const traits = traitsOf(p, behaviours);
    const certScore = certificationScore(badges);
    const proofs = proofsFromProfile(p);
    const tier = resolveTier({
      priceTier: p.priceTier,
      accessTier: p.accessTier,
      segment: p.segment,
      proYears: p.proYears,
      traitsConfirmed: traits.filter((t) => t.state === "confirmed").map((t) => t.id),
      legacyProfileType: p.ghostFile?.profileType ?? null,
      certScore,
      proofs,
    });
    const q = quote(cfg, {
      tier: tier.tier,
      durationMin: study.durationMin,
      focusGroup: study.focusGroup,
      certScore,
      ratings: trust.ratings,
      signals: signals.get(p.id) ?? { brandsAccepted90d: 0, shortlisted90d: 0, peers: 99, panelSize: 0 },
      overrideCredits: p.priceOverrideCredits,
    });
    out.set(p.id, { quote: q, tier, certScore, badges, traits });
  }
  return out;
}
