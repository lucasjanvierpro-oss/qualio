import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Filters = {
  city?: string;
  profileType?: string;
  primaryExpertise?: string;
  minScore?: number;
  influenceTier?: string;
  generationTag?: string;
  keywords?: string[];
};

async function extractFilters(query: string): Promise<Filters> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: `Extrais des filtres de recherche structurés depuis cette requête en français. Réponds UNIQUEMENT en JSON sans markdown.

Requête : "${query}"

Format attendu :
{
  "city": null,
  "profileType": null,
  "primaryExpertise": null,
  "minScore": null,
  "influenceTier": null,
  "generationTag": null,
  "keywords": []
}

Valeurs possibles :
- profileType : "expert", "insider", "influencer", "creative", "enthusiast", null
- primaryExpertise : ex "streetwear", "luxe", "mode contemporaine", "beauté", "retail", "styling", null
- influenceTier : "none", "nano", "micro", "macro", null
- generationTag : "Gen Z", "Millennial", "Gen X", null
- minScore : nombre entre 1 et 10, null si non précisé
- city : nom de ville exacte ou null
- keywords : mots-clés importants pour affiner (max 3)` }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  try {
    return JSON.parse(text) as Filters;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    query?: string;
    filters?: Filters;
    page?: number;
  };

  let filters: Filters = body.filters ?? {};

  // Natural language search
  if (body.query && body.query.trim().length > 3) {
    const extracted = await extractFilters(body.query);
    filters = { ...filters, ...extracted };
  }

  const page = body.page ?? 0;
  const pageSize = 24;

  // Build where clause
  const where: Record<string, unknown> = {
    idVerificationStatus: "VERIFIED",
    isBlacklisted: false,
    ghostFile: {
      processingStatus: "done",
      ...(filters.profileType ? { profileType: filters.profileType } : {}),
      ...(filters.primaryExpertise ? { primaryExpertise: { contains: filters.primaryExpertise, mode: "insensitive" } } : {}),
      ...(filters.minScore ? { overallQualityScore: { gte: filters.minScore } } : {}),
      ...(filters.influenceTier ? { influenceTier: filters.influenceTier } : {}),
      ...(filters.generationTag ? { generationTag: filters.generationTag } : {}),
    },
    ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
  };

  const [profiles, total] = await Promise.all([
    prisma.participantProfile.findMany({
      where,
      include: {
        ghostFile: {
          select: {
            overallQualityScore: true,
            profileType: true,
            primaryExpertise: true,
            secondaryExpertises: true,
            generationTag: true,
            influenceTier: true,
            aiStrengths: true,
            aiRecommendedBrands: true,
            processingStatus: true,
          },
        },
      },
      orderBy: { ghostFile: { overallQualityScore: "desc" } },
      take: pageSize,
      skip: page * pageSize,
    }),
    prisma.participantProfile.count({ where }),
  ]);

  const results = profiles.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastInitial: p.lastName ? p.lastName[0] + "." : "",
    city: p.city,
    country: p.country,
    profession: p.profession,
    professionalBio: p.professionalBio,
    brandAffinities: p.brandAffinities.slice(0, 4),
    followerRange: p.followerRange,
    ghostFile: p.ghostFile ? {
      overallQualityScore: p.ghostFile.overallQualityScore,
      profileType: p.ghostFile.profileType,
      primaryExpertise: p.ghostFile.primaryExpertise,
      secondaryExpertises: p.ghostFile.secondaryExpertises,
      generationTag: p.ghostFile.generationTag,
      influenceTier: p.ghostFile.influenceTier,
      aiStrengths: p.ghostFile.aiStrengths.slice(0, 2),
      aiRecommendedBrands: p.ghostFile.aiRecommendedBrands,
    } : null,
  }));

  return NextResponse.json({ results, total, page, pageSize, filtersUsed: filters });
}
