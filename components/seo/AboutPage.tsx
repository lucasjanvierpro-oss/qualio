import Link from "next/link";
import ContentShell from "./ContentShell";
import JsonLd from "./JsonLd";
import s from "./content.module.css";
import { breadcrumb, graph, organization } from "@/lib/seo/schema";
import { CONTACT_EMAIL, LINKEDIN_URL, ORG, SITE_URL } from "@/lib/seo/site";

// Page « À propos » : la page qui dit à Google et aux IA ce qu'est Rarelyst,
// avec son nom écrit en entier. Le site est jeune et Google corrige encore
// « rarelyst » en « rarelust » : une page entièrement consacrée à la marque
// l'aide à reconnaître le nom.

const T = {
  fr: {
    path: "/a-propos", home: "Accueil", crumb: "À propos", kicker: "À propos",
    lead: "Rarelyst (rarelyst.co) est une plateforme française qui trouve, vérifie et fait interroger des profils rares pour les études qualitatives des marques de mode, de luxe et de beauté.",
    nameH: "Le nom",
    name: "Rarelyst s'écrit avec un « y » : rare + list, la liste des profils rares. Rarelyst n'a aucun lien avec d'autres sites ou marques au nom proche.",
    whatH: "Ce que fait Rarelyst",
    brandsT: "Pour les marques",
    brands: ["La marque décrit en quelques phrases qui elle veut entendre, ou dépose son brief.", "Rarelyst propose des profils vérifiés (identité, LinkedIn, emploi, CV ou book), chacun avec son prix.", "Les entretiens se font en visio, enregistrés et transcrits ; une synthèse répond aux décisions de la marque.", "La marque ne paie que les profils qu'elle garde : 1 crédit = 10 € HT."],
    partsT: "Pour les participants",
    parts: ["Vendeurs en maison de luxe, acheteurs, stylistes, collectionneurs, revendeurs, créateurs de contenu, clients passionnés.", "45 minutes d'entretien payées de 90 € à 350 € selon le profil, jusqu'à 560 € pour les plus rares.", "Retrait sur le compte bancaire dès 50 €. Jamais de frais, jamais d'information confidentielle demandée sur l'employeur."],
    whoH: "Qui est derrière Rarelyst",
    who: `Rarelyst a été fondée en ${ORG.foundingDate} à Paris par ${ORG.founder}.`,
    findH: "Où trouver Rarelyst",
    site: "Site officiel", li: "LinkedIn", mail: "Email",
    more: [["/garanties", "Nos garanties"], ["/pricing", "Tarifs"], ["/guides", "Guides"], ["/signup/participant", "Rejoindre le panel"]],
  },
  en: {
    path: "/en/about", home: "Home", crumb: "About", kicker: "About",
    lead: "Rarelyst (rarelyst.co) is a French platform that finds, verifies and lines up rare profiles for qualitative research by fashion, luxury and beauty brands.",
    nameH: "The name",
    name: "Rarelyst is spelled with a “y”: rare + list, the list of rare profiles. Rarelyst has no connection with other websites or brands with a similar name.",
    whatH: "What Rarelyst does",
    brandsT: "For brands",
    brands: ["The brand describes in a few sentences who it wants to hear from, or uploads its brief.", "Rarelyst suggests verified profiles (identity, LinkedIn, employment, CV or portfolio), each with its price.", "Interviews happen by video, recorded and transcribed; a report answers the brand's decisions.", "Brands only pay for the profiles they keep: 1 credit = €10 excl. VAT."],
    partsT: "For participants",
    parts: ["Luxury sales associates, buyers, stylists, collectors, resellers, content creators, passionate clients.", "45-minute interviews paid €90 to €350 depending on the profile, up to €560 for the rarest.", "Withdraw to a bank account from €50. Never any fee, never any confidential question about an employer."],
    whoH: "Who is behind Rarelyst",
    who: `Rarelyst was founded in ${ORG.foundingDate} in Paris by ${ORG.founder}.`,
    findH: "Where to find Rarelyst",
    site: "Official website", li: "LinkedIn", mail: "Email",
    more: [["/garanties", "Our guarantees"], ["/pricing", "Pricing"], ["/en/guides", "Guides"], ["/signup/participant", "Join the panel"]],
  },
};

export default function AboutPage({ lang }: { lang: "fr" | "en" }) {
  const t = T[lang];
  const url = `${SITE_URL}${t.path}`;
  return (
    <ContentShell lang={lang}>
      <JsonLd data={graph(
        organization(lang),
        {
          "@type": "AboutPage", "@id": `${url}#page`, url, name: `${lang === "fr" ? "À propos de" : "About"} Rarelyst`,
          description: t.lead, inLanguage: lang === "fr" ? "fr-FR" : "en-GB",
          about: { "@id": `${SITE_URL}/#organization` }, mainEntity: { "@id": `${SITE_URL}/#organization` },
        },
        breadcrumb([{ name: t.home, url: `${SITE_URL}${lang === "en" ? "/en" : ""}` }, { name: t.crumb, url }]),
      )} />
      <main className={s.wrap}>
        <nav className={s.crumbs}><Link href={lang === "en" ? "/en" : "/"}>{t.home}</Link><span>›</span><span>{t.crumb}</span></nav>
        <p className={s.kicker}>{t.kicker}</p>
        <h1 className={s.h1}>Rarelyst</h1>
        <p className={s.lead}>{t.lead}</p>
        <div className={s.body}>
          <h2>{t.nameH}</h2>
          <p>{t.name}</p>
          <h2>{t.whatH}</h2>
          <p><strong>{t.brandsT}</strong></p>
          <ul>{t.brands.map((x) => <li key={x}>{x}</li>)}</ul>
          <p><strong>{t.partsT}</strong></p>
          <ul>{t.parts.map((x) => <li key={x}>{x}</li>)}</ul>
          <h2>{t.whoH}</h2>
          <p>{t.who}</p>
          <h2>{t.findH}</h2>
          <ul>
            <li>{t.site} : <a href={SITE_URL}>rarelyst.co</a></li>
            <li>{t.li} : <a href={LINKEDIN_URL} rel="me noopener" target="_blank">linkedin.com/company/rarelyst</a></li>
            <li>{t.mail} : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
          </ul>
        </div>
        <div className={s.related}>
          {t.more.map(([href, label]) => <Link key={href} className={s.card} href={href}><b>{label}</b></Link>)}
        </div>
      </main>
    </ContentShell>
  );
}
