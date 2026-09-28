import type { Metadata } from "next";
import { Familjen_Grotesk } from "next/font/google";
import "./globals.css";

// Une seule famille pour tout le site : Familjen Grotesk (les espaces marque,
// participant et l'accueil la chargent aussi via components/rl/font). Les
// anciennes variables --font-display et --font-mono-base pointent dessus :
// plus d'Inter ni de chasse fixe.
const familjen = Familjen_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://www.rarelyst.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rarelyst — Participants experts pour vos études qualitatives",
    template: "%s · Rarelyst",
  },
  description:
    "Rarelyst connecte les équipes insights des grandes marques mode et luxe avec des participants experts en moins de 72h. Recrutement qualitatif rapide et ciblé.",
  keywords: [
    "recrutement quali", "études qualitatives", "consumer insights",
    "mode", "luxe", "panel expert", "entretiens qualitatifs", "Rarelyst",
  ],
  authors: [{ name: "Rarelyst" }],
  robots: { index: true, follow: true },
  // Preuve à Google que le domaine nous appartient. Exigée pour faire vérifier
  // la marque : sans elle, l'écran de connexion Google affiche l'identifiant du
  // projet Supabase à la place de « Rarelyst ».
  verification: { google: "GD1b47z_YZR2ABVvnmCosy9frwfHlJak0KZ69zfUokc" },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Rarelyst — Participants experts pour vos études qualitatives",
    description:
      "Recrutez 5 à 8 profils experts mode/luxe en 72h pour vos entretiens qualitatifs.",
    url: SITE_URL,
    siteName: "Rarelyst",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rarelyst — Participants experts",
    description: "Recrutez les bons profils pour vos études quali mode et luxe.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${familjen.variable} h-full antialiased`}
      style={{ ["--font-display" as string]: "var(--font-body)", ["--font-mono-base" as string]: "var(--font-body)" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
