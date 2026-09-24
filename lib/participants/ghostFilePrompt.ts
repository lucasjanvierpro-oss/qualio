// Partie PURE de la génération du ghost file : construction du prompt,
// extraction et normalisation de la réponse. Aucun accès base, aucun SDK.
//
// Deux orchestrateurs s'appuient dessus — `ghostFile.ts` (Prisma) et
// `scripts/ghost-files-via-api.ts` (HTTPS, quand le réseau bloque Postgres).
// Le prompt ne doit exister qu'ici : une divergence entre les deux chemins
// produirait des tags incompatibles avec le moteur de recherche.

export const GHOST_FILE_MODEL = "claude-sonnet-5";

// Index stockés dans `macroUniverses` → libellés lisibles.
export const MACRO_UNIVERSES = [
  "Luxe & Haute couture",
  "Streetwear & Sneakers premium",
  "Mode contemporaine française",
  "Mode contemporaine internationale",
  "Prêt-à-porter sport premium",
  "Vintage & Seconde main",
];

// Ce dont le prompt a besoin. Volontairement large : les profils anciens
// n'ont que les champs `legacy`.
export type GhostFileInput = {
  firstName: string;
  lastName: string;
  city: string | null;
  gender: string | null;
  dateOfBirth: Date | string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  selfProfileType: string | null;
  macroUniverses: string[];
  brandAffinities: string[];
  engagementTypes: string[];
  behavioralChecklist: string[];
  adaptiveAnswers: Record<string, string> | null;
  expertAnswers: Record<string, string> | null;
  screenerAnswers: Record<string, string> | null;
  followerRange: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  cvAnalysis: string | null;
  // Tunnel v2 — optionnels : les profils anciens ne les ont pas.
  segment?: string | null;
  proRole?: string | null;
  proSector?: string | null;
  proYears?: string | null;
  proCompany?: string | null;
  selfTraits?: Record<string, number> | null;
  traitProofs?: Record<string, string> | null;
  linksAnalysis?: {
    headline?: string | null;
    consistency?: string;
    supports?: string[];
    links?: { kind: string; status: string; summary?: string; signals?: string[]; followers?: number | null }[];
  } | null;
};

export type ParsedGhostFile = {
  expertiseScore: number; vocabularyScore: number; consistencyScore: number;
  earlyAdopterScore: number; influenceScore: number; authenticityScore: number;
  overallQualityScore: number; profileType: string; primaryExpertise: string;
  secondaryExpertises: string[]; generationTag: string; influenceTier: string;
  redFlags: string[]; aiProfileSummary: string; aiStrengths: string[];
  aiWeaknesses: string[]; aiBestStudyTypes: string[]; aiRecommendedBrands: string[];
  aiTags?: string[]; brandSummary?: string; behaviours?: string[];
};

