"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendStudySubmittedAdmin } from "@/lib/resend/emails";

type StudyCreateData = {
  title: string;
  objective: string;
  studyType: "ONE_ON_ONE" | "FOCUS_GROUP";
  targetCount: number;
  language: string;
  ageMin: number;
  ageMax: number;
  cities: string[];
  interests: string[];
  brandAffinities: string[];
  profession: string;
  customCriteria: string;
  exclusionCriteria: string;
  deadlineAt: string;
  interviewDuration: number;
  timeSlots: string[];
  rewardType: "CASH" | "VOUCHER";
  rewardAmount: number;
  voucherBrand: string;
};

export async function createStudy(data: StudyCreateData) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { brandProfile: true },
  });
  if (!dbUser?.brandProfile) throw new Error("Brand profile not found");
  if (!dbUser.brandProfile.isActivated) throw new Error("preview_mode");

  const study = await prisma.study.create({
    data: {
      brandProfileId: dbUser.brandProfile.id,
      title: data.title.trim(),
      objective: data.objective.trim(),
      studyType: data.studyType,
      status: "ACTIVE",
      targetParticipantCount: data.targetCount,
      preferredLanguage: data.language,
      deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
      interviewDuration: data.interviewDuration,
      rewardAmount: data.rewardAmount,
      rewardType: data.rewardType,
      voucherBrand: data.voucherBrand || null,
      targetCriteria: {
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        cities: data.cities,
        interests: data.interests,
        brandAffinities: data.brandAffinities,
        profession: data.profession,
        custom: data.customCriteria,
      },
      exclusionCriteria: data.exclusionCriteria ? { text: data.exclusionCriteria } : undefined,
    },
  });

  // Create time slots
  if (data.timeSlots.length > 0) {
    await prisma.studyTimeSlot.createMany({
      data: data.timeSlots.map((slot) => ({
        studyId: study.id,
        startTime: new Date(slot),
        endTime: new Date(new Date(slot).getTime() + data.interviewDuration * 60 * 1000),
        capacity: data.studyType === "FOCUS_GROUP" ? 8 : 1,
      })),
    });
  }

  // Notify admin
  await sendStudySubmittedAdmin(data.title, dbUser.brandProfile.companyName).catch(() => {});

  revalidatePath("/brand/studies");
  return { studyId: study.id };
}

export async function acceptApplication(applicationId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { brandProfile: true },
  });
  if (!dbUser?.brandProfile) throw new Error("Brand profile not found");

  // Check credits
  if (dbUser.brandProfile.credits < 1) {
    return { error: "not_enough_credits" };
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { studyId: true },
  });

  // Deduct 1 credit + update application status + record transaction
  await prisma.$transaction([
    prisma.brandProfile.update({
      where: { id: dbUser.brandProfile.id },
      data: { credits: { decrement: 1 } },
    }),
    prisma.application.update({
      where: { id: applicationId },
      data: { brandAccepted: true, status: "INVITED" },
    }),
    prisma.creditTransaction.create({
      data: {
        brandProfileId: dbUser.brandProfile.id,
        type: "CONSUME",
        amount: -1,
        balanceAfter: dbUser.brandProfile.credits - 1,
        description: "Participant accepté",
        studyId: application?.studyId,
      },
    }),
  ]);

  revalidatePath("/brand/studies");
  return { ok: true };
}

export async function shortlistParticipant(studyId: string, participantProfileId: string, note?: string) {
  await prisma.application.upsert({
    where: { studyId_participantProfileId: { studyId, participantProfileId } },
    create: { studyId, participantProfileId, status: "SHORTLISTED", adminMatchNote: note ?? null },
    update: { status: "SHORTLISTED", adminMatchNote: note ?? null },
  });
  revalidatePath(`/admin/studies/${studyId}`);
  revalidatePath("/admin/matching");
  return { ok: true };
}

export async function updateStudyStatus(studyId: string, status: string) {
  await prisma.study.update({
    where: { id: studyId },
    data: { status: status as never },
  });
  revalidatePath(`/admin/studies/${studyId}`);
  revalidatePath("/admin/studies");
  return { ok: true };
}

export async function verifyParticipant(participantId: string, decision: "VERIFIED" | "REJECTED", reason?: string) {
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: {
      idVerificationStatus: decision,
      idVerifiedAt: decision === "VERIFIED" ? new Date() : null,
      ...(reason ? { blacklistReason: reason } : {}),
    },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/verifications");
  return { ok: true };
}

export async function blacklistParticipant(participantId: string, reason: string) {
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: { isBlacklisted: true, blacklistReason: reason },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/participants");
  return { ok: true };
}

export async function unblacklistParticipant(participantId: string) {
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: { isBlacklisted: false, blacklistReason: null },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/participants");
  return { ok: true };
}

export async function addAdminNote(participantId: string, note: string) {
  await prisma.adminNote.create({
    data: { participantProfileId: participantId, note },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  return { ok: true };
}

export async function rejectApplication(applicationId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      brandAccepted: false,
      status: "REJECTED",
      brandNote: reason ?? null,
    },
  });

  revalidatePath("/brand/studies");
  return { ok: true };
}
