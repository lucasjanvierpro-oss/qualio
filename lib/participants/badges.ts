// Médailles d'un participant : ce qui CERTIFIE le profil.
//
// Une médaille est une preuve, jamais une déclaration : une pièce d'identité
// contrôlée, un CV lu, un emploi confirmé par un code reçu sur l'adresse
// professionnelle, un historique d'entretiens. Plus un profil en a, plus les
// marques en savent sur lui — et plus il est payé (voir lib/pricing).
//
// Quatre familles :
//   · identité   — c'est bien cette personne (pièce d'identité, LinkedIn, emploi, vidéo)
//   · preuves    — ce qu'elle montre (CV, book, réseaux, achats, diplôme)
//   · historique — ce qu'elle a fait sur Rarelyst (entretiens, avis, présence)
//   · statut     — « Nouveau profil »
//
// Les traits de caractère (early adopter, prescripteur…) ne sont pas des
// médailles : ce sont des étiquettes que l'IA confirme à partir des preuves
// données dans le tunnel. Voir TRAITS plus bas.
//
// Pur : aucun accès base, utilisable côté serveur comme côté client.

import { PROOF_MIN, TRAIT_CLAIMED, type Bi } from "../onboarding/questions";

export type BadgeId =
  | "nouveau"
  | "verifie" | "linkedin" | "emploi" | "video"
  | "cv" | "portfolio" | "reseaux" | "achat" | "diplome"
  | "premier" | "habitue" | "recommande" | "ponctuel";

export type BadgeFamily = "statut" | "identite" | "preuve" | "historique";
export type BadgeState = "earned" | "pending" | "locked";

export type BadgeDef = {
  id: BadgeId;
  family: BadgeFamily;
  name: Bi;
  /** Ce que la médaille prouve, pour la marque. */
  meaning: Bi;
  /** Comment l'obtenir, pour le participant. */
  unlock: Bi;
  /** Poids dans le niveau de certification (sur 100). 0 pour l'historique. */
  weight: number;
  /** Qui la décerne : automatiquement, ou après contrôle par l'équipe. */
  check: "auto" | "equipe";
  /** Pas encore ouverte : visible, mais pas encore obtenable. */
  soon?: boolean;
};

