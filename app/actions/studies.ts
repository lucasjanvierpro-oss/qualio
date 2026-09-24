"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertAdmin, getSessionUser } from "@/lib/auth/guards";
import { sendAvailabilityRequested } from "@/lib/resend/emails";
import { sendStudySubmittedAdmin } from "@/lib/resend/emails";
import { priceProfiles } from "@/lib/pricing/quotes";

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

export async function acceptApplication(applicationId: string, expectedCredits?: number) {
  const me = await getSessionUser();
  // Une session expire au bout d'une heure. Lever une exception ici ferait
  // tomber la page entière sur un écran d'erreur, au lieu de proposer
  // simplement de se reconnecter.
  if (!me?.brandProfileId) return { error: "session_expired" as const };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      studyId: true,
      status: true,
      participantProfileId: true,
      priceCredits: true,
      participantPayCents: true,
      priceBreakdown: true,
      study: { select: { brandProfileId: true, title: true, interviewDuration: true, studyType: true } },
      participantProfile: { select: { firstName: true, accessTier: true, user: { select: { email: true } } } },
    },
  });
  if (!application || application.study.brandProfileId !== me.brandProfileId) {
    return { error: "not_found" };
  }
  if (application.status !== "SHORTLISTED" && application.status !== "PENDING") {
    return { error: "already_decided" };
  }
  // Un profil sur demande ne s'achète pas au crédit : il se demande.
  if (application.participantProfile.accessTier === "ON_REQUEST") return { error: "on_request" };

  // Le prix est recalculé ici, jamais pris au navigateur. Si la marque a vu un
  // autre montant (la demande a bougé entre-temps), on le lui dit plutôt que
  // de débiter une somme qu'elle n'a pas validée.
  // Prix fixé à la proposition s'il existe, sinon calculé maintenant.
  let q: { credits: number; participantPayCents: number; tier: string; multiplier: number; factors: unknown; overridden: boolean; marginCents: number };
  if (application.priceCredits && application.participantPayCents) {
    const b = (application.priceBreakdown ?? {}) as { tier?: string; multiplier?: number; factors?: unknown; overridden?: boolean; marginCents?: number };
    q = {
      credits: application.priceCredits, participantPayCents: application.participantPayCents,
      tier: b.tier ?? "averti", multiplier: b.multiplier ?? 1, factors: b.factors ?? [], overridden: !!b.overridden,
      marginCents: b.marginCents ?? 0,
    };
  } else {
    const pricing = (await priceProfiles([application.participantProfileId], {
      durationMin: application.study.interviewDuration,
      focusGroup: application.study.studyType === "FOCUS_GROUP",
    })).get(application.participantProfileId);
    if (!pricing) return { error: "not_found" };
    q = pricing.quote;
  }
  if (expectedCredits !== undefined && expectedCredits !== q.credits) return { error: "price_changed" };

  // Tout ou rien, et conditionné à l'état attendu : si deux clics arrivent en
  // même temps, un seul passe la condition et un seul prix est débité.
  const outcome = await prisma.$transaction(async (tx) => {
    const debited = await tx.brandProfile.updateMany({
      where: { id: me.brandProfileId!, credits: { gte: q.credits } },
      data: { credits: { decrement: q.credits } },
    });
    if (debited.count === 0) return "not_enough_credits" as const;

    const moved = await tx.application.updateMany({
      where: { id: applicationId, status: { in: ["SHORTLISTED", "PENDING"] } },
      data: {
        brandAccepted: true,
        status: "INVITED",
        priceCredits: q.credits,
        participantPayCents: q.participantPayCents,
        priceBreakdown: { tier: q.tier, multiplier: q.multiplier, factors: q.factors as object, overridden: q.overridden, marginCents: q.marginCents },
      },
    });
    if (moved.count === 0) throw new Error("already_decided");

    const brand = await tx.brandProfile.findUniqueOrThrow({
      where: { id: me.brandProfileId! },
      select: { credits: true },
    });
    await tx.creditTransaction.create({
      data: {
        brandProfileId: me.brandProfileId!,
        type: "CONSUME",
        amount: -q.credits,
        balanceAfter: brand.credits,
        description: `Profil accepté · ${application.participantProfile.firstName}`,
        studyId: application.studyId,
      },
    });
    return "ok" as const;
  }).catch((e: Error) => (e.message === "already_decided" ? ("already_decided" as const) : Promise.reject(e)));

  if (outcome === "not_enough_credits") return { error: outcome, needed: q.credits };
  if (outcome !== "ok") return { error: outcome };

  // Le participant est invité à proposer ses disponibilités : c'est à la marque
  // de s'adapter à ces profils rares. L'email part après la réponse — il ne doit
  // pas retarder l'affichage.
  after(async () => {
    await sendAvailabilityRequested(
      application.participantProfile.user.email,
      application.participantProfile.firstName,
      application.study.title,
      applicationId
    ).catch(() => null);
  });

  revalidatePath("/brand/studies");
  return { ok: true };
}

