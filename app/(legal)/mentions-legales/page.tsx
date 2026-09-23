import type { Metadata } from "next";
import s from "../legal.module.css";

export const metadata: Metadata = {
  title: "Mentions légales — Rarelyst",
  description: "Éditeur, directeur de publication et hébergeurs du site rarelyst.co.",
};

export default function MentionsLegales() {
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Mentions légales</h1>
      <p className={s.updated}>Dernière mise à jour : 23 septembre 2026</p>
      <p className={s.lead}>
        Informations prévues par la loi pour la confiance dans l&apos;économie numérique.
      </p>

      <h2 className={s.h2}>Éditeur du site</h2>
      <p>
        Le site rarelyst.co est édité par <strong>Lucas Janvier</strong>.
      </p>
      <p>
        Contact : <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>
      </p>

      <div className={s.todo}>
        <p>
          <strong>À compléter avant toute vente.</strong>{" "}Dès que l&apos;activité est exercée à
          titre professionnel, la loi impose de publier ici la forme juridique, la dénomination
          sociale, l&apos;adresse du siège, le numéro d&apos;immatriculation au registre du
          commerce ou au répertoire des métiers, le capital social le cas échéant, le numéro de
          TVA intracommunautaire et un numéro de téléphone.
        </p>
      </div>

      <h2 className={s.h2}>Directeur de la publication</h2>
      <p>Lucas Janvier.</p>

      <h2 className={s.h2}>Hébergement</h2>
      <p>Le site et ses données reposent sur trois prestataires.</p>
      <table className={s.table}>
        <thead>
          <tr><th>Prestataire</th><th>Rôle</th><th>Coordonnées</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel</td>
            <td>Hébergement du site</td>
            <td>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com</td>
          </tr>
          <tr>
            <td>Supabase</td>
            <td>Base de données, comptes, fichiers</td>
            <td>Supabase Inc. — données hébergées dans l&apos;Union européenne (Irlande) — supabase.com</td>
          </tr>
          <tr>
            <td>Whereby</td>
            <td>Visioconférence et enregistrements</td>
            <td>Whereby AS, Norvège — whereby.com</td>
          </tr>
        </tbody>
      </table>

      <h2 className={s.h2}>Propriété intellectuelle</h2>
      <p>
        La structure du site, ses textes, son identité visuelle et ses développements sont
        protégés par le droit d&apos;auteur. Toute reproduction ou réutilisation sans
        autorisation écrite est interdite.
      </p>
      <p>
        Les contenus produits pendant une étude — enregistrements, transcriptions, synthèses —
        obéissent aux règles fixées dans les{" "}
        <a href="/conditions">conditions générales</a>.
      </p>

      <h2 className={s.h2}>Signaler un contenu</h2>
      <p>
        Pour signaler un contenu illicite ou une atteinte à vos droits, écrivez à{" "}
        <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>{" "}en précisant la page
        concernée et le motif. Nous accusons réception et traitons le signalement sans délai.
      </p>

      <h2 className={s.h2}>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Vous pouvez y exercer vos
        droits d&apos;accès, de rectification et de suppression.
      </p>

      <h2 className={s.h2}>Médiation de la consommation</h2>
      <p>
        Conformément au code de la consommation, un consommateur peut recourir gratuitement à un
        médiateur en cas de litige non résolu. Les coordonnées du médiateur seront publiées ici
        dès la désignation de l&apos;éditeur. La plateforme européenne de règlement en ligne des
        litiges reste accessible à l&apos;adresse{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>
    </main>
  );
}
