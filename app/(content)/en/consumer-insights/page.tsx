import type { Metadata } from "next";
import InsightsPage from "@/components/seo/InsightsPage";

export const metadata: Metadata = {
  title: { absolute: "Rarelyst · Consumer insights for fashion, luxury and beauty brands" },
  description: "Rarelyst helps consumer insights teams at fashion, luxury and beauty brands interview rare, verified profiles by video, with a report that answers their decisions.",
  alternates: { canonical: "/en/consumer-insights", languages: { fr: "/consumer-insights", en: "/en/consumer-insights", "x-default": "/consumer-insights" } },
};

export default function Page() {
  return <InsightsPage lang="en" />;
}
