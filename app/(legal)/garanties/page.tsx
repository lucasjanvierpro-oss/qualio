import type { Metadata } from "next";
import Link from "next/link";
import s from "../legal.module.css";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Nos garanties — Rarelyst",
  description: "Ce que Rarelyst garantit aux marques et aux participants : anonymat, vérification des profils, confidentialité, vidéos effacées après 90 jours.",
};

// Ce que Rarelyst promet, et ce qu'on ne fera jamais. Chaque phrase décrit ce
// que le produit fait réellement : à mettre à jour si le produit change.
export default async function Garanties() {
  const en = (await getLang()) === "en";
  if (en) return (
    <main className={s.page}>
      <h1 className={s.h1}>Our guarantees</h1>
      <p className={s.lead}>What Rarelyst guarantees to brands and participants, and what we will never do.</p>

      <h2 className={s.h2}>For participants</h2>
      <ul>
        <li><strong>We never ask you for money.</strong> No sign-up fee, nothing to buy.</li>
        <li><strong>We never ask you for confidential information about your employer</strong>: its clients, figures or projects. You can decline any question without having to explain why.</li>
        <li><strong>The brand only sees your first name and the initial of your last name.</strong> Never your ID document or your contact details.</li>
        <li><strong>You know the amount before you accept</strong>, and you withdraw to your bank account from €50.</li>
        <li><strong>You never have to accept an invitation.</strong></li>
        <li>Tell us about any conflict of interest (for example, if the brand is your employer): we will not offer you that study.</li>
      </ul>

      <h2 className={s.h2}>For brands</h2>
      <ul>
        <li><strong>The team reviews every profile before suggesting it.</strong> What has been verified (identity, LinkedIn, employment through a code sent to their work address, CV, portfolio) shows as medals on the profile.</li>
        <li><strong>Every participant accepts a <Link href="/accord-confidentialite">confidentiality agreement</Link></strong> before the interview.</li>
        <li><strong>Your name can stay hidden</strong>: participants see your hallmark, not your name.</li>
        <li><strong>You only pay for the profiles you keep</strong>, and your credits come back automatically if a participant doesn&apos;t show up.</li>
        <li><strong>Every quote in the report is checked against the transcripts.</strong> A quote we cannot find word for word is replaced by the exact sentence, or removed.</li>
      </ul>

      <h2 className={s.h2}>Interview videos</h2>
      <p>
        Interviews are recorded with the participant&apos;s consent and can only be viewed by the brand that ran the study. Videos are deleted after
        90 days, and the brand is notified 7 days before so it can download them. Transcripts are kept for the report.
      </p>

      <h2 className={s.h2}>What we will never do</h2>
      <ul>
        <li>Sell or hand over personal data.</li>
        <li>Pass off invented answers as real: every person interviewed is a real, verified person.</li>
      </ul>

      <p>A question, a concern? Write to <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.</p>
    </main>
  );
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Nos garanties</h1>
      <p className={s.lead}>Ce que Rarelyst garantit aux marques et aux participants, et ce qu&apos;on ne fera jamais.</p>

      <h2 className={s.h2}>Pour les participants</h2>
      <ul>
        <li><strong>On ne vous demande jamais d&apos;argent.</strong> Pas de frais d&apos;inscription, rien à acheter.</li>
        <li><strong>On ne vous demande jamais d&apos;information confidentielle sur votre employeur</strong> : ses clients, ses chiffres, ses projets. Vous pouvez refuser de répondre à une question sans avoir à vous justifier.</li>
        <li><strong>La marque ne voit que votre prénom et l&apos;initiale de votre nom.</strong> Jamais votre pièce d&apos;identité ni vos coordonnées.</li>
        <li><strong>Vous connaissez le montant avant d&apos;accepter</strong>, et vous retirez votre argent sur votre compte bancaire dès 50 €.</li>
        <li><strong>Vous n&apos;êtes jamais obligé d&apos;accepter une invitation.</strong></li>
        <li>Signalez-nous tout conflit d&apos;intérêts (par exemple si la marque est votre employeur) : nous ne vous proposerons pas l&apos;étude.</li>
      </ul>

      <h2 className={s.h2}>Pour les marques</h2>
      <ul>
        <li><strong>L&apos;équipe relit chaque profil avant de vous le proposer.</strong> Ce qui a été vérifié (identité, LinkedIn, emploi par un code envoyé sur l&apos;adresse professionnelle, CV, book) apparaît sous forme de médailles sur le profil.</li>
        <li><strong>Chaque participant accepte un <Link href="/accord-confidentialite">accord de confidentialité</Link></strong> avant l&apos;entretien.</li>
        <li><strong>Votre nom peut rester caché</strong> : les participants voient votre poinçon, pas votre nom.</li>
        <li><strong>Vous ne payez que les profils que vous gardez</strong>, et vos crédits vous sont rendus automatiquement si un participant ne vient pas.</li>
        <li><strong>Chaque citation de la synthèse est vérifiée dans les transcriptions.</strong> Une citation qu&apos;on ne retrouve pas mot pour mot est remplacée par la phrase exacte, ou retirée.</li>
      </ul>

      <h2 className={s.h2}>Les vidéos d&apos;entretien</h2>
      <p>
        Les entretiens sont enregistrés avec l&apos;accord du participant et ne sont visibles que par la marque de l&apos;étude. Les vidéos sont effacées
        au bout de 90 jours, et la marque est prévenue 7 jours avant pour pouvoir les télécharger. Les transcriptions sont conservées pour la synthèse.
      </p>

      <h2 className={s.h2}>Ce qu&apos;on ne fera jamais</h2>
      <ul>
        <li>Vendre ou céder des données personnelles.</li>
        <li>Faire passer des réponses inventées pour vraies : chaque personne interrogée est une vraie personne, vérifiée.</li>
      </ul>

      <p>Une question, un doute ? Écrivez-nous à <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>.</p>
    </main>
  );
}
