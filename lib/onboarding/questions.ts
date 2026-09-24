// Contenu du tunnel de qualification participant.
//
// Principe : on pose la question franchement (« Vous considérez-vous early
// adopter ? »), puis on demande la preuve en une ligne. La déclaration seule
// ne décerne rien : c'est l'IA qui confirme le comportement à partir de la
// preuve, des réponses libres et des liens publics. Voir
// lib/participants/badges.ts.

export type Bi = { fr: string; en: string };

// ── Segment : la première bifurcation, à la manière de Respondent ──────
export type Segment = "pro" | "consumer" | "creator" | "hybrid";

export const SEGMENTS: { id: Segment; title: Bi; sub: Bi }[] = [
  {
    id: "pro",
    title: { fr: "Je travaille dans la mode, le luxe ou la beauté", en: "I work in fashion, luxury or beauty" },
    sub: { fr: "Styliste, acheteur·se, conseiller·ère de vente, designer, journaliste, étudiant·e en école de mode…", en: "Stylist, buyer, sales advisor, designer, journalist, fashion student…" },
  },
  {
    id: "consumer",
    title: { fr: "Je suis un·e consommateur·rice passionné·e", en: "I'm a passionate consumer" },
    sub: { fr: "J'achète, je suis les collections, je repère les pièces avant les autres.", en: "I buy, follow collections and spot pieces before others." },
  },
  {
    id: "creator",
    title: { fr: "Je crée du contenu, j'ai une communauté", en: "I create content and have a community" },
    sub: { fr: "Instagram, TikTok, YouTube, newsletter, podcast, forum…", en: "Instagram, TikTok, YouTube, newsletter, podcast, forum…" },
  },
  {
    id: "hybrid",
    title: { fr: "Un peu des trois", en: "A bit of all three" },
    sub: { fr: "Je travaille dans le milieu et je suis aussi client·e, ou je crée à côté.", en: "I work in the industry and I'm also a customer, or I create on the side." },
  },
];

export const isPro = (s: string | null | undefined) => s === "pro" || s === "hybrid";

// ── Parcours pro ──────────────────────────────────────────────────────
export const PRO_ROLES: Bi[] = [
  { fr: "Styliste / Direction artistique", en: "Stylist / Art direction" },
  { fr: "Designer / Modéliste", en: "Designer / Pattern maker" },
  { fr: "Acheteur·se / Merchandising", en: "Buyer / Merchandising" },
  { fr: "Conseiller·ère de vente / Client advisor", en: "Sales / Client advisor" },
  { fr: "Visual merchandising / Retail design", en: "Visual merchandising / Retail design" },
  { fr: "Marketing / Communication / RP", en: "Marketing / Communications / PR" },
  { fr: "Journaliste / Rédaction mode", en: "Fashion journalist / Editor" },
  { fr: "Photographe / Vidéaste", en: "Photographer / Videographer" },
  { fr: "Mannequin / Casting", en: "Model / Casting" },
  { fr: "Atelier / Artisanat / Production", en: "Atelier / Craft / Production" },
  { fr: "E-commerce / Digital", en: "E-commerce / Digital" },
  { fr: "Étudiant·e en école de mode", en: "Fashion student" },
  { fr: "Autre métier du secteur", en: "Other industry role" },
];

export const PRO_SECTORS: Bi[] = [
  { fr: "Luxe & haute couture", en: "Luxury & couture" },
  { fr: "Premium / contemporain", en: "Premium / contemporary" },
  { fr: "Streetwear & sneakers", en: "Streetwear & sneakers" },
  { fr: "Sport & outdoor", en: "Sport & outdoor" },
  { fr: "Beauté & parfum", en: "Beauty & fragrance" },
  { fr: "Joaillerie & horlogerie", en: "Jewellery & watches" },
  { fr: "Grande distribution / mass market", en: "Mass market" },
  { fr: "Seconde main / resale", en: "Resale" },
];

export const PRO_YEARS: Bi[] = [
  { fr: "En formation", en: "Studying" },
  { fr: "Moins de 2 ans", en: "Under 2 years" },
  { fr: "2 à 5 ans", en: "2–5 years" },
  { fr: "5 à 10 ans", en: "5–10 years" },
  { fr: "Plus de 10 ans", en: "10+ years" },
];

// ── Questions explicites ──────────────────────────────────────────────
// Chaque clé est aussi une clé de comportement que l'IA peut confirmer
// (ParticipantGhostFile.behaviours) et le nom d'un badge.
export type TraitKey =
  | "early_adopter" | "maven" | "collector" | "thrifter"
  | "quality" | "luxury" | "loyal" | "sharer";

