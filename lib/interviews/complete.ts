import { prisma } from "@/lib/prisma";
import { langOf, sendAsyncRejected, sendRewardAvailable } from "@/lib/resend/emails";
import { grantReferralBonuses } from "@/lib/referral/referral";

// Clore un entretien et payer le participant : utilisé par l'admin (changement
// de statut) et par la validation des réponses en autonomie.

/** Entretien terminé : candidature close, récompense créée une seule fois, primes de parrainage. */
export async function completeInterview(interviewId: string) {
  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "completed", completedAt: new Date() },
    include: {
      application: {
        include: {
          study: { select: { rewardAmount: true, rewardType: true, voucherBrand: true } },
          participantProfile: { include: { user: { select: { email: true } } } },
          reward: { select: { id: true } },
        },
      },
    },
  });
  await prisma.application.update({ where: { id: interview.applicationId }, data: { status: "COMPLETED" } });

  if (!interview.application.reward) {
    const reward = await prisma.reward.create({
      data: {
        applicationId: interview.applicationId,
        participantProfileId: interview.application.participantProfileId,
        type: interview.application.study.rewardType,
        // Le montant fixé par le moteur de prix ; l'ancien montant de l'étude sinon.
        amountCents: interview.application.participantPayCents ?? interview.application.study.rewardAmount,
        status: "PENDING",
        voucherBrand: interview.application.study.voucherBrand,
      },
    });
    const pp = interview.application.participantProfile;
    await sendRewardAvailable(pp.user.email, pp.firstName, reward.amountCents, reward.type as "CASH" | "VOUCHER", langOf(pp.preferredLanguage)).catch(() => null);
  }

  // Parrainage : l'entretien est mené et payé, les primes peuvent naître.
  await grantReferralBonuses(interview.applicationId).catch((e) => console.error("[referral]", e));
  return interview;
}

/**
 * Réponse en autonomie refusée (bâclée, hors sujet, questions sautées) : pas
 * de récompense, la marque récupère ses crédits une fois, le participant est
 * prévenu avec la raison. La réponse ne compte plus dans la synthèse.
 */
export async function rejectAsyncAnswer(interviewId: string, reason: string) {
  const iv = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfileId: true } },
          participantProfile: { select: { firstName: true, preferredLanguage: true, user: { select: { email: true } } } },
          reward: { select: { id: true } },
        },
      },
    },
  });
  if (!iv) return { error: "Réponse introuvable." };
  if (iv.application.reward) return { error: "Cette réponse a déjà été payée." };
  const already = iv.application.status === "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.interview.update({ where: { id: interviewId }, data: { status: "rejected" } });
    await tx.application.update({ where: { id: iv.applicationId }, data: { status: "REJECTED" } });
    await tx.interviewIncident.create({
      data: { interviewId, applicationId: iv.applicationId, studyId: iv.application.study.id, byRole: "admin", kind: "quality", reason: reason.slice(0, 1000) },
    });
    const paid = iv.application.priceCredits ?? 0;
    if (paid > 0 && !already) {
      const brandProfileId = iv.application.study.brandProfileId;
      const b = await tx.brandProfile.update({ where: { id: brandProfileId }, data: { credits: { increment: paid } }, select: { credits: true } });
      await tx.creditTransaction.create({
        data: { brandProfileId, type: "REFUND", amount: paid, balanceAfter: b.credits, description: `Réponse non validée · ${iv.application.participantProfile.firstName}`, studyId: iv.application.study.id },
      });
    }
  });

  const pp = iv.application.participantProfile;
  await sendAsyncRejected(pp.user.email, pp.firstName, iv.application.study.title, reason, langOf(pp.preferredLanguage)).catch(() => null);
  return { ok: true as const };
}
