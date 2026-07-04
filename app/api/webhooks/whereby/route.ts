import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchWherebyTranscript, fetchWherebyRecordingLink } from "@/lib/whereby/rooms";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";

// Webhook Whereby.
//
// Comportement réel (vérifié via l'API) :
//  - transcription.started : porte le transcriptionId → on le mémorise
//  - recording.finished    : session finie → on récupère le lien mp4 + on va
//                            chercher le transcript (via /transcriptions/{id})
//  - room.session.ended    : filet de sécurité → même récupération
//  Le texte du transcript se récupère par API, pas dans le payload.
//  Quand tous les entretiens d'une étude sont transcrits → rapport auto.

// Va chercher le transcript (s'il est prêt) et déclenche le rapport si complet.
async function tryTranscriptAndReport(interviewId: string): Promise<string> {
  const iv = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!iv) return "interview_gone";
  if (iv.transcriptStatus === "done") return "already_done";
  if (!iv.transcriptId) return "no_transcript_id";

  const text = await fetchWherebyTranscript(iv.transcriptId);
  if (!text) return "transcript_not_ready";

  await prisma.interview.update({
    where: { id: interviewId },
    data: { transcript: text, transcriptStatus: "done", status: "completed", completedAt: new Date() },
  });

  const result = await generateAndStoreReportFromTranscripts(iv.studyId, { requireAll: true });
  return result.ok ? "report_generated" : `report_${result.reason}`;
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  console.log("[whereby-webhook] payload:", JSON.stringify(payload));

  const type = String(payload.type ?? "").toLowerCase();
  const data = (payload.data ?? payload) as Record<string, unknown>;

  const roomName = String(data.roomName ?? "");
  const meetingId = String(data.meetingId ?? "");
  if (!roomName && !meetingId) {
    return NextResponse.json({ received: true, warning: "no_room_name" });
  }

  const interview = await prisma.interview.findFirst({
    where: {
      OR: [
        ...(roomName ? [{ wherebyRoomName: roomName }] : []),
        ...(meetingId ? [{ wherebyMeetingId: meetingId }] : []),
      ],
    },
  });
  if (!interview) {
    console.warn("[whereby-webhook] aucun entretien pour", roomName || meetingId);
    return NextResponse.json({ received: true, warning: "interview_not_found" });
  }

  // ── Transcription démarrée : on mémorise l'id du transcript ──────────
  if (type.includes("transcription")) {
    const transcriptionId = String(data.transcriptionId ?? "");
    if (transcriptionId) {
      await prisma.interview.update({
        where: { id: interview.id },
        data: { transcriptId: transcriptionId, transcriptStatus: "processing" },
      });
    }
    return NextResponse.json({ received: true, note: "transcription_started" });
  }

  // ── Enregistrement fini : lien mp4 + on tente le transcript ─────────
  if (type.includes("recording")) {
    const recordingId = String(data.recordingId ?? "");
    const link = recordingId ? await fetchWherebyRecordingLink(recordingId) : null;
    await prisma.interview.update({
      where: { id: interview.id },
      data: { recordingStatus: "ready", recordingUrl: link },
    });
    const outcome = await tryTranscriptAndReport(interview.id);
    return NextResponse.json({ received: true, note: "recording_saved", outcome });
  }

  // ── Fin de session : filet de sécurité pour le transcript ───────────
  if (type.includes("session.ended")) {
    const outcome = await tryTranscriptAndReport(interview.id);
    return NextResponse.json({ received: true, note: "session_ended", outcome });
  }

  return NextResponse.json({ received: true, ignored: type });
}
