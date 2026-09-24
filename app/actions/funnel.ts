"use server";

import { after } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeScore, levelFromScore } from "@/lib/onboarding/scoring";
import type { OnboardingState } from "@/lib/onboarding/types";
import { FUNNEL_LAST_STEP } from "@/lib/onboarding/types";
import { generateGhostFile } from "@/lib/participants/ghostFile";
import { analyzeLinks, type LinkInput } from "@/lib/participants/links";
import { appUrl } from "@/lib/appUrl";

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
      emailRedirectTo: `${appUrl()}/auth/callback`,
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

// Ancienne auto-identification, déduite des nouvelles réponses : le moteur de
// recherche et l'admin s'appuient encore dessus.
function legacyProfileType(s: Partial<OnboardingState>): string | null {
  if (s.segment === "pro") return "industry_insider";
  const t = s.selfTraits ?? {};
  const top = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return s.segment ? "advanced_consumer" : null;
  if (top[0] === "early_adopter") return "early_adopter";
  if (top[0] === "maven" || top[0] === "sharer") return "tastemaker";
  if (top[0] === "collector" || top[0] === "thrifter") return "collector_reseller";
  return "advanced_consumer";
}

// Champs du tunnel → colonnes du profil. Partagé par la sauvegarde progressive
// et par la finalisation, pour qu'aucune réponse ne puisse être perdue.
function profileDataFromState(s: Partial<OnboardingState>) {
  const text = (v: string | undefined) => (v !== undefined ? v.trim() || null : undefined);
  return {
    ...(s.firstName ? { firstName: s.firstName.trim() } : {}),
    ...(s.lastName ? { lastName: s.lastName.trim() } : {}),
    ...(s.dateOfBirth ? { dateOfBirth: new Date(s.dateOfBirth) } : {}),
    ...(s.gender !== undefined ? { gender: s.gender || null } : {}),
    ...(s.city !== undefined ? { city: text(s.city) } : {}),
    ...(s.country ? { country: s.country } : {}),
    ...(s.segment !== undefined ? { segment: s.segment || null } : {}),
    ...(s.proRole !== undefined ? { proRole: text(s.proRole) } : {}),
    ...(s.proSector !== undefined ? { proSector: text(s.proSector) } : {}),
    ...(s.proYears !== undefined ? { proYears: text(s.proYears) } : {}),
    ...(s.proCompany !== undefined ? { proCompany: text(s.proCompany) } : {}),
    ...(s.proRole ? { profession: s.proRole.trim() } : {}),
    ...(s.selfTraits !== undefined ? {
      selfTraits: s.selfTraits,
      isEarlyAdopter: (s.selfTraits.early_adopter ?? 0) >= 2,
      selfProfileType: legacyProfileType(s),
    } : {}),
    ...(s.traitProofs !== undefined ? { traitProofs: s.traitProofs } : {}),
    ...(s.employmentStatus !== undefined ? { employmentStatus: s.employmentStatus || null } : {}),
    ...(s.educationLevel !== undefined ? { educationLevel: s.educationLevel || null } : {}),
    ...(s.householdIncome !== undefined ? { householdIncome: s.householdIncome || null } : {}),
    ...(s.ethnicity !== undefined ? { ethnicity: s.ethnicity || null } : {}),
    ...(s.macroUniverses !== undefined ? { macroUniverses: s.macroUniverses } : {}),
    ...(s.brandAffinities !== undefined ? { brandAffinities: s.brandAffinities } : {}),
    ...(s.engagementTypes !== undefined ? { engagementTypes: s.engagementTypes } : {}),
    ...(s.behavioralChecklist !== undefined ? { behavioralChecklist: s.behavioralChecklist } : {}),
    ...(s.adaptiveAnswers !== undefined ? { adaptiveAnswers: s.adaptiveAnswers } : {}),
    ...(s.expertAnswers !== undefined ? { expertAnswers: s.expertAnswers } : {}),
    ...(s.linkedinUrl !== undefined ? { linkedinUrl: s.linkedinUrl || null } : {}),
    ...(s.cvUrl !== undefined ? { cvUrl: s.cvUrl || null } : {}),
    ...(s.portfolioUrl !== undefined ? { portfolioUrl: s.portfolioUrl || null } : {}),
    ...(s.instagramUrl !== undefined ? { instagramUrl: s.instagramUrl || null } : {}),
    ...(s.tiktokUrl !== undefined ? { tiktokUrl: s.tiktokUrl || null } : {}),
    ...(s.websiteUrl !== undefined ? { websiteUrl: s.websiteUrl || null } : {}),
    ...(s.otherLinks !== undefined ? { otherLinks: s.otherLinks.filter(Boolean) } : {}),
    ...(s.availability !== undefined ? { availability: s.availability } : {}),
    ...(s.preferredFormat !== undefined ? { preferredFormat: s.preferredFormat || null } : {}),
    ...(s.interviewLanguages !== undefined ? { interviewLanguages: s.interviewLanguages } : {}),
    ...(s.rewardPreference !== undefined ? { rewardPreference: s.rewardPreference || null } : {}),
  };
}

