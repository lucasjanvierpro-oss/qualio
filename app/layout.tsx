import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Une seule famille, classique et neutre : Inter — pour titres ET corps.
// Titres = graisses lourdes (700/800), corps = 400/500. Comme Airpanel.
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const interDisplay = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-base",
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
      className={`${inter.variable} ${interDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
