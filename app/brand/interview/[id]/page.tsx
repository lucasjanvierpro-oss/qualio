import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import InterviewRoom from "@/components/interview/InterviewRoom";
import AsyncResponse from "@/components/interview/AsyncResponse";
import { sweepNoShowsSoon } from "@/lib/interviews/reliability";

export const dynamic = "force-dynamic";

export default async function BrandInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  sweepNoShowsSoon();
  const { id } = await params;
  const me = await getSessionUser();
  if (!me?.brandProfileId) redirect("/login");

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfileId: true, guide: true, brandProfile: { select: { companyName: true } } } },
          participantProfile: { select: { firstName: true, lastName: true, city: true, profession: true, brandSummary: true } },
        },
      },
    },
  });
  // La marque n'ouvre que les entretiens de ses propres études.
  if (!interview || interview.application.study.brandProfileId !== me.brandProfileId) notFound();

  const { study, participantProfile: pp } = interview.application;

  // Entretien en autonomie (bêta) : pas de salle à rejoindre, une réponse à lire.
  if (interview.mode === "async") {
    return (
      <AsyncResponse
        interviewId={interview.id}
        title={study.title}
        studyHref={`/brand/studies/${study.id}`}
        person={{ name: `${pp.firstName} ${pp.lastName.slice(0, 1)}.`, facts: [pp.profession, pp.city].filter(Boolean).join(" · ") }}
        questions={study.guide}
        prompts={(Array.isArray(interview.prompts) ? interview.prompts : []) as { i: number; at: number }[]}
        status={interview.status}
        submittedAt={interview.submittedAt?.toISOString() ?? null}
        hasRecording={!!interview.recordingId}
        transcriptStatus={interview.transcriptStatus}
        transcript={interview.transcript}
      />
    );
  }
  return (
    <InterviewRoom
      role="brand"
      title={study.title}
      scheduledAt={interview.scheduledAt.toISOString()}
      durationMinutes={interview.durationMinutes}
      roomUrl={interview.hostRoomUrl ?? interview.videoLink}
      displayName={study.brandProfile.companyName}
      interviewId={interview.id}
      backHref={`/brand/studies/${study.id}`}
      status={interview.status}
      guide={study.guide}
      person={{
        name: `${pp.firstName} ${pp.lastName.slice(0, 1)}.`,
        facts: [pp.profession, pp.city].filter(Boolean).join(" · "),
        summary: pp.brandSummary,
        why: interview.application.adminMatchNote,
        nda: interview.application.ndaAcceptedAt?.toISOString() ?? null,
      }}
    />
  );
}
