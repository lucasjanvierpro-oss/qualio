import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const reward = await prisma.reward.findUnique({
    where: { id },
    include: {
      participantProfile: { select: { stripeConnectId: true, firstName: true, lastName: true } },
    },
  });

  if (!reward) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (reward.type !== "CASH") return NextResponse.json({ error: "not_cash" }, { status: 400 });
  if (reward.status !== "PENDING") return NextResponse.json({ error: "not_pending" }, { status: 400 });

  if (!reward.participantProfile.stripeConnectId) {
    // Mark as PAID without actual transfer if no Connect account (will need manual follow-up)
    const updated = await prisma.reward.update({
      where: { id },
      data: { status: "PROCESSING", paidAt: new Date() },
    });
    return NextResponse.json({ reward: updated, note: "no_connect_account" });
  }

  try {
    const stripe = getStripe();
    const transfer = await stripe.transfers.create({
      amount: reward.amountCents,
      currency: "eur",
      destination: reward.participantProfile.stripeConnectId,
      description: `Qualio reward — ${reward.participantProfile.firstName} ${reward.participantProfile.lastName}`,
      metadata: { rewardId: reward.id },
    });

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        status: "PAID",
        stripeTransferId: transfer.id,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ reward: updated, transfer: transfer.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "stripe_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
