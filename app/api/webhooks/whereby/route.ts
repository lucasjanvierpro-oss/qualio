import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";

// Webhook Whereby — reçoit les événements d'enregistrement ET de transcription.
// À configurer : dashboard Whereby → Webhooks → URL de ce endpoint.
//
// Pipeline (100% Whereby, sans service tiers) :
//  1. Fin d'entretien → Whereby enregistre puis transcrit (plan Build)
//  2. Événement "recording ready" → on stocke l'URL de l'enregistrement (référence)
//  3. Événement "transcription ready" → on stocke le transcript sur l'entretien,
//     puis si TOUS les entretiens de l'étude sont transcrits → rapport auto.
//
// NB : le format exact du payload dépend de la config du compte Whereby.
// On loggue le brut au premier test pour caler les noms de champs.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Log complet du payload — sert à caler les noms de champs au premier test réel.
  console.log("[whereby-webhook] payload reçu:", JSON.stringify(payload));

  const type = String(payload.type ?? "").toLowerCase();
  const data = (payload.data ?? payload) as Record<string, unknown>;

  const meetingId = String(data.meetingId ?? data.roomName ?? data.roomSessionId ?? "");
  if (!meetingId) {
    console.warn("[whereby-webhook] payload sans meetingId:", JSON.stringify(payload).slice(0, 800));
    return NextResponse.json({ received: true, warning: "no_meeting_id" });
  }

  const interview = await prisma.interview.findFirst({ where: { wherebyMeetingId: meetingId } });
  if (!interview) {
    console.warn("[whereby-webhook] aucun entretien pour meetingId", meetingId);
    return NextResponse.json({ received: true, warning: "interview_not_found" });
  }

  // ── Enregistrement prêt ──────────────────────────────────────────────
  if (type.includes("recording")) {
    const recordingUrl = String(
      (data.recordingUrl as string) ??
      ((data.recording as Record<string, unknown>)?.url as string) ??
      (data.assetUrl as string) ?? (data.url as string) ?? ""
    );
    await prisma.interview.update({
      where: { id: interview.id },
      data: { recordingStatus: "ready", recordingUrl: recordingUrl || null },
    });
    return NextResponse.json({ received: true, note: "recording_saved" });
  }

  // ── Transcription prête ──────────────────────────────────────────────
  if (type.includes("transcription") || type.includes("transcript")) {
    // Le transcript peut arriver en texte direct, ou via une URL à télécharger.
    let transcriptText = String(
      (data.transcript as string) ??
      (data.text as string) ??
      ((data.transcription as Record<string, unknown>)?.text as string) ?? ""
    );
    const transcriptUrl = String(
      (data.transcriptUrl as string) ??
      ((data.transcription as Record<string, unknown>)?.url as string) ??
      (data.url as string) ?? ""
    );

    if (!transcriptText && transcriptUrl) {
      try {
        const r = await fetch(transcriptUrl);
        transcriptText = await r.text();
      } catch (err) {
        console.error("[whereby-webhook] téléchargement transcript échoué", err);
      }
    }

    if (!transcriptText) {
      console.warn("[whereby-webhook] transcription sans texte:", JSON.stringify(payload).slice(0, 800));
      await prisma.interview.update({ where: { id: interview.id }, data: { transcriptStatus: "failed" } });
      return NextResponse.json({ received: true, warning: "empty_transcript" });
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: { transcript: transcriptText, transcriptStatus: "done", status: "completed", completedAt: new Date() },
    });

    // Génère le rapport si tous les entretiens de l'étude sont transcrits.
    const result = await generateAndStoreReportFromTranscripts(interview.studyId, { requireAll: true });
    return NextResponse.json({ received: true, report: result });
  }

  return NextResponse.json({ received: true, ignored: type });
}
