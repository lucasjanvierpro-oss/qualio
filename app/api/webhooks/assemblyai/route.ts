import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { fetchTranscript, formatTranscript } from "@/lib/transcription/assemblyai";
import { buildUserMessage, generateReport, type VerbatimInput, type ParticipantInput } from "@/lib/reports/generate";
import { sendReportReady } from "@/lib/resend/emails";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const t = new Date();
  let a = t.getFullYear() - dob.getFullYear();
  const m = t.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < dob.getDate())) a--;
  return a;
}

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

  const interview = await prisma.interview.findFirst({
    where: { transcriptId },
    include: {
      application: {
        include: {
          participantProfile: { select: { profession: true, dateOfBirth: true, ghostFile: { select: { primaryExpertise: true, profileType: true } } } },
        },
      },
    },
  });
  if (!interview) return NextResponse.json({ received: true, warning: "interview_not_found" });

  if (payload.status && payload.status !== "completed") {
    await prisma.interview.update({ where: { id: interview.id }, data: { transcriptStatus: "failed" } });
    return NextResponse.json({ received: true, note: "transcription_failed" });
  }

  // Récupère le texte final auprès d'AssemblyAI et le stocke.
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

  // Tous les entretiens (non annulés) de l'étude sont-ils transcrits ?
  const studyId = interview.studyId;
  const interviews = await prisma.interview.findMany({
    where: { studyId, status: { not: "cancelled" } },
    include: {
      application: {
        include: {
          participantProfile: { select: { profession: true, dateOfBirth: true, ghostFile: { select: { primaryExpertise: true, profileType: true } } } },
        },
      },
    },
  });

  const allDone = interviews.length > 0 && interviews.every((iv) => iv.transcriptStatus === "done" && iv.transcript);
  if (!allDone || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ received: true, note: allDone ? "no_anthropic_key" : "waiting_other_interviews" });
  }

  // Assemble le contexte + génère le rapport.
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { brandProfile: { include: { user: { select: { email: true } } } } },
  });
  if (!study) return NextResponse.json({ received: true, warning: "study_not_found" });

  const participantProfiles: ParticipantInput[] = interviews.map((iv) => {
    const p = iv.application.participantProfile;
    return {
      type: p.ghostFile?.profileType ?? p.profession ?? "Participant",
      age: calcAge(p.dateOfBirth),
      profession: p.profession,
      expertise: p.ghostFile?.primaryExpertise ?? null,
    };
  });
  const verbatims: VerbatimInput[] = interviews.map((iv) => ({
    participantType: iv.application.participantProfile.ghostFile?.profileType ?? iv.application.participantProfile.profession ?? "Participant",
    content: iv.transcript ?? "",
  }));

  const userMessage = buildUserMessage({
    studyObjective: study.objective,
    brandContext: `Étude menée pour ${study.brandProfile.companyName}`,
    participantProfiles,
    studyFormat: `${interviews.length} entretiens ${study.studyType === "ONE_ON_ONE" ? "1:1" : "focus group"} de ${study.interviewDuration} minutes, transcrits automatiquement`,
    verbatims,
  });

  try {
    const { raw, structured } = await generateReport(userMessage);
    if (structured) {
      await prisma.studyReport.upsert({
        where: { studyId },
        create: { studyId, markdownContent: raw, structuredContent: structured as Prisma.InputJsonValue, aiModelUsed: "claude-sonnet-5" },
        update: { markdownContent: raw, structuredContent: structured as Prisma.InputJsonValue, generatedAt: new Date() },
      });
      await prisma.study.update({ where: { id: studyId }, data: { status: "COMPLETED" } });
      await sendReportReady(
        study.brandProfile.user.email,
        study.brandProfile.contactFirstName ?? "",
        study.title,
        study.id
      ).catch(() => null);
    }
  } catch (err) {
    console.error("[assemblyai-webhook] génération rapport échouée", err);
  }

  return NextResponse.json({ received: true, reportGenerated: true });
}
