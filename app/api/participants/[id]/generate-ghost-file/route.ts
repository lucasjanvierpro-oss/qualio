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
      firstName: true, lastName: true, city: true, profession: true,
      yearsOfExperience: true, professionalBio: true,
      shoppingBudgetRange: true, shoppingChannels: true,
      followerRange: true, instagramUrl: true, tiktokUrl: true,
      screenerAnswers: true,
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

  const answers = profile.screenerAnswers as Record<string, string> | null ?? {};

  const prompt = `Tu es un expert en recrutement qualitatif pour des marques de mode et de luxe. Analyse le profil suivant et génère un rapport structuré en JSON.

PROFIL PARTICIPANT :
- Prénom/Nom : ${profile.firstName} ${profile.lastName}
- Ville : ${profile.city ?? "non renseigné"}
- Profession : ${profile.profession ?? "non renseigné"}
- Années d'expérience : ${profile.yearsOfExperience ?? "non renseigné"}
- Bio professionnelle : ${profile.professionalBio ?? "non renseigné"}
- Budget mode mensuel : ${profile.shoppingBudgetRange ?? "non renseigné"}
- Canaux d'achat : ${(profile.shoppingChannels ?? []).join(", ") || "non renseigné"}
- Abonnés (réseau principal) : ${profile.followerRange ?? "non renseigné"}
- Instagram : ${profile.instagramUrl ?? "non renseigné"}

RÉPONSES QUALITATIVES :
Parcours professionnel : "${answers.careerPath ?? ""}"
Rapport au style : "${answers.styleRelationship ?? ""}"
Expertise déclarée : "${answers.expertise ?? ""}"
Vision du marché : "${answers.marketVision ?? ""}"
Dernier achat : "${answers.lastPurchase ?? ""}"
Description audience : "${answers.socialDescription ?? ""}"

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
  "aiRecommendedBrands": []
}

Valeurs attendues :
- profileType : "expert", "insider", "influencer", "creative", "enthusiast" ou "généraliste"
- primaryExpertise : ex "streetwear", "luxe", "mode contemporaine", "beauté", "retail", "styling"
- generationTag : "Gen Z", "Millennial", "Gen X" ou "Boomer"
- influenceTier : "none" (<1k), "nano" (1k-10k), "micro" (10k-50k), "macro" (50k+)
- aiProfileSummary : 3-4 phrases synthétisant le profil comme une note interne (ton professionnel, factuel)
- aiStrengths : 3-5 points forts concrets
- aiWeaknesses : 1-3 points faibles ou limites
- aiBestStudyTypes : ex ["entretien 1:1 tendances", "test produit luxe", "focus group streetwear"]
- aiRecommendedBrands : 4-6 marques qui gagneraient à interroger ce profil`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
    };

    await prisma.participantGhostFile.upsert({
      where: { participantProfileId: id },
      create: {
        participantProfileId: id,
        processingStatus: "done",
        aiModelUsed: "claude-sonnet-4-6",
        ...parsed,
      },
      update: {
        processingStatus: "done",
        aiModelUsed: "claude-sonnet-4-6",
        ...parsed,
      },
    });

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
