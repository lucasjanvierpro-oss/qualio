// Contrôle d'une réponse vidéo en autonomie avant de payer le participant :
// a-t-il vu toutes les questions, y a-t-il passé du temps, a-t-il vraiment
// parlé ? Des indices pour l'admin, qui tranche en regardant la vidéo.

type Prompt = { i: number; at: number };

export type QuestionCheck = { index: number; question: string; seconds: number | null; words: number };
export type AsyncCheck = {
  total: number;
  seen: number;
  minutes: number | null;
  words: number;
  perQuestion: QuestionCheck[];
  flags: string[];
  level: "ok" | "a_regarder" | "suspect";
};

/** Repères en dessous desquels une réponse mérite qu'on la regarde. */
const MIN_SECONDS_PER_QUESTION = 20;
const MIN_WORDS_PER_QUESTION = 25;

// Une ligne de transcription Whereby : « [horodatage] Nom: texte ».
function parseLines(transcript: string) {
  return transcript.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^\[(.+?)\]\s*[^:]{1,60}:\s*(.*)$/);
    const at = m ? new Date(m[1]).getTime() : NaN;
    return { at: Number.isNaN(at) ? null : at, text: m ? m[2] : l };
  });
}
const countWords = (t: string) => (t.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;

export function checkAsyncAnswer(iv: {
  prompts: unknown; startedAt: Date | null; submittedAt: Date | null; transcript: string | null; transcriptStatus: string | null;
}, guide: string[]): AsyncCheck {
  const prompts = (Array.isArray(iv.prompts) ? iv.prompts : []) as Prompt[];
  const firstAt = new Map<number, number>();
  for (const p of prompts) if (!firstAt.has(p.i)) firstAt.set(p.i, p.at);
  const order = [...firstAt.entries()].sort((a, b) => a[1] - b[1]);
  const endMs = iv.startedAt && iv.submittedAt ? iv.submittedAt.getTime() - iv.startedAt.getTime() : null;

  // Temps passé sur chaque question : jusqu'à la question suivante, ou jusqu'à l'envoi.
  const seconds = new Map<number, number>();
  order.forEach(([i, at], k) => {
    const next = order[k + 1]?.[1] ?? endMs;
    if (next != null) seconds.set(i, Math.max(0, Math.round((next - at) / 1000)));
  });

  // Mots prononcés pendant chaque question, d'après l'horodatage de la transcription.
  const words = new Map<number, number>();
  let totalWords = 0;
  if (iv.transcript) {
    const start = iv.startedAt?.getTime() ?? null;
    for (const line of parseLines(iv.transcript)) {
      const n = countWords(line.text);
      totalWords += n;
      if (start == null || line.at == null || !order.length) continue;
      const offset = line.at - start;
      let q = order[0][0];
      for (const [i, at] of order) if (at <= offset) q = i;
      words.set(q, (words.get(q) ?? 0) + n);
    }
  }

  const perQuestion = guide.map((question, index) => ({ index, question, seconds: seconds.get(index) ?? null, words: words.get(index) ?? 0 }));
  const seen = firstAt.size;
  const flags: string[] = [];
  if (seen < guide.length) flags.push(`${guide.length - seen} question(s) jamais affichée(s)`);
  const rushed = perQuestion.filter((q) => q.seconds != null && q.seconds < MIN_SECONDS_PER_QUESTION).length;
  if (rushed) flags.push(`${rushed} question(s) passée(s) en moins de ${MIN_SECONDS_PER_QUESTION} s`);
  if (iv.transcriptStatus === "done") {
    const thin = perQuestion.filter((q) => firstAt.has(q.index) && q.words < MIN_WORDS_PER_QUESTION).length;
    if (thin) flags.push(`${thin} réponse(s) de moins de ${MIN_WORDS_PER_QUESTION} mots`);
    if (totalWords < guide.length * MIN_WORDS_PER_QUESTION) flags.push(`${totalWords} mots au total`);
  } else {
    flags.push("Transcription pas encore arrivée");
  }
  const severe = seen < guide.length || (iv.transcriptStatus === "done" && totalWords < guide.length * MIN_WORDS_PER_QUESTION);
  return {
    total: guide.length,
    seen,
    minutes: endMs != null ? Math.round(endMs / 6000) / 10 : null,
    words: totalWords,
    perQuestion,
    flags,
    level: severe ? "suspect" : flags.length ? "a_regarder" : "ok",
  };
}
