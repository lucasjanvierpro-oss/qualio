import Medallion from "@/components/badges/Medallion";
import { TrustLocked } from "@/components/badges/TrustBlock";
import { BADGES, TRAIT_LABELS, type BadgeFamily, type BadgeId, type EarnedBadge, type TraitState } from "@/lib/participants/badges";
import ProofAction from "./ProofAction";
import css from "./proofs.module.css";

type L = "fr" | "en";
const FAMILIES: { id: BadgeFamily; title: Record<L, string>; note: Record<L, string> }[] = [
  { id: "identite", title: { fr: "Identité", en: "Identity" }, note: { fr: "C'est bien vous : la base de la confiance.", en: "It's really you: the basis of trust." } },
  { id: "preuve", title: { fr: "Preuves", en: "Proof" }, note: { fr: "Ce que vous montrez de votre parcours et de votre style.", en: "What you show of your background and style." } },
  { id: "historique", title: { fr: "Historique", en: "History" }, note: { fr: "Ce que vous avez fait sur Rarelyst.", en: "What you have done on Rarelyst." } },
];

const STATE_LABEL: Record<L, Record<string, string>> = {
  fr: { earned: "Acquise", pending: "En cours", soon: "Bientôt" },
  en: { earned: "Earned", pending: "In progress", soon: "Coming soon" },
};

// Une preuve « en cours » qu'on peut encore faire avancer soi-même (le reste
// attend l'équipe ou l'analyse).
const RETRY: BadgeId[] = ["emploi", "linkedin", "reseaux", "portfolio"];

/**
 * La vitrine du participant : son niveau de certification, ce qu'il touche
 * par entretien, et pour chaque preuve manquante le geste qui la fait gagner
 * et ce qu'elle rapporte. L'historique (avis, marques) reste réservé aux marques.
 */
export default function Showcase({
  badges, traits, certScore, payCents, tierLabel, gains, interviewsDone, links, lang = "fr",
}: {
  lang?: L;
  badges: EarnedBadge[];
  traits: TraitState[];
  certScore: number;
  payCents: number;
  tierLabel: string;
  gains: Partial<Record<BadgeId, number>>;
  interviewsDone: number;
  links: { linkedin: string; instagram: string; tiktok: string; website: string };
}) {
  const nouveau = badges.find((b) => b.id === "nouveau");
  const en = lang === "en";
  const tt = (fr: string, e: string) => (en ? e : fr);
  const loc = en ? "en-GB" : "fr-FR";
  return (
    <section className={css.wrap}>
      <h1 className={css.h1}>{tt("Vos médailles", "Your medals")}</h1>
      <p className={css.lead}>
        {tt("Chaque médaille est une preuve. Plus vous en avez, plus les marques vous font confiance, et plus vos entretiens sont payés.", "Each medal is a proof. The more you have, the more brands trust you, and the more your interviews pay.")}
      </p>

      <div className={css.summary}>
        <div className={css.box}>
          <div className={css.boxLabel}>{tt("Profil certifié à", "Profile certified at")}</div>
          <div className={css.big}>{certScore}<small>%</small></div>
          <div className={css.gauge} aria-hidden="true"><i style={{ width: `${certScore}%` }} /></div>
        </div>
        <div className={css.box}>
          <div className={css.boxLabel}>{tt("Votre rémunération", "Your pay")}</div>
          <div className={css.big}>{(payCents / 100).toLocaleString(loc)} €<small>{tt("par entretien de 45 min", "per 45-min interview")}</small></div>
          <div className={css.sub}>{tt("Palier", "Tier")} {tierLabel}{nouveau ? ` · ${tt("Nouveau profil", "New profile")}` : ""}</div>
        </div>
      </div>

      {FAMILIES.map((fam) => {
        const list = badges.filter((b) => BADGES[b.id].family === fam.id);
        if (!list.length) return null;
        return (
          <div key={fam.id} className={css.family}>
            <div className={css.familyHead}><h2>{fam.title[lang]}</h2><span>{fam.note[lang]}</span></div>
            <div className={css.list}>
              {list.map((b) => {
                const def = BADGES[b.id];
                const state = def.soon ? "soon" : b.state;
                const gain = gains[b.id];
                return (
                  <div key={b.id} className={css.item} data-state={b.state}>
                    <Medallion id={b.id} state={b.state} size={56} lang={lang} />
                    <div>
                      <div className={css.itemName}>{def.name[lang]}</div>
                      <div className={css.itemText}>{b.state === "earned" ? def.meaning[lang] : def.unlock[lang]}</div>
                    </div>
                    <div className={css.itemSide}>
                      {state !== "locked" && <span className={css.state} data-s={state}>{STATE_LABEL[lang][state]}</span>}
                      {b.state !== "earned" && !def.soon && gain ? <span className={css.gain}>+{(gain / 100).toLocaleString(loc)} € {tt("par entretien", "per interview")}</span> : null}
                      {!def.soon && fam.id !== "historique" && (b.state === "locked" || (b.state === "pending" && RETRY.includes(b.id))) && <ProofAction id={b.id} links={links} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {traits.length > 0 && (
        <div className={css.family}>
          <div className={css.familyHead}><h2>{tt("Vos traits", "Your traits")}</h2><span>{tt("Confirmés par notre IA à partir de vos exemples et de vos preuves.", "Confirmed by our AI from your examples and proof.")}</span></div>
          <div className={css.traits}>
            {traits.map((t) => (
              <span key={t.id} className={css.trait} data-s={t.state}>
                {TRAIT_LABELS[t.id].name[lang]}<small>{t.state === "confirmed" ? tt("confirmé", "confirmed") : tt("à confirmer", "to confirm")}</small>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={css.family}>
        <div className={css.familyHead}><h2>{tt("Ce que les marques voient en plus", "What brands also see")}</h2></div>
        <TrustLocked interviewsDone={interviewsDone} style={{ margin: 0 }} lang={lang} />
      </div>
    </section>
  );
}
