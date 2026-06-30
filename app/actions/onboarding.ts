"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { OnboardingData } from "@/app/participant/onboarding/page";

export async function saveOnboardingProfile(data: OnboardingData) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: true },
  });
  if (!dbUser?.participantProfile) throw new Error("Participant profile not found");

  const profileId = dbUser.participantProfile.id;

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      city: data.city.trim() || null,
      country: data.country || "FR",
      profession: data.profession.trim() || null,
      yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null,

      professionalBio: data.professionalBio.trim() || null,

      shoppingBudgetRange: data.shoppingBudgetRange || null,
      shoppingChannels: data.shoppingChannels
        ? data.shoppingChannels.split(",").map((s) => s.trim()).filter(Boolean)
        : [],

      followerRange: data.followerRange || null,
      instagramUrl: data.instagramUrl.trim() || null,
      tiktokUrl: data.tiktokUrl.trim() || null,
      linkedinUrl: data.linkedinUrl.trim() || null,

      availability: data.availability,

      screenerAnswers: {
        careerPath: data.careerPath,
        styleRelationship: data.styleRelationship,
        shoppingChannels: data.shoppingChannels,
        expertise: data.expertise,
        marketVision: data.marketVision,
        lastPurchase: data.lastPurchase,
        socialDescription: data.socialDescription,
      },
    },
  });

  // Déclencher la génération du ghost file en arrière-plan
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/participants/${profileId}/generate-ghost-file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Non-bloquant — l'onboarding reste fonctionnel même si la génération échoue
  }
}
