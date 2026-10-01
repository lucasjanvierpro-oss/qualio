import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { landingTiers } from "@/components/landing/tiers";
import { LANDING_COPY } from "@/components/landing/copy";
import JsonLd from "@/components/seo/JsonLd";
import { faqPage, graph, organization, service, website } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

// La page d'accueil en anglais, à sa propre adresse : c'est ce qui permet à
// Google de la proposer aux recherches en anglais.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Rarelyst · Consumer insights and qualitative research recruitment" },
  description: "Verified participants for your qualitative interviews: stylists, buyers, collectors, micro-influencers. First profiles within 72 hours, paid only if you keep them.",
  alternates: { canonical: "/en", languages: { fr: "/", en: "/en", "x-default": "/" } },
  openGraph: {
    title: "Rarelyst · Who do you want to hear from?",
    description: "Very specific, verified participants for qualitative research by fashion, luxury and beauty brands. First profiles within 72 hours.",
    url: "https://www.rarelyst.co/en",
    siteName: "Rarelyst",
    locale: "en_GB",
    type: "website",
  },
};

export default async function HomePageEn() {
  const tiers = await landingTiers();
  return (
    <>
      <JsonLd data={graph(organization("en"), website("en"), service("en", tiers), faqPage(LANDING_COPY.en.faq(tiers), `${SITE_URL}/en`))} />
      <Landing tiers={tiers} lang="en" />
    </>
  );
}
