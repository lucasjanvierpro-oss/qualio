import { prisma } from "@/lib/prisma";
import AdminVerificationsClient from "./AdminVerificationsClient";

export const dynamic = "force-dynamic";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default async function AdminVerificationsPage() {
  const [profiles, recentlyProcessed] = await Promise.all([
    prisma.participantProfile.findMany({
      where: {
        idVerificationStatus: "PENDING",
        idDocumentUrl: { not: null },
      },
      orderBy: { updatedAt: "asc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.participantProfile.findMany({
      where: {
        idVerificationStatus: { in: ["VERIFIED", "REJECTED"] },
        idVerifiedAt: { not: null },
      },
      orderBy: { idVerifiedAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const queue = profiles.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.user.email,
    age: calcAge(p.dateOfBirth),
    city: p.city,
    profession: p.profession,
    idDocumentUrl: p.idDocumentUrl!,
    submittedAt: p.updatedAt.toISOString(),
    interests: p.interests,
    bio: p.bio,
  }));

  const processed = recentlyProcessed.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    status: p.idVerificationStatus,
    idVerifiedAt: p.idVerifiedAt?.toISOString() ?? null,
    blacklistReason: p.blacklistReason,
  }));

  return <AdminVerificationsClient queue={queue} processed={processed} />;
}
