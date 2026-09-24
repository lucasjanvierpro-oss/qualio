import Medallion from "@/components/badges/Medallion";
import { TrustLocked } from "@/components/badges/TrustBlock";
import { BADGES, TRAIT_LABELS, type BadgeFamily, type BadgeId, type EarnedBadge, type TraitState } from "@/lib/participants/badges";
import ProofAction from "./ProofAction";
import css from "./proofs.module.css";

const FAMILIES: { id: BadgeFamily; title: string; note: string }[] = [
  { id: "identite", title: "Identité", note: "C'est bien vous : la base de la confiance." },
  { id: "preuve", title: "Preuves", note: "Ce que vous montrez de votre parcours et de votre style." },
  { id: "historique", title: "Historique", note: "Ce que vous avez fait sur Rarelyst." },
];

const STATE_LABEL: Record<string, string> = { earned: "Acquise", pending: "En cours", soon: "Bientôt" };

// Une preuve « en cours » qu'on peut encore faire avancer soi-même (le reste
// attend l'équipe ou l'analyse).
const RETRY: BadgeId[] = ["emploi", "linkedin", "reseaux", "portfolio"];

/**
 * La vitrine du participant : son niveau de certification, ce qu'il touche
 * par entretien, et pour chaque preuve manquante le geste qui la fait gagner
 * et ce qu'elle rapporte. L'historique (avis, marques) reste réservé aux marques.
 */
export default function Showcase({
  badges, traits, certScore, payCents, tierLabel, gains, interviewsDone, links,
}: {
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
  return (
    <section className={css.wrap}>
      <h1 className={css.h1}>Vos médailles</h1>
      <p className={css.lead}>
        Chaque médaille est une preuve. Plus vous en avez, plus les marques vous font confiance, et plus vos entretiens sont payés.
      </p>

      <div className={css.summary}>
        <div className={css.box}>
          <div className={css.boxLabel}>Profil certifié à</div>
          <div className={css.big}>{certScore}<small>%</small></div>
          <div className={css.gauge} aria-hidden="true"><i style={{ width: `${certScore}%` }} /></div>
        </div>
        <div className={css.box}>
          <div className={css.boxLabel}>Votre rémunération</div>
          <div className={css.big}>{(payCents / 100).toLocaleString("fr-FR")} €<small>par entretien de 45 min</small></div>
          <div className={css.sub}>Palier {tierLabel}{nouveau ? " · Nouveau profil" : ""}</div>
        </div>
      </div>

      {FAMILIES.map((fam) => {
        const list = badges.filter((b) => BADGES[b.id].family === fam.id);
        if (!list.length) return null;
        return (
          <div key={fam.id} className={css.family}>
            <div className={css.familyHead}><h2>{fam.title}</h2><span>{fam.note}</span></div>
            <div className={css.list}>
              {list.map((b) => {
                const def = BADGES[b.id];
                const state = def.soon ? "soon" : b.state;
                const gain = gains[b.id];
                return (
                  <div key={b.id} className={css.item} data-state={b.state}>
                    <Medallion id={b.id} state={b.state} size={56} />
                    <div>
                      <div className={css.itemName}>{def.name.fr}</div>
                      <div className={css.itemText}>{b.state === "earned" ? def.meaning.fr : def.unlock.fr}</div>
                    </div>
                    <div className={css.itemSide}>
                      {state !== "locked" && <span className={css.state} data-s={state}>{STATE_LABEL[state]}</span>}
                      {b.state !== "earned" && !def.soon && gain ? <span className={css.gain}>+{(gain / 100).toLocaleString("fr-FR")} € par entretien</span> : null}
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
          <div className={css.familyHead}><h2>Vos traits</h2><span>Confirmés par notre IA à partir de vos exemples et de vos preuves.</span></div>
          <div className={css.traits}>
            {traits.map((t) => (
              <span key={t.id} className={css.trait} data-s={t.state}>
                {TRAIT_LABELS[t.id].name.fr}<small>{t.state === "confirmed" ? "confirmé" : "à confirmer"}</small>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={css.family}>
        <div className={css.familyHead}><h2>Ce que les marques voient en plus</h2></div>
        <TrustLocked interviewsDone={interviewsDone} style={{ margin: 0 }} />
      </div>
    </section>
  );
}
