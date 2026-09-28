import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { extractJsonObject, textFromMessage } from "@/lib/anthropic/text";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { readBrief } from "@/lib/studies/brief";
import type { BriefDraft } from "@/lib/studies/briefTypes";
import { demandOverview, recordDemand } from "./demand";

// Le laboratoire : Claude se fait passer pour une marque inventée, écrit son
// brief comme elle l'écrirait, le soumet au lecteur de brief de Rarelyst, puis
// réagit en tant que marque — ce qui est mal compris, ce qui manque, ce qu'elle
// paierait, les questions auxquelles Rarelyst ne sait pas répondre. Chaque
// passage alimente aussi la demande apprise (lib/lab/demand).

const MODEL = "claude-sonnet-5";

// Sans thème imposé, on tire un terrain au hasard pour varier les marques.
const THEMES = [
  "maison de luxe patrimoniale française", "marque DNVB de prêt-à-porter féminin", "beauté clean vendue en ligne",
  "parfumerie de niche", "marque de sneakers indépendante", "horlogerie suisse de milieu de gamme",
  "joaillerie fine", "plateforme de seconde main de luxe", "grand magasin parisien", "lingerie premium",
  "maroquinerie", "mode enfant premium", "lunetterie", "outdoor premium", "marque coréenne qui arrive en France",
  "marque américaine qui ouvre l'Europe", "créateur émergent en quête de positionnement", "vintage de luxe",
  "cosmétique pour hommes", "marque de mode éthique en difficulté", "marque de luxe qui vise la Gen Z",
  "maison italienne de cachemire", "marque de sport qui monte en gamme", "concept store multimarque",
];

export type LabBrand = {
  name: string; sector: string; positioning: string; priceRange: string; markets: string[]; size: string;
  clientele: string; situation: string; tension: string; decision: string;
  persona: { role: string; seniority: string; fears: string; judges: string };
  budget: string; confidentiality: string; unusualProfiles: string[]; briefStyle: string;
};

export type LabReview = {
  understood: "oui" | "partiellement" | "non";
  misread: string[];
  missingQuestions: string[];
  wouldBuy: "oui" | "peut-être" | "non";
  priceReaction: string;
  objections: string[];
  unmetNeeds: { need: string; why: string; frequency: string }[];
  hardProfiles: { profile: string; why: string }[];
  productIdeas: { idea: string; impact: string }[];
  unknowns: string[];
  dialogue: { who: "marque" | "rarelyst"; text: string }[];
  unanswered: string[];
  quote: string;
};

async function ask<T>(anthropic: Anthropic, system: string, prompt: string, maxTokens = 8000): Promise<T> {
  const msg = await anthropic.messages.create({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] });
  return JSON.parse(extractJsonObject(textFromMessage(msg))) as T;
}

async function productFacts(): Promise<string> {
  const [cfg, panel] = await Promise.all([
    getPricingConfig(),
    prisma.participantProfile.count({ where: { isBlacklisted: false, onboardingStatus: "complete" } }),
  ]);
  const t = cfg.tiers;
  return `CE QUE RARELYST FAIT AUJOURD'HUI (faits, ne rien inventer au-delà) :
- Recrute des participants rares (métiers de la mode et du luxe, clients avertis, collectionneurs, créateurs) pour des entretiens qualitatifs en visio, en français ou en anglais, de 30 à 90 minutes. Focus groups possibles, planifiés à la main.
- La marque écrit son brief ou dépose un document ; une IA en tire une fiche (profils, format, questions à trancher, guide d'entretien) que la marque corrige.
- Premiers profils sous 72 heures, relus à la main par l'équipe. Chaque profil affiche ses preuves (identité, LinkedIn, emploi, CV, book) et son prix.
- Prix par profil en crédits (1 crédit = ${cfg.creditValueCents / 100} € HT) pour 45 min : ${t.averti.label} ${t.averti.baseCredits} crédits, ${t.initie.label} ${t.initie.baseCredits}, ${t.rare.label} ${t.rare.baseCredits} ; ajusté selon durée, demande, rareté, certification et avis (×0,8 à ×1,6). Packs de ${cfg.packs.map((p) => `${p.credits} crédits pour ${p.priceCents / 100} €`).join(", ")}. Pas d'abonnement ; crédits rendus si le participant ne vient pas.
- C'est la marque qui mène l'entretien ; Rarelyst organise la visio, l'enregistre, la transcrit et livre une synthèse IA qui répond aux questions du brief, avec verbatims ; export PDF.
- Confidentialité : les participants voient le poinçon d'une maison vérifiée, pas son nom, avant l'entretien ; le brief n'entraîne aucune IA ; vidéos accessibles 90 jours.
- Panel actuel : ${panel} profils complets, surtout en France. Jeune entreprise, pas encore de références clients publiques.
CE QUE RARELYST NE FAIT PAS (À CE JOUR) : études quantitatives, entretiens en présentiel, tests produit à domicile, modération par un chargé d'études, accord de confidentialité signé automatiquement par chaque participant, recrutement hors France à grande échelle, traduction simultanée, rapports rédigés par un humain.`;
}