export async function shortlistParticipant(studyId: string, participantProfileId: string, note?: string) {
  await assertAdmin();
  // Le prix est fixé au moment où le profil est proposé : la marque voit un
  // montant qui ne bouge plus, le participant sait ce qu'il touchera.
  const study = await prisma.study.findUniqueOrThrow({ where: { id: studyId }, select: { interviewDuration: true, studyType: true } });
  const q = (await priceProfiles([participantProfileId], {
    durationMin: study.interviewDuration,
    focusGroup: study.studyType === "FOCUS_GROUP",
  })).get(participantProfileId)?.quote;
  const price = q ? {
    priceCredits: q.credits,
    participantPayCents: q.participantPayCents,
    priceBreakdown: { tier: q.tier, multiplier: q.multiplier, factors: q.factors, overridden: q.overridden, marginCents: q.marginCents },
  } : {};
  await prisma.application.upsert({
    where: { studyId_participantProfileId: { studyId, participantProfileId } },
    create: { studyId, participantProfileId, status: "SHORTLISTED", adminMatchNote: note ?? null, ...price },
    update: { status: "SHORTLISTED", adminMatchNote: note ?? null, ...price },
  });
  revalidatePath(`/admin/studies/${studyId}`);
  revalidatePath("/admin/matching");
  return { ok: true };
}

export async function updateStudyStatus(studyId: string, status: string) {
  await assertAdmin();
  await prisma.study.update({
    where: { id: studyId },
    data: { status: status as never },
  });
  revalidatePath(`/admin/studies/${studyId}`);
  revalidatePath("/admin/studies");
  return { ok: true };
}

export async function verifyParticipant(participantId: string, decision: "VERIFIED" | "REJECTED", reason?: string) {
  await assertAdmin();
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
  await assertAdmin();
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: { isBlacklisted: true, blacklistReason: reason },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/participants");
  return { ok: true };
}

export async function unblacklistParticipant(participantId: string) {
  await assertAdmin();
  await prisma.participantProfile.update({
    where: { id: participantId },
    data: { isBlacklisted: false, blacklistReason: null },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/participants");
  return { ok: true };
}

export async function addAdminNote(participantId: string, note: string) {
  await assertAdmin();
  await prisma.adminNote.create({
    data: { participantProfileId: participantId, note },
  });
  revalidatePath(`/admin/participants/${participantId}`);
  return { ok: true };
}

export async function rejectApplication(applicationId: string, reason?: string) {
  const me = await getSessionUser();
  if (!me) return { error: "session_expired" as const };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { study: { select: { brandProfileId: true } } },
  });
  const owns = me.role === "ADMIN" || (me.brandProfileId && application?.study.brandProfileId === me.brandProfileId);
  if (!application || !owns) return { error: "not_found" };

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
