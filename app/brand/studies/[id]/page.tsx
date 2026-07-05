import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import StudyDetailClient from "./StudyDetailClient";

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      brandProfile: {
        include: {
          studies: {
            where: { id },
            include: {
              applications: {
                include: {
                  participantProfile: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      dateOfBirth: true,
                      city: true,
                      profession: true,
                      interests: true,
                      bio: true,
                      brandSummary: true,
                      screenerAnswers: true,
                    },
                  },
                },
              },
              timeSlots: true,
            },
          },
        },
      },
    },
  });

  const study = dbUser?.brandProfile?.studies?.[0];

  // Fall back to mock data for study ID "1" (demo purposes)
  if (!study && id !== "1") notFound();

  const credits = dbUser?.brandProfile?.credits ?? 12;

  return <StudyDetailClient study={study ?? null} studyId={id} credits={credits} />;
}
