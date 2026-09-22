import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTag } from "@/lib/participants/ghostFile";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { textFromMessage } from "@/lib/anthropic/text";

// Retraite tout le panel, un appel par profil.
// Sans cette ligne, Vercel coupe la fonction bien avant la réponse.
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeTag).filter(Boolean))];
}

// Génère les tags manquants pour tous les profils ayant un ghost file "done"
// mais aucun tag. Batch de 10 max par appel (relancer jusqu'à processed=0).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ghostFiles = await prisma.participantGhostFile.findMany({
    where: { processingStatus: "done", aiTags: { isEmpty: true } },
    take: 10,
    include: {
      participantProfile: {
        select: {
          city: true, profession: true, professionalBio: true, bio: true,
          interests: true, brandAffinities: true, shoppingBudgetRange: true,
          shoppingChannels: true, shoppingFrequency: true, isEarlyAdopter: true,
          followerRange: true, screenerAnswers: true,
        },
      },
    },
  });

  let processed = 0;
  const errors: string[] = [];

  for (const gf of ghostFiles) {
    const p = gf.participantProfile;
    const answers = (p.screenerAnswers as Record<string, string> | null) ?? {};

    try {
      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: `Génère 15 à 25 tags de recherche pour ce profil consommateur mode/luxe. Réponds UNIQUEMENT avec un tableau JSON de strings, sans markdown.

Règles : minuscules, sans accents, tirets pour les mots composés (ex "quiet-luxury", "seconde-main", "gen-z").
Couvre : expertise, styles, marques citées, comportements d'achat, génération, ville, influence, univers produits.
Déduis les tags implicites des réponses libres.

PROFIL :
Ville : ${p.city ?? "?"} · Profession : ${p.profession ?? "?"}
Type : ${gf.profileType ?? "?"} · Expertise : ${gf.primaryExpertise ?? "?"} · Génération : ${gf.generationTag ?? "?"}
Budget : ${p.shoppingBudgetRange ?? "?"} · Fréquence : ${p.shoppingFrequency ?? "?"} · Early adopter : ${p.isEarlyAdopter ?? "?"}
Intérêts : ${(p.interests ?? []).join(", ")}
Marques : ${(p.brandAffinities ?? []).join(", ")}
Canaux : ${(p.shoppingChannels ?? []).join(", ")}
Bio : ${p.professionalBio ?? p.bio ?? ""}
Réponses libres : ${Object.values(answers).join(" | ").slice(0, 1200)}` }],
      });

      const raw = textFromMessage(msg) || "[]";
      const tags = normalizeTags(JSON.parse(raw) as string[]);

      if (tags.length > 0) {
        await prisma.participantGhostFile.update({
          where: { id: gf.id },
          data: { aiTags: tags },
        });
        processed++;
      }
    } catch {
      errors.push(gf.participantProfileId);
    }
  }

  const remaining = await prisma.participantGhostFile.count({
    where: { processingStatus: "done", aiTags: { isEmpty: true } },
  });

  return NextResponse.json({ processed, remaining, errors });
}
