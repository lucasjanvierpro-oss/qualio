import { prisma } from "@/lib/prisma";
import { priceProfiles, getPricingConfig } from "@/lib/pricing/quotes";
import { factorText } from "@/lib/pricing/engine";
import PricingForm from "./PricingForm";
import ProfilesPricing, { type Row } from "./ProfilesPricing";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

/**
 * Le cœur du modèle : les réglages du moteur de prix, et le prix de chaque
 * profil tel que les marques le verraient pour un entretien de 45 minutes.
 */
export default async function AdminPricing() {
  const [cfg, profiles] = await Promise.all([
    getPricingConfig(),
    prisma.participantProfile.findMany({
      where: { isBlacklisted: false },
      select: { id: true, firstName: true, lastName: true, city: true, onboardingStatus: true, priceTier: true, priceOverrideCredits: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  const pricing = await priceProfiles(profiles.map((p) => p.id));

  const rows: Row[] = profiles.map((p) => {
    const pr = pricing.get(p.id)!;
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim() || "Sans nom",
      city: p.city,
      complete: p.onboardingStatus === "complete",
      tier: pr.quote.tier,
      tierReason: pr.tier.reason,
      tierManual: !!p.priceTier,
      override: p.priceOverrideCredits,
      certScore: pr.certScore,
      credits: pr.quote.credits,
      priceCents: pr.quote.priceCents,
      payCents: pr.quote.participantPayCents,
      marginCents: pr.quote.marginCents,
      why: pr.quote.factors.map(factorText),
    };
  }).sort((x, y) => y.credits - x.credits);

  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Prix</p>
      <h1 className={a.h1}>Le moteur de prix</h1>
      <p className={a.sub}>
        Prix d&apos;un profil = base du palier × durée × demande × rareté × certification × avis, borné et arrondi au crédit.
        Le participant touche la même part du prix, quel que soit le calcul.
      </p>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Réglages</h2></div>
        <PricingForm initial={cfg} />
      </section>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Prix de chaque profil · entretien de 45 min</h2></div>
        <ProfilesPricing rows={rows} tierLabels={{ averti: cfg.tiers.averti.label, initie: cfg.tiers.initie.label, rare: cfg.tiers.rare.label }} />
      </section>
    </div>
  );
}
