import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BrandAccountClient from "./BrandAccountClient";
import CertificationCard from "@/components/brand/CertificationCard";
import { certLevel, certSteps } from "@/lib/brands/certification";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { TIERS } from "@/lib/pricing/config";

export default async function BrandAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      brandProfile: {
        include: {
          creditTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
    },
  });

  const profile = dbUser?.brandProfile;
  const cfg = await getPricingConfig();
  const cert = { email: dbUser?.email ?? "", domainVerifiedAt: profile?.domainVerifiedAt ?? null, isVerified: profile?.isVerified ?? false };

  return (
    <>
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px 0" }}>
      <CertificationCard level={certLevel(cert)} steps={certSteps(cert)} companyName={profile?.companyName ?? ""} />
    </div>
    <BrandAccountClient
      packs={cfg.packs}
      tiers={TIERS.map((t) => ({ label: cfg.tiers[t].label, credits: cfg.tiers[t].baseCredits }))}
      creditValueCents={cfg.creditValueCents}
      isActivated={profile?.isActivated ?? false}
      credits={profile?.credits ?? 0}
      companyName={profile?.companyName ?? ""}
      transactions={
        profile?.creditTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          desc: t.description ?? "",
          date: t.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
          balance: t.balanceAfter,
        })) ?? []
      }
    />
    </>
  );
}
