import type { Metadata } from "next";
import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Conditions générales — Rarelyst",
  description:
    "Les règles du service Rarelyst : rôle de chacun, déroulement d'une étude, enregistrements, rémunération des participants, crédits des marques.",
};

export default function Conditions() {
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Conditions générales</h1>
      <p className={s.updated}>Dernière mise à jour : 23 septembre 2026</p>
      <p className={s.lead}>
        Ces conditions décrivent le fonctionnement de Rarelyst et ce que chacun s&apos;engage à
        faire : la plateforme, les marques qui commandent une étude, et les participants qui
        donnent leur avis. Elles s&apos;appliquent dès que vous créez un compte.
      </p>

      <h2 className={s.h2}>1. Ce que fait Rarelyst</h2>
      <p>
        Rarelyst recrute des participants au profil précis pour des études qualitatives —
        entretiens individuels ou collectifs — commandées par des marques. La plateforme
        sélectionne les profils, organise les entretiens, héberge la visioconférence et produit
        une synthèse des échanges.
      </p>
      <p>
        Rarelyst est un intermédiaire. Elle ne garantit ni le contenu des propos tenus par les
        participants, ni les décisions qu&apos;une marque prendra à partir d&apos;une étude.
      </p>

      <h2 className={s.h2}>2. Créer un compte</h2>
      <p>
        L&apos;inscription est réservée aux personnes majeures. Vous vous engagez à fournir des
        informations exactes et à les tenir à jour : c&apos;est la justesse de votre profil qui
        fait la valeur du service. Un compte est personnel et ne se partage pas.
      </p>
      <p>
        Nous pouvons suspendre ou fermer un compte en cas d&apos;informations volontairement
        fausses, de manquement répété aux engagements ci-dessous, ou de comportement portant
        atteinte à un autre utilisateur.
      </p>

      <h2 className={s.h2}>3. Participants</h2>

      <h3 className={s.h3}>Participation et engagement</h3>
      <p>
        Rien ne vous oblige à accepter une étude. Une fois un créneau confirmé, vous vous engagez
        en revanche à être présent : votre absence fait perdre du temps et de l&apos;argent à la
        marque. Prévenez-nous dès que possible si vous ne pouvez plus venir.
      </p>

      <h3 className={s.h3}>Enregistrement</h3>
      <p>
        Les entretiens sont enregistrés et transcrits uniquement si vous y avez consenti avant la
        séance. Ce consentement est demandé explicitement et peut être retiré à tout moment, y
        compris après l&apos;entretien : nous supprimons alors l&apos;enregistrement et la
        transcription correspondante.
      </p>
      <p>
        Les enregistrements sont conservés <strong>90 jours</strong>, puis supprimés. Ils sont
        accessibles à la marque commanditaire et à l&apos;équipe Rarelyst, à personne d&apos;autre.
      </p>

      <h3 className={s.h3}>Rémunération</h3>
      <p>
        Le montant de la récompense est indiqué avant que vous n&apos;acceptiez une étude. Il est
        dû dès lors que l&apos;entretien s&apos;est tenu dans les conditions prévues. Le
        versement intervient après l&apos;entretien, par virement ou par bon d&apos;achat selon
        votre préférence.
      </p>
      <p>
        Ces sommes sont des revenus occasionnels. Il vous appartient de les déclarer selon votre
        situation fiscale.
      </p>

      <h3 className={s.h3}>Confidentialité</h3>
      <p>
        Une marque vous montrera parfois des produits, des visuels ou des projets non encore
        rendus publics. Vous vous engagez à ne pas les divulguer, ni à les reproduire, pendant
        deux ans à compter de l&apos;entretien.
      </p>

      <h3 className={s.h3}>Vos propos</h3>
      <p>
        Vous autorisez la marque commanditaire à utiliser vos propos, sous forme de citations et
        d&apos;extraits, dans ses travaux internes. Cette autorisation ne couvre pas la
        publication de votre image ou de votre nom dans une communication publique : celle-ci
        exigerait votre accord écrit distinct.
      </p>

      <h2 className={s.h2}>4. Marques</h2>

      <h3 className={s.h3}>Crédits</h3>
      <p>
        L&apos;accès aux profils fonctionne par crédits. Un crédit est consommé lorsque vous
        acceptez un profil, c&apos;est-à-dire lorsque vous décidez de rencontrer cette personne.
        Décliner un profil ne coûte rien.
      </p>
      <p>
        Un crédit est <strong>remboursé</strong>{" "}si le participant ne se présente pas à
        l&apos;entretien confirmé, ou si un problème technique imputable à la plateforme empêche
        l&apos;entretien de se tenir. Les crédits achetés sont valables douze mois.
      </p>
      <p>
        Certains profils sont proposés <strong>sur demande</strong> : aucun crédit ne permet d&apos;y
        accéder, les conditions se négocient au cas par cas.
      </p>

      <h3 className={s.h3}>Ce que vous recevez, ce que vous ne recevez pas</h3>
      <p>
        Vous recevez les profils sélectionnés, les entretiens, les enregistrements, les
        transcriptions et une synthèse. Vous ne recevez ni les coordonnées personnelles des
        participants, ni leur nom complet.
      </p>
      <p>
        Vous vous engagez à ne pas chercher à contacter un participant en dehors de la
        plateforme, ni pendant l&apos;étude ni après. Cette règle protège les participants et
        constitue le fondement du service.
      </p>

      <h3 className={s.h3}>Usage des résultats</h3>
      <p>
        Les livrables d&apos;une étude vous appartiennent pour vos usages internes. Leur
        publication ou leur revente à un tiers nécessite notre accord écrit, et le respect des
        droits des participants sur leur image et leurs propos.
      </p>

      <h3 className={s.h3}>Respect des participants</h3>
      <p>
        Les entretiens se déroulent dans le respect. Sont exclus les propos discriminatoires, les
        questions intrusives sans rapport avec l&apos;étude, et toute tentative de recrutement ou
        de démarchage commercial. Un manquement entraîne l&apos;arrêt immédiat de l&apos;étude
        sans remboursement.
      </p>

      <h2 className={s.h2}>5. Synthèses produites par intelligence artificielle</h2>
      <p>
        Les synthèses d&apos;étude sont rédigées avec l&apos;aide de modèles de langage à partir
        des transcriptions réelles des entretiens. Elles constituent une aide à la lecture, non
        une vérité établie : les transcriptions brutes restent disponibles et font foi.
      </p>
      <p>
        Les contenus transmis à notre prestataire d&apos;intelligence artificielle ne servent pas
        à entraîner ses modèles. Ce point est détaillé dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2 className={s.h2}>6. Disponibilité du service</h2>
      <p>
        Nous faisons notre possible pour que le service fonctionne en continu, sans le garantir.
        Des interruptions peuvent survenir pour maintenance ou du fait de nos prestataires. Nous
        prévenons à l&apos;avance lorsque c&apos;est possible.
      </p>

      <h2 className={s.h2}>7. Responsabilité</h2>
      <p>
        Rarelyst répond des manquements qui lui sont directement imputables. Elle ne répond ni
        des propos tenus par un participant, ni de l&apos;usage qu&apos;une marque fait des
        résultats, ni des décisions commerciales prises à leur suite.
      </p>
      <p>
        Aucune clause de ces conditions ne limite les droits que la loi reconnaît aux
        consommateurs.
      </p>

      <h2 className={s.h2}>8. Résiliation</h2>
      <p>
        Vous pouvez fermer votre compte à tout moment en nous écrivant. Les études en cours vont
        à leur terme, et les sommes dues vous restent acquises. La suppression de vos données
        suit les durées indiquées dans la politique de confidentialité.
      </p>

      <h2 className={s.h2}>9. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. Les utilisateurs inscrits sont prévenus par email avant
        l&apos;entrée en vigueur d&apos;un changement important. La poursuite de l&apos;usage du
        service vaut acceptation.
      </p>

      <h2 className={s.h2}>10. Droit applicable</h2>
      <p>
        Ces conditions sont régies par le droit français. En cas de litige, une solution amiable
        est recherchée en priorité ; à défaut, les tribunaux français sont compétents. Un
        consommateur peut saisir la juridiction de son lieu de résidence.
      </p>
    </main>
  );
}
