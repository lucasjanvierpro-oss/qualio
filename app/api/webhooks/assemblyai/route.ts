import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTranscript, formatTranscript } from "@/lib/transcription/assemblyai";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";

// Webhook AssemblyAI — appelé quand une transcription est terminée.
// Sauvegarde le transcript sur l'entretien, puis — si TOUS les entretiens de
// l'étude sont transcrits — génère le rapport de synthèse automatiquement.
export async function POST(req: NextRequest) {
  let payload: { transcript_id?: string; status?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const transcriptId = payload.transcript_id;
  if (!transcriptId) return NextResponse.json({ received: true, warning: "no_transcript_id" });

  const interview = await prisma.interview.findFirst({ where: { transcriptId } });
  if (!interview) return NextResponse.json({ received: true, warning: "interview_not_found" });

  if (payload.status && payload.status !== "completed") {
    await prisma.interview.update({ where: { id: interview.id }, data: { transcriptStatus: "failed" } });
    return NextResponse.json({ received: true, note: "transcription_failed" });
  }

  // Récupère le texte final et le stocke.
  let transcriptText = "";
  try {
    const t = await fetchTranscript(transcriptId);
    transcriptText = formatTranscript(t);
  } catch (err) {
    console.error("[assemblyai-webhook] fetch transcript échoué", err);
    await prisma.interview.update({ where: { id: interview.id }, data: { transcriptStatus: "failed" } });
    return NextResponse.json({ received: true, note: "fetch_failed" });
  }

  await prisma.interview.update({
    where: { id: interview.id },
    data: { transcript: transcriptText, transcriptStatus: "done" },
  });

  // Génère le rapport si tous les entretiens de l'étude sont transcrits.
  const result = await generateAndStoreReportFromTranscripts(interview.studyId, { requireAll: true });
  return NextResponse.json({ received: true, report: result });
}
