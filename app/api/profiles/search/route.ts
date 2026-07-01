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
  tags?: string[];
};

function normalizeTag(t: string): string {
  return t.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  "keywords": [],
  "tags": []
}

Valeurs possibles :
- profileType : "expert", "insider", "influencer", "creative", "enthusiast", null
- primaryExpertise : ex "streetwear", "luxe", "mode contemporaine", "beauté", "retail", "styling", null
- influenceTier : "none", "nano", "micro", "macro", null
- generationTag : "Gen Z", "Millennial", "Gen X", null
- minScore : nombre entre 1 et 10, null si non précisé
- city : nom de ville exacte ou null
- keywords : mots-clés importants pour affiner (max 3)
- tags : 5 à 12 tags de recherche normalisés déduits de la requête, y compris synonymes et notions implicites. Format : minuscules, sans accents, tirets (ex "quiet-luxury", "seconde-main", "gen-z", "sneakers", "lacoste", "early-adopter", "gros-budget"). Étends la requête : si la marque cherche "des acheteurs Lacoste jeunes", tags = ["lacoste", "gen-z", "tennis", "sportswear", "preppy", "polo"]` }],
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

  // Tags de recherche normalisés (extraits de la requête + keywords)
  const searchTags = [...new Set([
    ...(filters.tags ?? []),
    ...(filters.keywords ?? []),
  ].map(normalizeTag).filter(Boolean))];

  function buildWhere(withTags: boolean): Record<string, unknown> {
    return {
      idVerificationStatus: "VERIFIED",
      isBlacklisted: false,
      ghostFile: {
        processingStatus: "done",
        ...(filters.profileType ? { profileType: filters.profileType } : {}),
        ...(filters.primaryExpertise ? { primaryExpertise: { contains: filters.primaryExpertise, mode: "insensitive" } } : {}),
        ...(filters.minScore ? { overallQualityScore: { gte: filters.minScore } } : {}),
        ...(filters.influenceTier ? { influenceTier: filters.influenceTier } : {}),
        ...(filters.generationTag ? { generationTag: filters.generationTag } : {}),
        ...(withTags && searchTags.length > 0 ? { aiTags: { hasSome: searchTags } } : {}),
      },
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
    };
  }

  const ghostFileSelect = {
    select: {
      overallQualityScore: true,
      profileType: true,
      primaryExpertise: true,
      secondaryExpertises: true,
      generationTag: true,
      influenceTier: true,
      aiStrengths: true,
      aiRecommendedBrands: true,
      aiTags: true,
      processingStatus: true,
    },
  };

  // Passe 1 : match sur les tags invisibles (le plus précis)
  let where = buildWhere(true);
  let [profiles, total] = await Promise.all([
    prisma.participantProfile.findMany({
      where,
      include: { ghostFile: ghostFileSelect },
      orderBy: { ghostFile: { overallQualityScore: "desc" } },
      take: pageSize,
      skip: page * pageSize,
    }),
    prisma.participantProfile.count({ where }),
  ]);

  // Passe 2 (fallback) : si aucun profil ne matche les tags, on élargit sans tags
  let tagMatchUsed = searchTags.length > 0 && total > 0;
  if (searchTags.length > 0 && total === 0) {
    where = buildWhere(false);
    [profiles, total] = await Promise.all([
      prisma.participantProfile.findMany({
        where,
        include: { ghostFile: ghostFileSelect },
        orderBy: { ghostFile: { overallQualityScore: "desc" } },
        take: pageSize,
        skip: page * pageSize,
      }),
      prisma.participantProfile.count({ where }),
    ]);
    tagMatchUsed = false;
  }

  // Tri secondaire : nombre de tags matchés (pertinence), puis score qualité
  if (tagMatchUsed) {
    profiles.sort((a, b) => {
      const aMatches = (a.ghostFile?.aiTags ?? []).filter((t) => searchTags.includes(t)).length;
      const bMatches = (b.ghostFile?.aiTags ?? []).filter((t) => searchTags.includes(t)).length;
      if (bMatches !== aMatches) return bMatches - aMatches;
      return (b.ghostFile?.overallQualityScore ?? 0) - (a.ghostFile?.overallQualityScore ?? 0);
    });
  }

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

  return NextResponse.json({ results, total, page, pageSize, filtersUsed: filters, tagMatchUsed });
}
