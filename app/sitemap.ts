import { MetadataRoute } from "next";

const SITE = "https://www.rarelyst.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1, alternates: { languages: { fr: SITE, en: `${SITE}/en` } } },
    { url: `${SITE}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9, alternates: { languages: { fr: SITE, en: `${SITE}/en` } } },
    { url: `${SITE}/signup/participant`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/signup/brand`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
