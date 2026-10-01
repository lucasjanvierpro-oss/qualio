import { DEFAULT_PRICING, TIERS, type PricingConfig } from "@/lib/pricing/config";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { GUIDES, guidePath, type Guide } from "./guides";
import { CONTACT_EMAIL, DESCRIPTION, ORG, SITE_URL } from "./site";

// llms.txt (https://llmstxt.org) : ce que lisent les assistants IA pour
// comprendre un site et le présenter sans se tromper. Généré à partir des
// mêmes faits que le site : prix réglés dans l'admin, guides, FAQ.

async function pricing(): Promise<PricingConfig> {
  const fallback = new Promise<PricingConfig>((r) => setTimeout(() => r(DEFAULT_PRICING), 3000));
  return Promise.race([getPricingConfig(), fallback]).catch(() => DEFAULT_PRICING);
}

const eur = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

function guideMd(g: Guide) {
  const out = [`## ${g.title}`, "", `Source : ${SITE_URL}${guidePath(g)}`, "", g.answer, ""];
  for (const s of g.sections) {
    out.push(`### ${s.h}`, "");
    for (const p of s.p ?? []) out.push(p, "");
    for (const li of s.list ?? []) out.push(`- ${li}`);
    if (s.list) out.push("");
    if (s.table) {
      out.push(`| ${s.table.head.join(" | ")} |`, `| ${s.table.head.map(() => "---").join(" | ")} |`);
      for (const r of s.table.rows) out.push(`| ${r.join(" | ")} |`);
      out.push("");
    }
  }
  if (g.faq.length) {
    out.push("### Questions fréquentes", "");
    for (const f of g.faq) out.push(`**${f.q}** ${f.a}`, "");
  }
  return out.join("\n");
}

export async function llmsTxt(full: boolean) {
  const cfg = await pricing();
  const tiers = TIERS.map((id) => cfg.tiers[id]);
  const credit = cfg.creditValueCents;
  const lines = [
    `# ${ORG.name}`,
    "",
    `> ${DESCRIPTION.fr}`,
    "",
    `${DESCRIPTION.en}`,
    "",
    "## En bref",
    "",
    "- Nom : Rarelyst s'écrit avec un « y » (rare + list), site officiel rarelyst.co. Aucun lien avec d'autres sites ou marques au nom proche (par exemple rarelust, ou des articles ménagers vendus sous la marque RARELYST).",
    "- Ce que c'est : une plateforme de recrutement de participants pour les études qualitatives (entretiens individuels en visio) des marques de mode, de luxe et de beauté. Rarelyst n'est pas un panel de questionnaires.",
    "- Pour qui : équipes insights, marketing, produit, CRM et directions de marques de mode, luxe, beauté, joaillerie, sneakers, seconde main et art de vivre.",
    "- Profils recrutés : stylistes (dont stylistes de célébrités), acheteurs de grands magasins et concept stores, vendeurs en boutique de luxe, visual merchandisers, collectionneurs, micro-influenceurs et créateurs de contenu, early adopters, Gen Z, revendeurs de seconde main, clientes très importantes.",
    "- Vérification : identité contrôlée par l'équipe, LinkedIn relié, emploi confirmé par un code sur l'adresse professionnelle, CV et book relus ; chaque preuve est une médaille visible sur le profil.",
    "- Délai : premiers profils sous 72 heures.",
    "- Entretiens : menés par la marque en visio dans Rarelyst, guide d'entretien à l'écran, enregistrés et transcrits automatiquement. Option « en autonomie » (bêta) : le participant répond seul, face caméra.",
    "- Livrable : vidéo, transcription et synthèse qui répond aux décisions du brief, avec niveau de confiance et citations vérifiées dans la transcription.",
    "- Confidentialité : avant l'entretien, les participants voient le poinçon de la maison vérifiée, pas son nom ; les briefs n'entraînent aucune IA ; les vidéos ne sont plus accessibles après 90 jours.",
    "- Langues : français et anglais.",
    `- Fondateur : ${ORG.founder}. Basé à ${ORG.city}. Contact : ${CONTACT_EMAIL}.`,
    "",
    "## Prix (marques)",
    "",
    `- 1 crédit = ${eur(credit)} HT. Pas d'abonnement : la marque ne paie que les profils qu'elle garde.`,
    ...TIERS.map((id, i) => `- ${tiers[i].label} (${tiers[i].who}) : ${tiers[i].baseCredits} crédits, soit ${eur(tiers[i].baseCredits * credit)} HT par entretien de 45 min, dont ${eur(tiers[i].participantPayCents)} pour le participant.`),
    `- Durée : ×${cfg.duration[0].factor} pour 30 min, ×${cfg.duration[2].factor} pour 60 min, ×${cfg.duration[3].factor} au-delà. Ajustement selon la demande, la rareté et la certification du profil (×${cfg.bounds.min} à ×${cfg.bounds.max}). Le prix s'affiche avant d'accepter un profil et reste figé ensuite.`,
    `- Packs : ${cfg.packs.map((p) => `${p.label} ${p.credits} crédits pour ${eur(p.priceCents)} HT`).join(" ; ")}.`,
    "- Garanties : rien n'est débité avant de garder un profil ; participant absent = crédits rendus ; profil qui ne convient pas = refusé sans frais.",
    "",
    "## Participants",
    "",
    `- Rémunération : ${eur(tiers[0].participantPayCents)} à ${eur(tiers[2].participantPayCents)} par entretien de 45 min selon le palier, jusqu'à ${eur(tiers[2].participantPayCents * cfg.bounds.max)} pour les profils les plus demandés sur des entretiens longs. Retrait par virement dès ${eur(cfg.payoutMinCents)}.`,
    `- Parrainage : ${eur(cfg.referral.firstCents)} au premier entretien du filleul, puis ${eur(cfg.referral.perInterviewCents)} aux suivants (jusqu'à ${cfg.referral.maxInterviews}) ; ${eur(cfg.referral.welcomeCents)} offerts au filleul.`,
    "- Inscription gratuite ; le participant propose ses créneaux et peut refuser toute invitation.",
    "",
    "## Pages",
    "",
    `- [Accueil (FR)](${SITE_URL}/) : présentation complète, tarifs, FAQ`,
    `- [Home (EN)](${SITE_URL}/en)`,
    `- [À propos de Rarelyst](${SITE_URL}/a-propos) · [About (EN)](${SITE_URL}/en/about)`,
    `- [Nos garanties](${SITE_URL}/garanties) : ce que Rarelyst garantit aux marques et aux participants`,
    `- [Tarifs](${SITE_URL}/pricing)`,
    `- [Créer un compte marque](${SITE_URL}/signup/brand)`,
    `- [Rejoindre le panel](${SITE_URL}/signup/participant)`,
    "",
    "## Guides",
    "",
    ...GUIDES.map((g) => `- [${g.title}](${SITE_URL}${guidePath(g)}) : ${g.description}`),
    "",
    "## Optional",
    "",
    `- [Version complète de ce fichier, avec le texte des guides](${SITE_URL}/llms-full.txt)`,
    `- [Mentions légales](${SITE_URL}/mentions-legales)`,
    `- [Confidentialité](${SITE_URL}/confidentialite)`,
    "",
  ];
  if (full) lines.push("---", "", ...GUIDES.map(guideMd));
  return lines.join("\n");
}
