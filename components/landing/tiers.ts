import { DEFAULT_PRICING, TIERS, type PricingConfig } from "@/lib/pricing/config";
import { getPricingConfig } from "@/lib/pricing/quotes";
import type { LandingTier } from "./Landing";

// Prix affichés sur la page d'accueil : ceux réglés dans l'admin. La page ne
// doit jamais tomber avec la base : au-delà de quatre secondes, prix par défaut.
export async function landingTiers(): Promise<LandingTier[]> {
  const fallback = new Promise<PricingConfig>((resolve) => setTimeout(() => resolve(DEFAULT_PRICING), 4000));
  const cfg = await Promise.race([getPricingConfig(), fallback]).catch(() => DEFAULT_PRICING);
  return TIERS.map((id) => ({
    id,
    label: cfg.tiers[id].label,
    who: cfg.tiers[id].who,
    credits: cfg.tiers[id].baseCredits,
    euros: Math.round((cfg.tiers[id].baseCredits * cfg.creditValueCents) / 100),
    pay: cfg.tiers[id].participantPayCents,
  }));
}
