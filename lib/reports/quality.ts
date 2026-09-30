import Anthropic from "@anthropic-ai/sdk";
import { extractJsonObject, textFromMessage } from "@/lib/anthropic/text";

// Contrôle qualité des synthèses : une citation doit exister dans les
// transcriptions. Celles qu'on ne retrouve pas sont remplacées par une vraie
// citation qui dit la même chose, ou retirées. Une synthèse qui invente une
// phrase de participant ruine la confiance de la marque dans tout le reste.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const REPAIR_MODEL = "claude-sonnet-5";

/** Texte comparable : minuscules, apostrophes et guillemets unifiés, sans ponctuation ni hésitations. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[«»“”"]/g, " ")
    .replace(/\b(euh+|heu+|hum+|bah|ben)\b/g, " ")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Une citation est retrouvée si elle figure telle quelle dans le corpus, ou si
 * au moins 80 % de ses suites de quatre mots y figurent (la transcription
 * automatique varie d'un mot par-ci par-là).
 */
export function quoteFound(quote: string, corpusNorm: string): boolean {
  const q = normalize(quote);
  if (!q) return true;
  if (corpusNorm.includes(q)) return true;
  const w = q.split(" ");
  if (w.length < 6) return false;
  let hit = 0, total = 0;
  for (let i = 0; i + 4 <= w.length; i++) {
    total++;
    if (corpusNorm.includes(w.slice(i, i + 4).join(" "))) hit++;
  }
  return total > 0 && hit / total >= 0.8;
}

type Report = Record<string, unknown>;
type Slot = { get: () => string; set: (v: string) => void; drop: () => void };

/** Toutes les citations d'une synthèse, avec de quoi les remplacer ou les retirer. */
function quoteSlots(r: Report): Slot[] {
  const slots: Slot[] = [];
  for (const key of ["forces", "vigilance", "insights", "reponses"]) {
    const list = r[key];
    if (!Array.isArray(list)) continue;
    for (const item of list as Record<string, unknown>[]) {
      if (typeof item?.verbatim !== "string" || !item.verbatim.trim()) continue;
      slots.push({ get: () => item.verbatim as string, set: (v) => { item.verbatim = v; }, drop: () => { item.verbatim = ""; } });
    }
  }
  if (Array.isArray(r.verbatims)) {
    const list = r.verbatims as Record<string, unknown>[];
    for (const item of list) {
      if (typeof item?.content !== "string") continue;
      slots.push({
        get: () => item.content as string,
        set: (v) => { item.content = v; },
        drop: () => { item.__drop = true; },
      });
    }
  }
  return slots;
}

export type QuoteCheck = { total: number; verified: number; repaired: number; removed: number };

/**
 * Vérifie les citations ; fait réécrire par Claude celles qu'on ne retrouve
 * pas (avec une vraie phrase du corpus), puis retire ce qui reste douteux.
 * Modifie la synthèse sur place et renvoie le bilan.
 */
export async function checkAndRepairQuotes(report: Report, transcripts: string[]): Promise<QuoteCheck> {
  const corpus = transcripts.join("\n\n");
  const corpusNorm = normalize(corpus);
  const slots = quoteSlots(report);
  const bad = slots.filter((s) => !quoteFound(s.get(), corpusNorm));
  const out: QuoteCheck = { total: slots.length, verified: slots.length - bad.length, repaired: 0, removed: 0 };
  if (bad.length === 0) return out;

  // Réparation : une seule demande pour toutes les citations introuvables.
  let fixes: Record<string, string> = {};
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const msg = await anthropic.messages.create({
        model: REPAIR_MODEL,
        max_tokens: 3000,
        system: "Tu vérifies les citations d'une synthèse d'entretiens. Pour chaque citation fournie, trouve dans les transcriptions la phrase EXACTE (recopiée mot pour mot, hésitations retirées) qui exprime la même idée. Si aucune phrase ne convient, renvoie une chaîne vide. Réponds uniquement en JSON : {\"1\": \"citation exacte\", \"2\": \"\"}.",
        messages: [{
          role: "user",
          content: `CITATIONS INTROUVABLES :\n${bad.map((s, i) => `${i + 1}. ${s.get()}`).join("\n")}\n\nTRANSCRIPTIONS :\n${corpus.slice(0, 180_000)}`,
        }],
      });
      fixes = JSON.parse(extractJsonObject(textFromMessage(msg))) as Record<string, string>;
    } catch (e) {
      console.error("[synthèse] réparation des citations", e);
    }
  }
  bad.forEach((s, i) => {
    const fix = (fixes[String(i + 1)] ?? "").trim();
    if (fix && quoteFound(fix, corpusNorm)) { s.set(fix); out.repaired++; }
    else { s.drop(); out.removed++; }
  });
  if (Array.isArray(report.verbatims)) {
    report.verbatims = (report.verbatims as Record<string, unknown>[]).filter((v) => !v.__drop);
  }
  return out;
}
