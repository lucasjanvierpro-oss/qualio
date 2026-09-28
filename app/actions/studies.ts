"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertAdmin, getSessionUser } from "@/lib/auth/guards";
import { sendAvailabilityRequested } from "@/lib/resend/emails";
import { sendStudySubmittedAdmin } from "@/lib/resend/emails";
import { getPricingConfig, priceProfiles } from "@/lib/pricing/quotes";
import { DURATIONS, type BriefProfile, type Duration } from "@/lib/studies/briefTypes";
import { recordDemand } from "@/lib/lab/demand";

export type StudyInput = {
  /** Le brief tel que donné : texte écrit, et texte du document s'il a pu être lu. */
  brief: string;
  briefFileName: string | null;
  title: string;
  objective: string;
  profiles: BriefProfile[];
  studyType: "ONE_ON_ONE" | "FOCUS_GROUP";
  duration: number;
  language: "fr" | "en";
  ageMin: number | null;
  ageMax: number | null;
  cities: string[];
  brandAffinities: string[];
  exclusions: string;
  decisions: string[];
  guide: string[];
  deadlineAt: string | null;
  /** Moments où la marque peut mener les entretiens : matin, midi, après-midi, soir. */
  availability: string[];
};

const clean = (v: string, max: number) => v.trim().slice(0, max);
const cleanList = (v: string[], max: number, len = 300) => v.map((x) => clean(x, len)).filter(Boolean).slice(0, max);

export async function createStudy(data: StudyInput): Promise<{ studyId: string } | { error: string }> {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return { error: "session_expired" };
  const brand = await prisma.brandProfile.findUnique({
    where: { id: me.brandProfileId },
    select: { id: true, isActivated: true, companyName: true },
  });
  if (!brand) return { error: "session_expired" };
  if (!brand.isActivated) return { error: "preview_mode" };

  const profiles = data.profiles
    .map((p) => ({ label: clean(p.label, 80), count: Math.max(1, Math.min(20, Math.round(p.count) || 1)), details: clean(p.details, 300) }))
    .filter((p) => p.label)
    .slice(0, 4);
  const total = profiles.reduce((n, p) => n + p.count, 0);
  const title = clean(data.title, 90);
  const objective = clean(data.objective, 1200);
  if (title.length < 3) return { error: "Donnez un titre à l'étude." };
  if (objective.length < 10) return { error: "Dites en une ou deux phrases ce que vous voulez comprendre." };
  if (profiles.length === 0) return { error: "Décrivez au moins un profil à interroger." };
  if (total > 30) return { error: "30 entretiens au maximum par étude : écrivez-nous pour davantage." };
  const duration = DURATIONS.includes(data.duration as Duration) ? data.duration : 45;
  const deadline = data.deadlineAt ? new Date(data.deadlineAt) : null;

  const cfg = await getPricingConfig();
  const study = await prisma.study.create({
    data: {
      brandProfileId: brand.id,
      title,
      objective,
      studyType: data.studyType === "FOCUS_GROUP" ? "FOCUS_GROUP" : "ONE_ON_ONE",
      status: "ACTIVE",
      targetParticipantCount: total,
      preferredLanguage: data.language === "en" ? "en" : "fr",
      deadlineAt: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
      interviewDuration: duration,
      // Montant de secours seulement : le vrai se fixe par profil au moment de la présélection.
      rewardAmount: cfg.tiers.averti.participantPayCents,
      rewardType: "CASH",
      brief: clean(data.brief, 80_000) || null,
      briefFileName: data.briefFileName ? clean(data.briefFileName, 160) : null,
      decisions: cleanList(data.decisions, 5),
      guide: cleanList(data.guide, 12),
      // Mêmes clés qu'avant pour l'appariement admin, plus les groupes de profils.
      targetCriteria: {
        ageMin: data.ageMin ?? undefined,
        ageMax: data.ageMax ?? undefined,
        cities: cleanList(data.cities, 8, 60),
        interests: [],
        brandAffinities: cleanList(data.brandAffinities, 10, 60),
        profession: profiles.map((p) => p.label).join(" · "),
        custom: profiles.map((p) => `${p.label} (${p.count}) : ${p.details}`).join("\n"),
        profiles,
        availability: cleanList(data.availability, 5, 20),
      },
      exclusionCriteria: data.exclusions.trim() ? { text: clean(data.exclusions, 400) } : undefined,
    },
  });

  after(async () => {
    await sendStudySubmittedAdmin(title, brand.companyName).catch(() => {});
    // Ce que les vraies marques demandent : c'est ce qui apprend qui recruter.
    await recordDemand("study", study.id, profiles).catch((e) => console.error("[demande]", e));
  });

  revalidatePath("/brand/studies");
  revalidatePath("/admin");
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
