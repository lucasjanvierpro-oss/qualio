import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { readSlots, schedulingStep } from "@/lib/interviews/schedule";
import ParticipantStudyDetailClient from "./ParticipantStudyDetailClient";
import { certLevel } from "@/lib/brands/certification";

export const dynamic = "force-dynamic";

export default async function ParticipantStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.participantProfileId) redirect("/signup/participant");

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      study: { include: { brandProfile: { select: { isVerified: true, domainVerifiedAt: true, user: { select: { email: true } } } } } },
      interview: true,
      reward: true,
      participantProfile: { select: { availability: true } },
    },
  });
  if (!application || application.participantProfileId !== me.participantProfileId) notFound();

  const { study, interview, reward } = application;
  const slots = readSlots(application.proposedSlots);

  return (
    <ParticipantStudyDetailClient
      applicationId={id}
      status={application.status}
      step={application.status === "INVITED" ? schedulingStep(slots) : null}
      study={{
        title: study.title,
        objective: study.objective,
        isFocusGroup: study.studyType === "FOCUS_GROUP",
        interviewDuration: study.interviewDuration,
        rewardAmount: study.rewardAmount,
        rewardType: study.rewardType,
        deadlineAt: study.deadlineAt?.toISOString() ?? null,
        // Le nom de la marque reste caché ; son poinçon, non.
        brandCert: certLevel({
          email: study.brandProfile.user.email,
          domainVerifiedAt: study.brandProfile.domainVerifiedAt,
          isVerified: study.brandProfile.isVerified,
        }),
      }}
      slots={slots}
      availability={(application.participantProfile.availability as Record<string, string[]> | null) ?? null}
      interview={interview ? {
        id: interview.id,
        scheduledAt: interview.scheduledAt.toISOString(),
        durationMinutes: interview.durationMinutes,
        status: interview.status,
      } : null}
      reward={reward ? { amountCents: reward.amountCents, type: reward.type, status: reward.status } : null}
    />
  );
}
