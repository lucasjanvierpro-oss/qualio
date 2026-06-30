import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParticipantWalletClient from "./ParticipantWalletClient";

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
  if (!profile) redirect("/participant/onboarding");

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

  return (
    <ParticipantWalletClient
      rewards={rewards}
      stripeConnectStatus={profile.stripeConnectStatus}
      participantId={profile.id}
    />
  );
}
