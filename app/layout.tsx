import type { Metadata } from "next";
import { Cormorant_Garamond, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display — Cormorant Garamond italic: editorial luxury, used by high-fashion brands
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body — Syne: geometric grotesque by Bonjour Monde (French studio).
// Distinctive letterform rhythm at 12–14px, used by French creative agencies.
// The difference from Inter/Space Grotesk is immediately visible.
const syne = Syne({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-base",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qualio — Recrutez les bons profils. En 72h.",
  description:
    "Des entretiens qualitatifs avec des participants vraiment ciblés. Pour les équipes insights qui veulent aller vite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
