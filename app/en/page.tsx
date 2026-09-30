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
  title: "Rarelyst — Expert participants for your qualitative research",
  description: "Rarelyst connects fashion and luxury insights teams with proven expert participants: stylists, buyers, collectors, boutique associates. First profiles within 72 hours.",
  alternates: { canonical: "/en", languages: { fr: "/", en: "/en", "x-default": "/" } },
  openGraph: {
    title: "Rarelyst — Expert participants for your qualitative research",
    description: "Recruit proven fashion and luxury experts for your qualitative interviews.",
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
