import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ParticipantStudyDetailClient from "./ParticipantStudyDetailClient";

const TYPE_LABEL: Record<string, string> = {
  ONE_ON_ONE: "Entretien individuel (1:1)",
  FOCUS_GROUP: "Focus group",
};

export default async function ParticipantStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { participantProfile: { select: { id: true } } },
  });

  if (!dbUser?.participantProfile) redirect("/participant/onboarding");

  const application = await prisma.application.findUnique({
    where: { id },
    include: { study: true, interview: true, reward: true },
  });

  if (!application || application.participantProfileId !== dbUser.participantProfile.id) {
    notFound();
  }

  const { study, interview, reward } = application;

  const proposedSlots = (application.proposedSlots as Array<{ startTime: string; note?: string }>) ?? [];

  return (
    <ParticipantStudyDetailClient
      applicationId={id}
      status={application.status}
      study={{
        id: study.id,
        title: study.title,
        objective: study.objective,
        studyType: TYPE_LABEL[study.studyType] ?? study.studyType,
        interviewDuration: study.interviewDuration,
        preferredLanguage: study.preferredLanguage,
        rewardAmount: study.rewardAmount,
        rewardType: study.rewardType,
        deadlineAt: study.deadlineAt?.toISOString() ?? null,
      }}
      proposedSlots={proposedSlots}
      interview={interview ? {
        id: interview.id,
        scheduledAt: interview.scheduledAt.toISOString(),
        durationMinutes: interview.durationMinutes,
        videoLink: interview.videoLink,
        status: interview.status,
      } : null}
      reward={reward ? {
        amountCents: reward.amountCents,
        type: reward.type,
        status: reward.status,
      } : null}
    />
  );
}
