import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import {
  GHOST_FILE_MODEL,
  buildGhostFilePrompt,
  parseGhostFile,
  type GhostFileInput,
} from "./ghostFilePrompt";
import { textFromMessage, MAX_TOKENS_JSON } from "@/lib/anthropic/text";

export { GHOST_FILE_MODEL, normalizeTag } from "./ghostFilePrompt";

export type GhostFileResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "no_api_key" | "generation_failed" };

// Les champs dont le prompt a besoin — partagés avec le chemin HTTPS.
export const GHOST_FILE_SELECT = {
  firstName: true, lastName: true, city: true, gender: true, dateOfBirth: true,
  employmentStatus: true, educationLevel: true, selfProfileType: true,
  macroUniverses: true, brandAffinities: true, engagementTypes: true,
  behavioralChecklist: true, adaptiveAnswers: true, expertAnswers: true,
  screenerAnswers: true, followerRange: true, instagramUrl: true,
  linkedinUrl: true, cvAnalysis: true,
} as const;

/**
 * Génère (ou régénère) le ghost file d'un participant : scores internes,
 * tags de recherche invisibles, et `brandSummary` visible par les marques.
 *
 * Appelée directement côté serveur — jamais via un fetch vers notre propre API,
 * qui serait intercepté par `proxy.ts` et redirigé vers /login.
 */
export async function generateGhostFile(profileId: string): Promise<GhostFileResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[ghostFile] ANTHROPIC_API_KEY absente — génération ignorée");
    return { ok: false, reason: "no_api_key" };
  }

  const profile = await prisma.participantProfile.findUnique({
    where: { id: profileId },
    select: GHOST_FILE_SELECT,
  });
  if (!profile) return { ok: false, reason: "not_found" };

  await prisma.participantGhostFile.upsert({
    where: { participantProfileId: profileId },
    create: { participantProfileId: profileId, processingStatus: "processing", aiProfileSummary: "" },
    update: { processingStatus: "processing" },
  });

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: GHOST_FILE_MODEL,
      max_tokens: MAX_TOKENS_JSON,
      messages: [{
        role: "user",
        content: buildGhostFilePrompt({
          ...profile,
          adaptiveAnswers: profile.adaptiveAnswers as Record<string, string> | null,
          expertAnswers: profile.expertAnswers as Record<string, string> | null,
          screenerAnswers: profile.screenerAnswers as Record<string, string> | null,
        } satisfies GhostFileInput),
      }],
    });

    const raw = textFromMessage(message);
    const parsed = parseGhostFile(raw);

    // brandSummary → PROFIL (visible marques) ; le reste → ghost file (interne)
    const { brandSummary, ...ghost } = parsed;

    await prisma.participantGhostFile.upsert({
      where: { participantProfileId: profileId },
      create: { participantProfileId: profileId, processingStatus: "done", aiModelUsed: GHOST_FILE_MODEL, ...ghost },
      update: { processingStatus: "done", aiModelUsed: GHOST_FILE_MODEL, ...ghost },
    });

    if (brandSummary) {
      await prisma.participantProfile.update({ where: { id: profileId }, data: { brandSummary } });
    }

    return { ok: true };
  } catch (err) {
    await prisma.participantGhostFile.upsert({
      where: { participantProfileId: profileId },
      create: { participantProfileId: profileId, processingStatus: "error", aiProfileSummary: "" },
      update: { processingStatus: "error" },
    });
    console.error("[ghostFile] génération échouée pour", profileId, err);
    return { ok: false, reason: "generation_failed" };
  }
}
