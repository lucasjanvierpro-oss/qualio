import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VerificationClient from "./VerificationClient";

export default async function ParticipantVerificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        select: {
          id: true,
          idVerificationStatus: true,
          idDocumentUrl: true,
          idVerifiedAt: true,
          firstName: true,
        },
      },
    },
  });

  const profile = dbUser?.participantProfile;
  if (!profile) redirect("/participant/onboarding");

  return (
    <VerificationClient
      profileId={profile.id}
      status={profile.idVerificationStatus}
      hasDocument={!!profile.idDocumentUrl}
      verifiedAt={profile.idVerifiedAt?.toISOString() ?? null}
      firstName={profile.firstName}
    />
  );
}
