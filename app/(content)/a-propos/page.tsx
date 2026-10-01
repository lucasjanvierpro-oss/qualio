import type { Metadata } from "next";
import AboutPage from "@/components/seo/AboutPage";

export const metadata: Metadata = {
  title: { absolute: "Rarelyst : à propos de la plateforme de recrutement pour études qualitatives" },
  description: "Rarelyst (rarelyst.co) trouve, vérifie et fait interroger des profils rares pour les études qualitatives des marques de mode, de luxe et de beauté. Fondée à Paris en 2026.",
  alternates: { canonical: "/a-propos", languages: { fr: "/a-propos", en: "/en/about", "x-default": "/a-propos" } },
};

export default function Page() {
  return <AboutPage lang="fr" />;
}