/** Invente une marque, écrit son brief, le fait lire, puis recueille sa réaction. */
export async function runSimulation(theme?: string): Promise<{ id: string } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Clé Claude absente." };
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const chosen = theme?.trim() || THEMES[Math.floor(Math.random() * THEMES.length)];
  const recent = await prisma.labRun.findMany({ orderBy: { createdAt: "desc" }, take: 15, select: { brand: true } });
  const avoid = recent.map((r) => { const b = r.brand as Partial<LabBrand>; return `${b.name} (${b.sector})`; }).join(", ");

  let brand: LabBrand | null = null;
  let brief = "";
  try {
    brand = await ask<LabBrand>(anthropic,
      "Tu inventes des marques fictives mais crédibles pour tester un service d'études qualitatives. Tu connais très bien l'industrie de la mode, du luxe et de la beauté, ses métiers et ses tensions internes.",
      `Invente une marque dans ce terrain : ${chosen}.
Elle doit être FICTIVE (nom inventé, aucune personne réelle), mais tu peux citer des marques réelles comme repères ou concurrents.
Évite de ressembler à ces marques déjà inventées : ${avoid || "aucune"}.
Donne-lui un vrai problème interne (désaccord entre équipes, chiffre qui baisse, lancement risqué, direction qui change d'avis…) et une décision à prendre bientôt, qui justifie une étude qualitative. Choisis aussi des profils à interroger dont certains sont atypiques ou difficiles à trouver.

Réponds UNIQUEMENT en JSON :
{"name":"","sector":"","positioning":"","priceRange":"","markets":[""],"size":"effectif et chiffre d'affaires approximatifs","clientele":"","situation":"2-3 phrases","tension":"le problème interne, 2-3 phrases","decision":"la décision à prendre","persona":{"role":"poste de la personne qui écrit le brief","seniority":"","fears":"ce qu'elle redoute","judges":"comment elle juge un prestataire"},"budget":"sa sensibilité au prix","confidentiality":"ce qu'elle ne veut surtout pas divulguer","unusualProfiles":["profil atypique qu'elle aimerait entendre"],"briefStyle":"un style parmi : court et flou, document structuré, liste à puces, très précis, jargon marketing"}`, 4000);

    brief = textFromMessage(await anthropic.messages.create({
      model: MODEL, max_tokens: 4000,
      system: "Tu joues la personne décrite. Tu écris un brief à un prestataire d'études qualitatives, exactement comme cette personne l'écrirait, avec ses maladresses, ses non-dits et son niveau de précision. Tu ne révèles pas tout : certaines informations importantes peuvent manquer, comme dans la vraie vie.",
      messages: [{ role: "user", content: `Toi : ${JSON.stringify(brand)}\n\nÉcris ton brief (style : ${brand.briefStyle}), entre 60 et 400 mots, en français. Uniquement le texte du brief.` }],
    }));

    const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(new Date());
    const draft: BriefDraft = await readBrief([{ kind: "text", text: `Ce que la marque a écrit :\n${brief}` }], today);

    // Ce que le panel sait déjà fournir, pour que la marque juge sur pièces.
    const demand = await demandOverview().catch(() => []);
    const facts = await productFacts();

    const review = await ask<LabReview>(anthropic,
      "Tu joues la marque décrite, face au service Rarelyst. Tu es exigeante et honnête : tu dis ce qui ne va pas, tu ne fais pas de compliments gratuits. Ensuite tu analyses l'échange comme un consultant produit.",
      `TA MARQUE ET TOI : ${JSON.stringify(brand)}

TON BRIEF :
<brief>${brief}</brief>

LA FICHE QUE RARELYST EN A TIRÉE AUTOMATIQUEMENT :
${JSON.stringify(draft)}

${facts}

PROFILS QUE RARELYST A DÉJÀ VU DEMANDER, ET COMBIEN LE PANEL EN CONTIENT :
${demand.slice(0, 25).map((d) => `- ${d.canonical} : ${d.panel} dans le panel`).join("\n") || "(rien encore)"}

1. Juge la fiche : a-t-elle compris ce que tu voulais dire ? Qu'a-t-elle mal lu ou oublié ? Quelles questions aurait-elle dû te poser ?
2. Simule 6 à 10 échanges entre toi et un commercial de Rarelyst qui ne répond QU'AVEC les faits ci-dessus. Pose tes vraies questions (prix, délais, confidentialité, profils difficiles, méthode). Quand le commercial ne peut pas répondre avec les faits donnés, il le dit.
3. Achèterais-tu ? Que penses-tu du prix ? Quelles objections ?
4. En sortant du rôle : quels besoins de marques comme celle-ci Rarelyst ne couvre pas ? Quels profils seraient difficiles à trouver ? Quelles idées de produit ? Qu'est-ce que Rarelyst ne sait pas encore sur ce type de client ?

Réponds UNIQUEMENT en JSON :
{"understood":"oui|partiellement|non","misread":[""],"missingQuestions":[""],"wouldBuy":"oui|peut-être|non","priceReaction":"","objections":[""],"unmetNeeds":[{"need":"","why":"","frequency":"courant|occasionnel|rare"}],"hardProfiles":[{"profile":"","why":""}],"productIdeas":[{"idea":"","impact":"fort|moyen|faible"}],"unknowns":[""],"dialogue":[{"who":"marque|rarelyst","text":""}],"unanswered":["question restée sans réponse"],"quote":"une phrase qui résume ton avis, dans ta voix"}`, 12000);

    const run = await prisma.labRun.create({
      data: {
        theme: chosen, status: "done",
        brand: brand as unknown as Prisma.InputJsonValue,
        brief,
        draft: draft as unknown as Prisma.InputJsonValue,
        review: review as unknown as Prisma.InputJsonValue,
      },
    });
    // Les profils demandés nourrissent la demande apprise (marquée « simulée »).
    await recordDemand("lab", run.id, [
      ...draft.profiles.map((p) => ({ label: p.label, details: p.details, count: p.count })),
      ...brand.unusualProfiles.map((u) => ({ label: u, count: 1 })),
    ]).catch((e) => console.error("[lab] demande", e));
    return { id: run.id };
  } catch (e) {
    console.error("[lab]", e);
    if (brand) {
      await prisma.labRun.create({
        data: { theme: chosen, status: "failed", brand: brand as unknown as Prisma.InputJsonValue, brief, error: e instanceof Error ? e.message.slice(0, 500) : "échec" },
      }).catch(() => null);
    }
    return { error: "La simulation a échoué. Réessayez." };
  }
}