export const TRAITS: { key: TraitKey; q: Bi; def: Bi; proof: Bi }[] = [
  {
    key: "early_adopter",
    q: { fr: "Vous considérez-vous early adopter ?", en: "Do you consider yourself an early adopter?" },
    def: { fr: "= vous portez ou achetez les tendances avant tout le monde", en: "= you wear or buy trends before everyone else" },
    proof: { fr: "La dernière pièce ou marque que vous avez adoptée avant qu'elle soit partout ?", en: "The last piece or brand you adopted before it was everywhere?" },
  },
  {
    key: "maven",
    q: { fr: "Vos proches vous demandent-ils conseil avant d'acheter ?", en: "Do people ask your advice before buying?" },
    def: { fr: "= on vous consulte pour une paire, un sac, un parfum, une tenue", en: "= people check with you about shoes, a bag, a fragrance, an outfit" },
    proof: { fr: "La dernière fois qu'on vous a demandé conseil : pour quoi, et qu'avez-vous répondu ?", en: "The last time someone asked: for what, and what did you say?" },
  },
  {
    key: "collector",
    q: { fr: "Vous considérez-vous collectionneur·se ?", en: "Do you consider yourself a collector?" },
    def: { fr: "= sneakers, vintage, sacs, montres… vous gardez, vous triez, vous complétez", en: "= sneakers, vintage, bags, watches… you keep, sort and complete" },
    proof: { fr: "Votre collection en une phrase : quoi, combien de pièces, la plus rare ?", en: "Your collection in one line: what, how many, the rarest?" },
  },
  {
    key: "thrifter",
    q: { fr: "Achetez-vous ou revendez-vous en seconde main régulièrement ?", en: "Do you buy or resell second-hand regularly?" },
    def: { fr: "= Vinted, Vestiaire Collective, friperies, dépôts-ventes, archive", en: "= Vinted, Vestiaire Collective, thrift shops, consignment, archive" },
    proof: { fr: "Votre dernière trouvaille, et où ?", en: "Your latest find, and where?" },
  },
  {
    key: "quality",
    q: { fr: "Repérez-vous la qualité d'une pièce avant son logo ?", en: "Do you notice a garment's quality before its logo?" },
    def: { fr: "= matière, coutures, finitions, lieu de fabrication", en: "= fabric, seams, finishing, where it was made" },
    proof: { fr: "Une pièce que vous avez reposée à cause de sa qualité — qu'est-ce qui clochait ?", en: "A piece you put back because of its quality — what was wrong?" },
  },
  {
    key: "luxury",
    q: { fr: "Achetez-vous du luxe au moins une fois par an ?", en: "Do you buy luxury at least once a year?" },
    def: { fr: "= maisons de couture, maroquinerie, joaillerie, haute parfumerie", en: "= fashion houses, leather goods, jewellery, niche fragrance" },
    proof: { fr: "Votre dernier achat luxe : la maison, la pièce ?", en: "Your latest luxury purchase: house and piece?" },
  },
  {
    key: "loyal",
    q: { fr: "Êtes-vous fidèle à quelques marques ?", en: "Are you loyal to a few brands?" },
    def: { fr: "= vous y revenez saison après saison plutôt que de papillonner", en: "= you come back season after season rather than hopping around" },
    proof: { fr: "Laquelle, et depuis combien de temps ?", en: "Which one, and for how long?" },
  },
  {
    key: "sharer",
    q: { fr: "Partagez-vous votre style ou vos achats en ligne ?", en: "Do you share your style or purchases online?" },
    def: { fr: "= posts, stories, vidéos, avis, newsletter, forum", en: "= posts, stories, videos, reviews, newsletter, forum" },
    proof: { fr: "Où, et combien de personnes vous suivent à peu près ?", en: "Where, and roughly how many people follow you?" },
  },
];

export const TRAIT_SCALE: Bi[] = [
  { fr: "Pas du tout", en: "Not at all" },
  { fr: "Un peu", en: "A little" },
  { fr: "Plutôt oui", en: "Mostly" },
  { fr: "Complètement", en: "Completely" },
];

/** À partir de « Plutôt oui », on demande la preuve. */
export const TRAIT_CLAIMED = 2;
/** Une preuve plus courte ne dit rien (« oui », « souvent »…). */
export const PROOF_MIN = 15;

