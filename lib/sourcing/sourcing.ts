// Sourcing manuel des profils rares : où chercher, et le premier message.
// Les recherches s'ouvrent dans le navigateur de l'admin, connecté à son
// propre compte : rien n'est extrait ni envoyé automatiquement (LinkedIn
// l'interdit, et ce sont des personnes, pas une base à aspirer).

export const PROFILE_TYPES = {
  initie: { label: "Initié·e du terrain", pay: 180 },
  rare: { label: "Rare", pay: 350 },
  influence: { label: "Micro-influence", pay: 90 },
  defricheur: { label: "Défricheur", pay: 90 },
  client: { label: "Client·e averti·e", pay: 90 },
} as const;
export type ProfileType = keyof typeof PROFILE_TYPES;

export const PLATFORMS = { linkedin: "LinkedIn", instagram: "Instagram", tiktok: "TikTok", autre: "Autre" } as const;
export type Platform = keyof typeof PLATFORMS;

export const STATUSES = {
  a_contacter: "À contacter",
  contacte: "Contacté·e",
  accepte: "Invitation acceptée",
  repondu: "A répondu",
  inscrit: "Inscrit·e",
  refus: "Pas intéressé·e",
} as const;
export type Status = keyof typeof STATUSES;

const li = (q: string) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
const tag = (t: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(t)}/`;

/** Recherches prêtes à ouvrir, par type de profil. */
export const SEARCHES: { type: ProfileType; label: string; links: { label: string; href: string }[] }[] = [
  {
    type: "initie",
    label: "Vendeurs, acheteurs, merchandising",
    links: [
      { label: "Conseiller de vente · Chanel", href: li("conseiller de vente Chanel Paris") },
      { label: "Client advisor · Louis Vuitton", href: li("client advisor Louis Vuitton Paris") },
      { label: "Sales associate · Hermès", href: li("sales associate Hermès Paris") },
      { label: "Conseiller de vente · Dior", href: li("conseiller de vente Dior Paris") },
      { label: "Personal shopper luxe", href: li("personal shopper luxe Paris") },
      { label: "Acheteur · grands magasins", href: li("acheteur mode Galeries Lafayette Printemps Bon Marché") },
      { label: "Visual merchandiser luxe", href: li("visual merchandiser luxe Paris") },
      { label: "Clienteling / CRM luxe", href: li("clienteling luxe Paris") },
      { label: "Authentificateur seconde main", href: li("authentificateur Vestiaire Collective") },
    ],
  },
  {
    type: "rare",
    label: "Stylistes, directions artistiques",
    links: [
      { label: "Styliste freelance Paris", href: li("styliste freelance Paris mode") },
      { label: "Celebrity stylist", href: li("celebrity stylist Paris") },
      { label: "Directrice artistique mode", href: li("directrice artistique mode Paris") },
      { label: "#stylistparis", href: tag("stylistparis") },
      { label: "#fashionstylist", href: tag("fashionstylist") },
    ],
  },
  {
    type: "influence",
    label: "Créateurs mode (5 à 100 k abonnés)",
    links: [
      { label: "#modeparisienne", href: tag("modeparisienne") },
      { label: "#parisianstyle", href: tag("parisianstyle") },
      { label: "#quietluxury", href: tag("quietluxury") },
      { label: "#outfitinspo", href: tag("outfitinspo") },
    ],
  },
  {
    type: "defricheur",
    label: "Revendeurs, chineurs, collectionneurs",
    links: [
      { label: "#vintageparis", href: tag("vintageparis") },
      { label: "#luxuryreseller", href: tag("luxuryreseller") },
      { label: "#sneakerheadfrance", href: tag("sneakerheadfrance") },
      { label: "#lacostevintage", href: tag("lacostevintage") },
      { label: "Vintage dealer Paris", href: li("vintage dealer Paris mode") },
      { label: "Reseller sneakers", href: li("sneakers reseller France") },
    ],
  },
];

/** Le premier message, au prénom de la personne. */
export function firstMessage(c: { name: string; platform: string; profileType: string; why?: string | null }): string {
  const first = c.name.trim().split(/\s+/)[0] ?? "";
  const why = c.why?.trim() ? ` ${c.why.trim().replace(/\.?$/, ".")}` : "";
  const type = (c.profileType in PROFILE_TYPES ? c.profileType : "initie") as ProfileType;
  const pay = PROFILE_TYPES[type].pay;
  if (c.platform === "linkedin") {
    return `Bonjour ${first}, merci d'avoir accepté.${why} Je monte Rarelyst : des maisons de mode et de luxe y interrogent des gens qui connaissent vraiment le terrain. 45 min en visio, ${pay} €. La maison ne voit que votre prénom, et on ne vous demande jamais rien de confidentiel sur votre employeur. Je vous envoie le lien ?`;
  }
  if (type === "influence") {
    return `Salut ${first} ! Je suis Lucas, je lance Rarelyst.${why} Des marques de mode paient pour écouter des gens qui ont l'œil : pas pour de la visibilité, rien à poster, jamais. 45 min en visio, à partir de ${pay} €. Ça te tente ?`;
  }
  return `Bonjour ${first} ! Je suis Lucas, je lance Rarelyst.${why} Des maisons de mode y paient des gens qui ont un vrai regard pour 45 min d'échange en visio : ${pay} € pour un profil comme le tien. Discret, la maison ne voit que ton prénom. Je t'envoie le lien ?`;
}

/**
 * Le participant travaille-t-il peut-être pour la marque qui l'interroge ?
 * Indice seulement (adresse pro au même domaine, ou nom de la marque dans son
 * métier) : l'admin tranche avant de proposer le profil.
 */
export function conflictHint(p: { workEmail?: string | null; profession?: string | null; bio?: string | null }, brand: { companyName: string; email: string }): string | null {
  const dom = (e: string) => e.split("@")[1]?.toLowerCase().trim() ?? "";
  const brandDomain = dom(brand.email);
  const PUBLIC = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|orange|free|sfr|laposte|wanadoo|proton|protonmail)\./;
  if (p.workEmail && brandDomain && !PUBLIC.test(brandDomain) && dom(p.workEmail) === brandDomain) return `Adresse pro chez @${brandDomain}`;
  const name = brand.companyName.trim().toLowerCase();
  if (name.length >= 3) {
    const text = `${p.profession ?? ""} ${p.bio ?? ""}`.toLowerCase();
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) return `Mentionne « ${brand.companyName} » dans son profil`;
  }
  return null;
}
