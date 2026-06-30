import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Credit pack purchase ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const brandProfileId = meta.brandProfileId;
        if (!brandProfileId) break;

        if (meta.type === "credit_pack") {
          const credits = parseInt(meta.credits ?? "0");
          const profile = await prisma.brandProfile.findUnique({ where: { id: brandProfileId } });
          if (!profile) break;
          await prisma.$transaction([
            prisma.brandProfile.update({
              where: { id: brandProfileId },
              data: { credits: { increment: credits } },
            }),
            prisma.creditTransaction.create({
              data: {
                brandProfileId,
                type: "PURCHASE",
                amount: credits,
                balanceAfter: profile.credits + credits,
                description: `Pack ${credits} crédits acheté`,
                stripePaymentIntentId: session.payment_intent as string ?? null,
              },
            }),
          ]);
        }
        break;
      }

      // ── Stripe Connect — participant onboarding complete ─────────────────
      // Fires when a Connect Express account's status changes.
      // charges_enabled + payouts_enabled = the account can receive transfers.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const isActive =
          account.charges_enabled &&
          account.payouts_enabled &&
          account.details_submitted;

        const newStatus = isActive
          ? "active"
          : account.details_submitted
          ? "restricted"
          : "pending";

        await prisma.participantProfile.updateMany({
          where: { stripeConnectId: account.id },
          data: { stripeConnectStatus: newStatus },
        });
        break;
      }

      // ── Connect account deauthorized by participant ──────────────────────
      case "account.application.deauthorized": {
        const payload = event.data.object as { id: string };
        await prisma.participantProfile.updateMany({
          where: { stripeConnectId: payload.id },
          data: { stripeConnectStatus: "pending", stripeConnectId: null },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook]", err);
    // Return 200 — Stripe retries on 5xx but app-level errors shouldn't block processing
    return NextResponse.json({ received: true, warning: "handler_error" });
  }

  return NextResponse.json({ received: true });
}
