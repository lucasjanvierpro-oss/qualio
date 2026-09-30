import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import InterviewRoom from "@/components/interview/InterviewRoom";
import AsyncInterview from "@/components/interview/AsyncInterview";
import { sweepNoShowsSoon } from "@/lib/interviews/reliability";

export const dynamic = "force-dynamic";

export default async function ParticipantInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  sweepNoShowsSoon();
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.participantProfileId) redirect("/signup/participant");

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          study: { select: { title: true, guide: true } },
          participantProfile: { select: { firstName: true } },
        },
      },
    },
  });
  // Le participant n'ouvre que son propre entretien.
  if (!interview || interview.application.participantProfileId !== me.participantProfileId) notFound();

  // Entretien en autonomie (bêta) : seul face caméra, les questions à l'écran.
  if (interview.mode === "async") {
    const prompts = (Array.isArray(interview.prompts) ? interview.prompts : []) as { i: number; at: number }[];
    return (
      <AsyncInterview
        interviewId={interview.id}
        title={interview.application.study.title}
        questions={interview.application.study.guide}
        displayName={interview.application.participantProfile.firstName}
        status={interview.status}
        joined={!!interview.startedAt}
        index={prompts.at(-1)?.i ?? 0}
        backHref={`/participant/studies/${interview.applicationId}`}
      />
    );
  }

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
