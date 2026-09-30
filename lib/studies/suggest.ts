import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { extractJsonObject, textFromMessage } from "@/lib/anthropic/text";

// Dès qu'un brief arrive : Claude compare la demande aux fiches du panel et
// présélectionne jusqu'à 8 profils, chacun avec une phrase « pourquoi ce
// profil ». Ils arrivent chez l'admin en « suggestion » (candidature SUGGESTED) :
// un clic les propose à la marque, un autre les écarte. Rien n'est montré à la
// marque sans validation humaine.

const MAX = 8;

type Pick = { id: string; score: number; why: string };

export async function suggestProfiles(studyId: string): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) return 0;
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { title: true, objective: true, brief: true, targetCriteria: true, exclusionCriteria: true, preferredLanguage: true, applications: { select: { participantProfileId: true } } },
  });
  if (!study) return 0;
  const taken = new Set(study.applications.map((a) => a.participantProfileId));
  const panel = await prisma.participantProfile.findMany({
    where: { isBlacklisted: false, onboardingStatus: "complete" },
    select: {
      id: true, firstName: true, lastName: true, city: true, country: true, profession: true, yearsOfExperience: true, languages: true,
      followerRange: true, isEarlyAdopter: true, brandAffinities: true, interests: true, dateOfBirth: true,
      ghostFile: { select: { profileType: true, primaryExpertise: true, secondaryExpertises: true, generationTag: true, influenceTier: true, aiTags: true, aiProfileSummary: true, overallQualityScore: true } },
    },
    take: 300,
  });
  const candidates = panel.filter((p) => !taken.has(p.id));
  if (!candidates.length) return 0;

  const year = new Date().getFullYear();
  const lines = candidates.map((p) => {
    const g = p.ghostFile;
    const age = p.dateOfBirth ? year - p.dateOfBirth.getFullYear() : null;
    return [
      `id=${p.id}`, `${p.firstName} ${p.lastName.slice(0, 1)}.`, age ? `${age} ans` : "", p.city ?? "", p.profession ?? "",
      p.yearsOfExperience ? `${p.yearsOfExperience} ans d'expérience` : "", p.languages?.length ? `langues ${p.languages.join("/")}` : "",
      p.followerRange && p.followerRange !== "0" ? `abonnés ${p.followerRange}` : "", p.isEarlyAdopter ? "early adopter" : "",
      g?.profileType ?? "", g?.primaryExpertise ?? "", g?.secondaryExpertises?.join("/") ?? "", g?.generationTag ?? "",
      g?.aiTags?.slice(0, 12).join(", ") ?? "", p.brandAffinities?.slice(0, 8).join(", ") ?? "",
      g?.aiProfileSummary ? `« ${g.aiProfileSummary.slice(0, 280)} »` : "",
    ].filter(Boolean).join(" | ");
  });

  const criteria = study.targetCriteria as { custom?: string; cities?: string[]; ageMin?: number; ageMax?: number } | null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    system: "Tu es le recruteur de Rarelyst, service de recrutement pour études qualitatives mode, luxe et beauté. Tu choisis dans le panel les personnes qui répondent vraiment au brief. Tu es exigeant : mieux vaut 3 profils justes que 8 approximatifs. Tu n'inventes rien sur les personnes. Réponds uniquement en JSON.",
    messages: [{ role: "user", content: `ÉTUDE : ${study.title}
OBJECTIF : ${study.objective}
${study.brief ? `BRIEF DE LA MARQUE :\n${study.brief.slice(0, 3000)}\n` : ""}PROFILS DEMANDÉS :
${criteria?.custom ?? "Non précisés."}
${criteria?.cities?.length ? `VILLES : ${criteria.cities.join(", ")}\n` : ""}${criteria?.ageMin || criteria?.ageMax ? `ÂGE : ${criteria.ageMin ?? "?"}-${criteria.ageMax ?? "?"}\n` : ""}${study.exclusionCriteria ? `EXCLUSIONS : ${JSON.stringify(study.exclusionCriteria)}\n` : ""}LANGUE DE L'ENTRETIEN : ${study.preferredLanguage}

PANEL (une personne par ligne) :
${lines.join("\n")}

Choisis jusqu'à ${MAX} personnes pertinentes (aucune si personne ne correspond). Pour chacune : un score de 1 à 10, et « why » : une phrase concrète, destinée à la marque, qui dit pourquoi cette personne répond au brief, à partir de ce que dit sa fiche.
Format : {"picks":[{"id":"...","score":8,"why":"..."}]}` }],
  }).finalMessage();

  let picks: Pick[] = [];
  try {
    picks = (JSON.parse(extractJsonObject(textFromMessage(msg))) as { picks?: Pick[] }).picks ?? [];
  } catch {
    return 0;
  }
  const valid = new Set(candidates.map((c) => c.id));
  let created = 0;
  for (const p of picks.filter((x) => valid.has(x.id)).slice(0, MAX)) {
    await prisma.application.upsert({
      where: { studyId_participantProfileId: { studyId, participantProfileId: p.id } },
      create: { studyId, participantProfileId: p.id, status: "SUGGESTED", adminScore: Math.max(1, Math.min(10, Math.round(p.score))), adminMatchNote: String(p.why).slice(0, 500) },
      update: {},
    });
    created++;
  }
  return created;
}
