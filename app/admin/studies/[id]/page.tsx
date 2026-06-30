import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminStudyDetailClient from "./AdminStudyDetailClient";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      brandProfile: { include: { user: { select: { email: true } } } },
      applications: {
        include: {
          participantProfile: {
            select: {
              id: true, firstName: true, lastName: true, city: true,
              profession: true, interests: true, brandAffinities: true,
              bio: true, screenerAnswers: true, dateOfBirth: true,
              idVerificationStatus: true,
            },
          },
          interview: { select: { id: true, scheduledAt: true, status: true, videoLink: true } },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!study) notFound();

  const appliedIds = study.applications.map((a) => a.participantProfileId);

  const availableRaw = await prisma.participantProfile.findMany({
    where: { id: { notIn: appliedIds }, isBlacklisted: false },
    select: {
      id: true, firstName: true, lastName: true, city: true,
      profession: true, interests: true, brandAffinities: true,
      bio: true, screenerAnswers: true, dateOfBirth: true,
    },
    orderBy: { participationCount: "desc" },
  });

  const criteria = (study.targetCriteria ?? {}) as Record<string, unknown>;
  const exclusion = study.exclusionCriteria as Record<string, unknown> | null;

  const serializedStudy = {
    id: study.id,
    title: study.title,
    brand: study.brandProfile.companyName,
    contactEmail: study.brandProfile.user.email,
    studyType: study.studyType,
    status: study.status,
    target: study.targetParticipantCount,
    objective: study.objective,
    deadline: study.deadlineAt?.toISOString() ?? null,
    duration: study.interviewDuration,
    rewardAmount: study.rewardAmount,
    rewardType: study.rewardType,
    criteria: {
      ageMin: (criteria.ageMin as number) ?? undefined,
      ageMax: (criteria.ageMax as number) ?? undefined,
      cities: (criteria.cities as string[]) ?? [],
      interests: (criteria.interests as string[]) ?? [],
      brandAffinities: (criteria.brandAffinities as string[]) ?? [],
      profession: (criteria.profession as string) ?? "",
      custom: (criteria.custom as string) ?? "",
    },
    exclusionCriteria: exclusion ? String(exclusion.text ?? JSON.stringify(exclusion)) : null,
    adminNotes: study.adminNotes,
    applications: study.applications.map((a) => ({
      id: a.id,
      status: a.status,
      adminScore: a.adminScore,
      adminMatchNote: a.adminMatchNote,
      brandAccepted: a.brandAccepted,
      interview: a.interview ? {
        id: a.interview.id,
        scheduledAt: a.interview.scheduledAt.toISOString(),
        status: a.interview.status,
        videoLink: a.interview.videoLink,
      } : null,
      participantProfile: {
        id: a.participantProfile.id,
        firstName: a.participantProfile.firstName,
        lastName: a.participantProfile.lastName,
        age: calcAge(a.participantProfile.dateOfBirth),
        city: a.participantProfile.city,
        profession: a.participantProfile.profession,
        interests: a.participantProfile.interests,
        brandAffinities: a.participantProfile.brandAffinities,
        bio: a.participantProfile.bio,
        screenerAnswers: a.participantProfile.screenerAnswers as Record<string, string> | null,
        idVerificationStatus: a.participantProfile.idVerificationStatus,
      },
    })),
  };

  const availableParticipants = availableRaw.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    age: calcAge(p.dateOfBirth),
    city: p.city,
    profession: p.profession,
    interests: p.interests,
    brandAffinities: p.brandAffinities,
    bio: p.bio,
    screenerAnswers: p.screenerAnswers as Record<string, string> | null,
  }));

  return <AdminStudyDetailClient study={serializedStudy} availableParticipants={availableParticipants} />;
}
