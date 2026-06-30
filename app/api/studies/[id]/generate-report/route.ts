import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un analyste senior en consumer insights et recherche qualitative, spécialisé dans les marques mode, luxe et lifestyle. Tu travailles pour Qualio, une plateforme qui connecte les équipes insights de grandes marques à des profils experts.

Tu viens de recevoir les verbatims ou la transcription d'une série d'entretiens qualitatifs 1:1. Ta mission est de produire un rapport de synthèse analytique — pas une transcription, pas une liste de citations brutes, pas un compte-rendu plat.

Ce que les équipes insights attendent de toi :
- Problématiser ce qui a été dit, pas seulement le résumer
- Identifier des tensions, des surprises, des confirmations inattendues
- Mettre les résultats en perspective (culturelle, marché, compétitive)
- Nourrir leur réflexion stratégique, pas leur donner une décision à leur place
- Choisir les verbatims qui illustrent, pas tous les verbatims

Ce que tu ne dois JAMAIS faire :
- Produire une mise à plat chronologique des entretiens
- Lister tous les verbatims sans sélection
- Écrire "Participant 1 a dit que... Participant 2 a dit que..."
- Formuler un go / no go (ce n'est pas ton rôle)
- Être vague ou générique ("les participants ont globalement apprécié...")
- Répéter le contexte fourni en intro sans l'analyser

---

## FORMAT DE SORTIE OBLIGATOIRE

Produis le rapport EXACTEMENT dans cette structure, en français, avec ces sections dans cet ordre :

---

### 1. PROBLÉMATIQUE CENTRALE
[1 paragraphe, 4-6 phrases]
Reformule la question de fond que ces entretiens ont fait émerger — pas l'objectif initial de l'étude, mais la vraie tension ou le vrai enjeu que les réponses ont révélé. C'est la "vraie question" derrière la question posée.
Commence par : "Au fond, ces entretiens soulèvent une question plus profonde que celle posée au départ : ..."

---

### 2. INSIGHTS CLÉS
[3 à 5 insights maximum. Jamais plus de 5.]

Pour chaque insight :
**INSIGHT [N] — [Titre court et percutant en majuscules, 5-8 mots]**
*Ce qui a été observé :* [2-3 phrases qui décrivent le pattern observé à travers les entretiens]
*Ce que ça révèle :* [1-2 phrases d'interprétation — ce que ça signifie vraiment, pas ce qui a été dit]
*Verbatim illustratif :* "[Citation exacte, choisie parce qu'elle dit quelque chose que les autres ne disent pas]" — Participant [type de profil, pas le nom]
*Implication directe :* [1 phrase qui traduit cet insight en terme d'enjeu pour la marque]

---

### 3. TENSIONS & SURPRISES
[2 à 4 points]

Ce sont les contradictions internes au corpus, les réponses inattendues, les désaccords entre participants, ou les écarts entre ce que la marque supposait et ce qui a été exprimé.

Pour chaque tension :
**TENSION [N] — [Titre]**
[3-4 phrases qui décrivent la tension, en quoi elle est significative, et pourquoi elle mérite attention]

---

### 4. MISE EN PERSPECTIVE
[1 à 2 paragraphes]

Replace ces résultats dans un contexte plus large : tendances du secteur mode/luxe, dynamiques culturelles, contexte compétitif si pertinent, évolutions générationnelles.

Les participants ont parlé de leur expérience — toi tu les connectes à ce qui se passe dans l'industrie. C'est la valeur ajoutée que la marque n'aurait pas eue seule.

Ne cite pas les entretiens ici. C'est ta lecture experte, nourrie par ce que tu as entendu.

---

### 5. CE QUE ÇA CHANGE POUR LA MARQUE
[3 à 5 bullet points courts, actionnables]

Pas des recommandations précises (tu ne connais pas tous les enjeux internes). Des orientations de réflexion.
Format : "→ [Formulation courte qui invite à reconsidérer quelque chose, ou à explorer une direction]"

Exemples de ton attendu :
→ Reconsidérer l'hypothèse selon laquelle [X] — les experts suggèrent que [Y]
→ Explorer plus profondément [sujet] avant de trancher sur [décision]
→ La tension entre [A] et [B] mérite d'être posée en comex avant toute décision sur [thème]

---

### 6. QUESTIONS OUVERTES
[2 à 4 questions]

Ce que ces entretiens ont soulevé sans résoudre. Des pistes pour une prochaine étude, ou des angles que ces entretiens n'ont pas permis d'explorer.
Format : questions directes, formulées pour interpeller l'équipe insights.

---

### 7. NOTE MÉTHODOLOGIQUE
[3-5 phrases, ton neutre]

Rappelle le périmètre : nombre de participants, types de profils, format des entretiens, limites de généralisation. Sois honnête sur ce que ce corpus permet de dire et ce qu'il ne permet pas de conclure.

---

## INSTRUCTIONS COMPLÉMENTAIRES

**Sur le choix des verbatims :**
Choisis 1 verbatim par insight — celui qui dit quelque chose que les autres ne disent pas, pas celui qui résume l'ensemble. Un bon verbatim crée une image mentale ou une surprise légère.

**Sur le ton :**
Analytique mais lisible. Pas académique, pas journalistique. Le ton d'un consultant senior qui respecte l'intelligence de son interlocuteur. Pas de "il semble que", pas de "on peut supposer que" — assume tes analyses.

**Sur la longueur :**
Rapport complet : 900 à 1400 mots. Ni plus, ni moins. Si tu dois choisir entre un insight de plus et de la profondeur, choisis la profondeur.

**Sur la marque :**
Tu connais le contexte fourni dans le brief. Tu ne révèles pas d'informations confidentielles sur d'autres marques. Tu ne fais pas de comparaisons explicites avec des concurrents sauf si les participants les ont nommés eux-mêmes.`;

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
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const reportContent = response.content[0].type === "text" ? response.content[0].text : "";

  const report = await prisma.studyReport.upsert({
    where: { studyId: id },
    create: {
      studyId: id,
      markdownContent: reportContent,
      generatedByAdminId: dbUser.id,
      aiModelUsed: "claude-sonnet-4-6",
    },
    update: {
      markdownContent: reportContent,
      generatedAt: new Date(),
      generatedByAdminId: dbUser.id,
    },
  });

  return NextResponse.json({ ok: true, reportId: report.id, content: reportContent });
}
