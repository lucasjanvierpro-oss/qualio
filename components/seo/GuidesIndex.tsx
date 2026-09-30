import Link from "next/link";
import ContentShell from "./ContentShell";
import JsonLd from "./JsonLd";
import s from "./content.module.css";
import { guidePath, guidesIn } from "@/lib/seo/guides";
import { breadcrumb, graph, organization } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

const T = {
  fr: { kicker: "Guides Rarelyst", h1: "Études qualitatives : recruter les bonnes personnes", lead: "Méthode, prix, profils rares, et comment être payé pour donner son avis aux marques. Des réponses directes, avec nos vrais chiffres.", brands: "Pour les marques", parts: "Pour les participants", home: "Accueil", guides: "Guides" },
  en: { kicker: "Rarelyst guides", h1: "Qualitative research: recruiting the right people", lead: "Method, pricing, and how to get paid to share your view with brands. Straight answers, with our real numbers.", brands: "For brands", parts: "For participants", home: "Home", guides: "Guides" },
};

export default function GuidesIndex({ lang }: { lang: "fr" | "en" }) {
  const t = T[lang];
  const list = guidesIn(lang);
  const url = `${SITE_URL}${lang === "en" ? "/en" : ""}/guides`;
  const group = (aud: "marques" | "participants") => list.filter((g) => g.audience === aud).map((g) => (
    <Link key={g.slug} className={s.card} href={guidePath(g)}><b>{g.title}</b><span>{g.description}</span></Link>
  ));
  return (
    <ContentShell lang={lang}>
      <JsonLd data={graph(
        organization(lang),
        { "@type": "CollectionPage", "@id": `${url}#page`, url, name: t.h1, description: t.lead, inLanguage: lang === "fr" ? "fr-FR" : "en-GB", hasPart: list.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE_URL}${guidePath(g)}` })) },
        breadcrumb([{ name: t.home, url: `${SITE_URL}${lang === "en" ? "/en" : ""}` }, { name: t.guides, url }]),
      )} />
      <main className={s.wrap}>
        <p className={s.kicker}>{t.kicker}</p>
        <h1 className={s.h1}>{t.h1}</h1>
        <p className={s.lead}>{t.lead}</p>
        <p className={s.group}>{t.brands}</p>
        <div className={s.grid}>{group("marques")}</div>
        <p className={s.group}>{t.parts}</p>
        <div className={s.grid}>{group("participants")}</div>
      </main>
    </ContentShell>
  );
}
