import { DESCRIPTION, ORG, SECTORS, SHORT, SITE_URL, CONTACT_EMAIL } from "./site";

// Données structurées schema.org. Google s'en sert pour comprendre l'entreprise
// et afficher ses résultats enrichis ; les assistants IA pour décrire Rarelyst
// sans se tromper. Tout part de lib/seo/site.ts.

type Lang = "fr" | "en";
type Tier = { id: string; label: string; who: string; credits: number; euros: number; pay: number };

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function organization(lang: Lang) {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG.name,
    url: SITE_URL,
    logo: ORG.logo,
    description: DESCRIPTION[lang],
    email: CONTACT_EMAIL,
    foundingDate: ORG.foundingDate,
    founder: { "@type": "Person", name: ORG.founder },
    address: { "@type": "PostalAddress", addressLocality: ORG.city, addressCountry: ORG.country },
    areaServed: ["FR", "EU", "GB", "US"],
    knowsAbout: lang === "fr"
      ? ["études qualitatives", "recrutement de participants", "entretiens individuels", "consumer insights", ...SECTORS.fr]
      : ["qualitative research", "participant recruitment", "in-depth interviews", "consumer insights", ...SECTORS.en],
    ...(ORG.sameAs.length ? { sameAs: ORG.sameAs } : {}),
  };
}

export function website(lang: Lang) {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: ORG.name,
    description: SHORT[lang],
    inLanguage: ["fr-FR", "en-GB"],
    publisher: { "@id": ORG_ID },
  };
}

/** Le service, avec ses trois paliers de prix (prix pour un entretien de 45 min, hors taxes). */
export function service(lang: Lang, tiers: Tier[]) {
  const fr = lang === "fr";
  return {
    "@type": "Service",
    "@id": `${SITE_URL}/#service`,
    name: fr ? "Recrutement de participants pour études qualitatives" : "Participant recruitment for qualitative research",
    serviceType: fr ? "Recrutement de participants pour études qualitatives" : "Qualitative research participant recruitment",
    description: DESCRIPTION[lang],
    provider: { "@id": ORG_ID },
    areaServed: ["FR", "EU", "GB", "US"],
    audience: { "@type": "BusinessAudience", audienceType: fr ? "Équipes insights, marketing et produit des marques de mode, luxe et beauté" : "Insights, marketing and product teams at fashion, luxury and beauty brands" },
    availableLanguage: ["fr", "en"],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...tiers.map((t) => t.euros)),
      highPrice: Math.max(...tiers.map((t) => t.euros)),
      offerCount: tiers.length,
      offers: tiers.map((t) => ({
        "@type": "Offer",
        name: fr ? `Profil ${t.label} · entretien de 45 min` : `${t.label} profile · 45-min interview`,
        description: t.who,
        price: t.euros,
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: t.euros, priceCurrency: "EUR", valueAddedTaxIncluded: false, unitText: fr ? "profil retenu" : "profile kept" },
        url: `${SITE_URL}${fr ? "" : "/en"}#tarifs`,
      })),
    },
  };
}

export function faqPage(faqs: { q: string; a: string }[], url: string) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function article(input: { url: string; title: string; description: string; lang: Lang; updated: string; published: string }) {
  return {
    "@type": "Article",
    "@id": `${input.url}#article`,
    headline: input.title,
    description: input.description,
    inLanguage: input.lang === "fr" ? "fr-FR" : "en-GB",
    datePublished: input.published,
    dateModified: input.updated,
    mainEntityOfPage: input.url,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: `${SITE_URL}${input.lang === "fr" ? "" : "/en"}/opengraph-image.png`,
  };
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
