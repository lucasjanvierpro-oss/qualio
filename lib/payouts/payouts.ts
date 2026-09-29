import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/client";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { eur } from "@/lib/pricing/config";
import { sendPayoutFailedAdmin, sendPayoutSent } from "@/lib/resend/emails";

// Retraits des participants, comme sur Vinted : les gains d'entretiens et les
// primes de parrainage s'accumulent dans un solde ; dès le minimum atteint, le
// participant vide son solde vers son compte bancaire. Le virement part par
// Stripe Connect depuis le solde Stripe de Rarelyst, puis Stripe le verse sur
// l'IBAN du participant.
//
// Un gain appartient à un seul retrait : `payoutId` le verrouille dès la
// demande, si bien que deux clics simultanés ne paient jamais deux fois.

export const stripeReady = () => !!process.env.STRIPE_SECRET_KEY;

export type Balance = { availableCents: number; inFlightCents: number; paidCents: number; minCents: number };

export async function participantBalance(profileId: string): Promise<Balance> {
  const [rewards, bonuses, cfg] = await Promise.all([
    prisma.reward.findMany({ where: { participantProfileId: profileId, type: "CASH" }, select: { status: true, amountCents: true, payoutId: true } }),
    prisma.referralBonus.findMany({ where: { beneficiaryId: profileId, status: { not: "cancelled" } }, select: { status: true, amountCents: true, payoutId: true } }),
    getPricingConfig(),
  ]);
  const sum = (xs: { amountCents: number }[]) => xs.reduce((n, x) => n + x.amountCents, 0);
  return {
    availableCents: sum(rewards.filter((r) => r.status === "PENDING" && !r.payoutId)) + sum(bonuses.filter((b) => b.status === "pending" && !b.payoutId)),
    inFlightCents: sum(rewards.filter((r) => r.status === "PROCESSING")) + sum(bonuses.filter((b) => b.status === "processing")),
    paidCents: sum(rewards.filter((r) => r.status === "PAID")) + sum(bonuses.filter((b) => b.status === "paid")),
    minCents: cfg.payoutMinCents,
  };
}

type Result = { ok: true; amountCents: number; sent: boolean } | { error: string };

/** Le participant vide son solde. Le virement part aussitôt si Stripe le permet. */
export async function requestPayout(profileId: string): Promise<Result> {
  const profile = await prisma.participantProfile.findUnique({
    where: { id: profileId },
    select: { stripeConnectId: true, stripeConnectStatus: true },
  });
  if (!stripeReady()) return { error: "Les retraits ouvrent très bientôt : vos gains restent en sécurité dans votre solde." };
  if (!profile?.stripeConnectId || profile.stripeConnectStatus !== "active") return { error: "Connectez d'abord votre compte bancaire." };
  const min = (await getPricingConfig()).payoutMinCents;

  let payout: { id: string; amountCents: number } | null;
  try {
    payout = await prisma.$transaction(async (tx) => {
      const rewards = await tx.reward.findMany({ where: { participantProfileId: profileId, type: "CASH", status: "PENDING", payoutId: null }, select: { id: true, amountCents: true } });
      const bonuses = await tx.referralBonus.findMany({ where: { beneficiaryId: profileId, status: "pending", payoutId: null }, select: { id: true, amountCents: true } });
      const amountCents = [...rewards, ...bonuses].reduce((n, x) => n + x.amountCents, 0);
      if (amountCents <= 0 || amountCents < min) return null;
      const p = await tx.payout.create({ data: { participantProfileId: profileId, amountCents } });
      // Le filtre `payoutId: null` rend le verrou atomique : si un autre retrait a
      // emporté l'une de ces lignes entre-temps, les comptes ne tombent pas juste.
      const r = await tx.reward.updateMany({ where: { id: { in: rewards.map((x) => x.id) }, status: "PENDING", payoutId: null }, data: { payoutId: p.id, status: "PROCESSING" } });
      const b = await tx.referralBonus.updateMany({ where: { id: { in: bonuses.map((x) => x.id) }, status: "pending", payoutId: null }, data: { payoutId: p.id, status: "processing" } });
      if (r.count !== rewards.length || b.count !== bonuses.length) throw new Error("concurrent_payout");
      return { id: p.id, amountCents };
    });
  } catch (e) {
    if (e instanceof Error && e.message === "concurrent_payout") return { error: "Un retrait est déjà en cours." };
    throw e;
  }
  if (!payout) return { error: `Le retrait est possible dès ${eur(min)}.` };

  const sent = await sendPayout(payout.id);
  // Un échec Stripe ne se répercute pas sur le participant : sa demande est
  // enregistrée, et Lucas relance le virement depuis l'admin.
  return { ok: true, amountCents: payout.amountCents, sent: "ok" in sent };
}

const REASONS: Record<string, string> = {
  balance_insufficient: "Solde Stripe de Rarelyst insuffisant : attendre que les paiements des marques soient disponibles (ou ajouter des fonds), puis relancer.",
  account_invalid: "Le compte Stripe du participant n'est plus valide : il doit reconnecter son compte bancaire.",
};

