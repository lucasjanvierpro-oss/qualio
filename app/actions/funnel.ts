"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeScore, levelFromScore } from "@/lib/onboarding/scoring";
import type { OnboardingState } from "@/lib/onboarding/types";

type AccountInput = {
  firstName: string; lastName: string; email: string; password: string;
  dateOfBirth: string; gender: string; city: string; country: string;
};

// ── Étape 0 : création du compte + profil ────────────────────────────
export async function createFunnelAccount(input: AccountInput): Promise<{ ok: true } | { error: string }> {
  const { email, password, firstName, lastName, dateOfBirth, gender, city, country } = input;
  if (!email || !password || password.length < 8) return { error: "Email et mot de passe (8 caractères min) requis." };
  if (!firstName.trim() || !lastName.trim() || !dateOfBirth) return { error: "Prénom, nom et date de naissance requis." };

  // Validation 18+
  const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 18) return { error: "Vous devez avoir 18 ans ou plus." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { role: "PARTICIPANT" },
    },
  });
  if (authError) {
    if (authError.message.includes("already registered")) return { error: "Un compte existe déjà avec cet email. Connectez-vous." };
    return { error: authError.message ?? "Erreur lors de la création du compte." };
  }
  if (!authData.user) return { error: "Erreur lors de la création du compte." };

  // Auto-confirm (V1) puis session
  const service = await createServiceClient();
  await service.auth.admin.updateUserById(authData.user.id, { email_confirm: true });

  try {
    await prisma.user.create({
      data: {
        email,
        role: "PARTICIPANT",
        supabaseId: authData.user.id,
        participantProfile: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: new Date(dateOfBirth),
            gender: gender || null,
            city: city.trim() || null,
            country: country || "FR",
            onboardingStep: 1,
            onboardingStatus: "incomplete",
          },
        },
      },
    });
  } catch {
    // profil déjà existant — on continue
  }

  // Établit la session pour la suite du tunnel
  await supabase.auth.signInWithPassword({ email, password });
  return { ok: true };
}

// ── Sauvegarde progressive ───────────────────────────────────────────
export async function saveFunnelStep(step: number, s: Partial<OnboardingState>): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true } } },
  });
  if (!dbUser?.participantProfile) return { error: "Profil introuvable." };

  await prisma.participantProfile.update({
    where: { id: dbUser.participantProfile.id },
    data: {
      onboardingStep: step,
      ...(s.employmentStatus !== undefined ? { employmentStatus: s.employmentStatus || null } : {}),
      ...(s.educationLevel !== undefined ? { educationLevel: s.educationLevel || null } : {}),
      ...(s.householdIncome !== undefined ? { householdIncome: s.householdIncome || null } : {}),
      ...(s.ethnicity !== undefined ? { ethnicity: s.ethnicity || null } : {}),
      ...(s.macroUniverses !== undefined ? { macroUniverses: s.macroUniverses } : {}),
      ...(s.brandAffinities !== undefined ? { brandAffinities: s.brandAffinities } : {}),
      ...(s.engagementTypes !== undefined ? { engagementTypes: s.engagementTypes } : {}),
      ...(s.selfProfileType !== undefined ? { selfProfileType: s.selfProfileType || null } : {}),
      ...(s.behavioralChecklist !== undefined ? { behavioralChecklist: s.behavioralChecklist } : {}),
      ...(s.adaptiveAnswers !== undefined ? { adaptiveAnswers: s.adaptiveAnswers } : {}),
      ...(s.expertAnswers !== undefined ? { expertAnswers: s.expertAnswers } : {}),
      ...(s.linkedinUrl !== undefined ? { linkedinUrl: s.linkedinUrl || null } : {}),
      ...(s.cvUrl !== undefined ? { cvUrl: s.cvUrl || null } : {}),
      ...(s.portfolioUrl !== undefined ? { portfolioUrl: s.portfolioUrl || null } : {}),
      ...(s.instagramUrl !== undefined ? { instagramUrl: s.instagramUrl || null } : {}),
      ...(s.availability !== undefined ? { availability: s.availability } : {}),
      ...(s.preferredFormat !== undefined ? { preferredFormat: s.preferredFormat || null } : {}),
      ...(s.interviewLanguages !== undefined ? { interviewLanguages: s.interviewLanguages } : {}),
      ...(s.rewardPreference !== undefined ? { rewardPreference: s.rewardPreference || null } : {}),
    },
  });
  return { ok: true };
}

// ── Finalisation (Étape 8) ───────────────────────────────────────────
export async function completeFunnel(fullState: OnboardingState): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true } } },
  });
  if (!dbUser?.participantProfile) return { error: "Profil introuvable." };
  const profileId = dbUser.participantProfile.id;

  const score = computeScore(fullState);
  const level = levelFromScore(score);

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: {
      onboardingStep: 8,
      onboardingStatus: "complete",
      agreedToCodeOfConduct: fullState.agreedToCodeOfConduct,
      profileScore: score,
      profileLevel: level,
    },
  });

  // Ghost file en arrière-plan (non bloquant)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/participants/${profileId}/generate-ghost-file`, {
      method: "POST", headers: { "Content-Type": "application/json" },
    });
  } catch { /* non bloquant */ }

  return { ok: true, };
}
