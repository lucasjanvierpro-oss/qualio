// La liste des formats du studio (sans les animations, qui vivent dans
// compositions.tsx) : lisible par les pages serveur comme par le navigateur.

export type Lang = "fr" | "en";
export type Format = "story" | "post" | "square" | "banner" | "avatar";
export const SIZES: Record<Format, [number, number]> = {
  story: [540, 960], post: [540, 675], square: [540, 540], banner: [792, 198], avatar: [200, 200],
};
export type CompositionMeta = {
  id: string; title: string; format: Format;
  /** Durée en secondes ; 0 pour un visuel fixe. */
  duration: number;
  /** Instant affiché pour un visuel fixe. */
  still?: number;
  langs: Lang[];
};

export const REGISTRY: CompositionMeta[] = [
  { id: "marques", title: "Rarelyst en 16 secondes (marques)", format: "story", duration: 16, langs: ["fr", "en"] },
  { id: "participants", title: "Votre œil vaut quelque chose (participants)", format: "story", duration: 14, langs: ["fr", "en"] },
  { id: "parrainage", title: "Parrainage : jusqu'à 320 € par ami", format: "story", duration: 10.5, langs: ["fr"] },
  { id: "profil-rare", title: "Le genre de profil que nous trouvons", format: "story", duration: 11, langs: ["fr"] },
  { id: "loupe", title: "La loupe se présente", format: "story", duration: 12, langs: ["fr"] },
  { id: "avant-apres", title: "Avant, après", format: "story", duration: 10.5, langs: ["fr"] },
  { id: "synthese", title: "La synthèse qui s'écrit", format: "story", duration: 10, langs: ["fr"] },
  { id: "post-versus", title: "Post : une tranche d'âge, une personne", format: "post", duration: 0, langs: ["fr"] },
  { id: "post-introuvables", title: "Post : les profils introuvables", format: "post", duration: 0, langs: ["fr"] },
  { id: "post-remuneration", title: "Post : 90 à 350 € par entretien", format: "post", duration: 0, langs: ["fr"] },
  { id: "post-parrainage", title: "Post : parrainage", format: "post", duration: 0, langs: ["fr"] },
  { id: "story-citation", title: "Story : citation d'entretien", format: "story", duration: 0, langs: ["fr"] },
  { id: "story-langues", title: "Story : entretiens en anglais", format: "story", duration: 0, langs: ["fr"] },
  { id: "banniere-linkedin", title: "Bannière de la page LinkedIn", format: "banner", duration: 0, langs: ["fr"] },
  { id: "avatar", title: "Photo de profil (loupe)", format: "avatar", duration: 0, langs: ["fr"] },
  { id: "carre-logo", title: "Carré logo", format: "square", duration: 0, langs: ["fr"] },
  { id: "post-garanties", title: "Post : vous ne payez que les profils gardés", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "post-question", title: "Post : qui rêvez-vous d'interroger ?", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-1", title: "Carrousel marques 1/7 : couverture", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-2", title: "Carrousel marques 2/7 : décrire une personne", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-3", title: "Carrousel marques 3/7 : chercher hors des panels", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-4", title: "Carrousel marques 4/7 : vérifier avant", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-5", title: "Carrousel marques 5/7 : les questions qui tranchent", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-6", title: "Carrousel marques 6/7 : une synthèse qui décide", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-marques-7", title: "Carrousel marques 7/7 : appel à l'action", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-1", title: "Carrousel participants 1/6 : couverture", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-2", title: "Carrousel participants 2/6 : le profil", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-3", title: "Carrousel participants 3/6 : les médailles", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-4", title: "Carrousel participants 4/6 : l'invitation", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-5", title: "Carrousel participants 5/6 : le retrait", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-participants-6", title: "Carrousel participants 6/6 : appel à l'action", format: "post", duration: 0, langs: ["fr", "en"] },
];

export const findMeta = (id: string) => REGISTRY.find((c) => c.id === id) ?? null;
