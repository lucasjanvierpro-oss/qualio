import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

// Lien d'accès à l'espace Stripe du participant : changer d'IBAN, suivre ses
// virements. Valable quelques minutes, créé à la demande.
export async function POST() {
  const u = await getSessionUser();
  if (!u?.participantProfileId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const profile = await prisma.participantProfile.findUnique({ where: { id: u.participantProfileId }, select: { stripeConnectId: true } });
  if (!profile?.stripeConnectId) return NextResponse.json({ error: "no_account" }, { status: 404 });
  try {
    const link = await stripe.accounts.createLoginLink(profile.stripeConnectId);
    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("[connect-dashboard]", e);
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
}
