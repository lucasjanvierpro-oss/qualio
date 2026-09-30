import type { Trust } from "@/lib/participants/trust";
import css from "./trust.module.css";

type Lang = "fr" | "en";

const fmtMonth = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));

function Stars({ value, lang }: { value: number; lang: Lang }) {
  return (
    <span className={css.stars} aria-label={lang === "en" ? `${value} out of 5` : `${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} data-on={i <= Math.round(value)}>★</i>)}
    </span>
  );
}

const LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/**
 * L'historique d'un participant, tel que les marques le voient : entretiens,
 * note, marques qui l'ont interrogé·e, derniers avis. Comme les avis d'une
 * place de marché, mais entre marques uniquement.
 */
export default function TrustBlock({ trust, firstName, dark, lang = "fr" }: { trust: Trust; firstName: string; dark?: boolean; lang?: Lang }) {
  const hasHistory = trust.interviewsDone > 0;
  const en = lang === "en";
  const tt = (fr: string, e: string) => (en ? e : fr);
  return (
    <section className={`${css.block} ${dark ? css.dark : ""}`}>
      <div className={css.head}>
        <span className={css.title}>{tt("Historique Rarelyst", "Rarelyst history")}</span>
        <span className={css.private}>{LOCK} {tt("Visible des marques uniquement", "Visible to brands only")}</span>
      </div>

      {!hasHistory ? (
        <p className={css.empty}>
          {en
            ? `No brand has interviewed ${firstName} yet. A new profile has never been heard anywhere else: you would be the first.`
            : `Aucune marque n'a encore interrogé ${firstName}. Un nouveau profil n'a jamais été entendu ailleurs : vous seriez la première.`}
        </p>
      ) : (
        <>
          <div className={css.stats}>
            <div className={css.stat}><b>{trust.interviewsDone}</b><span>{tt(`entretien${trust.interviewsDone > 1 ? "s" : ""} mené${trust.interviewsDone > 1 ? "s" : ""}`, `interview${trust.interviewsDone > 1 ? "s" : ""} done`)}</span></div>
            {trust.rating !== null && (
              <div className={css.stat}>
                <b>{trust.rating.toLocaleString(en ? "en-GB" : "fr-FR")}<small>/5</small></b>
                <span>{trust.reviewCount} {tt("avis", trust.reviewCount > 1 ? "reviews" : "review")}</span>
              </div>
            )}
            {trust.attendance !== null && (
              <div className={css.stat}><b>{trust.attendance}<small> %</small></b><span>{tt("présence", "attendance")}</span></div>
            )}
          </div>

          {trust.brands.length > 0 && (
            <div className={css.brands}>
              <span className={css.sub}>{tt("Ils lui ont fait confiance", "Brands that trusted them")}</span>
              <div className={css.logos}>
                {trust.brands.slice(0, 5).map((b) => (
                  <span key={b.name} className={css.logo} title={b.name}>
                    {b.logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={b.logoUrl} alt={b.name} />
                      : b.name}
                  </span>
                ))}
                {trust.brands.length > 5 && <span className={css.more}>+{trust.brands.length - 5}</span>}
              </div>
            </div>
          )}

          {trust.topTags.length > 0 && (
            <div className={css.tags}>
              {trust.topTags.map((t) => (
                <span key={t.tag} className={css.tag}>{t.tag}{t.count > 1 && <em>×{t.count}</em>}</span>
              ))}
            </div>
          )}

          {trust.reviews.filter((r) => r.comment).slice(0, 2).map((r, i) => (
            <figure key={i} className={css.review}>
              <blockquote>« {r.comment} »</blockquote>
              <figcaption><Stars value={r.rating} lang={lang} /> {r.brand} · {fmtMonth(r.at, lang)}</figcaption>
            </figure>
          ))}
        </>
      )}
    </section>
  );
}

/**
 * Ce que le participant voit à la place : le bloc existe, son contenu est
 * réservé aux marques. Le flou montre qu'il y a quelque chose, sans rien
 * laisser lire.
 */
export function TrustLocked({ interviewsDone, style, lang = "fr" }: { interviewsDone: number; style?: React.CSSProperties; lang?: Lang }) {
  const tt = (fr: string, e: string) => (lang === "en" ? e : fr);
  return (
    <section className={`${css.block} ${css.locked}`} style={style}>
      <div className={css.head}>
        <span className={css.title}>{tt("Historique Rarelyst", "Rarelyst history")}</span>
        <span className={css.private}>{LOCK} {tt("Visible des marques uniquement", "Visible to brands only")}</span>
      </div>
      <div className={css.blur} aria-hidden="true">
        <div className={css.stats}>
          <div className={css.stat}><b>{interviewsDone || 4}</b><span>{tt("entretiens menés", "interviews done")}</span></div>
          <div className={css.stat}><b>4,8<small>/5</small></b><span>{tt("3 avis", "3 reviews")}</span></div>
          <div className={css.stat}><b>100<small> %</small></b><span>{tt("présence", "attendance")}</span></div>
        </div>
        <div className={css.logos}><span className={css.logo}>MAISON</span><span className={css.logo}>STUDIO</span><span className={css.logo}>ATELIER</span></div>
        <figure className={css.review}><blockquote>« Un regard très précis sur la matière et les finitions, des exemples concrets. »</blockquote></figure>
      </div>
      <div className={css.veil}>
        <span className={css.veilIcon}>{LOCK}</span>
        <b>{tt("Réservé aux comptes marque", "Brand accounts only")}</b>
        <span>{tt("Les notes, les avis et les marques qui vous ont interrogé·e ne sont visibles que par les marques. Ils se construisent à chaque entretien.", "Ratings, reviews and the brands that interviewed you are only visible to brands. They build up with each interview.")}</span>
      </div>
    </section>
  );
}
