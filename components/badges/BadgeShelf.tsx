import Medallion from "./Medallion";
import { BADGES, type EarnedBadge } from "@/lib/participants/badges";
import css from "./badges.module.css";

type Lang = "fr" | "en";

const PENDING: Record<Lang, string> = { fr: "À confirmer", en: "Pending" };

/** Une médaille, son nom, et ce qu'il reste à faire pour l'obtenir. */
export function BadgeTile({ b, lang = "fr", size = 88, reveal, delay, explain }: {
  b: EarnedBadge; lang?: Lang; size?: number; reveal?: boolean; delay?: number;
  /** Côté marque : ce que le badge dit de la personne. */
  explain?: "meaning" | "unlock";
}) {
  const def = BADGES[b.id];
  // « À confirmer » se suffit : rappeler comment l'obtenir à qui vient de le
  // faire serait absurde.
  const note = b.state === "earned" ? (explain === "meaning" ? def.meaning[lang] : null)
    : b.state === "locked" ? def.unlock[lang] : null;
  return (
    <div className={css.tile} data-state={b.state}>
      <Medallion id={b.id} state={b.state} size={size} lang={lang} reveal={reveal} delay={delay} />
      <span className={css.tileName}>{def.name[lang]}</span>
      {b.state === "pending" && <span className={css.tag}>{PENDING[lang]}</span>}
      {b.progress && b.state === "locked" && b.progress.at > 0 && (
        <span className={css.progress} aria-label={`${b.progress.at}/${b.progress.of}`}>
          <i style={{ width: `${(b.progress.at / b.progress.of) * 100}%` }} />
        </span>
      )}
      {note && <span className={css.tileNote}>{note}</span>}
    </div>
  );
}

export default function BadgeShelf({ badges, lang = "fr", size = 88, reveal, explain = "unlock" }: {
  badges: EarnedBadge[]; lang?: Lang; size?: number; reveal?: boolean; explain?: "meaning" | "unlock";
}) {
  return (
    <div className={css.shelf}>
      {badges.map((b, i) => (
        <BadgeTile key={b.id} b={b} lang={lang} size={size} reveal={reveal} delay={reveal ? 180 + i * 140 : 0} explain={explain} />
      ))}
    </div>
  );
}

/** Rangée compacte pour la fiche vue par une marque : médaille + nom. */
export function BadgeChips({ badges, max = 4 }: { badges: EarnedBadge[]; max?: number }) {
  if (!badges.length) return null;
  return (
    <div className={css.shelfCompact}>
      {badges.slice(0, max).map((b) => (
        <span key={b.id} className={css.chip} title={BADGES[b.id].meaning.fr}>
          <Medallion id={b.id} size={30} />
          {BADGES[b.id].name.fr}
        </span>
      ))}
    </div>
  );
}