// ── Faits : ce que la personne a déjà fait, pas ce qu'elle pense être ──
export const FACTS: { tag: string; fr: string; en: string; for?: "pro" | "all" }[] = [
  { tag: "drop_alert", fr: "Activé une alerte pour un drop", en: "Set an alert for a drop" },
  { tag: "queue_physical", fr: "Fait la queue pour une sortie", en: "Queued for a release" },
  { tag: "resale_active", fr: "Un compte Vinted, Vestiaire, StockX ou Grailed actif", en: "Active Vinted, Vestiaire, StockX or Grailed account" },
  { tag: "sneaker_collector", fr: "Plus de 20 paires de sneakers", en: "Own 20+ pairs of sneakers" },
  { tag: "waitlist", fr: "Été sur une liste d'attente de marque", en: "Been on a brand waitlist" },
  { tag: "preorder", fr: "Précommandé une pièce avant sa sortie", en: "Pre-ordered a piece before release" },
  { tag: "industry_access", fr: "Été invité·e à un press day ou un lancement", en: "Invited to a press day or launch" },
  { tag: "show_access", fr: "Assisté à un défilé ou un showroom", en: "Attended a show or showroom" },
  { tag: "fashion_intel", fr: "Abonné·e à des newsletters de veille mode", en: "Subscribed to fashion newsletters" },
  { tag: "prescripteur", fr: "Fait acheter une pièce à quelqu'un", en: "Got someone to buy a piece" },
  { tag: "community_member", fr: "Actif·ve sur un Discord, forum ou groupe mode", en: "Active in a fashion Discord, forum or group" },
  { tag: "tailoring", fr: "Fait retoucher ou customiser un vêtement", en: "Had a garment altered or customised" },
  { tag: "industry_work", fr: "Travaillé en boutique, atelier ou maison", en: "Worked in a store, atelier or house", for: "pro" },
  { tag: "brand_collab", fr: "Collaboré avec une marque (contenu, conseil, collection)", en: "Collaborated with a brand" },
];

// ── Réponses libres (vocales ou écrites), selon le segment ────────────
export const VOICE_Q: Record<"pro" | "other", { id: string; fr: string; en: string; min: number }[]> = {
  pro: [
    { id: "self", fr: "Votre métier expliqué à quelqu'un qui n'y connaît rien : une journée, une décision que vous prenez.", en: "Your job explained to an outsider: a typical day, a decision you make.", min: 60 },
    { id: "brand", fr: "Une décision récente d'une marque qui vous a marqué·e — en bien ou en mal. Pourquoi ?", en: "A recent brand decision that struck you — good or bad. Why?", min: 60 },
    { id: "blind", fr: "Ce que les marques comprennent mal chez leurs clients, selon ce que vous voyez de l'intérieur ?", en: "What do brands misunderstand about their customers, from what you see inside?", min: 60 },
  ],
  other: [
    { id: "self", fr: "En une phrase, quel·le client·e êtes-vous ?", en: "In one sentence, what kind of customer are you?", min: 40 },
    { id: "discover", fr: "La dernière fois que vous avez découvert ou recommandé quelque chose avant votre entourage — racontez.", en: "The last time you discovered or recommended something before those around you.", min: 60 },
    { id: "brand", fr: "Une décision récente d'une marque qui vous a marqué·e — en bien ou en mal. Pourquoi ?", en: "A recent brand decision that struck you — good or bad. Why?", min: 60 },
  ],
};

// ── Liens publics ─────────────────────────────────────────────────────
export type LinkKind = "linkedin" | "instagram" | "tiktok" | "website" | "other";

export const LINK_FIELDS: { kind: Exclude<LinkKind, "other">; label: string; placeholder: string; hint: Bi }[] = [
  { kind: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…", hint: { fr: "Votre parcours pro, en un lien.", en: "Your career, in one link." } },
  { kind: "instagram", label: "Instagram", placeholder: "instagram.com/…", hint: { fr: "Votre style, vos repères.", en: "Your style, your references." } },
  { kind: "tiktok", label: "TikTok", placeholder: "tiktok.com/@…", hint: { fr: "Si vous y parlez mode ou beauté.", en: "If you talk fashion or beauty there." } },
  { kind: "website", label: "Site / portfolio", placeholder: "votresite.com", hint: { fr: "Book, site perso, Behance, boutique…", en: "Book, personal site, Behance, shop…" } },
];

/** Normalise une saisie libre en URL absolue ; `@pseudo` devient un profil. */
export function toUrl(kind: LinkKind, raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@")) {
    if (kind === "instagram") return `https://www.instagram.com/${v.slice(1)}`;
    if (kind === "tiktok") return `https://www.tiktok.com/${v}`;
  }
  return `https://${v.replace(/^\/+/, "")}`;
}
