// Badges d'un participant : un seul endroit décide qui mérite quoi.
//
// Trois familles :
//   · statut   — nouveau, vérifié, relié : l'état du compte
//   · profil   — initié, défricheur, prescripteur… : ce que la personne EST.
//                Déclaré dans le tunnel, puis CONFIRMÉ par l'IA à partir des
//                preuves et des liens. Tant que ce n'est pas confirmé, le badge
//                reste « à confirmer » et n'est jamais montré aux marques.
//   · parcours — premier entretien, habitué, recommandé, ponctuel : ce que la
//                personne a FAIT sur Rarelyst.
//
// Pur : aucun accès base, utilisable côté serveur comme côté client.

import { PROOF_MIN, TRAIT_CLAIMED, type Bi } from "../onboarding/questions";

export type BadgeId =
  | "nouveau" | "verifie" | "relie"
  | "insider" | "early_adopter" | "maven" | "collector" | "thrifter"
  | "quality" | "luxury" | "loyal" | "sharer"
  | "premier" | "habitue" | "recommande" | "ponctuel";

export type BadgeFamily = "statut" | "profil" | "parcours";
export type BadgeState = "earned" | "pending" | "locked";

export type BadgeDef = {
  id: BadgeId;
  family: BadgeFamily;
  name: Bi;
  /** Ce que le badge dit de la personne, pour la marque. */
  meaning: Bi;
  /** Comment l'obtenir, pour le participant. */
  unlock: Bi;
};

