import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { TIERS } from "@/lib/pricing/config";
import { getLang } from "@/lib/i18n/server";
import LangSwitch from "@/components/i18n/LangSwitch";
import p from "./pricing.module.css";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumb, graph, organization, service } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

// Les tarifs viennent des réglages de prix (/admin/prix) : une seule grille
// pour ce site, le compte marque et le paiement.

export const metadata: Metadata = {
  title: { absolute: "Tarifs : prix d'un profil pour vos études qualitatives · Rarelyst" },
  description: "Le prix de chaque profil s'affiche avant de l'accepter : 390 € à 1 300 € HT l'entretien de 45 min, rémunération du participant comprise. Crédits sans abonnement, vous ne payez que les profils gardés.",
  alternates: { canonical: "/pricing" },
};

const T = {
  fr: {
    locale: "fr-FR", home: "/", nav: { how: "Comment ça marche", login: "Connexion", cta: "Demander une étude" },
    kicker: "Tarifs", h1: "Vous payez le profil, pas un abonnement",
    lead: "Des crédits, sans engagement. Chaque profil affiche son prix avant que vous l'acceptiez : ce qu'il sait, ce qu'il a prouvé, combien il est demandé.",
    tierTag: (i: number) => (i === 2 ? "Sur demande possible" : `Palier ${i + 1}`), from: "dès", credits: "crédits",
    euros: (e: string) => `soit ${e} € HT l'entretien de 45 min, tout compris`,
    tierText: null as null | Record<string, { label: string; who: string }>,
    howTitle: "Comment le prix d'un profil se calcule",
    howLead: "Automatiquement, et toujours affiché avec son détail. Le participant touche une part fixe de ce prix : plus un profil vaut, plus il est payé.",
    how: [
      ["Le palier", "Client·e averti·e, Initié·e ou Rare : ce que la personne sait et a prouvé de son métier."],
      ["La durée", "30, 45 ou 60 minutes ; un participant de focus group coûte moins qu'un entretien seul."],
      ["La demande", "Un profil que plusieurs marques ont retenu ces trois derniers mois vaut un peu plus."],
      ["La rareté", "Moins il existe de profils comparables dans le panel, plus le prix monte."],
      ["La certification", "Identité, emploi, LinkedIn, CV vérifiés : un profil prouvé vaut plus qu'un profil déclaré."],
      ["Les avis", "Les notes laissées par les autres marques après leurs entretiens."],
    ],
    packsTitle: "Les packs de crédits", packNote: null as null | Record<string, string>, excl: "€ HT", cta: "Créer un compte marque",
    faqTitle: "Questions fréquentes",
    faq: [
      ["C'est quoi un crédit ?", "1 crédit vaut 10 € HT. Chaque profil affiche son prix en crédits avant que vous l'acceptiez ; rien n'est débité tant que vous n'avez pas dit oui."],
      ["Pourquoi tous les profils n'ont pas le même prix ?", "Une vendeuse d'une maison de luxe ou une directrice artistique ne s'interrogent pas au même prix qu'un client passionné. Le prix se calcule seul à partir du palier, de la durée, de la demande, de la rareté, des preuves et des avis ; il est figé au moment où le profil vous est proposé."],
      ["Une petite marque peut-elle commencer ?", "Oui. Le pack Découverte (400 € HT) couvre un premier entretien avec un·e client·e averti·e, sans abonnement ni engagement."],
      ["Et si le participant ne vient pas ?", "Les crédits du profil vous sont rendus automatiquement."],
      ["Les crédits expirent-ils ?", "Non. Utilisez-les à votre rythme."],
      ["Qui paie les participants ?", "Rarelyst, sur ce que vous avez réglé en crédits. Vous n'avez ni virement ni bon d'achat à gérer."],
    ],
  },
  en: {
    locale: "en-GB", home: "/en", nav: { how: "How it works", login: "Log in", cta: "Start a study" },
    kicker: "Pricing", h1: "Pay per profile, not a subscription",
    lead: "Credits, no commitment. Every profile shows its price before you accept it: what they know, what they've proven, how in demand they are.",
    tierTag: (i: number) => (i === 2 ? "On request available" : `Tier ${i + 1}`), from: "from", credits: "credits",
    euros: (e: string) => `i.e. €${e} excl. VAT per 45-min interview, all included`,
    tierText: {
      averti: { label: "Savvy customer", who: "Passionate shoppers, thrifters, collectors" },
      initie: { label: "Insider", who: "In-house sales associates, stylists, buyers, visual merchandisers" },
      rare: { label: "Rare", who: "Art directors, top clients, renowned collectors" },
    } as null | Record<string, { label: string; who: string }>,
    howTitle: "How a profile's price is set",
    howLead: "Automatically, and always shown in detail. The participant gets a fixed share of the price: the more a profile is worth, the more they're paid.",
    how: [
      ["Tier", "Savvy customer, Insider or Rare: what the person knows and has proven about their work."],
      ["Length", "30, 45 or 60 minutes; a focus group participant costs less than a one-on-one."],
      ["Demand", "A profile several brands kept over the last three months is worth a little more."],
      ["Scarcity", "The fewer comparable profiles in the panel, the higher the price."],
      ["Certification", "Verified ID, employment, LinkedIn, CV: a proven profile is worth more than a self-declared one."],
      ["Reviews", "Ratings left by other brands after their interviews."],
    ],
    packsTitle: "Credit packs",
    packNote: { decouverte: "A first interview, no commitment", studio: "−10% · a small study", maison: "−20% · several studies", "grande-maison": "−30% · the whole year" } as null | Record<string, string>,
    excl: "excl. VAT", cta: "Create a brand account",
    faqTitle: "FAQ",
    faq: [
      ["What is a credit?", "1 credit is worth €10 excl. VAT. Every profile shows its price in credits before you accept it; nothing is charged until you say yes."],
      ["Why don't all profiles cost the same?", "A luxury house sales associate or an art director isn't interviewed at the same price as a passionate customer. The price is computed from tier, length, demand, scarcity, proof and reviews, and it's locked when the profile is suggested to you."],
      ["Can a small brand start?", "Yes. The Discovery pack (€400 excl. VAT) covers a first interview with a savvy customer, with no subscription or commitment."],
      ["What if the participant doesn't show up?", "The profile's credits are refunded automatically."],
      ["Do credits expire?", "No. Use them at your own pace."],
      ["Who pays the participants?", "Rarelyst, out of what you paid in credits. No transfers or vouchers for you to handle."],
    ],
  },
};

