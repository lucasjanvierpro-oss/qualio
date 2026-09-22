import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { RECORDING_RETENTION_DAYS } from "@/lib/interviews/schedule";
import StudyReportView, { type StructuredReport, type ReportInterview } from "./StudyReportView";

export const dynamic = "force-dynamic";

// Âge d'un entretien en jours : sert à appliquer la conservation de 90 jours.
function daysSince(d: Date): number {
  return (Date.now() - d.getTime()) / 86_400_000;
}

export default async function BrandStudyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me?.brandProfileId) redirect("/login");

  const study = await prisma.study.findFirst({
    where: { id, brandProfileId: me.brandProfileId },
    include: {
      report: true,
      brandProfile: { select: { companyName: true } },
      applications: {
        where: { interview: { isNot: null } },
        include: {
          interview: true,
          participantProfile: { select: { firstName: true, lastName: true, profession: true } },
        },
      },
    },
  });
  if (!study) notFound();

  const interviews: ReportInterview[] = study.applications
    .filter((a) => a.interview && a.interview.status !== "cancelled")
    .map((a) => {
      const iv = a.interview!;
      const ageDays = daysSince(iv.scheduledAt);
      return {
        id: iv.id,
        person: `${a.participantProfile.firstName} ${a.participantProfile.lastName.slice(0, 1)}.`,
        profession: a.participantProfile.profession,
        scheduledAt: iv.scheduledAt.toISOString(),
        status: iv.status,
        transcript: iv.transcriptStatus === "done" ? iv.transcript : null,
        hasVideo: !!iv.recordingId && ageDays <= RECORDING_RETENTION_DAYS,
        videoExpired: !!iv.recordingId && ageDays > RECORDING_RETENTION_DAYS,
      };
    })
    .sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt));

  return (
    <StudyReportView
      studyId={study.id}
      studyTitle={study.title}
      brandName={study.brandProfile.companyName}
      generatedAt={study.report?.generatedAt.toISOString() ?? null}
      report={(study.report?.structuredContent as StructuredReport | null) ?? null}
      legacyText={study.report && !study.report.structuredContent ? study.report.markdownContent : null}
      interviews={interviews}
    />
  );
}
