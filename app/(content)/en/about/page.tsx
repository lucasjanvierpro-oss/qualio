import type { Metadata } from "next";
import AboutPage from "@/components/seo/AboutPage";

export const metadata: Metadata = {
  title: { absolute: "Rarelyst: about the qualitative research recruitment platform" },
  description: "Rarelyst (rarelyst.co) finds, verifies and lines up rare profiles for qualitative research by fashion, luxury and beauty brands. Founded in Paris in 2026.",
  alternates: { canonical: "/en/about", languages: { fr: "/a-propos", en: "/en/about", "x-default": "/a-propos" } },
};

export default function Page() {
  return <AboutPage lang="en" />;
}
