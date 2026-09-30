import type { Metadata } from "next";
import GuidesIndex from "@/components/seo/GuidesIndex";

export const metadata: Metadata = {
  title: { absolute: "Guides : recruter pour une étude qualitative, prix, profils rares · Rarelyst" },
  description: "Guides Rarelyst pour les marques de mode, luxe et beauté : recruter des participants, trouver des profils rares, prix d'une étude qualitative, panel ou sur-mesure. Et pour les participants : les études rémunérées.",
  alternates: { canonical: "/guides", languages: { fr: "/guides", en: "/en/guides", "x-default": "/guides" } },
};

export default function Page() {
  return <GuidesIndex lang="fr" />;
}