/**
 * Envoie le virement d'un retrait. Rejouable sans risque : avant chaque essai,
 * on cherche chez Stripe un virement déjà parti pour ce retrait.
 */
export async function sendPayout(payoutId: string, opts: { force?: boolean } = {}): Promise<{ ok: true } | { error: string }> {
  // Prise atomique : un seul envoi à la fois pour un même retrait. Un envoi
  // resté « en cours » plus de 2 minutes (fonction coupée) peut être repris.
  const stale = new Date(Date.now() - 2 * 60_000);
  const claim = await prisma.payout.updateMany({
    where: {
      id: payoutId,
      OR: [
        { status: { in: ["requested", "failed"] } },
        ...(opts.force ? [{ status: "sending", sendingAt: { lt: stale } }] : []),
      ],
    },
    data: { status: "sending", sendingAt: new Date(), attempts: { increment: 1 } },
  });
  if (claim.count === 0) return { error: "Ce retrait n'est pas à envoyer." };

  const p = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
    include: { participantProfile: { select: { stripeConnectId: true, firstName: true, lastName: true, user: { select: { email: true } } } } },
  });
  const who = `${p.participantProfile.firstName} ${p.participantProfile.lastName}`.trim();
  const fail = async (reason: string) => {
    await prisma.payout.update({ where: { id: p.id }, data: { status: "failed", error: reason } });
    await sendPayoutFailedAdmin(who, p.amountCents, reason).catch(() => null);
    return { error: reason };
  };

  const destination = p.participantProfile.stripeConnectId;
  if (!destination) return fail("Le participant n'a pas de compte bancaire connecté.");

  let transferId: string;
  try {
    const stripe = getStripe();
    const group = `payout_${p.id}`;
    const existing = await stripe.transfers.list({ transfer_group: group, limit: 1 });
    transferId = existing.data[0]?.id ?? (await stripe.transfers.create(
      {
        amount: p.amountCents,
        currency: "eur",
        destination,
        transfer_group: group,
        description: `Rarelyst · retrait de ${who}`,
        metadata: { payoutId: p.id },
      },
      // Une clé par essai : Stripe mémorise aussi les échecs, une clé fixe
      // rejouerait l'erreur. La recherche ci-dessus empêche le double envoi.
      { idempotencyKey: `payout-${p.id}-${p.attempts}` },
    )).id;
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    const message = e instanceof Error ? e.message : "Erreur Stripe";
    console.error("[payout]", p.id, code, message);
    return fail(REASONS[code] ?? `Stripe : ${message}`);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.payout.update({ where: { id: p.id }, data: { status: "sent", method: "stripe", stripeTransferId: transferId, paidAt: now, error: null } }),
    prisma.reward.updateMany({ where: { payoutId: p.id }, data: { status: "PAID", paidAt: now, stripeTransferId: transferId } }),
    prisma.referralBonus.updateMany({ where: { payoutId: p.id }, data: { status: "paid", paidAt: now } }),
  ]);
  await sendPayoutSent(p.participantProfile.user.email, p.participantProfile.firstName, p.amountCents).catch(() => null);
  return { ok: true };
}

/** Lucas a payé à la main (virement depuis sa banque) : on solde le retrait. */
export async function markPayoutManual(payoutId: string): Promise<{ ok: true } | { error: string }> {
  const now = new Date();
  const p = await prisma.payout.findUnique({ where: { id: payoutId }, select: { status: true } });
  if (!p || p.status === "sent" || p.status === "cancelled") return { error: "Ce retrait est déjà clos." };
  await prisma.$transaction([
    prisma.payout.update({ where: { id: payoutId }, data: { status: "sent", method: "manual", paidAt: now, error: null } }),
    prisma.reward.updateMany({ where: { payoutId }, data: { status: "PAID", paidAt: now } }),
    prisma.referralBonus.updateMany({ where: { payoutId }, data: { status: "paid", paidAt: now } }),
  ]);
  return { ok: true as const };
}

/** Annule un retrait bloqué : les gains retournent dans le solde du participant. */
export async function cancelPayout(payoutId: string): Promise<{ ok: true } | { error: string }> {
  const p = await prisma.payout.findUnique({ where: { id: payoutId }, select: { status: true } });
  if (!p || p.status === "sent" || p.status === "cancelled") return { error: "Ce retrait est déjà clos." };
  await prisma.$transaction([
    prisma.reward.updateMany({ where: { payoutId }, data: { status: "PENDING", payoutId: null } }),
    prisma.referralBonus.updateMany({ where: { payoutId }, data: { status: "pending", payoutId: null } }),
    prisma.payout.update({ where: { id: payoutId }, data: { status: "cancelled" } }),
  ]);
  return { ok: true };
}

export async function listPayouts() {
  const rows = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { participantProfile: { select: { firstName: true, lastName: true, stripeConnectStatus: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    name: `${p.participantProfile.firstName} ${p.participantProfile.lastName}`.trim(),
    connect: p.participantProfile.stripeConnectStatus,
    amountCents: p.amountCents,
    status: p.status,
    method: p.method,
    error: p.error,
    attempts: p.attempts,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
  }));
}