export const BADGES: Record<BadgeId, BadgeDef> = {
  nouveau: {
    id: "nouveau", family: "statut", weight: 0, check: "auto",
    name: { fr: "Nouveau profil", en: "New profile" },
    meaning: { fr: "Arrivé·e récemment : jamais interrogé·e par une autre marque.", en: "Just joined: never interviewed by another brand." },
    unlock: { fr: "Offert à l'inscription.", en: "Given when you join." },
  },
  verifie: {
    id: "verifie", family: "identite", weight: 25, check: "equipe",
    name: { fr: "Identité vérifiée", en: "Verified identity" },
    meaning: { fr: "Pièce d'identité contrôlée par Rarelyst.", en: "ID checked by Rarelyst." },
    unlock: { fr: "Envoyez une pièce d'identité depuis votre espace.", en: "Upload an ID from your space." },
  },
  linkedin: {
    id: "linkedin", family: "identite", weight: 15, check: "auto",
    name: { fr: "LinkedIn vérifié", en: "Verified LinkedIn" },
    meaning: { fr: "Son compte LinkedIn lui appartient et concorde avec son parcours.", en: "Owns the LinkedIn account; matches their career." },
    unlock: { fr: "Connectez-vous une fois avec LinkedIn.", en: "Sign in once with LinkedIn." },
  },
  emploi: {
    id: "emploi", family: "identite", weight: 15, check: "auto",
    name: { fr: "Emploi vérifié", en: "Verified employment" },
    meaning: { fr: "A confirmé une adresse professionnelle : travaille bien là où il·elle le dit.", en: "Confirmed a work email: works where they say." },
    unlock: { fr: "Recevez un code sur votre adresse professionnelle.", en: "Get a code on your work email." },
  },
  video: {
    id: "video", family: "identite", weight: 10, check: "equipe", soon: true,
    name: { fr: "Présentation vidéo", en: "Video intro" },
    meaning: { fr: "S'est présenté·e en vidéo : visage, voix, aisance à l'oral.", en: "Introduced themselves on video." },
    unlock: { fr: "Bientôt : trente secondes de présentation filmée.", en: "Soon: a thirty-second video intro." },
  },
  cv: {
    id: "cv", family: "preuve", weight: 10, check: "auto",
    name: { fr: "CV analysé", en: "CV reviewed" },
    meaning: { fr: "CV fourni et lu : son parcours est documenté.", en: "CV provided and read." },
    unlock: { fr: "Ajoutez votre CV récent.", en: "Add your recent CV." },
  },
  portfolio: {
    id: "portfolio", family: "preuve", weight: 8, check: "auto",
    name: { fr: "Book vérifié", en: "Portfolio" },
    meaning: { fr: "Book, portfolio ou site personnel consulté.", en: "Portfolio or personal site reviewed." },
    unlock: { fr: "Ajoutez votre book ou votre site.", en: "Add your portfolio or site." },
  },
  reseaux: {
    id: "reseaux", family: "preuve", weight: 7, check: "auto",
    name: { fr: "Réseaux lus", en: "Socials read" },
    meaning: { fr: "Ses comptes publics ont été lus et concordent avec ses réponses.", en: "Public accounts read and consistent." },
    unlock: { fr: "Reliez Instagram ou TikTok.", en: "Link Instagram or TikTok." },
  },
  achat: {
    id: "achat", family: "preuve", weight: 10, check: "equipe", soon: true,
    name: { fr: "Achats prouvés", en: "Proven purchases" },
    meaning: { fr: "A montré ses pièces ou ses factures : cliente réelle de ces maisons.", en: "Showed pieces or receipts." },
    unlock: { fr: "Bientôt : photographiez une facture ou une pièce.", en: "Soon: photograph a receipt or piece." },
  },
  diplome: {
    id: "diplome", family: "preuve", weight: 0, check: "equipe", soon: true,
    name: { fr: "Diplôme", en: "Degree" },
    meaning: { fr: "Diplôme d'une école de mode ou de commerce contrôlé.", en: "Fashion or business degree checked." },
    unlock: { fr: "Bientôt : envoyez votre diplôme.", en: "Soon: upload your degree." },
  },
  premier: {
    id: "premier", family: "historique", weight: 0, check: "auto",
    name: { fr: "Premier entretien", en: "First interview" },
    meaning: { fr: "A déjà mené un entretien sur Rarelyst.", en: "Has completed an interview on Rarelyst." },
    unlock: { fr: "Menez votre premier entretien.", en: "Complete your first interview." },
  },
  habitue: {
    id: "habitue", family: "historique", weight: 0, check: "auto",
    name: { fr: "Habitué·e", en: "Regular" },
    meaning: { fr: "Cinq entretiens menés ou plus.", en: "Five or more interviews completed." },
    unlock: { fr: "Menez cinq entretiens.", en: "Complete five interviews." },
  },
  recommande: {
    id: "recommande", family: "historique", weight: 0, check: "auto",
    name: { fr: "Recommandé·e", en: "Recommended" },
    meaning: { fr: "Noté 4,5/5 ou plus par au moins deux marques.", en: "Rated 4.5/5+ by at least two brands." },
    unlock: { fr: "Obtenez 4,5/5 auprès de deux marques.", en: "Get 4.5/5 from two brands." },
  },
  ponctuel: {
    id: "ponctuel", family: "historique", weight: 0, check: "auto",
    name: { fr: "Toujours là", en: "Always there" },
    meaning: { fr: "Présent·e à tous ses entretiens (trois au moins).", en: "Showed up to every interview (three or more)." },
    unlock: { fr: "Honorez trois entretiens sans absence.", en: "Attend three interviews without a miss." },
  },
};

export const CERTIFICATIONS: BadgeId[] = ["verifie", "linkedin", "emploi", "video", "cv", "portfolio", "reseaux", "achat", "diplome"];

// ── Traits : confirmés par l'IA, affichés en étiquettes ──────────────
export type TraitId =
  | "insider" | "early_adopter" | "maven" | "collector" | "thrifter"
  | "quality" | "luxury" | "loyal" | "sharer";

