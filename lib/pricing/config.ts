// Réglages du moteur de prix. Les valeurs ci-dessous sont celles par défaut ;
// l'admin les modifie depuis /admin/prix, et la version enregistrée en base
// (table pricing_config) prime.
//
// Repères de marché (septembre 2026) : un appel via un réseau d'experts coûte
// ~1 000 à 1 200 € au client pour 300 à 500 € reversés à l'expert ; un
// institut facture ~500 € (B2C) à 750 € (B2B) le seul recrutement. Maze et
// User Interviews font payer plus cher un profil professionnel qu'un
// consommateur. D'où trois paliers et une marge brute visée d'environ 75 %.

export type Tier = "averti" | "initie" | "rare";

export const TIERS: Tier[] = ["averti", "initie", "rare"];

export type PricingConfig = {
  /** Valeur d'un crédit, en centimes HT. */
  creditValueCents: number;
  tiers: Record<Tier, { label: string; baseCredits: number; participantPayCents: number; who: string }>;
  /** Coefficient de durée : le premier palier dont `upTo` couvre la durée. */
  duration: { upTo: number; factor: number }[];
  /** Un participant de focus group coûte moins qu'un entretien seul. */
  focusGroupFactor: number;
  /** Demande : bonus par marque qui a retenu le profil sur 90 jours, et par présélection. */
  demand: { perBrand: number; perShortlist: number; max: number };
  /** Rareté : moins il existe de profils comparables, plus le coefficient monte. */
  scarcity: { minPeers: number; factor: number }[];
  /** En dessous de cette taille de panel, la rareté ne veut rien dire : pas de coefficient. */
  scarcityMinPanel: number;
  /** Bonus maximal pour un profil certifié à 100 %. */
  certificationMaxBonus: number;
  reputation: { minReviews: number; goodAvg: number; goodFactor: number; badAvg: number; badFactor: number };
  /** Bornes du coefficient total. */
  bounds: { min: number; max: number };
  /** Packs vendus aux marques. */
  packs: { id: string; label: string; credits: number; priceCents: number; note: string }[];
};

export const DEFAULT_PRICING: PricingConfig = {
  creditValueCents: 1000,
  tiers: {
    averti: { label: "Client·e averti·e", baseCredits: 39, participantPayCents: 9000, who: "Consommateurs passionnés, chineurs, collectionneurs" },
    initie: { label: "Initié·e", baseCredits: 69, participantPayCents: 18000, who: "Vendeurs en maison, stylistes, acheteurs, visual merchandisers" },
    rare: { label: "Rare", baseCredits: 130, participantPayCents: 35000, who: "Directions artistiques, clientes très importantes, collectionneurs reconnus" },
  },
  duration: [
    { upTo: 30, factor: 0.8 },
    { upTo: 45, factor: 1 },
    { upTo: 60, factor: 1.25 },
    { upTo: 999, factor: 1.6 },
  ],
  focusGroupFactor: 0.6,
  demand: { perBrand: 0.05, perShortlist: 0.02, max: 0.2 },
  scarcity: [
    { minPeers: 30, factor: 1 },
    { minPeers: 10, factor: 1.08 },
    { minPeers: 3, factor: 1.15 },
    { minPeers: 0, factor: 1.25 },
  ],
  scarcityMinPanel: 50,
  certificationMaxBonus: 0.25,
  reputation: { minReviews: 2, goodAvg: 4.5, goodFactor: 1.08, badAvg: 3.5, badFactor: 0.9 },
  bounds: { min: 0.8, max: 1.6 },
  packs: [
    { id: "decouverte", label: "Découverte", credits: 40, priceCents: 40000, note: "Un premier entretien, sans engagement" },
    { id: "studio", label: "Studio", credits: 150, priceCents: 135000, note: "−10 % · une petite étude" },
    { id: "maison", label: "Maison", credits: 400, priceCents: 320000, note: "−20 % · plusieurs études" },
    { id: "grande-maison", label: "Grande maison", credits: 1000, priceCents: 700000, note: "−30 % · l'année" },
  ],
};

/** Fusionne une configuration enregistrée (éventuellement partielle) avec les défauts. */
export function mergePricing(saved: unknown): PricingConfig {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<PricingConfig>;
  return {
    ...DEFAULT_PRICING,
    ...s,
    tiers: {
      averti: { ...DEFAULT_PRICING.tiers.averti, ...(s.tiers?.averti ?? {}) },
      initie: { ...DEFAULT_PRICING.tiers.initie, ...(s.tiers?.initie ?? {}) },
      rare: { ...DEFAULT_PRICING.tiers.rare, ...(s.tiers?.rare ?? {}) },
    },
    demand: { ...DEFAULT_PRICING.demand, ...(s.demand ?? {}) },
    reputation: { ...DEFAULT_PRICING.reputation, ...(s.reputation ?? {}) },
    bounds: { ...DEFAULT_PRICING.bounds, ...(s.bounds ?? {}) },
    duration: s.duration?.length ? s.duration : DEFAULT_PRICING.duration,
    scarcity: s.scarcity?.length ? s.scarcity : DEFAULT_PRICING.scarcity,
    packs: s.packs?.length ? s.packs : DEFAULT_PRICING.packs,
  };
}

export const eur = (cents: number) =>
  `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: cents % 100 ? 2 : 0 })} €`;