export const BADGES: Record<BadgeId, BadgeDef> = {
  nouveau: {
    id: "nouveau", family: "statut",
    name: { fr: "Nouveau profil", en: "New profile" },
    meaning: { fr: "Arrivé·e récemment : jamais interrogé·e par une autre marque.", en: "Just joined: never interviewed by another brand." },
    unlock: { fr: "Offert à l'inscription.", en: "Given when you join." },
  },
  verifie: {
    id: "verifie", family: "statut",
    name: { fr: "Identité vérifiée", en: "Verified identity" },
    meaning: { fr: "Pièce d'identité contrôlée par Rarelyst.", en: "ID checked by Rarelyst." },
    unlock: { fr: "Vérifiez votre identité depuis votre espace.", en: "Verify your ID from your space." },
  },
  relie: {
    id: "relie", family: "statut",
    name: { fr: "Profil relié", en: "Linked profile" },
    meaning: { fr: "Ses liens publics ont été lus et concordent avec ses réponses.", en: "Public links read and consistent with answers." },
    unlock: { fr: "Ajoutez LinkedIn, un site ou un portfolio.", en: "Add LinkedIn, a site or a portfolio." },
  },
  insider: {
    id: "insider", family: "profil",
    name: { fr: "Initié·e", en: "Insider" },
    meaning: { fr: "Travaille dans le secteur : voit les marques de l'intérieur.", en: "Works in the industry: sees brands from inside." },
    unlock: { fr: "Renseignez votre parcours pro et reliez LinkedIn.", en: "Fill in your career and link LinkedIn." },
  },
  early_adopter: {
    id: "early_adopter", family: "profil",
    name: { fr: "Défricheur·se", en: "Trailblazer" },
    meaning: { fr: "Adopte les tendances avant qu'elles se diffusent.", en: "Adopts trends before they spread." },
    unlock: { fr: "Répondez « early adopter » et donnez un exemple.", en: "Answer the early-adopter question with an example." },
  },
  maven: {
    id: "maven", family: "profil",
    name: { fr: "Prescripteur·rice", en: "Tastemaker" },
    meaning: { fr: "Son entourage le·la consulte avant d'acheter.", en: "Friends consult them before buying." },
    unlock: { fr: "Racontez la dernière fois qu'on vous a demandé conseil.", en: "Tell us the last time someone asked your advice." },
  },
  collector: {
    id: "collector", family: "profil",
    name: { fr: "Collectionneur·se", en: "Collector" },
    meaning: { fr: "Garde, trie, complète : connaît les pièces dans le détail.", en: "Keeps, sorts, completes: knows pieces in detail." },
    unlock: { fr: "Décrivez votre collection.", en: "Describe your collection." },
  },
  thrifter: {
    id: "thrifter", family: "profil",
    name: { fr: "Chineur·se", en: "Thrifter" },
    meaning: { fr: "Achète et revend en seconde main, connaît la cote des pièces.", en: "Buys and resells second-hand, knows resale value." },
    unlock: { fr: "Racontez votre dernière trouvaille.", en: "Tell us your latest find." },
  },
  quality: {
    id: "quality", family: "profil",
    name: { fr: "Œil exigeant", en: "Discerning eye" },
    meaning: { fr: "Juge une pièce à sa matière et à sa facture avant son logo.", en: "Judges fabric and make before the logo." },
    unlock: { fr: "Citez une pièce reposée pour sa qualité.", en: "Name a piece you put back for its quality." },
  },
  luxury: {
    id: "luxury", family: "profil",
    name: { fr: "Client·e luxe", en: "Luxury client" },
    meaning: { fr: "Achète dans les maisons au moins une fois par an.", en: "Buys from luxury houses at least yearly." },
    unlock: { fr: "Citez votre dernier achat luxe.", en: "Name your latest luxury purchase." },
  },
  loyal: {
    id: "loyal", family: "profil",
    name: { fr: "Fidèle", en: "Loyal" },
    meaning: { fr: "Revient vers les mêmes marques saison après saison.", en: "Returns to the same brands season after season." },
    unlock: { fr: "Dites-nous à quelle marque, et depuis quand.", en: "Tell us which brand, and since when." },
  },
  sharer: {
    id: "sharer", family: "profil",
    name: { fr: "Créateur·rice", en: "Creator" },
    meaning: { fr: "Partage son style en ligne, a une audience.", en: "Shares their style online, has an audience." },
    unlock: { fr: "Reliez le compte où vous publiez.", en: "Link the account where you post." },
  },
  premier: {
    id: "premier", family: "parcours",
    name: { fr: "Premier entretien", en: "First interview" },
    meaning: { fr: "A déjà mené un entretien sur Rarelyst.", en: "Has completed an interview on Rarelyst." },
    unlock: { fr: "Menez votre premier entretien.", en: "Complete your first interview." },
  },
  habitue: {
    id: "habitue", family: "parcours",
    name: { fr: "Habitué·e", en: "Regular" },
    meaning: { fr: "Cinq entretiens menés ou plus.", en: "Five or more interviews completed." },
    unlock: { fr: "Menez cinq entretiens.", en: "Complete five interviews." },
  },
  recommande: {
    id: "recommande", family: "parcours",
    name: { fr: "Recommandé·e", en: "Recommended" },
    meaning: { fr: "Noté 4,5/5 ou plus par au moins deux marques.", en: "Rated 4.5/5+ by at least two brands." },
    unlock: { fr: "Obtenez 4,5/5 auprès de deux marques.", en: "Get 4.5/5 from two brands." },
  },
  ponctuel: {
    id: "ponctuel", family: "parcours",
    name: { fr: "Toujours là", en: "Always there" },
    meaning: { fr: "Présent·e à tous ses entretiens (trois au moins).", en: "Showed up to every interview (three or more)." },
    unlock: { fr: "Honorez trois entretiens sans absence.", en: "Attend three interviews without a miss." },
  },
};

export const PROFILE_BADGES: BadgeId[] = [
  "insider", "early_adopter", "maven", "collector", "thrifter", "quality", "luxury", "loyal", "sharer",
];

/** Clés que l'IA a le droit de confirmer dans `behaviours`. */
export const BEHAVIOUR_KEYS = PROFILE_BADGES as readonly string[];

