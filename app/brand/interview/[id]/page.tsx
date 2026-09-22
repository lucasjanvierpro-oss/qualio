import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import InterviewRoom from "@/components/interview/InterviewRoom";

export const dynamic = "force-dynamic";

export default async function BrandInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me?.brandProfileId) redirect("/login");

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfileId: true, brandProfile: { select: { companyName: true } } } },
          participantProfile: { select: { firstName: true, lastName: true, city: true, profession: true, brandSummary: true } },
        },
      },
    },
  });
  // La marque n'ouvre que les entretiens de ses propres études.
  if (!interview || interview.application.study.brandProfileId !== me.brandProfileId) notFound();

  const { study, participantProfile: pp } = interview.application;
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
      person={{
        name: `${pp.firstName} ${pp.lastName.slice(0, 1)}.`,
        facts: [pp.profession, pp.city].filter(Boolean).join(" · "),
        summary: pp.brandSummary,
        why: interview.application.adminMatchNote,
      }}
    />
  );
}
