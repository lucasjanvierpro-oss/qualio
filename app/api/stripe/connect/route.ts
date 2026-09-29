import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/appUrl";
import { stripeReady } from "@/lib/payouts/payouts";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripeReady()) return NextResponse.json({ error: "Les retraits ouvrent très bientôt : vos gains restent en sécurité dans votre solde." }, { status: 503 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: true },
  });
  if (!dbUser?.participantProfile) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

  try {
    return NextResponse.json({ url: await onboardingUrl(dbUser.email, dbUser.participantProfile) });
  } catch (e) {
    console.error("[connect]", e);
    return NextResponse.json({ error: "Stripe ne répond pas pour l'instant. Réessayez dans quelques minutes." }, { status: 502 });
  }
}

async function onboardingUrl(email: string, p: { id: string; firstName: string; lastName: string; stripeConnectId: string | null }) {
  let connectId = p.stripeConnectId;

  if (!connectId) {
    // Pré-rempli pour un particulier : Stripe ne lui demande ni site web ni
    // secteur d'activité, seulement son identité et son IBAN.
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email,
      business_type: "individual",
      individual: {
        email,
        ...(p.firstName ? { first_name: p.firstName } : {}),
        ...(p.lastName ? { last_name: p.lastName } : {}),
      },
      business_profile: {
        mcc: "7299",
        product_description: "Participation rémunérée à des entretiens d'étude qualitative sur Rarelyst (rarelyst.co).",
      },
      capabilities: { transfers: { requested: true } },
      metadata: { participantProfileId: p.id },
    });
    connectId = account.id;
    await prisma.participantProfile.update({
      where: { id: p.id },
      data: { stripeConnectId: connectId, stripeConnectStatus: "pending" },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${appUrl()}/participant/wallet?connect=refresh`,
    return_url: `${appUrl()}/participant/wallet?connect=success`,
    type: "account_onboarding",
  });

  return accountLink.url;
}
