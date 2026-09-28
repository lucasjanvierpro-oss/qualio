import Landing, { type LandingTier } from "@/components/landing/Landing";
import { DEFAULT_PRICING, TIERS, type PricingConfig } from "@/lib/pricing/config";
import { getPricingConfig } from "@/lib/pricing/quotes";

// Les prix affichés sont ceux réglés dans l'admin, relus toutes les 5 minutes.
export const revalidate = 300;

async function pricing(): Promise<PricingConfig> {
  // La page d'accueil ne doit jamais tomber avec la base : au-delà de quatre
  // secondes, on affiche les prix par défaut.
  const fallback = new Promise<PricingConfig>((resolve) => setTimeout(() => resolve(DEFAULT_PRICING), 4000));
  return Promise.race([getPricingConfig(), fallback]).catch(() => DEFAULT_PRICING);
}

export default async function HomePage() {
  const cfg = await pricing();
  const tiers: LandingTier[] = TIERS.map((id) => ({
    id,
    label: cfg.tiers[id].label,
    who: cfg.tiers[id].who,
    credits: cfg.tiers[id].baseCredits,
    euros: Math.round((cfg.tiers[id].baseCredits * cfg.creditValueCents) / 100),
    pay: cfg.tiers[id].participantPayCents,
  }));
  return <Landing tiers={tiers} />;
}
