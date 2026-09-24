import type { OnboardingState, ProfileLevel } from "./types";
import { PROOF_MIN, TRAIT_CLAIMED, isPro } from "./questions";

// Score interne (non montré à l'utilisateur) → niveau de profil.
// Il récompense ce qui se vérifie — une preuve, un lien, un parcours précis —
// plus que ce qui se déclare.
export function computeScore(s: Partial<OnboardingState>): number {
  let pts = 0;

  if (s.firstName && s.lastName && s.dateOfBirth && s.city) pts += 15;

  // Parcours pro renseigné
  if (isPro(s.segment) && s.proRole && s.proSector && s.proYears) pts += 10;

  if ((s.macroUniverses?.length ?? 0) > 0) pts += 5;
  if ((s.brandAffinities?.length ?? 0) > 0) pts += 5;

  // Une déclaration appuyée d'une preuve vaut ; seule, elle ne vaut rien.
  const traits = s.selfTraits ?? {};
  const proofs = s.traitProofs ?? {};
  const proven = Object.keys(traits).filter(
    (k) => (traits[k] ?? 0) >= TRAIT_CLAIMED && (proofs[k] ?? "").trim().length >= PROOF_MIN
  ).length;
  pts += Math.min(proven * 6, 24);

  pts += Math.min((s.behavioralChecklist?.length ?? 0) * 3, 18);

  const voice = Object.values(s.expertAnswers ?? {}).filter((v) => v && v.trim().length >= 40);
  pts += Math.min(voice.length * 7, 21);

  // Liens publics : l'IA peut les lire
  if (s.linkedinUrl) pts += 12;
  if (s.websiteUrl || s.portfolioUrl) pts += 12;
  if (s.instagramUrl || s.tiktokUrl) pts += 6;
  if (s.cvUrl) pts += 8;

  return pts;
}

export function levelFromScore(score: number): ProfileLevel {
  if (score >= 100) return "platine";
  if (score >= 75) return "gold";
  if (score >= 45) return "silver";
  return "bronze";
}

export const LEVEL_META: Record<ProfileLevel, { label: string; icon: string; color: string; next: number | null }> = {
  bronze:  { label: "Bronze",  icon: "🥉", color: "#CD7F32", next: 45 },
  silver:  { label: "Argent",  icon: "🥈", color: "#9E9E9E", next: 75 },
  gold:    { label: "Or",      icon: "🥇", color: "#D4AF37", next: 100 },
  platine: { label: "Platine", icon: "💎", color: "#6A5ACD", next: null },
};
