import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePage, { guideMetadata } from "@/components/seo/GuidePage";
import { findGuide, guidesIn } from "@/lib/seo/guides";

export const dynamicParams = false;
export function generateStaticParams() {
  return guidesIn("en").map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = findGuide("en", (await params).slug);
  return g ? guideMetadata(g) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const g = findGuide("en", (await params).slug);
  if (!g) notFound();
  return <GuidePage guide={g} />;
}
