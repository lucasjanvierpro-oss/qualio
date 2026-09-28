// Les synthèses du CV et du book vivent dans le même champ (cvAnalysis), une
// section chacune : analyser le book ne doit pas effacer l'analyse du CV.

const LABEL = { cv: "CV", portfolio: "Book" } as const;

function sections(text: string | null | undefined): Partial<Record<keyof typeof LABEL, string>> {
  if (!text) return {};
  if (!/^\[(CV|Book)\]/m.test(text)) return { cv: text.trim() }; // ancien format : tout était le CV
  // ["", "CV", "texte…", "Book", "texte…"]
  const parts = text.split(/^\[(CV|Book)\]\n/m);
  const out: Partial<Record<keyof typeof LABEL, string>> = {};
  for (let i = 1; i < parts.length; i += 2) out[parts[i] === "CV" ? "cv" : "portfolio"] = (parts[i + 1] ?? "").trim();
  return out;
}

/** Remplace la section d'un document, garde l'autre. */
export function withDocSection(current: string | null | undefined, kind: "cv" | "portfolio", analysis: string): string {
  const s = { ...sections(current), [kind]: analysis.trim() };
  return (["cv", "portfolio"] as const).filter((k) => s[k]).map((k) => `[${LABEL[k]}]\n${s[k]}`).join("\n\n");
}

/** Vrai si le CV lui-même a été analysé (pas seulement le book). */
export function hasCvAnalysis(text: string | null | undefined): boolean {
  return !!sections(text).cv;
}
