import type { OnboardingState, ProfileLevel } from "./types";

// Score interne (non montré à l'utilisateur) → niveau de profil.
export function computeScore(s: Partial<OnboardingState>): number {
  let pts = 0;

  // Étapes 0-1 complètes
  if (s.firstName && s.lastName && s.dateOfBirth && s.city) pts += 20;

  // Univers + affinités
  if ((s.macroUniverses?.length ?? 0) > 0) pts += 5;
  if ((s.brandAffinities?.length ?? 0) > 0) pts += 5;

  // Checklist comportementale (5 pts / item, plafonné à 30)
  pts += Math.min((s.behavioralChecklist?.length ?? 0) * 5, 30);

  // Questions adaptatives remplies
  const adaptive = Object.values(s.adaptiveAnswers ?? {}).filter((v) => v && v.trim().length > 20);
  if (adaptive.length > 0) pts += 15;

  // Questions expertes remplies
  const expert = Object.values(s.expertAnswers ?? {}).filter((v) => v && v.trim().length >= 40);
  pts += Math.min(expert.length * 7, 20);

  // Badges optionnels
  if (s.linkedinUrl) pts += 20;
  if (s.cvUrl) pts += 15;
  if (s.portfolioUrl) pts += 25;
  if (s.instagramUrl) pts += 10;

  return pts;
}

export function levelFromScore(score: number): ProfileLevel {
  if (score >= 90) return "platine";
  if (score >= 70) return "gold";
  if (score >= 40) return "silver";
  return "bronze";
}

export const LEVEL_META: Record<ProfileLevel, { label: string; icon: string; color: string; next: number | null }> = {
  bronze:  { label: "Bronze",  icon: "🥉", color: "#CD7F32", next: 40 },
  silver:  { label: "Argent",  icon: "🥈", color: "#9E9E9E", next: 70 },
  gold:    { label: "Or",      icon: "🥇", color: "#D4AF37", next: 90 },
  platine: { label: "Platine", icon: "💎", color: "#6A5ACD", next: null },
};
