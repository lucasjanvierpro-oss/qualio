import type { Metadata } from "next";
import InsightsPage from "@/components/seo/InsightsPage";

export const metadata: Metadata = {
  title: { absolute: "Rarelyst · Consumer insights mode, luxe et beauté : recruter les bons profils" },
  description: "Rarelyst aide les équipes consumer insights des marques de mode, de luxe et de beauté à interroger des profils rares et vérifiés, en visio, avec une synthèse qui répond à leurs décisions.",
  alternates: { canonical: "/consumer-insights", languages: { fr: "/consumer-insights", en: "/en/consumer-insights", "x-default": "/consumer-insights" } },
};

export default function Page() {
  return <InsightsPage lang="fr" />;
}
