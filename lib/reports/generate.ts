import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { sendReportReady } from "@/lib/resend/emails";
import { textFromMessage, extractJsonObject } from "@/lib/anthropic/text";
import { checkAndRepairQuotes } from "@/lib/reports/quality";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const REPORT_MODEL = "claude-sonnet-5";

export const SYSTEM_PROMPT = `Tu es un analyste senior en consumer insights et recherche qualitative, spécialisé dans les marques mode, luxe et lifestyle. Tu travailles pour Rarelyst.

Tu reçois les verbatims d'une série d'entretiens qualitatifs. Ta mission : produire un rapport de synthèse analytique STRUCTURÉ — pas une transcription, pas une liste plate de citations.

Principes :
- Problématiser, pas résumer. Identifier tensions, surprises, confirmations inattendues.
- Mettre en perspective (culture, marché, générations).
- Choisir les verbatims qui révèlent quelque chose, pas ceux qui résument.
- Assume tes analyses (pas de "il semble que"). Ton : consultant senior, lisible, jamais académique.
- Ne formule pas de go/no-go. Ne compare pas à des concurrents sauf si les participants les ont nommés.

## MÉTHODE RARELYST — ce qui fait une synthèse que la marque utilise en comité

1. Réponds d'abord aux questions de la marque. Chaque réponse dit ce que les entretiens indiquent, combien de personnes vont dans ce sens (« 4 sur 6 »), ce que pensent les autres, et avec quelle confiance :
   - « forte » : une majorité nette, des raisons concordantes, aucun contre-exemple sérieux ;
   - « moyenne » : une tendance, mais des nuances ou un petit nombre d'entretiens ;
   - « faible » : avis partagés, ou le sujet a été peu abordé. Dis-le franchement : c'est une information.
2. Compte, ne généralise pas. Jamais « les consommatrices pensent » : « 4 participantes sur 6 ». Pas de pourcentages sur moins de 20 personnes.
3. Distingue les profils. Une vendeuse en boutique, une cliente et une revendeuse ne voient pas la même chose : quand leurs réponses divergent, c'est souvent l'enseignement principal (champ « segments »).
4. Un insight n'est pas un constat. Mauvais : « Les participantes aiment la qualité. » Bon : « La qualité se juge à la couture, pas à l'étiquette : trois acheteuses retournent le sac avant de lire le prix. » Un insight dit ce qui se passe, pourquoi, et ce que ça change pour la marque.
5. Les citations sont sacrées : recopie-les mot pour mot depuis les transcriptions (tu peux retirer « euh », rien d'autre). N'en invente jamais, n'en reformule jamais. Elles seront vérifiées une par une.
6. Parle la langue de la maison : reprends son vocabulaire, son positionnement et ce qu'elle a déjà appris (MÉMOIRE DE LA MAISON, ÉTUDES PRÉCÉDENTES) ; signale quand ces entretiens confirment ou contredisent une étude passée.
7. Ce qu'on ne sait pas encore est un livrable : les questions ouvertes disent ce qu'il faudrait creuser, et auprès de qui.
8. Rien hors du corpus : pas de chiffres de marché, pas de tendances non évoquées par les participants.

## FORMAT DE SORTIE — JSON STRICT

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans balises markdown. Structure EXACTE :

{
  "titre": "Titre court et évocateur du rapport (6-10 mots)",
  "problematique": "1 paragraphe (4-6 phrases). La vraie question de fond que ces entretiens ont fait émerger, au-delà de l'objectif initial.",
  "syntheseExecutive": "2-3 phrases. Le take-away principal, ce qu'un directeur doit retenir en 10 secondes.",
  "forces": [
    { "titre": "Titre court (5-8 mots)", "detail": "2-3 phrases décrivant ce point fort observé", "verbatim": "citation exacte illustrative", "participant": "type de profil, ex 'Styliste, 28 ans'" }
  ],
  "vigilance": [
    { "titre": "Titre court", "detail": "2-3 phrases décrivant le point de friction/vigilance", "verbatim": "citation exacte", "participant": "type de profil" }
  ],
  "insights": [
    { "titre": "TITRE EN MAJUSCULES (5-8 mots)", "observe": "2-3 phrases : le pattern observé", "revele": "1-2 phrases : ce que ça signifie vraiment", "verbatim": "citation exacte choisie", "participant": "type de profil", "implication": "1 phrase : l'enjeu concret pour la marque" }
  ],
  "themes": [
    { "nom": "Nom du thème (2-4 mots)", "resume": "1-2 phrases", "intensite": 4, "tonalite": "positif" }
  ],
  "verbatims": [
    { "content": "citation exacte", "participant": "type de profil", "theme": "nom du thème rattaché", "tonalite": "positif" }
  ],
  "personas": [
    { "nom": "Nom de persona évocateur (ex 'La puriste du vestiaire')", "portrait": "3-4 phrases décrivant ce type de profil récurrent dans le corpus", "posture": "1 phrase : sa posture face à la marque/au sujet" }
  ],
  "signauxFaibles": ["signal faible 1 (1 phrase)", "signal faible 2"],
  "questionsOuvertes": ["question directe 1", "question directe 2"],
  "recommandations": [
    { "titre": "Orientation de réflexion (pas une décision)", "detail": "1-2 phrases" }
  ],
  "reponses": [
    { "question": "question de la marque, recopiée telle quelle", "reponse": "2-3 phrases : ce que disent les entretiens sur ce choix, nuances comprises", "appui": "combien de participants vont dans ce sens, ex. '5 sur 6'", "confiance": "forte", "verbatim": "citation exacte", "participant": "type de profil" }
  ],
  "segments": [
    { "profil": "type de profil (ex. 'Vendeuses en boutique')", "difference": "1-2 phrases : ce que ce profil voit ou pense autrement que les autres" }
  ],
  "methodologie": "3-5 phrases neutres : périmètre, nombre de participants, profils, format, limites de généralisation."
}

Contraintes :
- reponses : une entrée par question listée dans « QUESTIONS QUE LA MARQUE VEUT TRANCHER », dans le même ordre ; tableau vide s'il n'y en a pas. Dis ce que les entretiens indiquent et avec quelle force ; si le corpus ne permet pas de trancher, dis-le.
- "confiance" : "forte" | "moyenne" | "faible". segments : 0-3 items, seulement si des profils divergent vraiment.
- forces : 2-3 items. vigilance : 2-3 items. insights : 3-5 items (jamais plus). themes : 3-6 items. verbatims : 5-10 items. personas : 2-3 items. recommandations : 3-5 items.
- "intensite" : entier 1-5. "tonalite" : "positif" | "neutre" | "negatif".
- Les verbatims doivent être des citations RÉELLES tirées du corpus fourni, pas inventées.
- Français, précis, actionnable (sauf consigne de langue contraire dans le message).`;