export const TRAIT_LABELS: Record<TraitId, { name: Bi; meaning: Bi }> = {
  insider:       { name: { fr: "Initié·e", en: "Insider" }, meaning: { fr: "Travaille dans le secteur.", en: "Works in the industry." } },
  early_adopter: { name: { fr: "Défricheur·se", en: "Trailblazer" }, meaning: { fr: "Adopte les tendances avant qu'elles se diffusent.", en: "Adopts trends early." } },
  maven:         { name: { fr: "Prescripteur·rice", en: "Tastemaker" }, meaning: { fr: "Son entourage le·la consulte avant d'acheter.", en: "Friends consult them before buying." } },
  collector:     { name: { fr: "Collectionneur·se", en: "Collector" }, meaning: { fr: "Garde, trie, complète.", en: "Keeps, sorts, completes." } },
  thrifter:      { name: { fr: "Chineur·se", en: "Thrifter" }, meaning: { fr: "Achète et revend en seconde main.", en: "Buys and resells second-hand." } },
  quality:       { name: { fr: "Œil exigeant", en: "Discerning eye" }, meaning: { fr: "Juge la matière et la facture avant le logo.", en: "Judges make before logo." } },
  luxury:        { name: { fr: "Client·e luxe", en: "Luxury client" }, meaning: { fr: "Achète dans les maisons chaque année.", en: "Buys luxury yearly." } },
  loyal:         { name: { fr: "Fidèle", en: "Loyal" }, meaning: { fr: "Revient vers les mêmes marques.", en: "Returns to the same brands." } },
  sharer:        { name: { fr: "Créateur·rice", en: "Creator" }, meaning: { fr: "Partage son style, a une audience.", en: "Shares their style online." } },
};

/** Clés que l'IA a le droit de confirmer dans `behaviours`. */
export const BEHAVIOUR_KEYS = Object.keys(TRAIT_LABELS) as readonly string[];

export type TraitState = { id: TraitId; state: "confirmed" | "declared" };

/**
 * Les traits : confirmés par l'IA, ou seulement déclarés avec une preuve.
 * Une marque ne voit que les confirmés.
 */
export function computeTraits(i: {
  segment: string | null; proRole?: string | null;
  selfTraits: Record<string, number> | null; traitProofs: Record<string, string> | null;
  behaviours: string[] | null;
}): TraitState[] {
  const confirmed = new Set(i.behaviours ?? []);
  const traits = i.selfTraits ?? {};
  const proofs = i.traitProofs ?? {};
  const out: TraitState[] = [];
  for (const id of Object.keys(TRAIT_LABELS) as TraitId[]) {
    if (confirmed.has(id)) { out.push({ id, state: "confirmed" }); continue; }
    const declared = id === "insider"
      ? (i.segment === "pro" || i.segment === "hybrid") && !!i.proRole
      : (traits[id] ?? 0) >= TRAIT_CLAIMED && (proofs[id] ?? "").trim().length >= PROOF_MIN;
    if (declared) out.push({ id, state: "declared" });
  }
  return out;
}

// ── Preuves ──────────────────────────────────────────────────────────
export type Proofs = {
  idVerified: boolean; idPending: boolean;
  linkedinVerified: boolean; linkedinGiven: boolean;
  workVerified: boolean; workPending: boolean;
  cvAnalyzed: boolean; cvGiven: boolean;
  portfolioOk: boolean; portfolioGiven: boolean;
  socialsRead: boolean; socialsGiven: boolean;
};

type LinkReportLite = { kind?: string; status?: string };

