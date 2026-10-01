import Link from "next/link";
import ContentShell from "./ContentShell";
import JsonLd from "./JsonLd";
import s from "./content.module.css";
import { breadcrumb, faqPage, graph, organization } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

// « Rarelyst consumer insights » : la page qui relie le nom de la marque au
// métier de ceux qui l'achètent (équipes consumer insights), pour que les
// recherches « rarelyst + consumer insights » tombent sur le site.

const T = {
  fr: {
    path: "/consumer-insights", home: "Accueil", crumb: "Consumer insights", kicker: "Rarelyst · consumer insights",
    h1: "Rarelyst, le recrutement des équipes consumer insights mode, luxe et beauté",
    lead: "Rarelyst aide les équipes consumer insights des marques de mode, de luxe et de beauté à interroger les bonnes personnes : des profils rares et vérifiés, proposés en quelques jours, interrogés en visio, avec une synthèse qui répond à vos décisions.",
    sections: [
      { h: "Pour quelles questions", list: ["Tester un prix avant un lancement.", "Choisir entre plusieurs coloris, matières ou noms.", "Comprendre une clientèle qui change, ou qui achète moins en boutique.", "Préparer une nouvelle catégorie ou un nouveau marché.", "Comprendre ce que voient les gens du terrain et que les tableaux de bord ne montrent pas."] },
      { h: "Qui vous interrogez", list: ["Vendeurs et vendeuses en maison de luxe, personal shoppers.", "Acheteurs de grands magasins et de concept stores, visual merchandisers.", "Stylistes, directions artistiques, collectionneurs.", "Micro-influenceurs, early adopters, revendeurs de seconde main.", "Clientes et clients avertis."] },
      { h: "Ce que reçoit l'équipe consumer insights", list: ["La vidéo et la transcription de chaque entretien.", "Une synthèse construite autour de vos décisions, avec un niveau de confiance.", "Des citations vérifiées dans les transcriptions, prêtes pour vos slides et vos comités."] },
      { h: "Comment ça se passe", list: ["Vous décrivez en quelques phrases qui vous voulez entendre, ou vous déposez votre brief.", "Rarelyst vous propose des profils vérifiés, chacun avec son prix.", "Vous gardez ceux qui vous intéressent : rien n'est débité avant.", "Les participants proposent leurs créneaux, vous menez les entretiens en visio.", "Vidéo, transcription et synthèse arrivent ensuite."] },
    ],
    faq: [
      { q: "Qu'est-ce que Rarelyst ?", a: "Rarelyst (rarelyst.co) est une plateforme française de recrutement de participants pour les études qualitatives et les équipes consumer insights des marques de mode, de luxe et de beauté." },
      { q: "Rarelyst remplace-t-il un institut d'études ?", a: "Rarelyst s'occupe du plus long : trouver et vérifier des profils précis. La marque mène les entretiens en visio dans Rarelyst et reçoit vidéo, transcription et synthèse." },
      { q: "Combien coûte une étude avec Rarelyst ?", a: "Le prix dépend de chaque profil et s'affiche avant de le garder. 1 crédit = 10 € HT, sans abonnement : la marque ne paie que les profils qu'elle garde." },
    ],
    faqH: "Questions fréquentes",
    box: "Qui voulez-vous entendre ?", boxP: "Décrivez votre étude en quelques phrases : nous vous proposons des profils vérifiés, avec leur prix.", boxCta: "Demander une étude", boxHref: "/signup/brand",
    more: [["/a-propos", "À propos de Rarelyst"], ["/pricing", "Tarifs"], ["/garanties", "Nos garanties"], ["/guides", "Guides"]],
  },
  en: {
    path: "/en/consumer-insights", home: "Home", crumb: "Consumer insights", kicker: "Rarelyst · consumer insights",
    h1: "Rarelyst, participant recruitment for fashion, luxury and beauty consumer insights teams",
    lead: "Rarelyst helps consumer insights teams at fashion, luxury and beauty brands talk to the right people: rare, verified profiles suggested within days, interviewed by video, with a report that answers your decisions.",
    sections: [
      { h: "For which questions", list: ["Testing a price before a launch.", "Choosing between colourways, materials or names.", "Understanding a changing clientele, or one buying less in store.", "Preparing a new category or a new market.", "Hearing what people on the ground see that dashboards don't show."] },
      { h: "Who you interview", list: ["Luxury sales associates and personal shoppers.", "Department store and concept store buyers, visual merchandisers.", "Stylists, art directors, collectors.", "Micro-influencers, early adopters, second-hand resellers.", "Savvy clients."] },
      { h: "What the consumer insights team receives", list: ["The video and transcript of every interview.", "A report built around your decisions, with a confidence level.", "Quotes checked against the transcripts, ready for your slides and committees."] },
      { h: "How it works", list: ["Describe in a few sentences who you want to hear from, or upload your brief.", "Rarelyst suggests verified profiles, each with its price.", "Keep the ones you want: nothing is charged before.", "Participants suggest time slots, you run the interviews by video.", "Video, transcript and report follow."] },
    ],
    faq: [
      { q: "What is Rarelyst?", a: "Rarelyst (rarelyst.co) is a French platform recruiting participants for qualitative research and consumer insights teams at fashion, luxury and beauty brands." },
      { q: "Does Rarelyst replace a research agency?", a: "Rarelyst handles the longest part: finding and verifying very specific profiles. The brand runs the video interviews in Rarelyst and receives video, transcript and report." },
      { q: "How much does a study with Rarelyst cost?", a: "The price depends on each profile and shows before you keep it. 1 credit = €10 excl. VAT, no subscription: brands only pay for the profiles they keep." },
    ],
    faqH: "Frequently asked questions",
    box: "Who do you want to hear from?", boxP: "Describe your study in a few sentences: we suggest verified profiles, with their price.", boxCta: "Start a study", boxHref: "/signup/brand",
    more: [["/en/about", "About Rarelyst"], ["/pricing", "Pricing"], ["/garanties", "Our guarantees"], ["/en/guides", "Guides"]],
  },
};

