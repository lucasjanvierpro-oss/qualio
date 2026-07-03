import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";

// Secours manuel (admin) : génère le rapport à partir des transcripts déjà
// disponibles pour l'étude — utile si un webhook a été raté, ou pour forcer
// la génération avant que tous les entretiens soient transcrits.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const result = await generateAndStoreReportFromTranscripts(id);

  if (!result.ok) {
    const messages: Record<string, string> = {
      no_transcripts: "Aucun entretien n'est encore transcrit pour cette étude.",
      not_all_done: "Tous les entretiens ne sont pas encore transcrits.",
      no_key: "Clé Anthropic manquante (ANTHROPIC_API_KEY).",
      study_not_found: "Étude introuvable.",
      generation_failed: "La génération du rapport a échoué. Réessayez.",
    };
    return NextResponse.json({ error: messages[result.reason] ?? result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
