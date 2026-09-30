import type { Metadata } from "next";
import GuidesIndex from "@/components/seo/GuidesIndex";

export const metadata: Metadata = {
  title: { absolute: "Guides: recruiting for qualitative research, pricing, paid studies · Rarelyst" },
  description: "Rarelyst guides for fashion, luxury and beauty brands: how to recruit participants for qualitative research, and for participants: paid research studies.",
  alternates: { canonical: "/en/guides", languages: { fr: "/guides", en: "/en/guides", "x-default": "/guides" } },
};

export default function Page() {
  return <GuidesIndex lang="en" />;
}
