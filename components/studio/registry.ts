// La liste des formats du studio (sans les animations, qui vivent dans
// compositions.tsx) : lisible par les pages serveur comme par le navigateur.

export type Lang = "fr" | "en";
export type Format = "story" | "post" | "square" | "banner" | "cover" | "og" | "avatar";
export const SIZES: Record<Format, [number, number]> = {
  story: [540, 960], post: [540, 675], square: [540, 540], banner: [792, 198], cover: [1128, 191], og: [600, 315], avatar: [200, 200],
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
  { id: "banniere-noir-casting", title: "Bannière noire : le casting de vos études", format: "banner", duration: 0, langs: ["fr", "en"] },
  { id: "banniere-noir-ticker", title: "Bannière noire : parlez aux gens qu'aucun panel ne touche", format: "banner", duration: 0, langs: ["fr", "en"] },
  { id: "banniere-noir-brief", title: "Bannière noire : un brief très précis", format: "banner", duration: 0, langs: ["fr", "en"] },
  { id: "banniere-noir-profils", title: "Bannière noire : des profils très précis", format: "banner", duration: 0, langs: ["fr", "en"] },
  { id: "banniere-noir-logo", title: "Bannière noire : logo", format: "banner", duration: 0, langs: ["fr", "en"] },
  { id: "partage", title: "Image de partage du site (Open Graph, 1200×630)", format: "og", duration: 0, langs: ["fr", "en"] },
  { id: "page-noir-casting", title: "Couverture de la page entreprise LinkedIn : le casting", format: "cover", duration: 0, langs: ["fr", "en"] },
  { id: "page-noir-ticker", title: "Couverture de la page entreprise LinkedIn : parlez aux gens", format: "cover", duration: 0, langs: ["fr", "en"] },
  { id: "page-noir-brief", title: "Couverture de la page entreprise LinkedIn : un brief précis", format: "cover", duration: 0, langs: ["fr", "en"] },
  { id: "page-noir-profils", title: "Couverture de la page entreprise LinkedIn : des profils très précis", format: "cover", duration: 0, langs: ["fr", "en"] },
  { id: "page-noir-logo", title: "Couverture de la page entreprise LinkedIn : logo", format: "cover", duration: 0, langs: ["fr", "en"] },
  { id: "casting-stars", title: "Vidéo casting (vertical) : styliste de stars", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "casting-stars-post", title: "Vidéo casting (4:5) : styliste de stars", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "casting-influence", title: "Vidéo casting (vertical) : micro-influenceuses", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "casting-influence-post", title: "Vidéo casting (4:5) : micro-influenceuses", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "casting-genz", title: "Vidéo casting (vertical) : Gen Z sur Vinted", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "casting-genz-post", title: "Vidéo casting (4:5) : Gen Z sur Vinted", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-expert", title: "Vidéo panel (vertical) : experts, pas le temps", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-expert-post", title: "Vidéo panel (4:5) : experts, pas le temps", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-influence", title: "Vidéo panel (vertical) : influenceurs", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-influence-post", title: "Vidéo panel (4:5) : influenceurs", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-conso", title: "Vidéo panel (vertical) : clients passionnés", format: "story", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "panel-conso-post", title: "Vidéo panel (4:5) : clients passionnés", format: "post", duration: 12.5, still: 5.6, langs: ["fr", "en"] },
  { id: "serie-1", title: "Série stories 1/4 : le brief", format: "story", duration: 7, still: 5.5, langs: ["fr", "en"] },
  { id: "serie-2", title: "Série stories 2/4 : les profils", format: "story", duration: 7, still: 5.5, langs: ["fr", "en"] },
  { id: "serie-3", title: "Série stories 3/4 : l'entretien", format: "story", duration: 7, still: 5.5, langs: ["fr", "en"] },
  { id: "serie-4", title: "Série stories 4/4 : la synthèse", format: "story", duration: 7, still: 5.5, langs: ["fr", "en"] },
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
  { id: "carrousel-confiance-1", title: "Carrousel confiance (candidats) 1/6 : couverture", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-confiance-2", title: "Carrousel confiance (candidats) 2/6 : pas d'argent demandé", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-confiance-3", title: "Carrousel confiance (candidats) 3/6 : le montant avant", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-confiance-4", title: "Carrousel confiance (candidats) 4/6 : votre employeur en dehors", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-confiance-5", title: "Carrousel confiance (candidats) 5/6 : le retrait", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-confiance-6", title: "Carrousel confiance (candidats) 6/6 : un vrai humain", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-1", title: "Carrousel comité (marques) 1/6 : couverture", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-2", title: "Carrousel comité (marques) 2/6 : le comité n'attend pas", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-3", title: "Carrousel comité (marques) 3/6 : décrire une personne", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-4", title: "Carrousel comité (marques) 4/6 : commencer petit", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-5", title: "Carrousel comité (marques) 5/6 : une vidéo qui convainc", format: "post", duration: 0, langs: ["fr", "en"] },
  { id: "carrousel-comite-6", title: "Carrousel comité (marques) 6/6 : appel à l'action", format: "post", duration: 0, langs: ["fr", "en"] },
];

export const findMeta = (id: string) => REGISTRY.find((c) => c.id === id) ?? null;
