import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendRewardAvailable } from "@/lib/resend/emails";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  // Pour ne rembourser une absence qu'une fois, même si le statut est renvoyé deux fois.
  const before = await prisma.interview.findUnique({
    where: { id },
    select: { application: { select: { status: true } } },
  });

  const interview = await prisma.interview.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    },
    include: {
      application: {
        include: {
          study: { select: { rewardAmount: true, rewardType: true, voucherBrand: true, title: true, brandProfileId: true } },
          participantProfile: { include: { user: { select: { email: true } } } },
          reward: { select: { id: true } },
        },
      },
    },
  });

  if (status === "completed") {
    await prisma.application.update({
      where: { id: interview.applicationId },
      data: { status: "COMPLETED" },
    });

    // Auto-create reward if not already exists
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

      // Notify participant
      const { email } = interview.application.participantProfile.user;
      await sendRewardAvailable(
        email,
        interview.application.participantProfile.firstName,
        reward.amountCents,
        reward.type as "CASH" | "VOUCHER"
      ).catch(() => null);
    }
  }

  if (status === "no_show") {
    await prisma.application.update({
      where: { id: interview.applicationId },
      data: { status: "NO_SHOW" },
    });

    // Absence : la marque récupère ce qu'elle a payé pour ce profil.
    const paid = interview.application.priceCredits ?? 0;
    if (paid > 0 && before?.application.status !== "NO_SHOW") {
      const brandProfileId = interview.application.study.brandProfileId;
      await prisma.$transaction(async (tx) => {
        const b = await tx.brandProfile.update({
          where: { id: brandProfileId },
          data: { credits: { increment: paid } },
          select: { credits: true },
        });
        await tx.creditTransaction.create({
          data: {
            brandProfileId, type: "REFUND", amount: paid, balanceAfter: b.credits,
            description: `Absence remboursée · ${interview.application.participantProfile.firstName}`,
            studyId: interview.studyId,
          },
        });
      });
    }
    // Si cet absent était le dernier entretien attendu, les autres sont peut-être
    // tous transcrits : on tente le rapport sans attendre une action manuelle.
    await generateAndStoreReportFromTranscripts(interview.studyId, { requireAll: true }).catch(() => null);
  }

  return NextResponse.json({ ok: true, interview });
}
