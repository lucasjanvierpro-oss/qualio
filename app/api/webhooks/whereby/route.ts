import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startTranscription } from "@/lib/transcription/assemblyai";

// Webhook Whereby — appelé quand un enregistrement d'entretien est prêt.
// À configurer dans le dashboard Whereby → Webhooks → URL de ce endpoint.
//
// Rôle : récupérer l'URL de l'enregistrement, la stocker sur l'Interview,
// puis lancer la transcription (AssemblyAI). Le résultat reviendra sur
// /api/webhooks/assemblyai.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Whereby enveloppe l'événement dans { type, data: {...} }.
  const type = String(payload.type ?? "");
  const data = (payload.data ?? payload) as Record<string, unknown>;

  // On ne traite que les événements d'enregistrement prêt.
  if (!type.toLowerCase().includes("recording")) {
    return NextResponse.json({ received: true, ignored: type });
  }

  // Identifiant de la réunion + URL de l'enregistrement (les champs exacts
  // dépendent de la config Whereby — on ratisse les noms les plus courants).
  const meetingId = String(data.meetingId ?? data.roomName ?? data.roomSessionId ?? "");
  const recordingUrl = String(
    (data.recordingUrl as string) ??
    ((data.recording as Record<string, unknown>)?.url as string) ??
    (data.assetUrl as string) ??
    (data.url as string) ??
    ""
  );

  if (!meetingId) {
    console.warn("[whereby-webhook] pas de meetingId dans le payload", JSON.stringify(payload).slice(0, 500));
    return NextResponse.json({ received: true, warning: "no_meeting_id" });
  }

  const interview = await prisma.interview.findFirst({
    where: { wherebyMeetingId: meetingId },
  });

  if (!interview) {
    console.warn("[whereby-webhook] aucun entretien pour meetingId", meetingId);
    return NextResponse.json({ received: true, warning: "interview_not_found" });
  }

  await prisma.interview.update({
    where: { id: interview.id },
    data: { recordingStatus: "ready", recordingUrl: recordingUrl || null },
  });

  // Sans URL exploitable ou sans clé AssemblyAI, on s'arrête proprement ici.
  if (!recordingUrl || !process.env.ASSEMBLYAI_API_KEY) {
    return NextResponse.json({ received: true, note: "recording_saved_no_transcription" });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const { id: transcriptId } = await startTranscription(
      recordingUrl,
      `${appUrl}/api/webhooks/assemblyai`
    );
    await prisma.interview.update({
      where: { id: interview.id },
      data: { transcriptId, transcriptStatus: "processing" },
    });
  } catch (err) {
    console.error("[whereby-webhook] échec lancement transcription", err);
    await prisma.interview.update({
      where: { id: interview.id },
      data: { transcriptStatus: "failed" },
    });
  }

  return NextResponse.json({ received: true });
}