/** Fait la synthèse de toutes les simulations : ce qui revient le plus souvent. */
export async function labDigest(): Promise<string> {
  const runs = await prisma.labRun.findMany({ where: { status: "done" }, orderBy: { createdAt: "desc" }, take: 30 });
  if (!runs.length) return "Aucune simulation pour l'instant.";
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const material = runs.map((r) => {
    const b = r.brand as unknown as LabBrand;
    const v = r.review as unknown as LabReview;
    return `## ${b.name} — ${b.sector} (${b.persona?.role})
Achèterait : ${v.wouldBuy}. Prix : ${v.priceReaction}
Mal lu : ${v.misread?.join(" ; ")}
Besoins non couverts : ${v.unmetNeeds?.map((n) => n.need).join(" ; ")}
Idées : ${v.productIdeas?.map((i) => i.idea).join(" ; ")}
Sans réponse : ${v.unanswered?.join(" ; ")}
Inconnues : ${v.unknowns?.join(" ; ")}`;
  }).join("\n\n");
  const msg = await anthropic.messages.create({
    model: MODEL, max_tokens: 6000,
    messages: [{ role: "user", content: `Voici ${runs.length} simulations de marques face à Rarelyst.\n\n${material}\n\nFais-en la synthèse pour le fondateur, en français simple, sans jargon : 1) les 5 problèmes qui reviennent le plus (avec combien de marques les ont soulevés), 2) les 5 améliorations produit les plus rentables, 3) ce que Rarelyst doit apprendre sur ses clients, 4) les profils à recruter en priorité. Listes courtes, une phrase par point.` }],
  });
  return textFromMessage(msg);
}
