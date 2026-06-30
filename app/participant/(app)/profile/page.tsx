import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParticipantProfileClient from "./ParticipantProfileClient";

export default async function ParticipantProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: true },
  });

  const profile = dbUser?.participantProfile;
  if (!profile) redirect("/participant/onboarding");

  return (
    <ParticipantProfileClient
      profile={{
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth?.toISOString().split("T")[0] ?? "",
        city: profile.city ?? "",
        country: profile.country,
        profession: profile.profession ?? "",
        bio: profile.bio ?? "",
        interests: profile.interests,
        brandAffinities: profile.brandAffinities,
        linkedinUrl: profile.linkedinUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        tiktokUrl: profile.tiktokUrl ?? "",
        idVerificationStatus: profile.idVerificationStatus,
        stripeConnectStatus: profile.stripeConnectStatus,
      }}
    />
  );
}
