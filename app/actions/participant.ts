"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ProfileUpdate = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  country: string;
  profession: string;
  bio: string;
  linkedinUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  interests: string[];
  brandAffinities: string[];
};

export async function updateParticipantProfile(participantId: string, data: ProfileUpdate) {
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      city: data.city || null,
      country: data.country,
      profession: data.profession || null,
      bio: data.bio || null,
      linkedinUrl: data.linkedinUrl || null,
      instagramUrl: data.instagramUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      interests: data.interests,
      brandAffinities: data.brandAffinities,
    },
  });
  revalidatePath("/participant/profile");
  revalidatePath("/participant/dashboard");
  return { ok: true };
}
