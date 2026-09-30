import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParticipantWalletClient from "./ParticipantWalletClient";
import { participantBalance, stripeReady } from "@/lib/payouts/payouts";

export default async function ParticipantWalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      participantProfile: {
        include: {
          rewards: {
            orderBy: { createdAt: "desc" },
            include: {
              application: {
                include: {
                  study: { select: { title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const profile = dbUser?.participantProfile;
  if (!profile) redirect("/signup/participant");

  const rewards = profile.rewards.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    amountCents: r.amountCents,
    voucherBrand: r.voucherBrand,
    voucherCode: r.voucherCode,
    voucherRevealedAt: r.voucherRevealedAt?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
    studyTitle: r.application.study.title,
    createdAt: r.createdAt.toISOString(),
  }));

  const bonuses = (await prisma.referralBonus.findMany({
    where: { beneficiaryId: profile.id, status: { not: "cancelled" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, amountCents: true, status: true, createdAt: true },
  })).map((b) => ({ ...b, createdAt: b.createdAt.toISOString() }));

  const [balance, payouts] = await Promise.all([
    participantBalance(profile.id),
    prisma.payout.findMany({
      where: { participantProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, amountCents: true, status: true, createdAt: true, paidAt: true },
    }),
  ]);

  const year = new Date().getFullYear();
  return (
    <>
    <ParticipantWalletClient
      rewards={rewards}
      bonuses={bonuses}
      stripeConnectStatus={profile.stripeConnectStatus}
      balance={balance}
      payouts={payouts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), paidAt: p.paidAt?.toISOString() ?? null }))}
      stripeReady={stripeReady()}
    />
    {/* Information fiscale due à chaque participant (art. 242 bis du CGI). */}
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px 48px" }}>
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: "16px 18px", background: "var(--color-surface)", fontSize: 13.5, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
        <strong style={{ color: "var(--color-text-primary)" }}>Vos gains et les impôts.</strong> Les sommes perçues sur Rarelyst peuvent être imposables et soumises à cotisations sociales selon votre situation (impots.gouv.fr, rubrique « économie collaborative » ; urssaf.fr). Rarelyst les déclare chaque année à l&apos;administration et vous envoie un relevé avant le 31 janvier.{" "}
        <Link href={`/participant/wallet/releve?year=${year}`} style={{ color: "var(--color-accent)", fontWeight: 600 }}>Mon relevé {year}</Link>
        {" · "}
        <Link href="/participant/settings" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Mes informations fiscales</Link>
      </div>
    </section>
    </>
  );
}
