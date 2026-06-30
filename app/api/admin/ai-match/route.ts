import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { study, participant } = await req.json();

    const prompt = `Tu es un expert en recrutement qualitatif pour des études consommateurs dans la mode et le luxe.

Voici une étude de marque avec ses critères de recrutement :
- Titre : ${study.title}
- Objectif : ${study.objective}
- Âge cible : ${study.criteria.ageMin ?? "?"}–${study.criteria.ageMax ?? "?"} ans
- Villes : ${(study.criteria.cities ?? []).join(", ") || "toute France"}
- Intérêts recherchés : ${(study.criteria.interests ?? []).join(", ") || "non précisé"}
- Affinités marques : ${(study.criteria.brandAffinities ?? []).join(", ") || "non précisé"}
- Profil professionnel : ${study.criteria.profession || "non précisé"}
- Note spécifique : ${study.criteria.custom || "aucune"}

Voici le profil du participant :
- Âge : ${participant.age ?? "non renseigné"} ans
- Ville : ${participant.city ?? "non renseignée"}
- Profession : ${participant.profession ?? "non renseignée"}
- Intérêts : ${participant.interests.join(", ") || "non renseignés"}
- Affinités marques : ${participant.brandAffinities.join(", ") || "non renseignées"}
- Bio : ${participant.bio || "non renseignée"}
${participant.screenerAnswers ? `- Réponse screener 1 : ${participant.screenerAnswers.q1 ?? ""}
- Réponse screener 2 : ${participant.screenerAnswers.q2 ?? ""}
- Réponse screener 3 : ${participant.screenerAnswers.q3 ?? ""}` : ""}

Donne un score de correspondance de 1 à 5 (où 5 = parfaitement correspondant, 1 = ne correspond pas du tout) et une explication courte en 1-2 phrases de pourquoi.

Réponds UNIQUEMENT en JSON valide, exactement dans ce format :
{"score": <1-5>, "reason": "<explication courte en français>"}`;

    const client = getAnthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const result = JSON.parse(text);

    return NextResponse.json({ score: result.score, reason: result.reason });
  } catch (err) {
    console.error("AI match error:", err);
    return NextResponse.json({ score: null, reason: "Erreur lors de l'analyse IA" }, { status: 200 });
  }
}
