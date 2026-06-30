import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const CREDIT_PACKS = [
  { credits: 5,  priceCents: 7500 },
  { credits: 15, priceCents: 19500 },
  { credits: 30, priceCents: 36000 },
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { credits } = await request.json() as { credits: number };
  const pack = CREDIT_PACKS.find((p) => p.credits === credits);
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
          name: `Pack ${pack.credits} crédits Qualio`,
          description: `${pack.credits} participants confirmés`,
        },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/brand/account?checkout=credits_success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/brand/account`,
    metadata: {
      brandProfileId: dbUser.brandProfile.id,
      type: "credit_pack",
      credits: String(pack.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