/** Les preuves, à partir des colonnes du profil. */
export function proofsFromProfile(p: {
  idVerificationStatus?: string | null; idDocumentUrl?: string | null;
  linkedinVerified?: boolean | null; linkedinUrl?: string | null;
  workEmail?: string | null; workEmailVerifiedAt?: Date | string | null;
  cvUrl?: string | null; cvAnalysis?: string | null;
  portfolioUrl?: string | null; websiteUrl?: string | null;
  instagramUrl?: string | null; tiktokUrl?: string | null;
  linksAnalysis?: unknown;
}): Proofs {
  const a = p.linksAnalysis as { links?: LinkReportLite[]; consistency?: string } | null | undefined;
  const coherent = a?.consistency !== "inconsistent";
  const read = (kind: string) => coherent && (a?.links ?? []).some((l) => l.kind === kind && l.status === "read");
  return {
    idVerified: p.idVerificationStatus === "VERIFIED",
    idPending: p.idVerificationStatus === "PENDING" && !!p.idDocumentUrl,
    linkedinVerified: !!p.linkedinVerified,
    linkedinGiven: !!p.linkedinUrl,
    workVerified: !!p.workEmailVerifiedAt,
    workPending: !!p.workEmail && !p.workEmailVerifiedAt,
    cvAnalyzed: !!p.cvUrl && !!p.cvAnalysis,
    cvGiven: !!p.cvUrl,
    portfolioOk: !!p.portfolioUrl || read("website"),
    portfolioGiven: !!p.websiteUrl,
    socialsRead: read("instagram") || read("tiktok"),
    socialsGiven: !!(p.instagramUrl || p.tiktokUrl),
  };
}

export type BadgeInput = {
  createdAt: Date | string;
  proofs: Proofs;
  interviewsDone: number;
  noShow: number;
  ratings: number[];
};

export type EarnedBadge = {
  id: BadgeId;
  state: BadgeState;
  /** Pour « Habitué·e » : 3/5, par exemple. */
  progress?: { at: number; of: number };
};

const NEW_FOR_DAYS = 45;

const st = (earned: boolean, pending = false): BadgeState => (earned ? "earned" : pending ? "pending" : "locked");

export function computeBadges(i: BadgeInput): EarnedBadge[] {
  const p = i.proofs;
  const ageDays = (Date.now() - new Date(i.createdAt).getTime()) / 86_400_000;
  const out: EarnedBadge[] = [];

  if (i.interviewsDone === 0 && ageDays < NEW_FOR_DAYS) out.push({ id: "nouveau", state: "earned" });

  // ── identité ──
  out.push({ id: "verifie", state: st(p.idVerified, p.idPending) });
  out.push({ id: "linkedin", state: st(p.linkedinVerified, p.linkedinGiven) });
  out.push({ id: "emploi", state: st(p.workVerified, p.workPending) });
  out.push({ id: "video", state: "locked" });

  // ── preuves ──
  out.push({ id: "cv", state: st(p.cvAnalyzed, p.cvGiven) });
  out.push({ id: "portfolio", state: st(p.portfolioOk, p.portfolioGiven) });
  out.push({ id: "reseaux", state: st(p.socialsRead, p.socialsGiven) });
  out.push({ id: "achat", state: "locked" });
  out.push({ id: "diplome", state: "locked" });

  // ── historique ──
  const avg = i.ratings.length ? i.ratings.reduce((a, b) => a + b, 0) / i.ratings.length : 0;
  out.push({ id: "premier", state: st(i.interviewsDone >= 1) });
  out.push({ id: "habitue", state: st(i.interviewsDone >= 5), progress: { at: Math.min(i.interviewsDone, 5), of: 5 } });
  out.push({ id: "recommande", state: st(i.ratings.length >= 2 && avg >= 4.5) });
  out.push({ id: "ponctuel", state: st(i.interviewsDone >= 3 && i.noShow === 0), progress: { at: Math.min(i.interviewsDone, 3), of: 3 } });

  return out;
}

/** Niveau de certification, de 0 à 100 : la somme des preuves acquises. */
export function certificationScore(badges: EarnedBadge[]): number {
  const total = badges
    .filter((b) => b.state === "earned")
    .reduce((s, b) => s + BADGES[b.id].weight, 0);
  return Math.min(100, total);
}

/** Ce qu'une marque voit : uniquement l'acquis, jamais le déclaré. */
export function badgesForBrand(all: EarnedBadge[]): EarnedBadge[] {
  const order: BadgeId[] = ["nouveau", "recommande", "verifie", "emploi", "linkedin", "cv", "portfolio", "reseaux", "habitue", "ponctuel", "premier"];
  return order
    .map((id) => all.find((b) => b.id === id && b.state === "earned"))
    .filter((b): b is EarnedBadge => !!b);
}
