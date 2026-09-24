import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { certLevel, emailDomain, isProDomain } from "@/lib/brands/certification";
import { getPricingConfig } from "@/lib/pricing/quotes";
import type { Company } from "@/lib/brands/registry";
import VerifyHouse from "./VerifyHouse";

export const dynamic = "force-dynamic";

/**
 * Juste après l'inscription : on rattache le compte à sa société (titre III
 * du poinçon), puis on montre par où commencer.
 */
export default async function BrandOnboardingPage() {
  const me = await getSessionUser();
  if (!me?.brandProfileId) redirect("/login");

  const [brand, cfg] = await Promise.all([
    prisma.brandProfile.findUnique({
      where: { id: me.brandProfileId },
      select: {
        companyName: true, contactFirstName: true, domainVerifiedAt: true, isVerified: true,
        siren: true, legalName: true, companyInfo: true, companyVerifiedAt: true, companyVerifyMethod: true,
        user: { select: { email: true } },
      },
    }),
    getPricingConfig(),
  ]);
  if (!brand) redirect("/login");

  const info = (brand.companyInfo ?? null) as (Partial<Company> & { match?: boolean; foreign?: boolean; country?: string }) | null;
  const domain = emailDomain(brand.user.email);
  const level = certLevel({
    email: brand.user.email,
    domainVerifiedAt: brand.domainVerifiedAt,
    isVerified: brand.isVerified,
    companyVerifiedAt: brand.companyVerifiedAt,
    companyMatch: !!info?.match,
  });

  return (
    <VerifyHouse
      companyName={brand.companyName}
      firstName={brand.contactFirstName ?? ""}
      domain={domain}
      pro={isProDomain(domain)}
      domainProven={!!brand.domainVerifiedAt}
      level={level}
      claimed={brand.legalName ? {
        legalName: brand.legalName,
        siren: brand.siren,
        activity: info?.activity ?? null,
        city: info?.city ?? null,
        employees: info?.employees ?? null,
        foreign: !!info?.foreign,
        country: info?.country ?? null,
        match: !!info?.match,
        method: brand.companyVerifyMethod,
      } : null}
      fromCredits={cfg.tiers.averti.baseCredits}
      creditValueCents={cfg.creditValueCents}
      firstPack={cfg.packs[0] ? { credits: cfg.packs[0].credits, priceCents: cfg.packs[0].priceCents, label: cfg.packs[0].label } : null}
    />
  );
}