export default function InsightsPage({ lang }: { lang: "fr" | "en" }) {
  const t = T[lang];
  const url = `${SITE_URL}${t.path}`;
  return (
    <ContentShell lang={lang}>
      <JsonLd data={graph(
        organization(lang),
        { "@type": "WebPage", "@id": `${url}#page`, url, name: t.h1, description: t.lead, inLanguage: lang === "fr" ? "fr-FR" : "en-GB", about: { "@id": `${SITE_URL}/#organization` } },
        faqPage(t.faq, url),
        breadcrumb([{ name: t.home, url: `${SITE_URL}${lang === "en" ? "/en" : ""}` }, { name: t.crumb, url }]),
      )} />
      <main className={s.wrap}>
        <nav className={s.crumbs}><Link href={lang === "en" ? "/en" : "/"}>{t.home}</Link><span>›</span><span>{t.crumb}</span></nav>
        <p className={s.kicker}>{t.kicker}</p>
        <h1 className={s.h1}>{t.h1}</h1>
        <p className={s.lead}>{t.lead}</p>
        <div className={s.body}>
          {t.sections.map((sec) => (
            <section key={sec.h}>
              <h2>{sec.h}</h2>
              <ul>{sec.list.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className={s.faq}>
          <h2>{t.faqH}</h2>
          {t.faq.map((f) => <div key={f.q} className={s.q}><h3>{f.q}</h3><p>{f.a}</p></div>)}
        </div>
        <div className={s.box}>
          <h2>{t.box}</h2>
          <p>{t.boxP}</p>
          <Link className={s.boxCta} href={t.boxHref}>{t.boxCta} →</Link>
        </div>
        <div className={s.related}>
          {t.more.map(([href, label]) => <Link key={href} className={s.card} href={href}><b>{label}</b></Link>)}
        </div>
      </main>
    </ContentShell>
  );
}
