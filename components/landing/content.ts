// Contenu de la page d'accueil, séparé de la mise en forme.

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
