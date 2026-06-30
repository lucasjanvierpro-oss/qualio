import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendRewardAvailable } from "@/lib/resend/emails";

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

  const interview = await prisma.interview.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    },
    include: {
      application: {
        include: {
          study: { select: { rewardAmount: true, rewardType: true, voucherBrand: true, title: true } },
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
          amountCents: interview.application.study.rewardAmount,
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
  }

  return NextResponse.json({ ok: true, interview });
}
