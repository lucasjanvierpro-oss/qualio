import Link from "next/link";
import type { Metadata } from "next";
import ContentShell from "./ContentShell";
import JsonLd from "./JsonLd";
import s from "./content.module.css";
import { GUIDES, guidePath, type Guide } from "@/lib/seo/guides";
import { article, breadcrumb, faqPage, graph, organization } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/seo/site";

const T = {
  fr: { home: "Accueil", guides: "Guides", updated: "Mis à jour le", answer: "L'essentiel", faq: "Questions fréquentes", related: "À lire aussi", other: "Read in English",
    boxBrand: { h: "Qui voulez-vous entendre ?", p: "Décrivez la personne en quelques phrases : vos premiers profils vérifiés arrivent sous 72 heures, et vous ne payez que ceux que vous gardez.", cta: "Demander une étude" },
    boxPart: { h: "Votre regard a de la valeur.", p: "Inscription gratuite, entretiens en visio quand vous voulez, retrait dès 50 €.", cta: "Rejoindre le panel" } },
  en: { home: "Home", guides: "Guides", updated: "Updated", answer: "The short answer", faq: "Frequently asked questions", related: "Read next", other: "Lire en français",
    boxBrand: { h: "Who do you want to hear from?", p: "Describe the person in a few sentences: your first verified profiles arrive within 72 hours, and you only pay for the ones you keep.", cta: "Start a study" },
    boxPart: { h: "Your perspective is worth something.", p: "Free to join, video interviews whenever suits you, withdraw from €50.", cta: "Join the panel" } },
};

const fmt = (d: string, lang: "fr" | "en") => new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(new Date(d));

export function guideMetadata(g: Guide): Metadata {
  const url = `${SITE_URL}${guidePath(g)}`;
  const other = g.alt ? GUIDES.find((x) => x.slug === g.alt) : null;
  return {
    title: { absolute: `${g.metaTitle} · Rarelyst` },
    description: g.description,
    alternates: {
      canonical: guidePath(g),
      ...(other ? { languages: { [g.lang]: guidePath(g), [other.lang]: guidePath(other), "x-default": guidePath(g.lang === "fr" ? g : other) } } : {}),
    },
    openGraph: { type: "article", url, title: g.title, description: g.description, siteName: "Rarelyst", locale: g.lang === "fr" ? "fr_FR" : "en_GB", publishedTime: g.published, modifiedTime: g.updated, images: [g.lang === "fr" ? "/opengraph-image.png" : "/en/opengraph-image.png"] },
  };
}

export default function GuidePage({ guide: g }: { guide: Guide }) {
  const t = T[g.lang];
  const url = `${SITE_URL}${guidePath(g)}`;
  const guidesUrl = `${SITE_URL}${g.lang === "en" ? "/en" : ""}/guides`;
  const other = g.alt ? GUIDES.find((x) => x.slug === g.alt) : null;
  const related = g.related.map((slug) => GUIDES.find((x) => x.slug === slug && x.lang === g.lang)).filter(Boolean) as Guide[];
  const box = g.audience === "participants" ? t.boxPart : t.boxBrand;
  return (
    <ContentShell lang={g.lang} audience={g.audience}>
      <JsonLd data={graph(
        organization(g.lang),
        article({ url, title: g.title, description: g.description, lang: g.lang, published: g.published, updated: g.updated }),
        breadcrumb([{ name: t.home, url: `${SITE_URL}${g.lang === "en" ? "/en" : ""}` }, { name: t.guides, url: guidesUrl }, { name: g.title, url }]),
        faqPage(g.faq, url),
      )} />
      <main className={s.wrap}>
        <nav className={s.crumbs} aria-label="Fil d'Ariane">
          <Link href={g.lang === "en" ? "/en" : "/"}>{t.home}</Link><span>›</span><Link href={g.lang === "en" ? "/en/guides" : "/guides"}>{t.guides}</Link>
          {other && <><span>·</span><Link href={guidePath(other)} hrefLang={other.lang}>{t.other}</Link></>}
        </nav>
        <p className={s.kicker}>{g.kicker}</p>
        <h1 className={s.h1}>{g.title}</h1>
        <p className={s.meta}>{t.updated} {fmt(g.updated, g.lang)} · Rarelyst</p>
        <section className={s.answer} aria-label={t.answer}><b>{t.answer}</b><p>{g.answer}</p></section>
        <article className={s.body}>
          {g.sections.map((sec) => (
            <section key={sec.h}>
              <h2>{sec.h}</h2>
              {sec.p?.slice(0, sec.table ? 0 : undefined).map((p) => <p key={p}>{p}</p>)}
              {sec.list && <ul>{sec.list.map((li) => <li key={li}>{li}</li>)}</ul>}
              {sec.table && (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead><tr>{sec.table.head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
                    <tbody>{sec.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row" style={{ background: "none", textTransform: "none", letterSpacing: 0, fontSize: 15, color: "var(--ink)" }}>{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {sec.table && sec.p?.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}
        </article>
        <section className={`${s.body} ${s.faq}`}>
          <h2>{t.faq}</h2>
          {g.faq.map((f) => <div key={f.q} className={s.q}><h3>{f.q}</h3><p>{f.a}</p></div>)}
        </section>
        <aside className={s.box}>
          <h2>{box.h}</h2>
          <p>{box.p}</p>
          <Link className={s.boxCta} href={g.audience === "participants" ? "/signup/participant" : "/signup/brand"}>{box.cta} →</Link>
        </aside>
        {related.length > 0 && (
          <nav className={s.related} aria-label={t.related}>
            <h2>{t.related}</h2>
            {related.map((r) => <Link key={r.slug} className={s.card} href={guidePath(r)}><b>{r.title}</b><span>{r.description}</span></Link>)}
          </nav>
        )}
      </main>
    </ContentShell>
  );
}
