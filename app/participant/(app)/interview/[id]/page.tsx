import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import InterviewRoom from "@/components/interview/InterviewRoom";

export const dynamic = "force-dynamic";

export default async function ParticipantInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.participantProfileId) redirect("/signup/participant");

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          study: { select: { title: true } },
          participantProfile: { select: { firstName: true } },
        },
      },
    },
  });
  // Le participant n'ouvre que son propre entretien.
  if (!interview || interview.application.participantProfileId !== me.participantProfileId) notFound();

  return (
    <InterviewRoom
      role="participant"
      title={interview.application.study.title}
      scheduledAt={interview.scheduledAt.toISOString()}
      durationMinutes={interview.durationMinutes}
      roomUrl={interview.videoLink}
      displayName={interview.application.participantProfile.firstName}
      interviewId={interview.id}
      backHref={`/participant/studies/${interview.applicationId}`}
      status={interview.status}
    />
  );
}
