import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.participantProfile.findUnique({
    where: { id },
    select: {
      firstName: true, lastName: true, city: true, country: true, profession: true,
      dateOfBirth: true, gender: true, professionalBio: true,
      employmentStatus: true, educationLevel: true, householdIncome: true,
      macroUniverses: true, brandAffinities: true, engagementTypes: true,
      selfProfileType: true, behavioralChecklist: true,
      adaptiveAnswers: true, expertAnswers: true,
      interviewLanguages: true, followerRange: true, instagramUrl: true, linkedinUrl: true,
      cvAnalysis: true,
      // legacy (anciens profils)
      screenerAnswers: true, interests: true, shoppingBudgetRange: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Marquer comme en cours
  await prisma.participantGhostFile.upsert({
    where: { participantProfileId: id },
    create: {
      participantProfileId: id,
      processingStatus: "processing",
      aiProfileSummary: "",
    },
    update: { processingStatus: "processing" },
  });

  const MACRO = ["Luxe & Haute couture", "Streetwear & Sneakers premium", "Mode contemporaine française", "Mode contemporaine internationale", "Prêt-à-porter sport premium", "Vintage & Seconde main"];
  const expert = (profile.expertAnswers as Record<string, string> | null) ?? {};
  const adaptive = (profile.adaptiveAnswers as Record<string, string> | null) ?? {};
  const legacy = (profile.screenerAnswers as Record<string, string> | null) ?? {};
  const universes = (profile.macroUniverses ?? []).map((i) => MACRO[Number(i)] ?? i).filter(Boolean);
  const expertText = Object.values(expert).filter(Boolean).join("\n");
  const adaptiveText = Object.values(adaptive).filter(Boolean).join("\n");
  const legacyText = Object.values(legacy).filter(Boolean).join("\n");
  const dob = profile.dateOfBirth;
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const prompt = `Tu es un expert en recrutement qualitatif pour des marques de mode et de luxe. Analyse le profil suivant et génère un rapport structuré en JSON.

PROFIL PARTICIPANT :
- Prénom/Nom : ${profile.firstName} ${profile.lastName}
- Âge : ${age ?? "non renseigné"} · Genre : ${profile.gender ?? "non renseigné"} · Ville : ${profile.city ?? "non renseigné"}
- Statut d'emploi : ${profile.employmentStatus ?? "non renseigné"} · Éducation : ${profile.educationLevel ?? "non renseigné"}
- Auto-identification : ${profile.selfProfileType ?? "non renseigné"}
- Univers mode : ${universes.join(", ") || "non renseigné"}
- Affinités marques : ${(profile.brandAffinities ?? []).join(", ") || "non renseigné"}
- Types d'engagement : ${(profile.engagementTypes ?? []).join(", ") || "non renseigné"}
- Preuves comportementales cochées : ${(profile.behavioralChecklist ?? []).join(", ") || "aucune"}
- Abonnés (réseau principal) : ${profile.followerRange ?? "non renseigné"} · Instagram : ${profile.instagramUrl ?? "—"} · LinkedIn : ${profile.linkedinUrl ?? "—"}
${profile.cvAnalysis ? `- Synthèse CV/portfolio (IA) : ${profile.cvAnalysis}` : ""}

RÉPONSES QUALITATIVES (le plus important — évalue la profondeur et l'authenticité) :
Questions adaptatives :
${adaptiveText || "(non renseigné)"}

Questions expertes :
${expertText || legacyText || "(non renseigné)"}

INSTRUCTIONS :
- Évalue objectivement la qualité et l'authenticité des réponses
- Score chaque dimension de 1 à 10 (sois exigeant — 8+ = vraiment excellent)
- Identifie le type de profil et l'expertise principale
- Repère les red flags (réponses trop vagues, vocabulaire générique, incohérences)
- Recommande des types d'études adaptés et des marques qui bénéficieraient de ce profil

Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte avant ou après :

{
  "expertiseScore": 0,
  "vocabularyScore": 0,
  "consistencyScore": 0,
  "earlyAdopterScore": 0,
  "influenceScore": 0,
  "authenticityScore": 0,
  "overallQualityScore": 0,
  "profileType": "",
  "primaryExpertise": "",
  "secondaryExpertises": [],
  "generationTag": "",
  "influenceTier": "",
  "redFlags": [],
  "aiProfileSummary": "",
  "aiStrengths": [],
  "aiWeaknesses": [],
  "aiBestStudyTypes": [],
  "aiRecommendedBrands": [],
  "aiTags": [],
  "brandSummary": ""
}

Valeurs attendues :
- brandSummary : résumé PRÉSENTABLE de 4-6 phrases, VISIBLE PAR LES MARQUES. Décris qui est cette personne comme profil consommateur/expert : son univers, son rapport à la mode, sa valeur pour une étude. Ton valorisant mais factuel, à la 3e personne (ex "Styliste indépendante spécialisée dans le quiet luxury…"). AUCUN score, AUCun jugement de qualité, AUCUN nom de famille — c'est une vitrine du profil, pas une évaluation interne.
- profileType : "expert", "insider", "influencer", "creative", "enthusiast" ou "généraliste"
- primaryExpertise : ex "streetwear", "luxe", "mode contemporaine", "beauté", "retail", "styling"
- generationTag : "Gen Z", "Millennial", "Gen X" ou "Boomer"
- influenceTier : "none" (<1k), "nano" (1k-10k), "micro" (10k-50k), "macro" (50k+)
- aiProfileSummary : 3-4 phrases synthétisant le profil comme une note interne (ton professionnel, factuel)
- aiStrengths : 3-5 points forts concrets
- aiWeaknesses : 1-3 points faibles ou limites
- aiBestStudyTypes : ex ["entretien 1:1 tendances", "test produit luxe", "focus group streetwear"]
- aiRecommendedBrands : 4-6 marques qui gagneraient à interroger ce profil
- aiTags : 15 à 25 tags de recherche NORMALISÉS. Règles strictes :
  · minuscules, sans accents, mots composés avec tiret (ex "quiet-luxury", "seconde-main")
  · couvrir TOUTES les dimensions : expertise (ex "styliste", "buyer", "journaliste-mode"), styles/esthétiques (ex "streetwear", "quiet-luxury", "vintage", "avant-garde"), marques citées en minuscules (ex "lacoste", "jacquemus", "nike"), comportements (ex "early-adopter", "resale", "collectionneur", "gros-budget", "petit-budget"), génération (ex "gen-z", "millennial"), ville (ex "paris", "lyon"), influence (ex "createur-contenu", "micro-influence"), univers (ex "tennis", "sneakers", "beaute", "menswear", "womenswear")
  · déduire des tags implicites depuis les réponses qualitatives (si la personne parle de friperies → "seconde-main", "vintage" ; si elle achète au drop → "hype", "drops")
  · ces tags servent UNIQUEMENT au moteur de recherche interne, jamais affichés`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const parsed = JSON.parse(raw) as {
      expertiseScore: number; vocabularyScore: number; consistencyScore: number;
      earlyAdopterScore: number; influenceScore: number; authenticityScore: number;
      overallQualityScore: number; profileType: string; primaryExpertise: string;
      secondaryExpertises: string[]; generationTag: string; influenceTier: string;
      redFlags: string[]; aiProfileSummary: string; aiStrengths: string[];
      aiWeaknesses: string[]; aiBestStudyTypes: string[]; aiRecommendedBrands: string[];
      aiTags?: string[]; brandSummary?: string;
    };

    // Normalisation défensive des tags (minuscules, sans accents, tirets)
    const normalizedTags = [...new Set((parsed.aiTags ?? []).map((t) =>
      t.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    ).filter(Boolean))];
    // brandSummary → PROFIL (visible marques) ; le reste → ghost file (interne)
    const { brandSummary, ...ghost } = parsed;
    ghost.aiTags = normalizedTags;

    await prisma.participantGhostFile.upsert({
      where: { participantProfileId: id },
      create: { participantProfileId: id, processingStatus: "done", aiModelUsed: "claude-sonnet-5", ...ghost },
      update: { processingStatus: "done", aiModelUsed: "claude-sonnet-5", ...ghost },
    });

    if (brandSummary) {
      await prisma.participantProfile.update({ where: { id }, data: { brandSummary } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    await prisma.participantGhostFile.upsert({
      where: { participantProfileId: id },
      create: {
        participantProfileId: id,
        processingStatus: "error",
        aiProfileSummary: "",
      },
      update: { processingStatus: "error" },
    });
    console.error("Ghost file generation failed:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
