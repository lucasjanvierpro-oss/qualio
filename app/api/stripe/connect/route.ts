import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: true },
  });
  if (!dbUser?.participantProfile) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

  let connectId = dbUser.participantProfile.stripeConnectId;

  if (!connectId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: dbUser.email,
      capabilities: { transfers: { requested: true } },
    });
    connectId = account.id;
    await prisma.participantProfile.update({
      where: { id: dbUser.participantProfile.id },
      data: { stripeConnectId: connectId, stripeConnectStatus: "pending" },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/participant/wallet?connect=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/participant/wallet?connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
