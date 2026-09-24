// Registre officiel des entreprises françaises, via l'API publique
// recherche-entreprises.api.gouv.fr (gratuite, sans clé). Sert à rattacher un
// compte marque à une société réelle : nom légal, activité, taille, état.
//
// La recherche par nom renvoie des homonymes (« LACOSTE » : une agence de
// fournitures, deux SCI…) : c'est la marque qui choisit la bonne, et c'est son
// domaine prouvé qui établit qu'elle y travaille.

const API = "https://recherche-entreprises.api.gouv.fr/search";

export type Company = {
  siren: string;
  name: string;
  city: string | null;
  naf: string | null;
  activity: string | null;
  category: string | null;
  employees: string | null;
  created: string | null;
  active: boolean;
};

// Activités qu'on rencontre chez les marques de mode, de luxe et de beauté,
// et chez leurs agences. Le reste s'affiche avec son code.
const NAF: Record<string, string> = {
  "13.92Z": "Articles textiles", "14.11Z": "Vêtements en cuir", "14.12Z": "Vêtements de travail",
  "14.13Z": "Vêtements de dessus", "14.14Z": "Vêtements de dessous", "14.19Z": "Vêtements et accessoires",
  "14.20Z": "Articles en fourrure", "14.31Z": "Bonneterie", "14.39Z": "Articles à mailles",
  "15.12Z": "Maroquinerie", "15.20Z": "Chaussures", "20.42Z": "Parfums et cosmétiques",
  "32.12Z": "Joaillerie", "32.13Z": "Bijouterie fantaisie", "26.52Z": "Horlogerie",
  "46.16Z": "Intermédiaires du commerce textile", "46.41Z": "Commerce de gros de textiles",
  "46.42Z": "Commerce de gros d'habillement", "46.45Z": "Commerce de gros de parfumerie",
  "46.48Z": "Commerce de gros d'horlogerie et bijouterie", "46.49Z": "Commerce de gros de biens domestiques",
  "47.71Z": "Commerce de détail d'habillement", "47.72A": "Commerce de détail de chaussures",
  "47.72B": "Maroquinerie et articles de voyage", "47.75Z": "Parfumerie et beauté",
  "47.77Z": "Horlogerie et bijouterie", "47.91A": "Vente à distance", "47.91B": "Vente à distance",
  "70.10Z": "Holding", "70.21Z": "Relations publiques", "70.22Z": "Conseil en gestion",
  "73.11Z": "Agence de publicité", "73.12Z": "Régie publicitaire", "73.20Z": "Études de marché",
  "74.10Z": "Design", "64.20Z": "Holding",
};

const FASHION = new Set(Object.keys(NAF).filter((k) => !["70.10Z", "70.21Z", "70.22Z", "73.11Z", "73.12Z", "73.20Z", "74.10Z", "64.20Z", "46.49Z", "47.91A", "47.91B"].includes(k)));

const EMPLOYEES: Record<string, string> = {
  "00": "0 salarié", "01": "1-2 salariés", "02": "3-5 salariés", "03": "6-9 salariés", "11": "10-19 salariés",
  "12": "20-49 salariés", "21": "50-99 salariés", "22": "100-199 salariés", "31": "200-249 salariés",
  "32": "250-499 salariés", "41": "500-999 salariés", "42": "1 000-1 999 salariés", "51": "2 000-4 999 salariés",
  "52": "5 000-9 999 salariés", "53": "10 000 salariés et plus",
};

const CATEGORY: Record<string, string> = { GE: "Grande entreprise", ETI: "Entreprise de taille intermédiaire", PME: "PME" };

type Raw = {
  siren: string; nom_complet?: string; nom_raison_sociale?: string | null; etat_administratif?: string;
  activite_principale?: string | null; categorie_entreprise?: string | null; tranche_effectif_salarie?: string | null;
  date_creation?: string | null; siege?: { libelle_commune?: string | null };
};

function toCompany(r: Raw): Company {
  return {
    siren: r.siren,
    name: r.nom_raison_sociale || r.nom_complet || r.siren,
    city: r.siege?.libelle_commune ?? null,
    naf: r.activite_principale ?? null,
    activity: r.activite_principale ? NAF[r.activite_principale] ?? `Activité ${r.activite_principale}` : null,
    category: r.categorie_entreprise ? CATEGORY[r.categorie_entreprise] ?? r.categorie_entreprise : null,
    employees: r.tranche_effectif_salarie ? EMPLOYEES[r.tranche_effectif_salarie] ?? null : null,
    created: r.date_creation ?? null,
    active: r.etat_administratif === "A",
  };
}

async function call(params: Record<string, string>): Promise<Raw[]> {
  const url = `${API}?${new URLSearchParams({ per_page: "10", ...params })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`registre ${res.status}`);
  const data = (await res.json()) as { results?: Raw[] };
  return data.results ?? [];
}

/**
 * Sociétés actives correspondant à un nom ou à un SIREN, les plus grandes
 * d'abord : une marque qui s'inscrit est rarement une SCI de trois personnes.
 */
export async function searchCompanies(q: string): Promise<Company[]> {
  const clean = q.trim().slice(0, 80);
  if (clean.length < 2) return [];
  const rows = (await call({ q: clean, per_page: "20" })).map(toCompany).filter((c) => c.active);
  // Une activité de mode, de luxe ou de beauté passe devant la taille : une
  // grossiste en fournitures de bureau nommée « Lacoste » ne doit pas cacher
  // la maison.
  const weight = (c: Company) =>
    (c.naf && FASHION.has(c.naf) ? 4 : 0) +
    (c.category === CATEGORY.GE ? 3 : c.category === CATEGORY.ETI ? 2 : c.category === CATEGORY.PME ? 1 : 0);
  return rows.sort((a, b) => weight(b) - weight(a)).slice(0, 8);
}

export async function companyBySiren(siren: string): Promise<Company | null> {
  const s = siren.replace(/\D/g, "");
  if (s.length !== 9) return null;
  const rows = await call({ q: s });
  const r = rows.find((x) => x.siren === s);
  return r ? toCompany(r) : null;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Le nom légal correspond-il à la marque ? On compare au nom saisi et au
 * domaine de l'email (lacoste.com → « lacoste »).
 */
export function nameMatches(legalName: string, brandName: string, domain: string): boolean {
  const legal = norm(legalName);
  const base = norm(domain.split(".").slice(-2, -1)[0] ?? "");
  const brand = norm(brandName);
  return (!!base && base.length >= 3 && legal.includes(base)) || (!!brand && brand.length >= 3 && legal.includes(brand));
}
