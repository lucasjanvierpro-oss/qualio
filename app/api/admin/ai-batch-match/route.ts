import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type ParticipantInput = {
  id: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  interests: string[];
  brandAffinities: string[];
  bio: string | null;
  screenerAnswers: Record<string, string> | null;
};

type StudyInput = {
  title: string;
  objective: string;
  criteria: {
    ageMin?: number;
    ageMax?: number;
    cities?: string[];
    interests?: string[];
    brandAffinities?: string[];
    profession?: string;
    custom?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const { study, participants }: { study: StudyInput; participants: ParticipantInput[] } = await req.json();

    if (!participants.length) {
      return NextResponse.json({ results: [] });
    }

    // Compact representation to save tokens
    const compactParticipants = participants.map((p) => ({
      id: p.id,
      age: p.age,
      city: p.city,
      profession: p.profession,
      interests: p.interests.slice(0, 6),
      brands: p.brandAffinities.slice(0, 6),
      bio: p.bio ? p.bio.slice(0, 120) : null,
      s1: p.screenerAnswers?.q1 ? p.screenerAnswers.q1.slice(0, 100) : null,
      s2: p.screenerAnswers?.q2 ? p.screenerAnswers.q2.slice(0, 100) : null,
      budget: p.screenerAnswers?.budget ?? null,
    }));

    const prompt = `Tu es expert en recrutement qualitatif pour des études consommateurs dans la mode et le luxe.

ÉTUDE À MATCHER :
Titre: ${study.title}
Objectif: ${study.objective}
Critères:
- Âge: ${study.criteria.ageMin ?? "?"}–${study.criteria.ageMax ?? "?"} ans
- Villes: ${(study.criteria.cities ?? []).join(", ") || "toute France"}
- Intérêts recherchés: ${(study.criteria.interests ?? []).join(", ") || "non précisé"}
- Affinités marques: ${(study.criteria.brandAffinities ?? []).join(", ") || "non précisé"}
- Profil pro: ${study.criteria.profession || "non précisé"}
- Note spécifique: ${study.criteria.custom || "aucune"}

BASE DE PARTICIPANTS (JSON compact):
${JSON.stringify(compactParticipants)}

CONSIGNE:
1. Évalue chaque participant sur une échelle de 1 à 5 (5 = parfaitement correspondant, 1 = ne correspond pas)
2. Retourne UNIQUEMENT les participants avec score >= 3
3. Trie par score décroissant
4. Maximum 15 résultats
5. Pour chaque résultat, une phrase de raison courte et précise en français (max 15 mots)

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte autour :
[{"id":"...","score":5,"reason":"..."},{"id":"...","score":4,"reason":"..."}]`;

    const client = getAnthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const results = JSON.parse(cleaned);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("AI batch match error:", err);
    return NextResponse.json({ results: [], error: String(err) }, { status: 200 });
  }
}
