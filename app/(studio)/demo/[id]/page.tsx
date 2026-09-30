import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getPricingConfig } from "@/lib/pricing/quotes";
import DemoDeck from "@/components/demo/DemoDeck";
import type { DemoData } from "@/lib/demo/prepare";

export const dynamic = "force-dynamic";

// La démo préparée pour une marque, en plein écran (Admin → Lancer une démo).
export default async function DemoPresentation({ params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") notFound();
  const { id } = await params;
  const demo = await prisma.demoSession.findUnique({ where: { id } });
  const data = demo?.data as unknown as DemoData | null;
  if (!demo || !data?.profiles) notFound();
  const pricing = await getPricingConfig();
  const tiers = {
    averti: { label: pricing.tiers.averti.label, baseCredits: pricing.tiers.averti.baseCredits },
    initie: { label: pricing.tiers.initie.label, baseCredits: pricing.tiers.initie.baseCredits },
    rare: { label: pricing.tiers.rare.label, baseCredits: pricing.tiers.rare.baseCredits },
  };
  return <DemoDeck brandName={demo.brandName} lang={demo.lang === "en" ? "en" : "fr"} data={data} tiers={tiers} />;
}
