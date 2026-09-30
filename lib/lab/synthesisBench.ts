import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { extractJsonObject, textFromMessage } from "@/lib/anthropic/text";
import { buildUserMessage, generateReport } from "@/lib/reports/generate";
import { checkAndRepairQuotes } from "@/lib/reports/quality";
import type { BriefDraft } from "@/lib/studies/briefTypes";
import type { LabBrand } from "@/lib/lab/simulate";

// Banc d'essai de la synthèse, dans le labo. À partir d'une marque simulée et
// de son brief : quatre entretiens inventés (avec de vrais désaccords), la
// synthèse produite par le même moteur que pour les vraies études, le contrôle
// des citations, puis la marque elle-même qui juge si le document lui sert.
// C'est ce qui permet d'améliorer la synthèse sans attendre de vrais clients.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-5";

type Interview = { profil: string; transcript: string };
export type BenchCritique = {
  note: number;
  verdict: string;
  utile: string[];
  generique: string[];
  manque: string[];
  aCorriger: string[];
};
export type BenchResult = {
  createdAt: string;
  interviews: Interview[];
  report: Record<string, unknown>;
  quality: { citations: number; verifiees: number; corrigees: number; retirees: number; questions: number; repondues: number };
  critique: BenchCritique | null;
};

async function askJson<T>(system: string, prompt: string, maxTokens: number): Promise<T> {
  const msg = await anthropic.messages.create({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] });
  return JSON.parse(extractJsonObject(textFromMessage(msg))) as T;
}

export async function runSynthesisBench(runId: string): Promise<{ ok: true } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Clé Anthropic absente." };
  const run = await prisma.labRun.findUnique({ where: { id: runId } });
  if (!run || run.status !== "done") return { error: "Simulation introuvable." };
  const brand = run.brand as unknown as LabBrand;
  const draft = (run.draft ?? {}) as unknown as Partial<BriefDraft>;
  const profiles = (draft.profiles ?? []).map((p) => p.label).filter(Boolean);
  const guide = draft.guide?.length ? draft.guide : ["Parlez-moi de votre rapport à la marque.", "Qu'attendez-vous d'elle ?", "Qu'est-ce qui vous ferait changer d'avis ?"];
  const decisions = draft.decisions ?? [];

  try {
    // 1. Quatre entretiens, comme de vraies transcriptions.
    const { interviews } = await askJson<{ interviews: Interview[] }>(
      "Tu écris des transcriptions réalistes d'entretiens qualitatifs de 20 minutes, en français, pour tester un outil de synthèse. Chaque participant a sa voix, ses hésitations, ses exemples concrets, ses contradictions. Les avis divergent vraiment entre participants : au moins un est en désaccord net avec les autres sur une des décisions. Format de chaque transcription : lignes « Intervieweur : … » et « Participant : … ». Réponds uniquement en JSON.",
      `MARQUE : ${brand.name}, ${brand.sector}, ${brand.positioning}, ${brand.priceRange}. Clientèle : ${brand.clientele}.
SITUATION : ${brand.situation}
DÉCISIONS À TRANCHER :
${decisions.map((d, i) => `${i + 1}. ${d}`).join("\n") || "Non précisées."}
PROFILS À INTERROGER : ${profiles.join(" · ") || brand.clientele}
GUIDE D'ENTRETIEN :
${guide.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Écris 4 entretiens (400 à 600 mots chacun), avec des participants variés parmi ces profils.
Format : {"interviews": [{"profil": "Acheteuse luxe, 34 ans", "transcript": "Intervieweur : …\\nParticipant : …"}]}`,
      12000,
    );
    if (!interviews?.length) return { error: "Les entretiens simulés n'ont pas pu être écrits." };

    // 2. La synthèse, avec le même moteur que pour une vraie étude.
    const userMessage = buildUserMessage({
      studyObjective: draft.objective || brand.decision,
      brandContext: `Étude menée pour ${brand.name} · secteur : ${brand.sector}`,
      houseNotes: `${brand.positioning}. Gamme de prix : ${brand.priceRange}. Marchés : ${brand.markets.join(", ")}. Clientèle : ${brand.clientele}. Situation : ${brand.situation}`,
      participantProfiles: interviews.map((iv) => ({ type: iv.profil })),
      studyFormat: `${interviews.length} entretiens 1:1 d'environ 20 minutes, transcrits automatiquement (entretiens simulés pour le banc d'essai)`,
      verbatims: interviews.map((iv) => ({ participantType: iv.profil, content: iv.transcript })),
      decisions,
      brief: run.brief,
      guide,
    });
    const { structured } = await generateReport(userMessage);
    if (!structured) return { error: "La synthèse produite n'était pas lisible." };
    const q = await checkAndRepairQuotes(structured, interviews.map((iv) => iv.transcript));
    const reponses = Array.isArray(structured.reponses) ? structured.reponses as { reponse?: string }[] : [];

    // 3. La marque juge le document, sans complaisance.
    const critique = await askJson<BenchCritique>(
      `Tu es ${brand.persona.role} chez ${brand.name} (${brand.persona.seniority}). Tu crains : ${brand.persona.fears}. Tu juges un livrable sur : ${brand.persona.judges}. On te remet une synthèse d'entretiens. Dis sans complaisance si elle t'aide à décider en comité. Réponds uniquement en JSON.`,
      `TES DÉCISIONS :\n${decisions.map((d, i) => `${i + 1}. ${d}`).join("\n") || "Non précisées."}\n\nLA SYNTHÈSE :\n${JSON.stringify(structured).slice(0, 30000)}\n\nFormat : {"note": 7, "verdict": "1 phrase", "utile": ["ce qui t'aide vraiment"], "generique": ["ce qui est vague ou convenu"], "manque": ["ce qui te manque pour décider"], "aCorriger": ["consigne précise pour améliorer la prochaine synthèse"]}`,
      3000,
    ).catch(() => null);

    const result: BenchResult = {
      createdAt: new Date().toISOString(),
      interviews,
      report: structured,
      quality: { citations: q.total, verifiees: q.verified, corrigees: q.repaired, retirees: q.removed, questions: decisions.length, repondues: reponses.filter((r) => r.reponse?.trim()).length },
      critique,
    };
    await prisma.labRun.update({ where: { id: runId }, data: { synthesis: result as unknown as Prisma.InputJsonValue } });
    return { ok: true };
  } catch (e) {
    console.error("[banc synthèse]", e);
    return { error: "Le banc d'essai a échoué. Réessayez." };
  }
}
