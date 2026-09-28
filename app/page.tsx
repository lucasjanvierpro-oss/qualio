import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { landingTiers } from "@/components/landing/tiers";

// Les prix affichés sont ceux réglés dans l'admin, relus toutes les 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { fr: "/", en: "/en", "x-default": "/" } },
};

export default async function HomePage() {
  return <Landing tiers={await landingTiers()} lang="fr" />;
}
