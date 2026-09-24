import type { Trust } from "@/lib/participants/trust";
import css from "./trust.module.css";

const fmtMonth = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));

function Stars({ value }: { value: number }) {
  return (
    <span className={css.stars} aria-label={`${value} sur 5`}>
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
export default function TrustBlock({ trust, firstName }: { trust: Trust; firstName: string }) {
  const hasHistory = trust.interviewsDone > 0;
  return (
    <section className={css.block}>
      <div className={css.head}>
        <span className={css.title}>Historique Rarelyst</span>
        <span className={css.private}>{LOCK} Visible des marques uniquement</span>
      </div>

      {!hasHistory ? (
        <p className={css.empty}>
          Aucune marque n&apos;a encore interrogé {firstName}. Un nouveau profil n&apos;a jamais été entendu ailleurs :
          vous seriez la première.
        </p>
      ) : (
        <>
          <div className={css.stats}>
            <div className={css.stat}><b>{trust.interviewsDone}</b><span>entretien{trust.interviewsDone > 1 ? "s" : ""} mené{trust.interviewsDone > 1 ? "s" : ""}</span></div>
            {trust.rating !== null && (
              <div className={css.stat}>
                <b>{trust.rating.toLocaleString("fr-FR")}<small>/5</small></b>
                <span>{trust.reviewCount} avis</span>
              </div>
            )}
            {trust.attendance !== null && (
              <div className={css.stat}><b>{trust.attendance}<small> %</small></b><span>présence</span></div>
            )}
          </div>

          {trust.brands.length > 0 && (
            <div className={css.brands}>
              <span className={css.sub}>Ils lui ont fait confiance</span>
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
              <figcaption><Stars value={r.rating} /> {r.brand} · {fmtMonth(r.at)}</figcaption>
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
export function TrustLocked({ interviewsDone, style }: { interviewsDone: number; style?: React.CSSProperties }) {
  return (
    <section className={`${css.block} ${css.locked}`} style={style}>
      <div className={css.head}>
        <span className={css.title}>Historique Rarelyst</span>
        <span className={css.private}>{LOCK} Visible des marques uniquement</span>
      </div>
      <div className={css.blur} aria-hidden="true">
        <div className={css.stats}>
          <div className={css.stat}><b>{interviewsDone || 4}</b><span>entretiens menés</span></div>
          <div className={css.stat}><b>4,8<small>/5</small></b><span>3 avis</span></div>
          <div className={css.stat}><b>100<small> %</small></b><span>présence</span></div>
        </div>
        <div className={css.logos}><span className={css.logo}>MAISON</span><span className={css.logo}>STUDIO</span><span className={css.logo}>ATELIER</span></div>
        <figure className={css.review}><blockquote>« Un regard très précis sur la matière et les finitions, des exemples concrets. »</blockquote></figure>
      </div>
      <div className={css.veil}>
        <span className={css.veilIcon}>{LOCK}</span>
        <b>Réservé aux comptes marque</b>
        <span>Les notes, les avis et les marques qui vous ont interrogé·e ne sont visibles que par les marques. Ils se construisent à chaque entretien.</span>
      </div>
    </section>
  );
}
