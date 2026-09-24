import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParticipantProfileClient from "./ParticipantProfileClient";
import Showcase from "./Showcase";
import { TRUST_SELECT, trustFrom } from "@/lib/participants/trust";
import { BADGES, type BadgeId } from "@/lib/participants/badges";
import { priceProfiles, getPricingConfig } from "@/lib/pricing/quotes";

// Déposer un CV relance l'analyse du profil (Claude) après la réponse.
export const maxDuration = 300;

export default async function ParticipantProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        include: {
          ghostFile: { select: { behaviours: true, processingStatus: true } },
          applications: { select: TRUST_SELECT },
        },
      },
    },
  });

  const profile = dbUser?.participantProfile;
  if (!profile) redirect("/signup/participant");

  // Le participant voit toutes ses médailles et ce que chacune lui rapporte ;
  // l'historique (notes, avis, marques) reste réservé aux marques.
  const trust = trustFrom(profile.applications);
  const [pricing, cfg] = await Promise.all([priceProfiles([profile.id]), getPricingConfig()]);
  const pr = pricing.get(profile.id)!;
  const badges = pr.badges;

  // Ce que rapporterait chaque preuve manquante, au prix actuel : le bonus de
  // certification qu'elle ajoute, appliqué à la rémunération d'aujourd'hui.
  const bonus = (score: number) => 1 + cfg.certificationMaxBonus * Math.min(100, score) / 100;
  const gains: Partial<Record<BadgeId, number>> = {};
  for (const b of badges) {
    const w = BADGES[b.id].weight;
    if (b.state === "earned" || !w) continue;
    const g = pr.quote.participantPayCents * (bonus(pr.certScore + w) / bonus(pr.certScore) - 1);
    gains[b.id] = Math.max(500, Math.round(g / 500) * 500);
  }

  return (
    <>
    <Showcase
      badges={badges}
      traits={pr.traits}
      certScore={pr.certScore}
      payCents={pr.quote.participantPayCents}
      tierLabel={cfg.tiers[pr.quote.tier].label}
      gains={gains}
      interviewsDone={trust.interviewsDone}
      links={{ linkedin: profile.linkedinUrl ?? "", instagram: profile.instagramUrl ?? "", tiktok: profile.tiktokUrl ?? "", website: profile.websiteUrl ?? "" }}
    />
    <ParticipantProfileClient
      profile={{
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth?.toISOString().split("T")[0] ?? "",
        city: profile.city ?? "",
        country: profile.country,
        profession: profile.profession ?? "",
        bio: profile.bio ?? "",
        interests: profile.interests,
        brandAffinities: profile.brandAffinities,
        linkedinUrl: profile.linkedinUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        tiktokUrl: profile.tiktokUrl ?? "",
        idVerificationStatus: profile.idVerificationStatus,
        stripeConnectStatus: profile.stripeConnectStatus,
      }}
    />
    </>
  );
}
