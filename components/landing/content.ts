// Contenu de la page d'accueil, séparé de la mise en forme.
// Les profils de la console sont ceux du panel de démonstration : quand de
// vraies photos (avec l'accord des personnes) seront disponibles, il suffit de
// renseigner `photo` avec un chemin dans /public/panel/.

export type Rarity = "rare" | "introuvable";

export type LaneProfile = { label: string; rarity?: Rarity };

// Le genre de profils que nous recrutons. La rareté dit à quel point un
// profil est difficile à trouver ailleurs — c'est ce qui en fait la valeur.
export const LANE_1: LaneProfile[] = [
  { label: "Styliste freelance" },
  { label: "Buyer menswear", rarity: "rare" },
  { label: "Journaliste mode" },
  { label: "Collectionneur d'archives Margiela", rarity: "introuvable" },
  { label: "Reseller sneakers" },
  { label: "Directrice artistique", rarity: "rare" },
  { label: "Acheteuse de luxe discret" },
  { label: "Personal shopper", rarity: "rare" },
];

export const LANE_2: LaneProfile[] = [
  { label: "Étudiante en école de mode" },
  { label: "Vendeuse en boutique de luxe", rarity: "rare" },
  { label: "Créateur de contenu vintage" },
  { label: "Ancien acheteur grand magasin", rarity: "introuvable" },
  { label: "Chasseur de drops" },
  { label: "Consultante en tendances", rarity: "rare" },
  { label: "Habituée de la seconde main" },
  { label: "Photographe de mode" },
];

export type ConsoleProfile = {
  name: string;
  role: string;
  signals: string[];
  rarity?: Rarity;
  photo?: string;
};

export const PANEL: ConsoleProfile[] = [
  { name: "Amina D.", role: "Styliste indépendante · Paris", signals: ["quiet luxury", "styliste", "matières", "Paris"], rarity: "rare" },
  { name: "Sofia L.", role: "Directrice artistique · Bordeaux", signals: ["quiet luxury", "gros budget", "matières"] },
  { name: "Nadia C.", role: "Directrice marketing retail · Lille", signals: ["quiet luxury", "gros budget"] },
  { name: "Lucas M.", role: "Buyer menswear · Paris", signals: ["buyer", "retail", "concept store"], rarity: "rare" },
  { name: "Thomas R.", role: "Reseller sneakers · Lyon", signals: ["sneakers", "revente", "drops"] },
  { name: "Julien P.", role: "Étudiant en design · Nantes", signals: ["drops", "Gen Z", "sneakers"] },
  { name: "Inès B.", role: "Journaliste mode · Paris", signals: ["seconde main", "archive", "Gen Z"] },
  { name: "Camille F.", role: "Créateur·rice de contenu · Marseille", signals: ["archive", "seconde main", "Gen Z"], rarity: "introuvable" },
];

export type Brief = { text: string; signals: string[] };

export const BRIEFS: Brief[] = [
  { text: "Des acheteuses de luxe discret, 25–40 ans, qui savent parler matière.", signals: ["quiet luxury", "matières", "gros budget", "styliste"] },
  { text: "Des reselleurs de sneakers qui achètent au drop.", signals: ["sneakers", "revente", "drops"] },
  { text: "Des Gen Z qui s'habillent en seconde main et en archive.", signals: ["Gen Z", "seconde main", "archive"] },
  { text: "Des pros du retail mode, pour tester un nouveau concept de boutique.", signals: ["buyer", "retail", "concept store"] },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  rare: "Rare",
  introuvable: "Introuvable",
};
