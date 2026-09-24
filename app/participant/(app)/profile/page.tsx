import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParticipantProfileClient from "./ParticipantProfileClient";
import Showcase from "./Showcase";
import { TRUST_SELECT, trustFrom, badgesOf } from "@/lib/participants/trust";

export default async function ParticipantProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        include: {
          ghostFile: { select: { behaviours: true, processingStatus: true } },
          applications: { select: TRUST_SELECT },
        },
      },
    },
  });

  const profile = dbUser?.participantProfile;
  if (!profile) redirect("/signup/participant");

  // Le participant voit toutes ses médailles, y compris celles à confirmer ;
  // l'historique (notes, avis, marques) reste réservé aux marques.
  const trust = trustFrom(profile.applications);
  const badges = badgesOf(profile, profile.ghostFile?.processingStatus === "done" ? profile.ghostFile.behaviours : null, trust);

  return (
    <>
    <Showcase badges={badges} interviewsDone={trust.interviewsDone} />
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
    </>
  );
}
