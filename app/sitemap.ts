import { MetadataRoute } from "next";
import { GUIDES, guidePath } from "@/lib/seo/guides";
import { SITE_URL } from "@/lib/seo/site";

// Le plan du site : pages publiques et guides, avec leurs versions FR/EN.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home = { languages: { fr: SITE_URL, en: `${SITE_URL}/en` } };
  const guidesAlt = { languages: { fr: `${SITE_URL}/guides`, en: `${SITE_URL}/en/guides` } };
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1, alternates: home },
    { url: `${SITE_URL}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9, alternates: home },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8, alternates: guidesAlt },
    { url: `${SITE_URL}/en/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: guidesAlt },
    ...GUIDES.map((g) => {
      const other = g.alt ? GUIDES.find((x) => x.slug === g.alt) : null;
      return {
        url: `${SITE_URL}${guidePath(g)}`,
        lastModified: new Date(g.updated),
        changeFrequency: "monthly" as const,
        priority: g.lang === "fr" ? 0.8 : 0.7,
        ...(other ? { alternates: { languages: { [g.lang]: `${SITE_URL}${guidePath(g)}`, [other.lang]: `${SITE_URL}${guidePath(other)}` } } } : {}),
      };
    }),
    { url: `${SITE_URL}/signup/brand`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/signup/participant`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/accord-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/garanties`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/consumer-insights`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/en/consumer-insights`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/en/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
