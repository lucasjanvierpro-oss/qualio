import { prisma } from "@/lib/prisma";
import ParticipantsClient from "./ParticipantsClient";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminParticipantsPage() {
  const profiles = await prisma.participantProfile.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const participants = profiles.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    city: p.city,
    age: calcAge(p.dateOfBirth),
    profession: p.profession,
    interests: p.interests,
    status: p.idVerificationStatus as "PENDING" | "VERIFIED" | "REJECTED",
    participationCount: p.participationCount,
    isBlacklisted: p.isBlacklisted,
    email: p.user.email,
  }));

  return <ParticipantsClient participants={participants} />;
}
