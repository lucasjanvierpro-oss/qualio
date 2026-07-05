import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Nettoie une réponse vocale brute : supprime hésitations et répétitions,
// sans changer le sens ni le vocabulaire de la personne.
export async function POST(req: NextRequest) {
  const { transcript, language } = await req.json() as { transcript?: string; language?: "fr" | "en" };
  if (!transcript || transcript.trim().length < 10) {
    return NextResponse.json({ cleaned: transcript ?? "" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ cleaned: transcript });
  }

  const lang = language === "en" ? "en" : "fr";
  const system = lang === "fr"
    ? `Reformule cette réponse vocale brute à la première personne. Garde EXACTEMENT le sens et le vocabulaire de la personne. Supprime uniquement les "euh", répétitions et hésitations. Ne rends pas le style plus soutenu, n'ajoute rien. Réponds uniquement avec le texte nettoyé, sans commentaire.`
    : `Rewrite this raw voice answer in the first person. Keep EXACTLY the person's meaning and vocabulary. Only remove fillers ("um"), repetitions and hesitations. Do not make the style more formal, do not add anything. Reply only with the cleaned text, no comment.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: transcript }],
    });
    const cleaned = msg.content[0].type === "text" ? msg.content[0].text.trim() : transcript;
    return NextResponse.json({ cleaned });
  } catch {
    return NextResponse.json({ cleaned: transcript });
  }
}