export default async function PricingPage() {
  const [cfg, lang] = await Promise.all([getPricingConfig(), getLang()]);
  const t = T[lang];
  const euros = (credits: number) => ((credits * cfg.creditValueCents) / 100).toLocaleString(t.locale);

  return (
    <div className={p.page} lang={lang}>
      <JsonLd data={graph(
        organization(lang),
        service(lang, TIERS.map((id) => ({ id, label: cfg.tiers[id].label, who: cfg.tiers[id].who, credits: cfg.tiers[id].baseCredits, euros: Math.round((cfg.tiers[id].baseCredits * cfg.creditValueCents) / 100), pay: cfg.tiers[id].participantPayCents }))),
        breadcrumb([{ name: lang === "en" ? "Home" : "Accueil", url: `${SITE_URL}${lang === "en" ? "/en" : ""}` }, { name: lang === "en" ? "Pricing" : "Tarifs", url: `${SITE_URL}/pricing` }]),
      )} />
      <header className={p.nav}>
        <Link href={t.home} className={p.brand}><Image src="/brand/logo.png" alt="" width={26} height={26} priority />Rarelyst</Link>
        <div className={p.navRight}>
          <Link href={t.home === "/" ? "/#comment" : "/en#comment"} className={p.navLink}>{t.nav.how}</Link>
          <LangSwitch lang={lang} />
          <Link href="/login" className={p.navLink}>{t.nav.login}</Link>
          <Link href="/signup/brand" className={p.btnSm}>{t.nav.cta} →</Link>
        </div>
      </header>

      <main className={p.main}>
        <header className={p.head}>
          <p className={p.kicker}>{t.kicker}</p>
          <h1 className={p.h1}>{t.h1}</h1>
          <p className={p.lead}>{t.lead}</p>
        </header>

        <section className={p.tiers}>
          {TIERS.map((id, i) => {
            const tier = cfg.tiers[id];
            const txt = t.tierText?.[id] ?? { label: tier.label, who: tier.who };
            return (
              <article key={id} className={p.tier} data-tier={id} style={{ ["--i" as string]: i }}>
                <span className={p.tierTag}>{t.tierTag(i)}</span>
                <b className={p.tierLabel}>{txt.label}</b>
                <p className={p.tierWho}>{txt.who}</p>
                <div className={p.tierPrice}><small>{t.from}</small><b>{tier.baseCredits}</b><span>{t.credits}</span></div>
                <p className={p.tierEuros}>{t.euros(euros(tier.baseCredits))}</p>
              </article>
            );
          })}
        </section>

        <section className={p.sec}>
          <h2 className={p.h2}>{t.howTitle}</h2>
          <p className={p.secLead}>{t.howLead}</p>
          <div className={p.how}>
            {t.how.map(([title, d], i) => (
              <div key={title}><span className={p.howNum}>0{i + 1}</span><b>{title}</b><p>{d}</p></div>
            ))}
          </div>
        </section>

        <section className={p.sec}>
          <h2 className={p.h2}>{t.packsTitle}</h2>
          <div className={p.packs}>
            {cfg.packs.map((pk, i) => (
              <div key={pk.id} className={p.pack} data-best={i === cfg.packs.length - 2}>
                <span className={p.packLabel}>{pk.label}</span>
                <b className={p.packCredits}>{pk.credits.toLocaleString(t.locale)} <small>{t.credits}</small></b>
                <span className={p.packPrice}>{lang === "en" ? `€${(pk.priceCents / 100).toLocaleString(t.locale)}` : `${(pk.priceCents / 100).toLocaleString(t.locale)} €`} {lang === "en" ? t.excl : "HT"}</span>
                <span className={p.packNote}>{t.packNote?.[pk.id] ?? pk.note}</span>
              </div>
            ))}
          </div>
          <div className={p.ctaRow}><Link href="/signup/brand" className={p.btn}>{t.cta} →</Link></div>
        </section>

        <section className={`${p.sec} ${p.faqSec}`}>
          <h2 className={p.h2}>{t.faqTitle}</h2>
          {t.faq.map(([q, a]) => (
            <details key={q} className={p.faq}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </main>
    </div>
  );
}
