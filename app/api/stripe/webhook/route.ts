import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { connectStatus } from "@/lib/stripe/connect";

// Deux points d'arrivée côté Stripe peuvent viser cette adresse : un pour les
// événements du compte Rarelyst (achats de crédits), un pour ceux des comptes
// connectés des participants. Chacun a sa clé de signature.
function verify(body: string, sig: string): Stripe.Event | null {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean) as string[];
  for (const secret of secrets) {
    try { return stripe.webhooks.constructEvent(body, sig, secret); } catch { /* clé suivante */ }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const event = verify(body, sig);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  try {
    switch (event.type) {

      // ── Credit pack purchase ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const brandProfileId = meta.brandProfileId;
        if (!brandProfileId) break;

        if (meta.type === "credit_pack" && session.payment_status === "paid") {
          const credits = parseInt(meta.credits ?? "0");
          if (!(credits > 0)) break;
          // Stripe renvoie parfois deux fois le même événement : un paiement
          // ne crédite qu'une fois.
          const paymentRef = (typeof session.payment_intent === "string" ? session.payment_intent : null) ?? session.id;
          await prisma.$transaction(async (tx) => {
            const already = await tx.creditTransaction.findFirst({ where: { stripePaymentIntentId: paymentRef }, select: { id: true } });
            if (already) return;
            const updated = await tx.brandProfile.update({
              where: { id: brandProfileId },
              data: { credits: { increment: credits } },
              select: { credits: true },
            });
            await tx.creditTransaction.create({
              data: {
                brandProfileId,
                type: "PURCHASE",
                amount: credits,
                balanceAfter: updated.credits,
                description: `Pack ${credits} crédits acheté`,
                stripePaymentIntentId: paymentRef,
              },
            });
          });
        }
        break;
      }

      // ── Stripe Connect — participant onboarding complete ─────────────────
      // Fires when a Connect Express account's status changes.
      // charges_enabled + payouts_enabled = the account can receive transfers.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const newStatus = connectStatus(account);

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
