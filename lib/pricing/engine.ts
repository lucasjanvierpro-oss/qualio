// Moteur de prix : combien de crédits coûte un profil pour une étude, et
// combien touche le participant. Pur, testable, sans accès base.
//
// Prix = base du palier × durée × format × demande × rareté × certification × avis,
// borné, arrondi au crédit. Le participant touche la base de son palier
// multipliée par les MÊMES coefficients : quand un profil vaut plus, il gagne
// plus. C'est ce qui le pousse à ajouter des preuves.

import type { PricingConfig, Tier } from "./config";

export type TierInput = {
  priceTier: string | null;
  accessTier: string;
  segment: string | null;
  proYears: string | null;
  traitsConfirmed: string[];
  legacyProfileType: string | null;
  certScore: number;
  proofs: { linkedinVerified: boolean; workVerified: boolean; cvAnalyzed: boolean };
};

export type TierDecision = { tier: Tier; reason: string; manual: boolean };

const SENIOR = ["5 à 10 ans", "Plus de 10 ans"];

/** Palier d'un profil : imposé par l'admin, sinon déduit de ses preuves. */
export function resolveTier(p: TierInput): TierDecision {
  if (p.priceTier === "averti" || p.priceTier === "initie" || p.priceTier === "rare") {
    return { tier: p.priceTier, reason: "Fixé par l'équipe", manual: true };
  }
  if (p.accessTier === "ON_REQUEST") return { tier: "rare", reason: "Profil sur demande", manual: true };

  const pro = p.segment === "pro" || p.segment === "hybrid";
  const insider = p.traitsConfirmed.includes("insider");
  if (insider && p.proYears && SENIOR.includes(p.proYears) && p.certScore >= 60) {
    return { tier: "rare", reason: "Initié·e confirmé·e, plus de 5 ans de métier, certifié·e à 60 % ou plus", manual: false };
  }
  if (insider) return { tier: "initie", reason: "Travaille dans le secteur (confirmé par l'IA)", manual: false };
  if (pro && (p.proofs.workVerified || p.proofs.linkedinVerified || p.proofs.cvAnalyzed)) {
    return { tier: "initie", reason: "Parcours pro appuyé par une preuve (emploi, LinkedIn ou CV)", manual: false };
  }
  if (!p.segment && (p.legacyProfileType === "insider" || p.legacyProfileType === "expert")) {
    return { tier: "initie", reason: "Profil expert (ancien tunnel)", manual: false };
  }
  return { tier: "averti", reason: pro ? "Parcours pro déclaré, sans preuve pour l'instant" : "Consommateur·rice", manual: false };
}

export type MarketSignals = {
  /** Marques distinctes qui ont retenu ce profil ces 90 derniers jours. */
  brandsAccepted90d: number;
  /** Fois où il a été proposé à une marque ces 90 derniers jours. */
  shortlisted90d: number;
  /** Profils comparables actifs (même expertise), lui compris. */
  peers: number;
  /** Taille du panel actif. */
  panelSize: number;
};

export type PriceInput = {
  tier: Tier;
  durationMin: number;
  focusGroup: boolean;
  certScore: number;
  ratings: number[];
  signals: MarketSignals;
  overrideCredits: number | null;
};

export type PriceFactor = { key: string; label: string; factor: number };

export type PriceQuote = {
  tier: Tier;
  credits: number;
  priceCents: number;
  participantPayCents: number;
  marginCents: number;
  factors: PriceFactor[];
  multiplier: number;
  overridden: boolean;
};

const fmt = (f: number) => `×${f.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`;
const round5 = (cents: number) => Math.round(cents / 500) * 500;

export function quote(cfg: PricingConfig, i: PriceInput): PriceQuote {
  const t = cfg.tiers[i.tier];
  const factors: PriceFactor[] = [];

  const dur = cfg.duration.find((d) => i.durationMin <= d.upTo)?.factor ?? 1;
  if (dur !== 1) factors.push({ key: "duree", label: `Durée ${i.durationMin} min`, factor: dur });

  if (i.focusGroup) factors.push({ key: "format", label: "Focus group (par participant)", factor: cfg.focusGroupFactor });

  const demandBonus = Math.min(
    cfg.demand.max,
    i.signals.brandsAccepted90d * cfg.demand.perBrand + i.signals.shortlisted90d * cfg.demand.perShortlist,
  );
  if (demandBonus > 0) {
    factors.push({
      key: "demande",
      label: `Demande : ${i.signals.brandsAccepted90d} marque${i.signals.brandsAccepted90d > 1 ? "s" : ""} l'${i.signals.brandsAccepted90d > 1 ? "ont" : "a"} retenu·e en 90 jours`,
      factor: 1 + demandBonus,
    });
  }

  const scarce = i.signals.panelSize < cfg.scarcityMinPanel
    ? 1
    : [...cfg.scarcity].sort((a, b) => b.minPeers - a.minPeers).find((s) => i.signals.peers >= s.minPeers)?.factor ?? 1;
  if (scarce !== 1) {
    factors.push({ key: "rarete", label: `Rareté : ${i.signals.peers} profil${i.signals.peers > 1 ? "s" : ""} comparable${i.signals.peers > 1 ? "s" : ""}`, factor: scarce });
  }

  const cert = 1 + cfg.certificationMaxBonus * Math.min(100, Math.max(0, i.certScore)) / 100;
  if (cert > 1) factors.push({ key: "certification", label: `Certifié·e à ${i.certScore} %`, factor: Math.round(cert * 100) / 100 });

  const r = cfg.reputation;
  if (i.ratings.length >= r.minReviews) {
    const avg = i.ratings.reduce((a, b) => a + b, 0) / i.ratings.length;
    const avgTxt = avg.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    if (avg >= r.goodAvg) factors.push({ key: "avis", label: `Avis ${avgTxt}/5`, factor: r.goodFactor });
    else if (avg < r.badAvg) factors.push({ key: "avis", label: `Avis ${avgTxt}/5`, factor: r.badFactor });
  }

  const raw = factors.reduce((m, f) => m * f.factor, 1);
  const multiplier = Math.min(cfg.bounds.max, Math.max(cfg.bounds.min, raw));

  // Le participant touche la même part du prix quel que soit le calcul :
  // la part de son palier.
  const share = t.participantPayCents / (t.baseCredits * cfg.creditValueCents);

  if (i.overrideCredits && i.overrideCredits > 0) {
    const priceCents = i.overrideCredits * cfg.creditValueCents;
    const pay = round5(priceCents * share);
    return {
      tier: i.tier, credits: i.overrideCredits, priceCents, participantPayCents: pay, marginCents: priceCents - pay,
      factors: [{ key: "manuel", label: "Prix fixé par l'équipe", factor: 1 }], multiplier: 1, overridden: true,
    };
  }

  const credits = Math.max(1, Math.round(t.baseCredits * multiplier));
  const priceCents = credits * cfg.creditValueCents;
  const pay = round5(t.participantPayCents * multiplier);
  return {
    tier: i.tier, credits, priceCents, participantPayCents: pay, marginCents: priceCents - pay,
    factors, multiplier: Math.round(multiplier * 100) / 100, overridden: false,
  };
}

export const factorText = (f: PriceFactor) => `${f.label} ${fmt(f.factor)}`;
