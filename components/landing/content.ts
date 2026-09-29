// Contenu de la page d'accueil, séparé de la mise en forme, en français et en
// anglais. Les profils de la console sont ceux du panel de démonstration :
// quand de vraies photos (avec l'accord des personnes) seront disponibles, il
// suffit de renseigner `photo` avec un chemin dans /public/panel/.

import type { Lang } from "@/lib/i18n/detect";

export type Rarity = "rare" | "introuvable";

export type LaneProfile = { label: string; rarity?: Rarity };

export type ConsoleProfile = {
  name: string;
  role: string;
  signals: string[];
  rarity?: Rarity;
  photo?: string;
};

export type Brief = { text: string; signals: string[] };

type Content = {
  lane1: LaneProfile[];
  lane2: LaneProfile[];
  panel: ConsoleProfile[];
  briefs: Brief[];
  rarity: Record<Rarity, string>;
  console: { head: string; match: string; demo: string; pause: string; resume: string; fit: [string, string, string]; aria: string };
};

// Le genre de profils que nous recrutons. La rareté dit à quel point un
// profil est difficile à trouver ailleurs — c'est ce qui en fait la valeur.
const FR: Content = {
  lane1: [
    { label: "Styliste freelance" },
    { label: "Buyer menswear", rarity: "rare" },
    { label: "Journaliste mode" },
    { label: "Collectionneur d'archives Margiela", rarity: "introuvable" },
    { label: "Reseller sneakers" },
    { label: "Directrice artistique", rarity: "rare" },
    { label: "Acheteuse de luxe discret" },
    { label: "Personal shopper", rarity: "rare" },
  ],
  lane2: [
    { label: "Étudiante en école de mode" },
    { label: "Vendeuse en boutique de luxe", rarity: "rare" },
    { label: "Créateur de contenu vintage" },
    { label: "Ancien acheteur grand magasin", rarity: "introuvable" },
    { label: "Chasseur de drops" },
    { label: "Consultante en tendances", rarity: "rare" },
    { label: "Habituée de la seconde main" },
    { label: "Photographe de mode" },
  ],
  panel: [
    { name: "Amina D.", role: "Styliste indépendante · Paris", signals: ["quiet luxury", "styliste", "matières", "Paris"], rarity: "rare" },
    { name: "Sofia L.", role: "Directrice artistique · Bordeaux", signals: ["quiet luxury", "gros budget", "matières"] },
    { name: "Nadia C.", role: "Directrice marketing retail · Lille", signals: ["quiet luxury", "gros budget"] },
    { name: "Lucas M.", role: "Buyer menswear · Paris", signals: ["buyer", "retail", "concept store"], rarity: "rare" },
    { name: "Thomas R.", role: "Reseller sneakers · Lyon", signals: ["sneakers", "revente", "drops"] },
    { name: "Julien P.", role: "Étudiant en design · Nantes", signals: ["drops", "Gen Z", "sneakers"] },
    { name: "Inès B.", role: "Journaliste mode · Paris", signals: ["seconde main", "archive", "Gen Z"] },
    { name: "Camille F.", role: "Créateur·rice de contenu · Marseille", signals: ["archive", "seconde main", "Gen Z"], rarity: "introuvable" },
  ],
  briefs: [
    { text: "Des acheteuses de luxe discret, 25–40 ans, qui savent parler matière.", signals: ["quiet luxury", "matières", "gros budget", "styliste"] },
    { text: "Des reselleurs de sneakers qui achètent au drop.", signals: ["sneakers", "revente", "drops"] },
    { text: "Des Gen Z qui s'habillent en seconde main et en archive.", signals: ["Gen Z", "seconde main", "archive"] },
    { text: "Des pros du retail mode, pour tester un nouveau concept de boutique.", signals: ["buyer", "retail", "concept store"] },
  ],
  rarity: { rare: "Rare", introuvable: "Introuvable" },
  console: {
    head: "Brief d'une marque", match: "profils correspondent", demo: "Démonstration sur des profils d'exemple.",
    pause: "Mettre en pause", resume: "Reprendre", fit: ["Très proche", "Proche", "À considérer"],
    aria: "Démonstration de la recherche de profils",
  },
};

const EN: Content = {
  lane1: [
    { label: "Freelance stylist" },
    { label: "Menswear buyer", rarity: "rare" },
    { label: "Fashion journalist" },
    { label: "Margiela archive collector", rarity: "introuvable" },
    { label: "Sneaker reseller" },
    { label: "Art director", rarity: "rare" },
    { label: "Quiet luxury shopper" },
    { label: "Personal shopper", rarity: "rare" },
  ],
  lane2: [
    { label: "Fashion school student" },
    { label: "Luxury boutique associate", rarity: "rare" },
    { label: "Vintage content creator" },
    { label: "Former department store buyer", rarity: "introuvable" },
    { label: "Drop hunter" },
    { label: "Trend consultant", rarity: "rare" },
    { label: "Second-hand regular" },
    { label: "Fashion photographer" },
  ],
  panel: [
    { name: "Amina D.", role: "Freelance stylist · Paris", signals: ["quiet luxury", "stylist", "materials", "Paris"], rarity: "rare" },
    { name: "Sofia L.", role: "Art director · Bordeaux", signals: ["quiet luxury", "high spend", "materials"] },
    { name: "Nadia C.", role: "Retail marketing director · Lille", signals: ["quiet luxury", "high spend"] },
    { name: "Lucas M.", role: "Menswear buyer · Paris", signals: ["buyer", "retail", "concept store"], rarity: "rare" },
    { name: "Thomas R.", role: "Sneaker reseller · Lyon", signals: ["sneakers", "resale", "drops"] },
    { name: "Julien P.", role: "Design student · Nantes", signals: ["drops", "Gen Z", "sneakers"] },
    { name: "Inès B.", role: "Fashion journalist · Paris", signals: ["second-hand", "archive", "Gen Z"] },
    { name: "Camille F.", role: "Content creator · Marseille", signals: ["archive", "second-hand", "Gen Z"], rarity: "introuvable" },
  ],
  briefs: [
    { text: "Quiet luxury shoppers, 25–40, who can talk about materials.", signals: ["quiet luxury", "materials", "high spend", "stylist"] },
    { text: "Sneaker resellers who buy on drop day.", signals: ["sneakers", "resale", "drops"] },
    { text: "Gen Z who dress in second-hand and archive pieces.", signals: ["Gen Z", "second-hand", "archive"] },
    { text: "Fashion retail pros, to test a new store concept.", signals: ["buyer", "retail", "concept store"] },
  ],
  rarity: { rare: "Rare", introuvable: "Unfindable" },
  console: {
    head: "A brand's brief", match: "matching profiles", demo: "Demo on sample profiles.",
    pause: "Pause", resume: "Resume", fit: ["Very close", "Close", "Worth a look"],
    aria: "Profile search demo",
  },
};

export const CONTENT: Record<Lang, Content> = { fr: FR, en: EN };

/**
 * Logos des maisons clientes, affichés sous l'ouverture. Vide tant qu'aucune
 * maison n'a donné son accord écrit : un logo sans accord laisserait croire à
 * un partenariat qui n'existe pas. Fichiers dans /public/clients/.
 */
export const TRUSTED: { name: string; logo: string; width: number; height: number }[] = [];
