import type { Metadata } from "next";
import s from "../legal.module.css";
import { NDA_VERSION } from "@/lib/legal/nda";

export const metadata: Metadata = {
  title: "Accord de confidentialité des participants — Rarelyst",
  description: "Ce que chaque participant s'engage à garder confidentiel avant un entretien avec une marque sur Rarelyst.",
};

export default function AccordConfidentialite() {
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Accord de confidentialité des participants</h1>
      <p className={s.updated}>Version du {NDA_VERSION.split("-").reverse().join("/")}</p>
      <p className={s.lead}>
        Les marques qui interrogent des participants sur Rarelyst leur montrent parfois des projets qui ne sont pas encore
        publics : une collection, un produit, un prix, une campagne. Avant chaque entretien, le participant accepte cet
        accord. Il est conclu entre le participant et Rarelyst, qui agit aussi pour le compte de la marque de l&apos;étude.
      </p>

      <h2 className={s.h2}>1. Ce qui est confidentiel</h2>
      <p>Est confidentiel tout ce que le participant apprend à l&apos;occasion d&apos;une étude, notamment :</p>
      <ul>
        <li>l&apos;identité de la marque, si elle se présente ;</li>
        <li>les produits, prototypes, visuels, noms, prix, dates et projets montrés ou évoqués ;</li>
        <li>les questions posées et le sujet de l&apos;étude ;</li>
        <li>les documents, liens ou fichiers partagés pendant l&apos;entretien.</li>
      </ul>

      <h2 className={s.h2}>2. Ce que le participant s&apos;engage à faire</h2>
      <ul>
        <li>ne rien divulguer de ces informations, à quiconque et sous quelque forme que ce soit, y compris sur les réseaux sociaux ;</li>
        <li>ne pas faire de capture d&apos;écran, de photo ni d&apos;enregistrement de l&apos;entretien ;</li>
        <li>ne pas utiliser ces informations à son profit ou à celui d&apos;un tiers (par exemple un employeur ou un concurrent de la marque) ;</li>
        <li>prévenir Rarelyst s&apos;il découvre un conflit d&apos;intérêts avant ou pendant l&apos;entretien.</li>
      </ul>

      <h2 className={s.h2}>3. Ce qui n&apos;est pas concerné</h2>
      <ul>
        <li>les informations déjà publiques, ou qui le deviennent sans faute du participant ;</li>
        <li>ce que le participant savait déjà avant l&apos;étude ;</li>
        <li>ce qu&apos;une loi ou une autorité oblige à communiquer.</li>
      </ul>
      <p>Le participant reste libre de dire qu&apos;il participe à des études rémunérées sur Rarelyst, sans en révéler le contenu.</p>

      <h2 className={s.h2}>4. Durée</h2>
      <p>L&apos;engagement court à partir de l&apos;acceptation, pendant cinq ans, ou jusqu&apos;à ce que l&apos;information devienne publique si c&apos;est plus tôt.</p>

      <h2 className={s.h2}>5. En cas de manquement</h2>
      <p>
        Rarelyst peut retirer le participant du panel et suspendre les rémunérations liées à l&apos;étude concernée. La marque
        et Rarelyst se réservent le droit de demander réparation du préjudice subi.
      </p>

      <h2 className={s.h2}>6. Données personnelles</h2>
      <p>
        Cet accord ne change rien à la protection des données du participant, décrite dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a> : la marque ne reçoit jamais sa pièce d&apos;identité ni ses coordonnées.
      </p>

      <h2 className={s.h2}>7. Acceptation</h2>
      <p>
        Le participant accepte cet accord en cochant la case prévue avant de confirmer ses disponibilités ou de commencer un
        entretien. La date et la version acceptées sont enregistrées et visibles par la marque.
      </p>
      <p>Questions : <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.</p>
    </main>
  );
}
