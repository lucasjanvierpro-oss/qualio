import { prisma } from "@/lib/prisma";
import MatchingClient from "./MatchingClient";

// Page admin — toujours rendue à la demande (jamais prérendue au build)
export const dynamic = "force-dynamic";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminMatchingPage() {
  const [studies, profiles] = await Promise.all([
    prisma.study.findMany({
      where: { status: { in: ["ACTIVE", "MATCHING"] } },
      orderBy: { deadlineAt: "asc" },
      include: {
        brandProfile: { select: { companyName: true } },
        applications: { select: { participantProfileId: true, status: true } },
      },
    }),
    prisma.participantProfile.findMany({
      where: { isBlacklisted: false },
      orderBy: { participationCount: "desc" },
    }),
  ]);

  const serializedStudies = studies.map((s) => {
    const criteria = (s.targetCriteria ?? {}) as Record<string, unknown>;
    const confirmed = s.applications.filter((a) => a.status === "CONFIRMED").length;
    const shortlistedIds = s.applications
      .filter((a) => ["SHORTLISTED", "INVITED", "CONFIRMED"].includes(a.status))
      .map((a) => a.participantProfileId);

    return {
      id: s.id,
      brand: s.brandProfile.companyName,
      title: s.title,
      objective: s.objective,
      deadline: s.deadlineAt?.toISOString() ?? null,
      confirmed,
      target: s.targetParticipantCount,
      criteria: {
        ageMin: (criteria.ageMin as number) ?? undefined,
        ageMax: (criteria.ageMax as number) ?? undefined,
        cities: (criteria.cities as string[]) ?? [],
        interests: (criteria.interests as string[]) ?? [],
        brandAffinities: (criteria.brandAffinities as string[]) ?? [],
        profession: (criteria.profession as string) ?? "",
        custom: (criteria.custom as string) ?? "",
      },
      shortlistedIds,
    };
  });

  const serializedParticipants = profiles.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    city: p.city,
    age: calcAge(p.dateOfBirth),
    profession: p.profession,
    interests: p.interests,
    brandAffinities: p.brandAffinities,
    bio: p.bio,
    screenerAnswers: p.screenerAnswers as Record<string, string> | null,
  }));

  return <MatchingClient studies={serializedStudies} participants={serializedParticipants} />;
}