// Résout le profil participant de l'utilisateur connecté.
async function currentProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { participantProfile: { select: { id: true } } },
  });
  return dbUser?.participantProfile?.id ?? null;
}

// ── Reprise : compte créé par Google ou LinkedIn ─────────────────────
// Après une connexion sociale, la personne arrive dans le tunnel avec une
// session mais sans mot de passe à saisir : on le lui dit, et on reprend là
// où elle en était.
export async function funnelSession(): Promise<
  | { signedIn: false }
  | { signedIn: true; email: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; city: string; step: number; complete: boolean }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false };
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      email: true,
      participantProfile: {
        select: { firstName: true, lastName: true, dateOfBirth: true, gender: true, city: true, onboardingStep: true, onboardingStatus: true },
      },
    },
  });
  const p = dbUser?.participantProfile;
  if (!dbUser || !p) return { signedIn: false };
  return {
    signedIn: true,
    email: dbUser.email,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth?.toISOString().slice(0, 10) ?? "",
    gender: p.gender ?? "",
    city: p.city ?? "",
    step: p.onboardingStep,
    complete: p.onboardingStatus === "complete",
  };
}

// ── Sauvegarde progressive ───────────────────────────────────────────
export async function saveFunnelStep(step: number, s: Partial<OnboardingState>): Promise<{ ok: true } | { error: string }> {
  const profileId = await currentProfileId();
  if (!profileId) return { error: "Non authentifié." };

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: { onboardingStep: step, ...profileDataFromState(s) },
  });
  return { ok: true };
}

// ── Finalisation ─────────────────────────────────────────────────────
export async function completeFunnel(fullState: OnboardingState): Promise<{ ok: true } | { error: string }> {
  const profileId = await currentProfileId();
  if (!profileId) return { error: "Non authentifié." };

  // Le score reste calculé côté serveur à partir de l'état complet : la valeur
  // affichée dans le tunnel n'est qu'un indicateur, elle ne fait pas autorité.
  const score = computeScore(fullState);
  const level = levelFromScore(score);

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: {
      ...profileDataFromState(fullState),
      onboardingStep: FUNNEL_LAST_STEP,
      onboardingStatus: "complete",
      agreedToCodeOfConduct: fullState.agreedToCodeOfConduct,
      profileScore: score,
      profileLevel: level,
    },
  });

  // Ghost file : appel direct, après l'envoi de la réponse. Surtout PAS un fetch
  // vers notre propre API — `proxy.ts` le redirigerait vers /login (aucun cookie
  // sur un appel serveur→serveur) et le ghost file ne serait jamais généré.
  after(async () => {
    // Des liens donnés mais jamais lus (la personne n'a pas lancé la lecture) :
    // on les lit avant l'analyse, qui s'appuie dessus pour confirmer les médailles.
    const p = await prisma.participantProfile.findUnique({
      where: { id: profileId },
      select: {
        firstName: true, lastName: true, segment: true, proRole: true, selfTraits: true, linksAnalysis: true,
        linkedinUrl: true, instagramUrl: true, tiktokUrl: true, websiteUrl: true, otherLinks: true,
      },
    });
    if (p && !p.linksAnalysis) {
      const links: LinkInput[] = [
        ...(["linkedin", "instagram", "tiktok", "website"] as const)
          .map((kind) => ({ kind, url: p[`${kind}Url`] ?? "" })),
        ...p.otherLinks.map((url) => ({ kind: "other" as const, url })),
      ].filter((l) => l.url);
      if (links.length) {
        const traits = (p.selfTraits ?? {}) as Record<string, number>;
        const analysis = await analyzeLinks(links, {
          name: `${p.firstName} ${p.lastName}`.trim(), segment: p.segment, proRole: p.proRole,
          claims: Object.keys(traits).filter((k) => traits[k] >= 2),
        });
        await prisma.participantProfile.update({ where: { id: profileId }, data: { linksAnalysis: analysis } });
      }
    }
    await generateGhostFile(profileId);
  });

  return { ok: true };
}
