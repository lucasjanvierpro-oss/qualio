// Historique d'un participant tel que les marques le lisent : entretiens menés,
// présence, notes, avis et marques qui l'ont déjà interrogé.
//
// Réservé aux comptes marque. Le participant sait que ce bloc existe (sa
// propre fiche l'annonce), mais n'en voit pas le contenu : un avis ne se
// négocie pas.

import { computeBadges, computeTraits, proofsFromProfile, type EarnedBadge, type TraitState } from "./badges";

export const REVIEW_TAGS = [
  "Précis·e", "Inspirant·e", "Vocabulaire d'expert", "Franc·he",
  "Bon·ne conteur·se", "Visionnaire", "Ponctuel·le", "Bien préparé·e",
] as const;

/** Sélection Prisma commune aux pages marque qui affichent l'historique. */
export const TRUST_SELECT = {
  status: true,
  study: { select: { brandProfileId: true, brandProfile: { select: { companyName: true, logoUrl: true } } } },
  interview: {
    select: { brandRating: true, brandFeedback: true, brandReviewTags: true, brandReviewedAt: true, completedAt: true },
  },
} as const;

type TrustApp = {
  status: string;
  study: { brandProfileId: string; brandProfile: { companyName: string; logoUrl: string | null } };
  interview: {
    brandRating: number | null; brandFeedback: string | null; brandReviewTags: string[];
    brandReviewedAt: Date | null; completedAt: Date | null;
  } | null;
};

export type TrustReview = { brand: string; rating: number; comment: string | null; tags: string[]; at: string };

export type Trust = {
  interviewsDone: number;
  noShow: number;
  /** null sous trois entretiens : un taux sur un seul ne dit rien. */
  attendance: number | null;
  rating: number | null;
  ratings: number[];
  reviewCount: number;
  /** Marques qui l'ont interrogé·e, la plus récente d'abord, sans doublon. */
  brands: { name: string; logoUrl: string | null }[];
  reviews: TrustReview[];
  topTags: { tag: string; count: number }[];
};

export function trustFrom(apps: TrustApp[]): Trust {
  const done = apps.filter((a) => a.status === "COMPLETED");
  const noShow = apps.filter((a) => a.status === "NO_SHOW").length;
  const reviewed = done
    .filter((a) => a.interview?.brandRating)
    .sort((a, b) => (b.interview!.brandReviewedAt?.getTime() ?? 0) - (a.interview!.brandReviewedAt?.getTime() ?? 0));
  const ratings = reviewed.map((a) => a.interview!.brandRating!);

  const tagCount = new Map<string, number>();
  for (const a of reviewed) for (const t of a.interview!.brandReviewTags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);

  const brands: Trust["brands"] = [];
  for (const a of [...done].sort((x, y) => (y.interview?.completedAt?.getTime() ?? 0) - (x.interview?.completedAt?.getTime() ?? 0))) {
    const b = a.study.brandProfile;
    if (!brands.some((x) => x.name === b.companyName)) brands.push({ name: b.companyName, logoUrl: b.logoUrl });
  }

  return {
    interviewsDone: done.length,
    noShow,
    attendance: done.length + noShow >= 3 ? Math.round((done.length / (done.length + noShow)) * 100) : null,
    rating: ratings.length ? Math.round((ratings.reduce((x, y) => x + y, 0) / ratings.length) * 10) / 10 : null,
    ratings,
    reviewCount: ratings.length,
    brands,
    reviews: reviewed.slice(0, 3).map((a) => ({
      brand: a.study.brandProfile.companyName,
      rating: a.interview!.brandRating!,
      comment: a.interview!.brandFeedback,
      tags: a.interview!.brandReviewTags,
      at: (a.interview!.brandReviewedAt ?? a.interview!.completedAt ?? new Date()).toISOString(),
    })),
    topTags: [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag, count]) => ({ tag, count })),
  };
}

/** Sélection Prisma des champs nécessaires aux médailles et aux traits. */
export const BADGE_PROFILE_SELECT = {
  createdAt: true, segment: true, proRole: true, proYears: true, selfTraits: true, traitProofs: true,
  idVerificationStatus: true, idDocumentUrl: true, linkedinVerified: true,
  linkedinUrl: true, instagramUrl: true, tiktokUrl: true, websiteUrl: true, portfolioUrl: true,
  otherLinks: true, linksAnalysis: true, cvUrl: true, cvAnalysis: true,
  workEmail: true, workEmailVerifiedAt: true,
  accessTier: true, priceTier: true, priceOverrideCredits: true,
} as const;

type BadgeProfile = Parameters<typeof proofsFromProfile>[0] & { createdAt: Date };

export function badgesOf(
  p: BadgeProfile,
  trust: Pick<Trust, "interviewsDone" | "noShow" | "ratings">,
): EarnedBadge[] {
  return computeBadges({
    createdAt: p.createdAt,
    proofs: proofsFromProfile(p),
    interviewsDone: trust.interviewsDone,
    noShow: trust.noShow,
    ratings: trust.ratings,
  });
}

/** Traits déclarés et confirmés ; `behaviours` vaut null tant que l'IA n'a pas tourné. */
export function traitsOf(
  p: { segment: string | null; proRole: string | null; selfTraits: unknown; traitProofs: unknown },
  behaviours: string[] | null,
): TraitState[] {
  return computeTraits({
    segment: p.segment,
    proRole: p.proRole,
    selfTraits: p.selfTraits as Record<string, number> | null,
    traitProofs: p.traitProofs as Record<string, string> | null,
    behaviours,
  });
}
