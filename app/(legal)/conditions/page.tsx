import type { Metadata } from "next";
import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Conditions générales — Rarelyst",
  description:
    "Conditions générales d'utilisation, de service et de vente de Rarelyst : règles pour les participants, engagements des marques, tarifs, responsabilité et litiges.",
};

export default function Conditions() {
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Conditions générales</h1>
      <p className={s.updated}>Version 2 — 23 septembre 2026</p>
      <p className={s.lead}>
        Ce document réunit les conditions d&apos;utilisation du site, les règles du service et
        les conditions de vente. Il s&apos;applique dès la création d&apos;un compte. Deux
        publics coexistent sur Rarelyst et n&apos;ont pas les mêmes droits : les{" "}
        <strong>participants</strong>, qui sont des consommateurs, et les{" "}
        <strong>marques</strong>, qui agissent dans un cadre professionnel. Les articles 4 à 7
        concernent les premiers, les articles 8 à 12 les secondes.
      </p>

      <h2 className={s.h2}>1. Définitions</h2>
      <ul>
        <li><strong>Plateforme</strong> : le site rarelyst.co et les services accessibles depuis un compte.</li>
        <li><strong>Participant</strong> : personne physique inscrite au panel, susceptible d&apos;être sollicitée pour une étude.</li>
        <li><strong>Marque</strong> : personne morale, ou professionnel, qui commande une étude.</li>
        <li><strong>Étude</strong> : une mission de recherche qualitative — entretiens individuels ou collectifs.</li>
        <li><strong>Crédit</strong> : unité d&apos;accès permettant à une marque d&apos;accepter un profil.</li>
        <li><strong>Livrables</strong> : enregistrements, transcriptions et synthèses produits à l&apos;occasion d&apos;une étude.</li>
      </ul>

      <h2 className={s.h2}>2. Objet et rôle de Rarelyst</h2>
      <p>
        Rarelyst recrute des participants au profil précis pour des études qualitatives
        commandées par des marques. La plateforme sélectionne les profils, organise les
        entretiens, héberge la visioconférence et produit une synthèse des échanges.
      </p>
      <p>
        Rarelyst est un <strong>intermédiaire</strong>. Elle ne garantit ni le contenu des propos
        tenus par les participants, ni la pertinence des décisions qu&apos;une marque prendra à
        partir d&apos;une étude. Elle est tenue d&apos;une obligation de moyens, non de résultat.
      </p>

      <h2 className={s.h2}>3. Compte et accès</h2>
      <p>
        L&apos;inscription est réservée aux personnes majeures. Vous vous engagez à fournir des
        informations exactes et à les tenir à jour : la justesse des profils fait la valeur du
        service. Un compte est personnel et ne se partage pas ; vous répondez des actions
        effectuées depuis le vôtre.
      </p>
      <p>
        La connexion peut se faire par mot de passe, par code reçu par email, ou via un compte
        Google ou LinkedIn. Nous ne recevons alors de ces fournisseurs que votre nom et votre
        adresse email.
      </p>
      <p>
        Nous pouvons suspendre ou fermer un compte en cas d&apos;informations volontairement
        fausses, de manquement répété aux présentes conditions, ou de comportement portant
        atteinte à un autre utilisateur. Sauf urgence ou faute grave, un avertissement précède la
        suspension.
      </p>

      {/* ───────────────── PARTICIPANTS ───────────────── */}

      <h2 className={s.h2}>4. Participants — participation aux études</h2>
      <p>
        Aucune obligation de participer : vous acceptez ou déclinez chaque proposition librement,
        sans avoir à vous justifier et sans conséquence sur les propositions futures.
      </p>
      <p>
        Une fois un créneau confirmé, vous vous engagez à être présent. Une absence non prévenue
        fait perdre du temps et de l&apos;argent à la marque, et nous conduit à réduire vos
        propositions ultérieures. Prévenez-nous dès que possible si vous ne pouvez plus venir :
        un report est presque toujours possible.
      </p>
      <p>
        <strong>Vous n&apos;êtes pas salarié de Rarelyst.</strong>{" "}Votre participation ne crée ni
        contrat de travail, ni lien de subordination, ni exclusivité. Vous restez libre de
        participer à des études d&apos;autres organismes.
      </p>

      <h2 className={s.h2}>5. Participants — enregistrement et image</h2>
      <p>
        Les entretiens sont enregistrés et transcrits <strong>uniquement</strong>{" "}si vous y avez
        consenti avant la séance. Ce consentement est demandé explicitement, séparément du reste
        du parcours, et peut être retiré à tout moment — y compris après l&apos;entretien. Nous
        supprimons alors l&apos;enregistrement et la transcription correspondante sous 30 jours,
        et la marque en est informée.
      </p>
      <p>
        Les enregistrements sont conservés <strong>90 jours</strong>{" "}puis supprimés. Ils sont
        accessibles à la marque commanditaire et à l&apos;équipe Rarelyst, à personne d&apos;autre.
      </p>
      <p>
        Vous autorisez la marque à utiliser vos propos sous forme de citations et
        d&apos;extraits, dans ses travaux internes et à des fins de recherche. Cette autorisation{" "}
        <strong>ne couvre pas</strong>{" "}la publication de votre image, de votre voix ou de votre
        nom dans une communication publique, publicitaire ou commerciale : celle-ci exigerait une
        autorisation écrite distincte, spécifique et révocable.
      </p>

      <h2 className={s.h2}>6. Participants — rémunération</h2>
      <p>
        Le montant de la récompense est indiqué avant que vous n&apos;acceptiez une étude. Il est
        dû dès lors que l&apos;entretien s&apos;est tenu dans les conditions prévues, quelle que
        soit la satisfaction de la marque quant au contenu de vos réponses.
      </p>
      <p>
        Le versement intervient dans les 30 jours suivant l&apos;entretien, par virement ou par
        bon d&apos;achat selon votre préférence. Si la marque ne se présente pas à un entretien
        confirmé, la récompense vous reste due.
      </p>
      <p>
        Ces sommes constituent des revenus occasionnels. Il vous appartient de les déclarer selon
        votre situation fiscale et sociale ; Rarelyst n&apos;effectue aucune retenue à la source.
      </p>

      <h2 className={s.h2}>7. Participants — confidentialité</h2>
      <p>
        Une marque vous montrera parfois des produits, des visuels ou des projets non encore
        rendus publics. Vous vous engagez à ne pas les divulguer ni les reproduire pendant{" "}
        <strong>deux ans</strong>{" "}à compter de l&apos;entretien. Cet engagement ne s&apos;applique
        pas aux informations déjà publiques, ni à celles que vous connaissiez avant l&apos;étude.
      </p>

      {/* ───────────────── MARQUES ───────────────── */}

      <h2 className={s.h2}>8. Marques — crédits, commandes et prix</h2>
      <p>
        L&apos;accès aux profils fonctionne par crédits. Un crédit est consommé lorsque vous
        acceptez un profil, c&apos;est-à-dire lorsque vous décidez de rencontrer cette personne.
        Décliner un profil ne coûte rien.
      </p>
      <p>
        Les prix applicables sont ceux figurant sur le devis, le bon de commande ou la grille
        tarifaire en vigueur au jour de la commande. Ils s&apos;entendent hors taxes ; la TVA
        applicable s&apos;y ajoute. Les crédits achetés sont valables <strong>douze mois</strong>{" "}
        à compter de leur achat.
      </p>
      <p>
        Un crédit est <strong>remboursé</strong>{" "}si le participant ne se présente pas à
        l&apos;entretien confirmé, ou si un incident technique imputable à la plateforme empêche
        l&apos;entretien de se tenir. Le remboursement s&apos;effectue en crédits, recrédités
        automatiquement sur votre compte.
      </p>
      <p>
        Certains profils sont proposés <strong>sur demande</strong> : aucun crédit ne permet
        d&apos;y accéder. Les conditions se négocient au cas par cas et font l&apos;objet
        d&apos;un accord distinct.
      </p>

      <h2 className={s.h2}>9. Marques — facturation et paiement</h2>
      <p>
        Les factures sont émises au moment de la commande et payables à trente jours date de
        facture, sauf stipulation différente convenue par écrit.
      </p>
      <p>
        Conformément aux articles L. 441-10 et D. 441-5 du code de commerce, tout retard de
        paiement entraîne de plein droit des pénalités calculées au taux d&apos;intérêt de la
        Banque centrale européenne majoré de dix points, ainsi qu&apos;une indemnité forfaitaire
        de <strong>40 euros</strong>{" "}pour frais de recouvrement, sans qu&apos;un rappel soit
        nécessaire. Aucun escompte n&apos;est accordé pour paiement anticipé.
      </p>
      <p>
        En cas d&apos;impayé persistant après mise en demeure restée sans effet pendant quinze
        jours, l&apos;accès au compte peut être suspendu jusqu&apos;à régularisation.
      </p>
      <p>
        Les commandes sont passées par des professionnels agissant pour les besoins de leur
        activité : le droit de rétractation prévu par le code de la consommation ne
        s&apos;applique pas.
      </p>

      <h2 className={s.h2}>10. Marques — livrables et propriété</h2>
      <p>
        Vous recevez les profils sélectionnés, les entretiens, les enregistrements, les
        transcriptions et une synthèse. Vous ne recevez <strong>ni</strong>{" "}les coordonnées
        personnelles des participants, <strong>ni</strong>{" "}leur nom complet, <strong>ni</strong>{" "}
        leurs réponses à des questions sans rapport avec votre étude.
      </p>
      <p>
        Les livrables vous sont concédés pour vos usages internes de recherche et de décision.
        Leur publication, leur diffusion à un tiers ou leur revente nécessitent notre accord
        écrit et le respect des droits des participants sur leur image et leurs propos.
      </p>
      <p>
        Rarelyst conserve la propriété de la plateforme, de sa méthode, de ses modèles de
        documents et des éléments techniques qui produisent les livrables.
      </p>

      <h2 className={s.h2}>11. Marques — non-contournement</h2>
      <p>
        Vous vous engagez à ne pas solliciter, contacter ou rémunérer directement un participant
        rencontré via Rarelyst, en dehors de la plateforme, pendant l&apos;étude et pendant{" "}
        <strong>douze mois</strong>{" "}après son terme, pour une prestation de même nature.
      </p>
      <p>
        Cette règle n&apos;est pas une formalité : elle protège les participants d&apos;une
        sollicitation directe non encadrée, et constitue le fondement économique du service. Tout
        manquement caractérisé peut donner lieu à la résiliation immédiate du compte et à une
        indemnisation correspondant au préjudice subi.
      </p>

      <h2 className={s.h2}>12. Marques — conduite des entretiens</h2>
      <p>
        Les entretiens se déroulent dans le respect des personnes. Sont exclus les propos
        discriminatoires, les questions intrusives sans rapport avec l&apos;étude, les demandes
        touchant à la santé, aux opinions politiques, religieuses ou syndicales, à
        l&apos;orientation sexuelle, ainsi que toute tentative de recrutement ou de démarchage
        commercial.
      </p>
      <p>
        Un manquement entraîne l&apos;arrêt immédiat de l&apos;étude sans remboursement, et la
        récompense reste due aux participants concernés.
      </p>

      {/* ───────────────── COMMUN ───────────────── */}

      <h2 className={s.h2}>13. Intelligence artificielle</h2>
      <p>
        Rarelyst utilise des modèles de langage à deux endroits : pour analyser les profils du
        panel et proposer ceux qui correspondent à un brief, et pour rédiger les synthèses
        d&apos;étude à partir des transcriptions réelles.
      </p>
      <p>
        <strong>Aucune décision produisant un effet significatif n&apos;est prise par la seule
        machine.</strong>{" "}La sélection finale des profils proposés à une marque est revue par une
        personne, qui écrit elle-même la justification de chaque choix. Vous pouvez demander une
        explication sur une proposition ou contester une sélection en nous écrivant.
      </p>
      <p>
        Les synthèses constituent une aide à la lecture, non une vérité établie : les
        transcriptions brutes restent disponibles et font foi en cas de divergence.
      </p>
      <p>
        Les contenus transmis à notre prestataire d&apos;intelligence artificielle{" "}
        <strong>ne servent pas à entraîner ses modèles</strong>. Ce point est détaillé dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2 className={s.h2}>14. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>, qui fait partie intégrante
        des présentes conditions.
      </p>
      <p>
        Pour les données recueillies pendant un entretien, la marque commanditaire devient
        responsable de traitement pour ses propres finalités de recherche, et Rarelyst agit comme
        sous-traitant. Les engagements correspondants figurent dans notre addendum de
        sous-traitance, communiqué sur demande à{" "}
        <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.
      </p>

      <h2 className={s.h2}>15. Disponibilité et maintenance</h2>
      <p>
        Nous faisons notre possible pour que le service fonctionne en continu, sans le garantir.
        Des interruptions peuvent survenir pour maintenance ou du fait de nos prestataires. Nous
        prévenons à l&apos;avance lorsque c&apos;est possible et privilégions les heures creuses.
      </p>

      <h2 className={s.h2}>16. Responsabilité</h2>
      <p>
        Rarelyst répond des manquements qui lui sont directement imputables. Elle ne répond ni des
        propos tenus par un participant, ni de l&apos;usage qu&apos;une marque fait des
        résultats, ni des décisions commerciales prises à leur suite, ni des défaillances des
        réseaux de télécommunication.
      </p>
      <p>
        À l&apos;égard des marques, et hors faute lourde ou dolosive, la responsabilité de
        Rarelyst est plafonnée aux sommes effectivement versées au titre de l&apos;étude
        concernée au cours des douze derniers mois. Les préjudices indirects — perte de chiffre
        d&apos;affaires, d&apos;image ou de données — ne sont pas indemnisables.
      </p>
      <p>
        <strong>Aucune clause du présent document ne limite les droits que la loi reconnaît aux
        consommateurs</strong>, ni la responsabilité en cas de dommage corporel ou de faute
        intentionnelle.
      </p>

      <h2 className={s.h2}>17. Force majeure</h2>
      <p>
        Aucune partie ne répond d&apos;un manquement causé par un événement échappant à son
        contrôle raisonnable au sens de l&apos;article 1218 du code civil : catastrophe,
        épidémie, conflit, panne généralisée d&apos;un réseau ou défaillance majeure d&apos;un
        fournisseur d&apos;infrastructure. Les obligations sont suspendues le temps de
        l&apos;événement ; si celui-ci dure plus de soixante jours, chacune des parties peut
        mettre fin au contrat sans indemnité.
      </p>

      <h2 className={s.h2}>18. Durée, résiliation et réversibilité</h2>
      <p>
        Vous pouvez fermer votre compte à tout moment en nous écrivant. Les études en cours vont à
        leur terme et les sommes dues restent acquises. La suppression des données suit les durées
        indiquées dans la politique de confidentialité.
      </p>
      <p>
        Une marque peut demander, dans les trente jours suivant la fermeture de son compte,
        l&apos;export de ses études et livrables dans un format exploitable. Passé ce délai, ils
        sont supprimés.
      </p>
      <p>
        Les crédits non utilisés à la date de résiliation à l&apos;initiative de la marque ne sont
        pas remboursés. Ils le sont si la résiliation résulte d&apos;un manquement de Rarelyst.
      </p>

      <h2 className={s.h2}>19. Preuve</h2>
      <p>
        Les enregistrements conservés par Rarelyst — journaux de connexion, horodatages,
        consentements recueillis — sont admis comme mode de preuve des actes accomplis sur la
        plateforme. Chacun conserve la faculté d&apos;apporter la preuve contraire.
      </p>

      <h2 className={s.h2}>20. Modification, cession, divisibilité</h2>
      <p>
        Ces conditions peuvent évoluer. Les utilisateurs inscrits sont prévenus par email au
        moins trente jours avant l&apos;entrée en vigueur d&apos;un changement substantiel. Une
        marque qui refuse peut résilier sans frais avant cette date.
      </p>
      <p>
        Rarelyst peut céder le contrat dans le cadre d&apos;une opération sur son capital, à
        condition que les engagements pris envers vous soient repris à l&apos;identique.
      </p>
      <p>
        Si une clause est jugée invalide, les autres demeurent applicables et la clause invalide
        est remplacée par la règle légale la plus proche de l&apos;intention commune.
      </p>

      <h2 className={s.h2}>21. Réclamations, médiation et litiges</h2>
      <p>
        Toute réclamation s&apos;adresse d&apos;abord à{" "}
        <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>. Nous accusons réception sous
        cinq jours ouvrés et répondons sous trente jours.
      </p>
      <p>
        Un consommateur peut ensuite recourir gratuitement à un médiateur de la consommation,
        dont les coordonnées figurent dans les{" "}
        <a href="/mentions-legales">mentions légales</a>, ou saisir la plateforme européenne de
        règlement en ligne des litiges à l&apos;adresse{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>
      <p>
        Ces conditions sont régies par le droit français. À défaut de solution amiable, les
        tribunaux français sont compétents. Un consommateur peut saisir la juridiction du lieu où
        il demeurait lors de la conclusion du contrat ou de la survenance du dommage.
      </p>
    </main>
  );
}