export type ParticipantInput = { type: string; age?: number | null; profession?: string | null; expertise?: string | null; why?: string | null };
export type VerbatimInput = { participantType: string; content: string };

export function buildUserMessage(input: {
  studyObjective: string;
  brandContext: string;
  participantProfiles: ParticipantInput[];
  studyFormat: string;
  verbatims: VerbatimInput[];
  additionalContext?: string;
  /** Ce que la marque a demandé à la synthèse de trancher, dans son brief. */
  decisions?: string[];
  /** Le brief tel que la marque l'a donné, et le guide d'entretien. */
  brief?: string | null;
  guide?: string[];
  /** Ce que la maison a dit d'elle (positionnement, clientèle, vocabulaire…). */
  houseNotes?: string | null;
  /** Enseignements des études précédentes de la même maison. */
  previousLearnings?: string[];
  /** Langue du rapport. */
  language?: "fr" | "en";
}): string {
  const { studyObjective, brandContext, participantProfiles, studyFormat, verbatims, additionalContext, decisions = [], brief, guide = [], houseNotes, previousLearnings = [], language = "fr" } = input;
  return `${language === "en" ? "LANGUE : rédige tout le rapport en anglais (les clés JSON restent en français ; les citations restent dans la langue où elles ont été dites).\n\n" : ""}OBJECTIF DE L'ÉTUDE :
${studyObjective}

CONTEXTE MARQUE :
${brandContext}

MÉMOIRE DE LA MAISON :
${houseNotes?.trim() || "Rien de renseigné par la maison."}

ÉTUDES PRÉCÉDENTES DE LA MAISON :
${previousLearnings.length ? previousLearnings.map((l) => `- ${l}`).join("\n") : "Aucune."}

BRIEF DE LA MARQUE (tel qu'elle l'a écrit) :
${brief?.trim() ? brief.trim().slice(0, 8000) : "Non fourni."}

GUIDE D'ENTRETIEN :
${guide.length ? guide.map((q, i) => `${i + 1}. ${q}`).join("\n") : "Non fourni."}

PROFILS DES PARTICIPANTS (${participantProfiles.length}) :
${participantProfiles.map((p, i) =>
  `Participant ${i + 1} : ${p.type}${p.age ? `, ${p.age} ans` : ""}${p.profession ? `, ${p.profession}` : ""}${p.expertise ? ` — Expertise : ${p.expertise}` : ""}${p.why ? ` — Retenu·e parce que : ${p.why}` : ""}`
).join("\n") || "Profils non renseignés"}

FORMAT DE L'ÉTUDE :
${studyFormat}

QUESTIONS QUE LA MARQUE VEUT TRANCHER :
${decisions.length ? decisions.map((d, i) => `${i + 1}. ${d}`).join("\n") : "Aucune précisée."}

VERBATIMS ET CONTENUS DES ENTRETIENS :
${verbatims.map((v, i) => `--- ENTRETIEN ${i + 1} [${v.participantType}] ---\n${v.content}`).join("\n\n")}

${additionalContext ? `NOTES ADDITIONNELLES DE L'ÉQUIPE RARELYST :\n${additionalContext}` : ""}

Génère maintenant le rapport de synthèse complet selon le format défini.`;
}

// Appelle Claude, parse le JSON. Retourne le brut + l'objet structuré (ou null).
export async function generateReport(userMessage: string): Promise<{
  raw: string;
  structured: Record<string, unknown> | null;
}> {
  const response = await anthropic.messages.create({
    model: REPORT_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = textFromMessage(response);
  let structured: Record<string, unknown> | null = null;
  try {
    structured = JSON.parse(extractJsonObject(raw));
  } catch {
    structured = null;
  }
  return { raw, structured };
}

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const t = new Date();
  let a = t.getFullYear() - dob.getFullYear();
  const m = t.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < dob.getDate())) a--;
  return a;
}

export type AutoReportResult =
  | { ok: true; reportGenerated: true }
  | { ok: false; reason: "no_transcripts" | "not_all_done" | "no_key" | "study_not_found" | "generation_failed" };

// Assemble les transcripts d'une étude et génère le rapport structuré.
// Appelée automatiquement (webhook) OU manuellement (secours admin).
// requireAll = true : n'agit que si TOUS les entretiens sont transcrits.
export async function generateAndStoreReportFromTranscripts(
  studyId: string,
  opts: { requireAll?: boolean } = {}
): Promise<AutoReportResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "no_key" };

  const interviews = await prisma.interview.findMany({
    // Les absents et les entretiens annulés ne produiront jamais de transcript :
    // les compter bloquerait le rapport automatique pour toute l'étude.
    where: { studyId, status: { notIn: ["cancelled", "no_show"] } },
    include: {
      application: {
        include: {
          participantProfile: {
            select: {
              profession: true, dateOfBirth: true,
              ghostFile: { select: { primaryExpertise: true, profileType: true } },
            },
          },
        },
      },
    },
  });

  const transcribed = interviews.filter((iv) => iv.transcriptStatus === "done" && iv.transcript);
  if (transcribed.length === 0) return { ok: false, reason: "no_transcripts" };
  if (opts.requireAll && transcribed.length < interviews.length) return { ok: false, reason: "not_all_done" };

  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { brandProfile: { include: { user: { select: { email: true } } } } },
  });
  if (!study) return { ok: false, reason: "study_not_found" };
  const house = await houseContext(study.brandProfileId, study.id);

  const participantProfiles: ParticipantInput[] = transcribed.map((iv) => {
    const p = iv.application.participantProfile;
    return {
      type: p.ghostFile?.profileType ?? p.profession ?? "Participant",
      age: calcAge(p.dateOfBirth),
      profession: p.profession,
      expertise: p.ghostFile?.primaryExpertise ?? null,
      why: iv.application.adminMatchNote,
    };
  });
  const verbatims: VerbatimInput[] = transcribed.map((iv) => ({
    participantType: iv.application.participantProfile.ghostFile?.profileType ?? iv.application.participantProfile.profession ?? "Participant",
    content: withQuestionMarks(iv.transcript ?? "", iv.mode === "async" ? iv.prompts : null, study.guide),
  }));

  const userMessage = buildUserMessage({
    studyObjective: study.objective,
    brandContext: house.brandContext,
    participantProfiles,
    studyFormat: study.mode === "async"
      ? `${transcribed.length} entretiens en autonomie (le participant répond seul, face caméra, aux questions du guide), environ ${study.interviewDuration} minutes, transcrits automatiquement`
      : `${transcribed.length} entretiens ${study.studyType === "ONE_ON_ONE" ? "1:1" : "focus group"} de ${study.interviewDuration} minutes, transcrits automatiquement`,
    verbatims,
    decisions: study.decisions,
    brief: study.brief,
    guide: study.guide,
    houseNotes: study.brandProfile.houseNotes,
    previousLearnings: house.previousLearnings,
    language: study.preferredLanguage === "en" ? "en" : "fr",
  });

  try {
    const { raw, structured } = await generateReport(userMessage);
    if (!structured) return { ok: false, reason: "generation_failed" };
    const q = await checkAndRepairQuotes(structured, transcribed.map((iv) => iv.transcript ?? ""));
    structured.qualite = { citations: q.total, verifiees: q.verified, corrigees: q.repaired, retirees: q.removed };

    await prisma.studyReport.upsert({
      where: { studyId },
      create: { studyId, markdownContent: raw, structuredContent: structured as Prisma.InputJsonValue, aiModelUsed: REPORT_MODEL },
      update: { markdownContent: raw, structuredContent: structured as Prisma.InputJsonValue, generatedAt: new Date() },
    });
    await prisma.study.update({ where: { id: studyId }, data: { status: "COMPLETED" } });
    await sendReportReady(
      study.brandProfile.user.email,
      study.brandProfile.contactFirstName ?? "",
      study.title,
      study.id
    ).catch(() => null);
    return { ok: true, reportGenerated: true };
  } catch (err) {
    console.error("[auto-report] génération échouée", err);
    return { ok: false, reason: "generation_failed" };
  }
}


// ── Contexte de la maison ─────────────────────────────────────────────
// Ce que l'IA sait de la marque avant de lire les entretiens : son secteur,
// son site, et ce qu'ont appris ses études précédentes.
export async function houseContext(brandProfileId: string, excludeStudyId?: string) {
  const [brand, past] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { companyName: true, industry: true, website: true, legalName: true } }),
    prisma.study.findMany({
      where: { brandProfileId, id: excludeStudyId ? { not: excludeStudyId } : undefined, report: { isNot: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, createdAt: true, report: { select: { structuredContent: true } } },
    }),
  ]);
  const brandContext = [
    `Étude menée pour ${brand?.companyName ?? "une maison"}`,
    brand?.industry ? `secteur : ${brand.industry}` : null,
    brand?.website ? `site : ${brand.website}` : null,
  ].filter(Boolean).join(" · ");
  const previousLearnings = past.map((p) => {
    const r = (p.report?.structuredContent ?? {}) as { syntheseExecutive?: string };
    const when = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(p.createdAt);
    return `${p.title} (${when}) : ${r.syntheseExecutive ?? "synthèse sans résumé"}`;
  });
  return { brandContext, previousLearnings };
}

/**
 * Entretien en autonomie : on repère dans la transcription le passage à chaque
 * question, à partir du minutage noté pendant l'entretien. La transcription
 * Whereby porte des repères [hh:mm:ss] ; sans eux, on liste les questions en tête.
 */
export function withQuestionMarks(transcript: string, prompts: unknown, guide: string[]): string {
  if (!Array.isArray(prompts) || !prompts.length || !guide.length) return transcript;
  const firstAt = new Map<number, number>();
  for (const p of prompts as { i: number; at: number }[]) if (!firstAt.has(p.i)) firstAt.set(p.i, p.at);
  const header = [...firstAt.entries()].sort((a, b) => a[1] - b[1])
    .map(([i, at]) => `[${String(Math.floor(at / 60000)).padStart(2, "0")}:${String(Math.floor(at / 1000) % 60).padStart(2, "0")}] Question ${i + 1} affichée : ${guide[i] ?? ""}`)
    .join("\n");
  return `DÉROULÉ DES QUESTIONS (minutage depuis l'entrée du participant dans la salle) :\n${header}\n\nTRANSCRIPTION :\n${transcript}`;
}
