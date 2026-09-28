import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { referralSummary, wantedProfiles } from "@/lib/referral/referral";
import { appUrl } from "@/lib/appUrl";
import ReferralClient from "./ReferralClient";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const me = await getSessionUser();
  if (!me?.participantProfileId) redirect("/login");

  const [summary, wanted, cfg] = await Promise.all([
    referralSummary(me.participantProfileId),
    wantedProfiles(),
    getPricingConfig(),
  ]);

  return (
    <ReferralClient
      link={`${appUrl()}/r/${summary.code}`}
      code={summary.code}
      friends={summary.friends}
      earnedCents={summary.earnedCents}
      pendingCents={summary.pendingCents}
      wanted={wanted}
      rules={cfg.referral}
      payoutMinCents={cfg.payoutMinCents}
      payRange={[cfg.tiers.averti.participantPayCents, cfg.tiers.rare.participantPayCents]}
    />
  );
}
