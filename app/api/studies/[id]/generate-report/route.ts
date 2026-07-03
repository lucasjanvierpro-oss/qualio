import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un analyste senior en consumer insights et recherche qualitative, spécialisé dans les marques mode, luxe et lifestyle. Tu travailles pour Qualio.

Tu reçois les verbatims d'une série d'entretiens qualitatifs. Ta mission : produire un rapport de synthèse analytique STRUCTURÉ — pas une transcription, pas une liste plate de citations.

Principes :
- Problématiser, pas résumer. Identifier tensions, surprises, confirmations inattendues.
- Mettre en perspective (culture, marché, générations).
- Choisir les verbatims qui révèlent quelque chose, pas ceux qui résument.
- Assume tes analyses (pas de "il semble que"). Ton : consultant senior, lisible, jamais académique.
- Ne formule pas de go/no-go. Ne compare pas à des concurrents sauf si les participants les ont nommés.

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
  "methodologie": "3-5 phrases neutres : périmètre, nombre de participants, profils, format, limites de généralisation."
}

Contraintes :
- forces : 2-3 items. vigilance : 2-3 items. insights : 3-5 items (jamais plus). themes : 3-6 items. verbatims : 5-10 items. personas : 2-3 items. recommandations : 3-5 items.
- "intensite" : entier 1-5. "tonalite" : "positif" | "neutre" | "negatif".
- Les verbatims doivent être des citations RÉELLES tirées du corpus fourni, pas inventées.
- Français, précis, actionnable.`;

type ParticipantInput = {
  type: string;
  age?: number | null;
  profession?: string | null;
  expertise?: string | null;
};

type VerbatimInput = {
  participantType: string;
  content: string;
};

type RequestBody = {
  studyObjective?: string;
  brandContext?: string;
  participantProfiles?: ParticipantInput[];
  verbatims?: VerbatimInput[];
  studyFormat?: string;
  additionalContext?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: { brandProfile: { select: { companyName: true } } },
  });
  if (!study) return NextResponse.json({ error: "Study not found" }, { status: 404 });

  const body: RequestBody = await req.json();
  const {
    studyObjective = study.objective,
    brandContext = "",
    participantProfiles = [],
    verbatims = [],
    studyFormat = `${study.targetParticipantCount} entretiens ${study.studyType === "ONE_ON_ONE" ? "1:1" : "focus group"} de ${study.interviewDuration} minutes, en visio`,
    additionalContext = "",
  } = body;

  if (!verbatims.length) {
    return NextResponse.json({ error: "Au moins un verbatim est requis" }, { status: 400 });
  }

  const userMessage = `OBJECTIF DE L'ÉTUDE :
${studyObjective}

CONTEXTE MARQUE :
${brandContext || `Étude menée pour ${study.brandProfile.companyName}`}

PROFILS DES PARTICIPANTS (${participantProfiles.length}) :
${participantProfiles.map((p, i) =>
  `Participant ${i + 1} : ${p.type}${p.age ? `, ${p.age} ans` : ""}${p.profession ? `, ${p.profession}` : ""}${p.expertise ? ` — Expertise : ${p.expertise}` : ""}`
).join("\n") || "Profils non renseignés"}

FORMAT DE L'ÉTUDE :
${studyFormat}

VERBATIMS ET CONTENUS DES ENTRETIENS :
${verbatims.map((v, i) =>
  `--- ENTRETIEN ${i + 1} [${v.participantType}] ---\n${v.content}`
).join("\n\n")}

${additionalContext ? `NOTES ADDITIONNELLES DE L'ÉQUIPE QUALIO :\n${additionalContext}` : ""}

Génère maintenant le rapport de synthèse complet selon le format défini.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  // Extrait le JSON (au cas où le modèle enveloppe dans ```json … ```)
  let structured: Record<string, unknown> | null = null;
  try {
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    structured = JSON.parse(jsonStr);
  } catch {
    structured = null;
  }

  if (!structured) {
    return NextResponse.json({ error: "Le rapport généré est invalide (JSON). Réessayez." }, { status: 502 });
  }

  const report = await prisma.studyReport.upsert({
    where: { studyId: id },
    create: {
      studyId: id,
      markdownContent: raw,
      structuredContent: structured as Prisma.InputJsonValue,
      generatedByAdminId: dbUser.id,
      aiModelUsed: "claude-sonnet-5",
    },
    update: {
      markdownContent: raw,
      structuredContent: structured as Prisma.InputJsonValue,
      generatedAt: new Date(),
      generatedByAdminId: dbUser.id,
    },
  });

  return NextResponse.json({ ok: true, reportId: report.id, structured, content: raw });
}
