import type { Metadata } from "next";
import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Rarelyst",
  description:
    "Quelles données Rarelyst collecte, pourquoi, avec qui elles sont partagées, combien de temps elles sont conservées, et comment exercer vos droits.",
};

const MAJ = "23 septembre 2026";

export default function Confidentialite() {
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Politique de confidentialité</h1>
      <p className={s.updated}>Dernière mise à jour : {MAJ}</p>
      <p className={s.lead}>
        Rarelyst met en relation des marques et des participants pour des études qualitatives.
        Cela suppose de traiter des données personnelles : votre parcours, vos habitudes, et,
        si vous participez à un entretien, votre voix et votre image. Cette page décrit
        précisément ce que nous collectons, pourquoi, et ce que vous pouvez exiger de nous.
      </p>

      <h2 className={s.h2}>1. Qui est responsable de vos données</h2>
      <p>
        Le responsable du traitement est l&apos;éditeur du site rarelyst.co, dont l&apos;identité
        complète figure dans les <a href="/mentions-legales">mentions légales</a>.
      </p>
      <p>
        Pour toute question ou pour exercer vos droits :{" "}
        <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.
      </p>

      <h2 className={s.h2}>2. Ce que nous collectons</h2>

      <h3 className={s.h3}>Si vous êtes participant</h3>
      <ul>
        <li><strong>Identité et contact</strong> : nom, prénom, adresse email, date de naissance, ville, pays.</li>
        <li><strong>Profil professionnel</strong> : métier, années d&apos;expérience, biographie, liens LinkedIn, Instagram, TikTok.</li>
        <li><strong>Habitudes de consommation</strong> : budget d&apos;achat, canaux d&apos;achat, fréquence, marques suivies, centres d&apos;intérêt.</li>
        <li><strong>Disponibilités</strong>{" "}et réponses aux questions de sélection propres à chaque étude.</li>
        <li><strong>Données facultatives et sensibles</strong> : genre, situation professionnelle, niveau d&apos;études, revenus du foyer, origine.</li>
        <li><strong>Pièce d&apos;identité</strong>, si vous demandez la vérification de votre profil.</li>
        <li><strong>Enregistrement vidéo et transcription</strong>{" "}de vos entretiens, si vous y consentez.</li>
        <li><strong>Coordonnées de paiement</strong>{" "}pour vous verser votre récompense, gérées par notre prestataire de paiement.</li>
      </ul>

      <div className={s.note}>
        <p>
          <strong>Sur les données sensibles.</strong>{" "}L&apos;origine et les revenus relèvent de
          catégories particulières ou intimes. Elles ne servent qu&apos;à constituer des panels
          représentatifs quand une étude l&apos;exige. Elles sont <strong>facultatives</strong>,
          ne sont jamais transmises aux marques sous forme individuelle, et leur refus
          n&apos;empêche pas de participer. Vous pouvez les effacer à tout moment depuis votre
          profil ou en nous écrivant.
        </p>
      </div>

      <h3 className={s.h3}>Si vous êtes une marque</h3>
      <ul>
        <li>Nom de la société, secteur, site web.</li>
        <li>Nom, prénom, fonction et email de la personne de contact.</li>
        <li>Contenu de vos briefs d&apos;étude et notes prises pendant les entretiens.</li>
        <li>Historique de facturation et de consommation de crédits.</li>
      </ul>

      <h3 className={s.h3}>Dans tous les cas</h3>
      <ul>
        <li>Données de connexion nécessaires au fonctionnement du compte.</li>
        <li>Journaux techniques de nos hébergeurs, conservés pour la sécurité du service.</li>
      </ul>
      <p>
        Nous n&apos;utilisons <strong>aucun traceur publicitaire</strong>{" "}et ne revendons aucune
        donnée.
      </p>

      <h2 className={s.h2}>3. Pourquoi, et sur quelle base légale</h2>
      <table className={s.table}>
        <thead>
          <tr><th>Finalité</th><th>Base légale</th></tr>
        </thead>
        <tbody>
          <tr><td>Créer et gérer votre compte</td><td>Exécution du contrat</td></tr>
          <tr><td>Vous proposer des études correspondant à votre profil</td><td>Intérêt légitime, et votre consentement pour les données sensibles</td></tr>
          <tr><td>Organiser et tenir les entretiens</td><td>Exécution du contrat</td></tr>
          <tr><td>Enregistrer et transcrire un entretien</td><td>Consentement explicite, recueilli avant chaque entretien</td></tr>
          <tr><td>Vérifier votre identité</td><td>Consentement, et intérêt légitime à garantir aux marques des profils réels</td></tr>
          <tr><td>Vous verser votre récompense</td><td>Exécution du contrat et obligations comptables</td></tr>
          <tr><td>Sécuriser le service et prévenir la fraude</td><td>Intérêt légitime</td></tr>
        </tbody>
      </table>
      <p>
        Lorsque le traitement repose sur votre consentement, vous pouvez le retirer à tout
        moment, sans avoir à vous justifier et sans conséquence sur votre participation future.
      </p>

      <h2 className={s.h2}>4. Ce que voient les marques</h2>
      <p>
        Une marque qui consulte votre profil ne voit <strong>pas</strong>{" "}votre nom complet,
        votre date de naissance, votre adresse email, votre pièce d&apos;identité ni vos réponses
        brutes. Elle voit votre prénom suivi de l&apos;initiale de votre nom, votre âge, votre
        ville, votre métier, un portrait rédigé et des indicateurs d&apos;expertise.
      </p>
      <p>
        Si vous acceptez un entretien, la marque vous voit et vous entend en visioconférence, et
        accède ensuite à l&apos;enregistrement et à la transcription de cet entretien.
      </p>

      <h2 className={s.h2}>5. Qui décide quoi : responsable et sous-traitant</h2>
      <p>
        Deux situations coexistent et n&apos;obéissent pas aux mêmes règles.
      </p>
      <ul>
        <li>
          <strong>Pour le panel</strong> — votre profil, vos disponibilités, votre vérification
          d&apos;identité, votre rémunération — Rarelyst est{" "}
          <strong>responsable de traitement</strong> : c&apos;est nous qui décidons pourquoi et
          comment ces données sont utilisées, et c&apos;est à nous que vous adressez vos demandes.
        </li>
        <li>
          <strong>Pour le contenu d&apos;un entretien</strong> — ce que vous dites,
          l&apos;enregistrement, la transcription — la marque commanditaire devient{" "}
          <strong>responsable de traitement</strong>{" "}pour ses propres finalités de recherche, et
          Rarelyst agit comme <strong>sous-traitant</strong>{" "}pour son compte.
        </li>
      </ul>
      <p>
        Concrètement : si vous voulez faire supprimer votre profil, écrivez-nous. Si vous voulez
        faire supprimer ce que vous avez dit à une marque, écrivez-nous aussi — nous relayons la
        demande et supprimons notre copie. Les engagements qui lient la marque figurent dans
        notre addendum de sous-traitance, que nous lui faisons signer.
      </p>

      <h2 className={s.h2}>6. Avec qui nous partageons</h2>
      <p>
        Nous faisons appel à des prestataires techniques qui agissent sur nos instructions.
        Aucun d&apos;eux n&apos;a le droit d&apos;utiliser vos données pour son propre compte.
      </p>
      <table className={s.table}>
        <thead>
          <tr><th>Prestataire</th><th>Rôle</th><th>Lieu</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Base de données, comptes, stockage des fichiers</td><td>Union européenne (Irlande)</td></tr>
          <tr><td>Vercel</td><td>Hébergement du site</td><td>États-Unis, traitement en Europe</td></tr>
          <tr><td>Whereby</td><td>Visioconférence, enregistrement, transcription</td><td>Norvège (EEE)</td></tr>
          <tr><td>Anthropic</td><td>Analyse des profils et rédaction des synthèses</td><td>États-Unis</td></tr>
          <tr><td>Resend</td><td>Envoi des emails du service</td><td>États-Unis</td></tr>
          <tr><td>Stripe</td><td>Paiements et versement des récompenses</td><td>Irlande et États-Unis</td></tr>
        </tbody>
      </table>

      <div className={s.note}>
        <p>
          <strong>Sur l&apos;intelligence artificielle.</strong>{" "}Nous utilisons les modèles
          d&apos;Anthropic pour analyser les profils et rédiger les synthèses d&apos;étude.
          Anthropic s&apos;engage contractuellement à <strong>ne pas entraîner ses modèles</strong>{" "}
          sur les contenus transmis par son interface de programmation. Vos réponses et vos
          transcriptions ne nourrissent donc aucun modèle.
        </p>
      </div>

      <p>
        Les transferts vers les États-Unis reposent sur les clauses contractuelles types de la
        Commission européenne et, le cas échéant, sur le cadre de protection des données
        UE–États-Unis.
      </p>

      <h2 className={s.h2}>7. Profilage et décisions automatisées</h2>
      <p>
        Nous utilisons des modèles de langage pour analyser les profils du panel et proposer ceux
        qui correspondent au brief d&apos;une marque. Cette analyse produit un résumé, des
        étiquettes de domaine et des indicateurs d&apos;expertise. Il s&apos;agit d&apos;un{" "}
        <strong>profilage</strong>{" "}au sens du règlement européen.
      </p>
      <div className={s.note}>
        <p>
          <strong>Aucune décision vous concernant n&apos;est prise par la seule machine.</strong>{" "}
          Le modèle réduit une longue liste à une sélection ; c&apos;est ensuite une personne de
          l&apos;équipe Rarelyst qui choisit les profils proposés et rédige la justification de
          chaque choix. Vous pouvez demander une explication, exprimer votre point de vue, ou
          contester une sélection en écrivant à{" "}
          <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.
        </p>
      </div>

      <h2 className={s.h2}>8. Combien de temps nous conservons</h2>
      <table className={s.table}>
        <thead>
          <tr><th>Donnée</th><th>Durée</th></tr>
        </thead>
        <tbody>
          <tr><td>Compte actif</td><td>Tant que vous l&apos;utilisez</td></tr>
          <tr><td>Compte inactif</td><td>3 ans après votre dernière connexion, puis suppression</td></tr>
          <tr><td>Enregistrements vidéo</td><td><strong>90 jours</strong>{" "}après l&apos;entretien</td></tr>
          <tr><td>Transcriptions et synthèses</td><td>3 ans, sous forme pseudonymisée</td></tr>
          <tr><td>Pièce d&apos;identité</td><td>Supprimée dès la vérification effectuée</td></tr>
          <tr><td>Documents comptables</td><td>10 ans, obligation légale</td></tr>
        </tbody>
      </table>

      <h2 className={s.h2}>9. Vos droits</h2>
      <p>Vous pouvez à tout moment :</p>
      <ul>
        <li>accéder aux données que nous détenons sur vous et en obtenir une copie ;</li>
        <li>les faire corriger si elles sont inexactes ;</li>
        <li>demander leur suppression ;</li>
        <li>vous opposer à un traitement ou en demander la limitation ;</li>
        <li>récupérer vos données dans un format réutilisable ;</li>
        <li>retirer un consentement déjà donné, y compris pour un enregistrement déjà réalisé ;</li>
        <li>définir des directives sur le sort de vos données après votre décès.</li>
      </ul>
      <p>
        Écrivez à <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>. Nous répondons
        sous un mois. Si notre réponse ne vous satisfait pas, vous pouvez saisir la Commission
        nationale de l&apos;informatique et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris,{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>.
      </p>

      <h2 className={s.h2}>10. Sécurité</h2>
      <p>
        Les échanges avec le site sont chiffrés. Les mots de passe ne sont jamais stockés en
        clair. L&apos;accès aux données des participants est réservé aux personnes qui en ont
        besoin. Les liens vers les enregistrements vidéo sont temporaires et expirent
        automatiquement.
      </p>
      <p>
        En cas de violation de données présentant un risque pour vos droits, nous vous
        informerions et préviendrions la CNIL dans les délais prévus par le règlement européen.
      </p>

      <h2 className={s.h2}>11. Cookies</h2>
      <p>
        Nous déposons uniquement des cookies <strong>strictement nécessaires</strong>{" "}au
        fonctionnement du service. Ils sont exemptés de consentement préalable au titre de
        l&apos;article 82 de la loi Informatique et Libertés, ce qui explique l&apos;absence de
        bandeau sur le site.
      </p>
      <table className={s.table}>
        <thead>
          <tr><th>Cookie</th><th>Rôle</th><th>Durée</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-…-auth-token</td>
            <td>Maintient votre session ouverte après connexion</td>
            <td>1 heure, renouvelé tant que vous restez connecté</td>
          </tr>
          <tr>
            <td>Jetons de sécurité</td>
            <td>Protègent les formulaires contre les envois frauduleux</td>
            <td>Le temps de la visite</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Aucun cookie publicitaire, aucun traceur de réseau social, aucune mesure
        d&apos;audience tierce</strong>{" "}n&apos;est utilisé. Nous ne revendons aucune donnée et ne
        pratiquons aucun ciblage.
      </p>
      <p>
        Vous pouvez supprimer ces cookies depuis les réglages de votre navigateur ; vous serez
        alors déconnecté.
      </p>

      <h2 className={s.h2}>12. Mineurs</h2>
      <p>
        Le service est réservé aux personnes majeures. Nous ne collectons pas sciemment de
        données concernant des mineurs. Si vous constatez qu&apos;un mineur s&apos;est inscrit,
        écrivez-nous et nous supprimerons le compte.
      </p>

      <h2 className={s.h2}>13. Changement de prestataire</h2>
      <p>
        Nous pouvons changer de prestataire technique. Dans ce cas, le tableau de la section 6 est
        mis à jour et les utilisateurs inscrits sont prévenus par email au moins trente jours
        avant, afin de pouvoir s&apos;y opposer en fermant leur compte s&apos;ils le souhaitent.
      </p>

      <h2 className={s.h2}>14. Modifications</h2>
      <p>
        Cette politique peut évoluer. En cas de changement important, nous en informerons les
        utilisateurs inscrits par email avant son entrée en vigueur. La date de dernière mise à
        jour figure en haut de cette page.
      </p>
    </main>
  );
}
