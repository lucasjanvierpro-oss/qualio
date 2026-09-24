import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/appUrl";
import { getPricingConfig } from "@/lib/pricing/quotes";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Les packs viennent des réglages de prix : une seule grille pour le site,
  // le compte marque et le paiement.
  const { packId } = await request.json() as { packId?: string };
  const pack = (await getPricingConfig()).packs.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { brandProfile: true },
  });
  if (!dbUser?.brandProfile) return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });

  let stripeCustomerId = dbUser.brandProfile.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      metadata: { brandProfileId: dbUser.brandProfile.id },
    });
    stripeCustomerId = customer.id;
    await prisma.brandProfile.update({
      where: { id: dbUser.brandProfile.id },
      data: { stripeCustomerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: pack.priceCents,
        product_data: {
          name: `Pack ${pack.label} · ${pack.credits} crédits Rarelyst`,
          description: `${pack.credits} crédits, 1 crédit = 10 € HT`,
        },
      },
      quantity: 1,
    }],
    success_url: `${appUrl()}/brand/account?checkout=credits_success`,
    cancel_url: `${appUrl()}/brand/account`,
    metadata: {
      brandProfileId: dbUser.brandProfile.id,
      type: "credit_pack",
      credits: String(pack.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