export function normalizeTag(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

import { extractJsonObject } from "../anthropic/text";
import { TRAITS } from "../onboarding/questions";
import { BEHAVIOUR_KEYS } from "./badges";

const SCALE = ["pas du tout", "un peu", "plutôt oui", "complètement"];

// Conservé pour les appels existants.
export const extractJson = extractJsonObject;

const SCORE_FIELDS = [
  "expertiseScore", "vocabularyScore", "consistencyScore", "earlyAdopterScore",
  "influenceScore", "authenticityScore", "overallQualityScore",
] as const;

const LIST_FIELDS = [
  "secondaryExpertises", "redFlags", "aiStrengths", "aiWeaknesses",
  "aiBestStudyTypes", "aiRecommendedBrands",
] as const;

/** Entier 1-10, quoi que le modèle ait renvoyé (8.5, "8", null…). */
function toScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

/**
 * Parse la réponse du modèle, normalise les tags et contraint les types.
 *
 * La coercition n'est pas décorative : les colonnes de score sont des entiers
 * Postgres, et un « 8.5 » occasionnel fait échouer l'insertion avec un 22P02.
 * Le modèle ne renvoie pas toujours exactement la même forme d'un appel à
 * l'autre — c'est à nous de fermer la porte.
 */
export function parseGhostFile(raw: string): ParsedGhostFile {
  const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>;

  for (const f of SCORE_FIELDS) parsed[f] = toScore(parsed[f]);
  for (const f of LIST_FIELDS) {
    const v = parsed[f];
    parsed[f] = Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  }
  parsed.aiTags = [...new Set(
    (Array.isArray(parsed.aiTags) ? parsed.aiTags : []).map((t) => normalizeTag(String(t))).filter(Boolean),
  )];
  for (const f of ["profileType", "primaryExpertise", "generationTag", "influenceTier", "aiProfileSummary"]) {
    parsed[f] = typeof parsed[f] === "string" ? parsed[f] : "";
  }
  parsed.behaviours = [...new Set(
    (Array.isArray(parsed.behaviours) ? parsed.behaviours : []).map(String).filter((k) => BEHAVIOUR_KEYS.includes(k)),
  )];
  if (parsed.brandSummary !== undefined && typeof parsed.brandSummary !== "string") {
    delete parsed.brandSummary;
  }

  return parsed as unknown as ParsedGhostFile;
}

export function buildGhostFilePrompt(p: GhostFileInput): string {
  const expert = p.expertAnswers ?? {};
  const adaptive = p.adaptiveAnswers ?? {};
  const legacy = p.screenerAnswers ?? {};
  const universes = (p.macroUniverses ?? []).map((i) => MACRO_UNIVERSES[Number(i)] ?? i).filter(Boolean);
  const expertText = Object.values(expert).filter(Boolean).join("\n");
  const adaptiveText = Object.values(adaptive).filter(Boolean).join("\n");
  const legacyText = Object.values(legacy).filter(Boolean).join("\n");
  const dob = p.dateOfBirth;
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const traits = p.selfTraits ?? {};
  const proofs = p.traitProofs ?? {};
  const declared = TRAITS.filter((t) => traits[t.key] !== undefined).map((t) => {
    const proof = (proofs[t.key] ?? "").trim();
    return `- [${t.key}] « ${t.q.fr} » → ${SCALE[traits[t.key]] ?? "?"}${proof ? ` · preuve : « ${proof} »` : ""}`;
  }).join("\n");
  const la = p.linksAnalysis;
  const linksText = la?.links?.length
    ? la.links.map((l) => `- ${l.kind} : ${l.status === "read" ? `${l.summary ?? "lu"}${l.signals?.length ? ` (signaux : ${l.signals.join(", ")})` : ""}${l.followers ? ` · ${l.followers} abonnés` : ""}` : "non lisible publiquement"}`).join("\n")
      + `\nConcordance avec les déclarations : ${la.consistency ?? "unknown"}${la.headline ? ` · « ${la.headline} »` : ""}`
    : "(aucun lien lu)";

return `Tu es un expert en recrutement qualitatif pour des marques de mode et de luxe. Analyse le profil suivant et génère un rapport structuré en JSON.

PROFIL PARTICIPANT :
- Prénom/Nom : ${p.firstName} ${p.lastName}
- Âge : ${age ?? "non renseigné"} · Genre : ${p.gender ?? "non renseigné"} · Ville : ${p.city ?? "non renseigné"}
- Statut d'emploi : ${p.employmentStatus ?? "non renseigné"} · Éducation : ${p.educationLevel ?? "non renseigné"}
- Segment : ${p.segment ?? "non renseigné"}${p.proRole ? ` · Métier : ${p.proRole}${p.proSector ? ` (${p.proSector})` : ""}${p.proYears ? `, ${p.proYears}` : ""}${p.proCompany ? `, structure : ${p.proCompany}` : ""}` : ""}
- Auto-identification (ancienne) : ${p.selfProfileType ?? "non renseigné"}
- Univers mode : ${universes.join(", ") || "non renseigné"}
- Affinités marques : ${(p.brandAffinities ?? []).join(", ") || "non renseigné"}
- Types d'engagement : ${(p.engagementTypes ?? []).join(", ") || "non renseigné"}
- Preuves comportementales cochées : ${(p.behavioralChecklist ?? []).join(", ") || "aucune"}
- Abonnés (réseau principal) : ${p.followerRange ?? "non renseigné"} · Instagram : ${p.instagramUrl ?? "—"} · LinkedIn : ${p.linkedinUrl ?? "—"}
${p.cvAnalysis ? `- Synthèse CV/portfolio (IA) : ${p.cvAnalysis}` : ""}

QUESTIONS EXPLICITES (déclaration + preuve en une ligne) :
${declared || "(non renseigné)"}

LIENS PUBLICS LUS PAR NOTRE ROBOT (résumés, pas les pages) :
${linksText}

RÉPONSES QUALITATIVES (le plus important — évalue la profondeur et l'authenticité) :
Questions adaptatives :
${adaptiveText || "(non renseigné)"}

Questions expertes :
${expertText || legacyText || "(non renseigné)"}

INSTRUCTIONS :
- Évalue objectivement la qualité et l'authenticité des réponses
- Score chaque dimension de 1 à 10 (sois exigeant — 8+ = vraiment excellent)
- Identifie le type de profil et l'expertise principale
- Repère les red flags (réponses trop vagues, vocabulaire générique, incohérences)
- Recommande des types d'études adaptés et des marques qui bénéficieraient de ce profil

Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte avant ou après :

{
"expertiseScore": 0,
"vocabularyScore": 0,
"consistencyScore": 0,
"earlyAdopterScore": 0,
"influenceScore": 0,
"authenticityScore": 0,
"overallQualityScore": 0,
"profileType": "",
"primaryExpertise": "",
"secondaryExpertises": [],
"generationTag": "",
"influenceTier": "",
"redFlags": [],
"aiProfileSummary": "",
"aiStrengths": [],
"aiWeaknesses": [],
"aiBestStudyTypes": [],
"aiRecommendedBrands": [],
"aiTags": [],
"behaviours": [],
"brandSummary": ""
}

Valeurs attendues :
- brandSummary : résumé PRÉSENTABLE de 4-6 phrases, VISIBLE PAR LES MARQUES. Décris qui est cette personne comme profil consommateur/expert : son univers, son rapport à la mode, sa valeur pour une étude. Ton valorisant mais factuel, à la 3e personne (ex "Styliste indépendante spécialisée dans le quiet luxury…"). AUCUN score, AUCUN jugement de qualité, AUCUN nom de famille — c'est une vitrine du profil, pas une évaluation interne.
- profileType : "expert", "insider", "influencer", "creative", "enthusiast" ou "généraliste"
- primaryExpertise : ex "streetwear", "luxe", "mode contemporaine", "beauté", "retail", "styling"
- generationTag : "Gen Z", "Millennial", "Gen X" ou "Boomer"
- influenceTier : "none" (<1k), "nano" (1k-10k), "micro" (10k-50k), "macro" (50k+)
- aiProfileSummary : 3-4 phrases synthétisant le profil comme une note interne (ton professionnel, factuel)
- aiStrengths : 3-5 points forts concrets
- aiWeaknesses : 1-3 points faibles ou limites
- aiBestStudyTypes : ex ["entretien 1:1 tendances", "test produit luxe", "focus group streetwear"]
- aiRecommendedBrands : 4-6 marques qui gagneraient à interroger ce profil
- behaviours : comportements CONFIRMÉS, parmi exactement ces clés : ${BEHAVIOUR_KEYS.join(", ")}. « insider » = travaille réellement dans le secteur. N'inclus une clé que si la preuve est concrète et plausible (une marque, une pièce, un lieu, un chiffre), cohérente avec le reste du profil, ou appuyée par un lien. Une simple déclaration (« plutôt oui ») sans preuve crédible ne suffit JAMAIS. Une preuve vague (« souvent », « j'adore la mode ») ne suffit pas. En cas de doute, n'inclus pas.
- aiTags : 15 à 25 tags de recherche NORMALISÉS. Règles strictes :
· minuscules, sans accents, mots composés avec tiret (ex "quiet-luxury", "seconde-main")
· couvrir TOUTES les dimensions : expertise (ex "styliste", "buyer", "journaliste-mode"), styles/esthétiques (ex "streetwear", "quiet-luxury", "vintage", "avant-garde"), marques citées en minuscules (ex "lacoste", "jacquemus", "nike"), comportements (ex "early-adopter", "resale", "collectionneur", "gros-budget", "petit-budget"), génération (ex "gen-z", "millennial"), ville (ex "paris", "lyon"), influence (ex "createur-contenu", "micro-influence"), univers (ex "tennis", "sneakers", "beaute", "menswear", "womenswear")
· déduire des tags implicites depuis les réponses qualitatives (si la personne parle de friperies → "seconde-main", "vintage" ; si elle achète au drop → "hype", "drops")
· ces tags servent UNIQUEMENT au moteur de recherche interne, jamais affichés`;
}
