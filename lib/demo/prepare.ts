import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { extractJsonObject, textFromMessage } from "@/lib/anthropic/text";
import { readBrief } from "@/lib/studies/brief";
import type { BriefDraft } from "@/lib/studies/briefTypes";
import { buildUserMessage, generateReport } from "@/lib/reports/generate";
import { checkAndRepairQuotes } from "@/lib/reports/quality";

// La démo pour une marque, en trois temps (chacun tient dans une requête) :
// 1. le brief qu'écrirait son équipe études, lu par le vrai lecteur de brief,
//    et huit profils d'exemple très précis ;
// 2. quatre entretiens simulés ;
// 3. la synthèse, par le vrai moteur de synthèse, citations vérifiées comprises.
// Tout est marqué « exemple » à l'écran : ce ne sont ni de vrais membres du
// panel, ni de vrais entretiens.

const MODEL = "claude-sonnet-5";

export type DemoTier = "averti" | "initie" | "rare";
export type DemoProfile = {
  firstName: string; initial: string; age: number; city: string; role: string;
  tier: DemoTier; match: "Très proche" | "Proche"; why: string; highlight: string; proofs: string[];
};
export type DemoData = {
  sector: string; positioning: string; clientele: string; topic: string; persona: string;
  brief: string; draft?: BriefDraft; profiles: DemoProfile[];
  interviews?: { profil: string; transcript: string }[];
  report?: Record<string, unknown>;
  quality?: { citations: number; verifiees: number; corrigees: number; retirees: number };
};

const PROOFS = ["verifie", "linkedin", "emploi", "cv", "portfolio", "reseaux", "achat", "diplome", "video"];

async function askJson<T>(system: string, prompt: string, maxTokens: number): Promise<T> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // En flux : le raisonnement du modèle prend une partie du budget avant la réponse.
  const msg = await anthropic.messages.stream({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }).finalMessage();
  return JSON.parse(extractJsonObject(textFromMessage(msg))) as T;
}

/** Étape 1 : le brief de la marque, la fiche lue par Rarelyst, les profils d'exemple. */
export async function prepareDemoBrief(id: string): Promise<{ ok: true } | { error: string }> {
  const demo = await prisma.demoSession.findUnique({ where: { id } });
  if (!demo) return { error: "Démo introuvable." };
  const en = demo.lang === "en";
  try {
    const base = await askJson<Omit<DemoData, "draft" | "interviews" | "report" | "quality">>(
      `Tu prépares une démonstration commerciale de Rarelyst, un service qui recrute des profils très précis (mode, luxe, beauté, lifestyle) pour des études qualitatives en visio, puis livre vidéo, transcription et synthèse.
Tu connais très bien l'industrie, ses métiers et ses consommateurs. Tu n'utilises que des informations publiques et générales sur la marque : aucun chiffre confidentiel, aucune affirmation qu'elle est cliente de Rarelyst, aucune personne réelle.
Les profils sont des personnes FICTIVES mais crédibles, très spécifiques, du genre que les panels classiques ne trouvent pas : styliste de célébrités, micro-influenceuse (avec son nombre d'abonnés), early adopter, Gen Z qui revend sur Vinted, vendeur en boutique de luxe, collectionneur, client très fidèle, acheteuse de grand magasin, maquilleuse backstage, personal shopper, etc., choisis pour le sujet.
Réponds uniquement en JSON.`,
      `MARQUE : ${demo.brandName}
${demo.topic ? `SUJET SOUHAITÉ : ${demo.topic}` : "SUJET : choisis un sujet d'étude qualitative crédible et actuel pour cette marque (lancement, repositionnement, nouvelle clientèle, prix, collaboration, canal…)."}
LANGUE DES TEXTES : ${en ? "anglais" : "français"}

Écris :
- le brief (120 à 220 mots) tel que l'équipe études ou marketing de la marque l'enverrait à Rarelyst : contexte, ce qu'elle doit décider, qui elle veut entendre, délai ;
- 8 profils d'exemple qui répondent à ce brief, variés, dont au moins 3 vraiment rares.

Format :
{"sector":"","positioning":"1 phrase","clientele":"1 phrase","topic":"le sujet en 1 ligne","persona":"poste de la personne qui écrit le brief","brief":"",
"profiles":[{"firstName":"Léa","initial":"M.","age":29,"city":"Paris","role":"Styliste de célébrités","tier":"rare|initie|averti","match":"Très proche|Proche","why":"pourquoi elle répond au brief, 1 à 2 phrases concrètes","highlight":"un détail marquant court (ex. 38 k abonnés, 12 ans en boutique)","proofs":["verifie","linkedin"]}]}
Les preuves possibles : ${PROOFS.join(", ")} (2 à 4 par profil, « verifie » toujours).`,
      16000,
    );
    const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(new Date());
    const draft = await readBrief([{ kind: "text", text: `Ce que la marque a écrit :\n${base.brief}` }], today);
    const profiles = (base.profiles ?? []).slice(0, 8).map((p) => ({
      ...p,
      tier: (["averti", "initie", "rare"].includes(p.tier) ? p.tier : "initie") as DemoTier,
      proofs: [...new Set(["verifie", ...(p.proofs ?? []).filter((x) => PROOFS.includes(x))])].slice(0, 4),
    }));
    const data: DemoData = { ...base, profiles, draft };
    await prisma.demoSession.update({ where: { id }, data: { status: "synthesis", data: data as unknown as Prisma.InputJsonValue, error: null } });
    return { ok: true };
  } catch (e) {
    console.error("[démo] brief", e);
    await prisma.demoSession.update({ where: { id }, data: { status: "failed", error: "Le brief n'a pas pu être préparé." } }).catch(() => null);
    return { error: "Le brief n'a pas pu être préparé. Réessayez." };
  }
}

