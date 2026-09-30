import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { landingTiers } from "@/components/landing/tiers";
import { LANDING_COPY } from "@/components/landing/copy";
import JsonLd from "@/components/seo/JsonLd";
import { faqPage, graph, organization, service, website } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

// Les prix affichés sont ceux réglés dans l'admin, relus toutes les 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { fr: "/", en: "/en", "x-default": "/" } },
};

export default async function HomePage() {
  const tiers = await landingTiers();
  return (
    <>
      <JsonLd data={graph(organization("fr"), website("fr"), service("fr", tiers), faqPage(LANDING_COPY.fr.faq(tiers), SITE_URL))} />
      <Landing tiers={tiers} lang="fr" />
    </>
  );
}
