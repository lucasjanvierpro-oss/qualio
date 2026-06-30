import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminParticipantDetailClient from "./AdminParticipantDetailClient";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await prisma.participantProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, createdAt: true } },
      applications: {
        orderBy: { appliedAt: "desc" },
        include: {
          study: { select: { id: true, title: true, studyType: true, status: true } },
          interview: { select: { scheduledAt: true, status: true, brandRating: true } },
          reward: { select: { type: true, amountCents: true, status: true } },
        },
      },
      adminNotes: { orderBy: { createdAt: "desc" } },
      ghostFile: true,
    },
  });

  if (!profile) notFound();

  const serialized = {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.user.email,
    age: calcAge(profile.dateOfBirth),
    dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
    city: profile.city,
    country: profile.country,
    profession: profile.profession,
    bio: profile.bio,
    languages: profile.languages,
    interests: profile.interests,
    brandAffinities: profile.brandAffinities,
    shoppingFrequency: profile.shoppingFrequency,
    isEarlyAdopter: profile.isEarlyAdopter,
    linkedinUrl: profile.linkedinUrl,
    instagramUrl: profile.instagramUrl,
    tiktokUrl: profile.tiktokUrl,
    screenerAnswers: profile.screenerAnswers as Record<string, string> | null,
    availability: profile.availability as Record<string, string[]> | null,
    idVerificationStatus: profile.idVerificationStatus,
    idVerifiedAt: profile.idVerifiedAt?.toISOString() ?? null,
    idDocumentUrl: profile.idDocumentUrl,
    participationCount: profile.participationCount,
    averageRating: profile.averageRating,
    isBlacklisted: profile.isBlacklisted,
    blacklistReason: profile.blacklistReason,
    stripeConnectStatus: profile.stripeConnectStatus,
    createdAt: profile.user.createdAt.toISOString(),
    applications: profile.applications.map((a) => ({
      id: a.id,
      status: a.status,
      studyId: a.study.id,
      studyTitle: a.study.title,
      studyType: a.study.studyType,
      studyStatus: a.study.status,
      adminScore: a.adminScore,
      brandAccepted: a.brandAccepted,
      appliedAt: a.appliedAt.toISOString(),
      interview: a.interview ? {
        scheduledAt: a.interview.scheduledAt.toISOString(),
        status: a.interview.status,
        brandRating: a.interview.brandRating,
      } : null,
      reward: a.reward ? {
        type: a.reward.type,
        amountCents: a.reward.amountCents,
        status: a.reward.status,
      } : null,
    })),
    adminNotes: profile.adminNotes.map((n) => ({
      id: n.id,
      note: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
  };

  const gf = profile.ghostFile;
  const ghostFile = gf ? {
    expertiseScore: gf.expertiseScore,
    vocabularyScore: gf.vocabularyScore,
    consistencyScore: gf.consistencyScore,
    earlyAdopterScore: gf.earlyAdopterScore,
    influenceScore: gf.influenceScore,
    authenticityScore: gf.authenticityScore,
    overallQualityScore: gf.overallQualityScore,
    profileType: gf.profileType,
    primaryExpertise: gf.primaryExpertise,
    secondaryExpertises: gf.secondaryExpertises,
    generationTag: gf.generationTag,
    influenceTier: gf.influenceTier,
    redFlags: gf.redFlags,
    aiProfileSummary: gf.aiProfileSummary,
    aiStrengths: gf.aiStrengths,
    aiWeaknesses: gf.aiWeaknesses,
    aiBestStudyTypes: gf.aiBestStudyTypes,
    aiRecommendedBrands: gf.aiRecommendedBrands,
    processingStatus: gf.processingStatus,
    generatedAt: gf.generatedAt.toISOString(),
  } : null;

  return <AdminParticipantDetailClient profile={serialized} ghostFile={ghostFile} />;
}
