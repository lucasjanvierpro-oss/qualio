import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Called when participant returns from Stripe Connect onboarding (?connect=success)
// Fetches the real account status from Stripe and updates the DB.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true, stripeConnectId: true } } },
  });

  const profile = dbUser?.participantProfile;
  if (!profile?.stripeConnectId) {
    return NextResponse.json({ status: "no_account" });
  }

  const account = await stripe.accounts.retrieve(profile.stripeConnectId);

  const isActive =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted;

  const newStatus = isActive ? "active" : account.details_submitted ? "restricted" : "pending";

  await prisma.participantProfile.update({
    where: { id: profile.id },
    data: { stripeConnectStatus: newStatus },
  });

  return NextResponse.json({ status: newStatus });
}
