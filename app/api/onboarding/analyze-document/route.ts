import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Analyse un CV / portfolio uploadé → synthèse professionnelle stockée dans
// cvAnalysis (qui nourrit ensuite le résumé marque + le ghost file).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: false, note: "no_key" });

  const { path } = await req.json() as { path?: string };
  if (!path) return NextResponse.json({ error: "no_path" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true } } },
  });
  if (!dbUser?.participantProfile) return NextResponse.json({ error: "no_profile" }, { status: 404 });

  // Récupère le fichier depuis le bucket privé
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: file, error } = await service.storage.from("participant-docs").download(path);
  if (error || !file) return NextResponse.json({ error: "download_failed" }, { status: 500 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const ext = path.split(".").pop()?.toLowerCase() ?? "pdf";
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);

  const promptText = `Analyse ce document (CV ou portfolio) et produis une synthèse professionnelle de 3-5 phrases : parcours, expertise mode/lifestyle, expériences marquantes, et ce qui rend ce profil intéressant pour des études qualitatives de marques mode/luxe. Ton factuel, 3e personne. Réponds uniquement avec la synthèse.`;

  try {
    const content: Anthropic.MessageParam["content"] = isImage
      ? [
          { type: "image", source: { type: "base64", media_type: `image/${ext === "jpg" ? "jpeg" : ext}` as "image/jpeg" | "image/png" | "image/webp", data: base64 } },
          { type: "text", text: promptText },
        ]
      : [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: promptText },
        ];

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      messages: [{ role: "user", content }],
    });
    const analysis = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    if (analysis) {
      await prisma.participantProfile.update({ where: { id: dbUser.participantProfile.id }, data: { cvAnalysis: analysis } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[analyze-document]", err);
    return NextResponse.json({ ok: false, note: "analysis_failed" });
  }
}