/** Étape 2 : quatre entretiens simulés. */
export async function prepareDemoInterviews(id: string): Promise<{ ok: true } | { error: string }> {
  const demo = await prisma.demoSession.findUnique({ where: { id } });
  const data = demo?.data as unknown as DemoData | null;
  if (!demo || !data?.draft) return { error: "Préparez d'abord le brief." };
  const en = demo.lang === "en";
  const { draft } = data;
  try {
    const picked = data.profiles.slice(0, 4);
    const { interviews } = await askJson<{ interviews: { profil: string; transcript: string }[] }>(
      "Tu écris des transcriptions réalistes d'entretiens qualitatifs de 20 minutes pour une démonstration. Chaque participant a sa voix, ses hésitations, ses exemples concrets, ses contradictions. Les avis divergent vraiment : au moins un participant est en désaccord net avec les autres sur une décision. Format de chaque transcription : lignes « Intervieweur : … » et « Participant : … ». Réponds uniquement en JSON.",
      `MARQUE : ${demo.brandName} (${data.sector}). ${data.positioning} Clientèle : ${data.clientele}
SUJET : ${data.topic}
DÉCISIONS À TRANCHER :
${draft.decisions.map((d, i) => `${i + 1}. ${d}`).join("\n") || "Non précisées."}
GUIDE D'ENTRETIEN :
${draft.guide.map((q, i) => `${i + 1}. ${q}`).join("\n")}
PARTICIPANTS (un entretien chacun) :
${picked.map((p) => `- ${p.firstName} ${p.initial}, ${p.age} ans, ${p.role}, ${p.city} (${p.highlight})`).join("\n")}
LANGUE : ${en ? "anglais" : "français"}

Écris les ${picked.length} entretiens (350 à 500 mots chacun).
Format : {"interviews": [{"profil": "Léa M., styliste de célébrités, 29 ans", "transcript": "Intervieweur : …\\nParticipant : …"}]}`,
      24000,
    );
    if (!interviews?.length) throw new Error("aucun entretien");
    const next: DemoData = { ...data, interviews };
    await prisma.demoSession.update({ where: { id }, data: { data: next as unknown as Prisma.InputJsonValue, error: null } });
    return { ok: true };
  } catch (e) {
    console.error("[démo] entretiens", e);
    await prisma.demoSession.update({ where: { id }, data: { status: "failed", error: "Les entretiens simulés n'ont pas pu être écrits." } }).catch(() => null);
    return { error: "Les entretiens simulés n'ont pas pu être écrits. Réessayez." };
  }
}

/** Étape 3 : la synthèse par le vrai moteur, citations vérifiées. */
export async function prepareDemoSynthesis(id: string): Promise<{ ok: true } | { error: string }> {
  const demo = await prisma.demoSession.findUnique({ where: { id } });
  const data = demo?.data as unknown as DemoData | null;
  if (!demo || !data?.draft) return { error: "Préparez d'abord le brief." };
  if (!data.interviews?.length) return { error: "Les entretiens simulés manquent." };
  const en = demo.lang === "en";
  const { draft, interviews } = data;
  try {
    const userMessage = buildUserMessage({
      studyObjective: draft.objective || data.topic,
      brandContext: `Étude menée pour ${demo.brandName} · secteur : ${data.sector}`,
      houseNotes: `${data.positioning} Clientèle : ${data.clientele}`,
      participantProfiles: interviews.map((iv) => ({ type: iv.profil })),
      studyFormat: `${interviews.length} entretiens 1:1 d'environ 20 minutes, transcrits automatiquement`,
      verbatims: interviews.map((iv) => ({ participantType: iv.profil, content: iv.transcript })),
      decisions: draft.decisions,
      brief: data.brief,
      guide: draft.guide,
      language: en ? "en" : "fr",
    });
    const { structured } = await generateReport(userMessage);
    if (!structured) throw new Error("synthèse illisible");
    const q = await checkAndRepairQuotes(structured, interviews.map((iv) => iv.transcript));
    const next: DemoData = { ...data, report: structured, quality: { citations: q.total, verifiees: q.verified, corrigees: q.repaired, retirees: q.removed } };
    await prisma.demoSession.update({ where: { id }, data: { status: "done", data: next as unknown as Prisma.InputJsonValue, error: null } });
    return { ok: true };
  } catch (e) {
    console.error("[démo] synthèse", e);
    await prisma.demoSession.update({ where: { id }, data: { status: "failed", error: "La synthèse n'a pas pu être écrite." } }).catch(() => null);
    return { error: "La synthèse n'a pas pu être écrite. Réessayez." };
  }
}