export type BadgeInput = {
  createdAt: Date | string;
  segment: string | null;
  proRole?: string | null;
  selfTraits: Record<string, number> | null;
  traitProofs: Record<string, string> | null;
  /** null tant que l'IA n'a pas analysé le profil. */
  behaviours: string[] | null;
  idVerified: boolean;
  linkedinVerified: boolean;
  links: { given: number; read: number };
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

export function computeBadges(i: BadgeInput): EarnedBadge[] {
  const out: EarnedBadge[] = [];
  const confirmed = new Set(i.behaviours ?? []);
  const traits = i.selfTraits ?? {};
  const proofs = i.traitProofs ?? {};
  const ageDays = (Date.now() - new Date(i.createdAt).getTime()) / 86_400_000;

  // ── statut ──
  if (i.interviewsDone === 0 && ageDays < NEW_FOR_DAYS) out.push({ id: "nouveau", state: "earned" });
  out.push({ id: "verifie", state: i.idVerified ? "earned" : "locked" });
  out.push({
    id: "relie",
    state: i.links.read > 0 || i.linkedinVerified ? "earned" : i.links.given > 0 ? "pending" : "locked",
  });

  // ── profil ──
  const pro = i.segment === "pro" || i.segment === "hybrid";
  out.push({
    id: "insider",
    state: confirmed.has("insider") || (pro && i.linkedinVerified) ? "earned" : pro && i.proRole ? "pending" : "locked",
  });
  for (const id of PROFILE_BADGES.filter((b) => b !== "insider")) {
    const claimed = (traits[id] ?? 0) >= TRAIT_CLAIMED && (proofs[id] ?? "").trim().length >= PROOF_MIN;
    out.push({ id, state: confirmed.has(id) ? "earned" : claimed ? "pending" : "locked" });
  }

  // ── parcours ──
  const avg = i.ratings.length ? i.ratings.reduce((a, b) => a + b, 0) / i.ratings.length : 0;
  out.push({ id: "premier", state: i.interviewsDone >= 1 ? "earned" : "locked" });
  out.push({
    id: "habitue",
    state: i.interviewsDone >= 5 ? "earned" : "locked",
    progress: { at: Math.min(i.interviewsDone, 5), of: 5 },
  });
  out.push({ id: "recommande", state: i.ratings.length >= 2 && avg >= 4.5 ? "earned" : "locked" });
  out.push({
    id: "ponctuel",
    state: i.interviewsDone >= 3 && i.noShow === 0 ? "earned" : "locked",
    progress: { at: Math.min(i.interviewsDone, 3), of: 3 },
  });

  return out;
}

/**
 * Ce qu'une marque voit : uniquement l'acquis, jamais le déclaré. L'identité
 * et la présence ont déjà leur place dans la fiche (sceaux et historique).
 */
export function badgesForBrand(all: EarnedBadge[]): EarnedBadge[] {
  const order: BadgeId[] = ["nouveau", "recommande", ...PROFILE_BADGES, "relie", "habitue"];
  return order
    .map((id) => all.find((b) => b.id === id && b.state === "earned"))
    .filter((b): b is EarnedBadge => !!b);
}

/** Nombre de liens renseignés et lus, à partir des colonnes du profil. */
export function linkCounts(p: {
  linkedinUrl?: string | null; instagramUrl?: string | null; tiktokUrl?: string | null;
  websiteUrl?: string | null; portfolioUrl?: string | null; otherLinks?: string[] | null;
  linksAnalysis?: unknown;
}): { given: number; read: number } {
  const given = [p.linkedinUrl, p.instagramUrl, p.tiktokUrl, p.websiteUrl, p.portfolioUrl]
    .filter(Boolean).length + (p.otherLinks?.length ?? 0);
  const a = p.linksAnalysis as { links?: { status?: string }[]; consistency?: string } | null | undefined;
  // Des pages lues qui contredisent la personne ne la « relient » à rien.
  const read = a?.consistency === "inconsistent" ? 0 : (a?.links ?? []).filter((l) => l.status === "read").length;
  return { given, read };
}
