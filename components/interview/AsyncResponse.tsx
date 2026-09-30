import Link from "next/link";
import s from "@/components/rl/rl.module.css";

// Côté marque : la réponse d'un participant à un entretien en autonomie.
// Les questions avec le moment où il y est passé (pour retrouver la réponse
// dans la vidéo), la vidéo, puis la transcription.

type Prompt = { i: number; at: number };

const mmss = (ms: number) => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export default function AsyncResponse(p: {
  interviewId: string;
  title: string;
  studyHref: string;
  person: { name: string; facts: string };
  questions: string[];
  prompts: Prompt[];
  status: string;
  submittedAt: string | null;
  hasRecording: boolean;
  transcriptStatus: string | null;
  transcript: string | null;
  lang?: "fr" | "en";
}) {
  const en = p.lang === "en";
  const tt = (fr: string, e: string) => (en ? e : fr);
  // Premier passage sur chaque question.
  const first = new Map<number, number>();
  for (const x of p.prompts) if (!first.has(x.i)) first.set(x.i, x.at);
  const state =
    p.status === "scheduled" ? { label: tt("Pas encore commencé", "Not started yet"), tone: "wait" } :
    p.status === "in_progress" ? { label: tt("En train de répondre", "Answering"), tone: "wait" } :
    p.transcriptStatus === "done" ? { label: tt("Réponse complète", "Answer complete"), tone: "ok" } :
    { label: tt("Envoyé · transcription en cours", "Sent · transcript in progress"), tone: "wait" };

  return (
    <div className={s.page}>
      <Link href={p.studyHref} className={`${s.small} ${s.muted}`}>← {p.title}</Link>
      <p className={s.eyebrow} style={{ marginTop: 18 }}>{tt("Entretien en autonomie · bêta", "Self-paced interview · beta")}</p>
      <h1 className={s.h1}>{p.person.name}</h1>
      <p className={s.lead}>{p.person.facts}</p>
      <p style={{ margin: "10px 0 0" }}>
        <span className={`${s.badge} ${state.tone === "ok" ? s.badgeOk : s.badgeWait}`}>{state.label}</span>
        {p.submittedAt && <span className={`${s.small} ${s.muted}`} style={{ marginLeft: 10 }}>{tt("Envoyé le", "Sent on")} {new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(p.submittedAt))}</span>}
      </p>

      <section className={s.card} style={{ marginTop: 20 }}>
        <div className={s.spread}>
          <h2 className={s.h3}>{tt("Les questions", "The questions")}</h2>
          {p.hasRecording
            ? <a className={`${s.btn} ${s.btnGhost}`} href={`/api/interviews/${p.interviewId}/recording`} target="_blank" rel="noreferrer">{tt("Voir la vidéo", "Watch the video")}</a>
            : <span className={`${s.small} ${s.muted}`}>{tt("La vidéo arrive quelques minutes après l'envoi.", "The video arrives a few minutes after sending.")}</span>}
        </div>
        <ol style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {p.questions.map((q, i) => (
            <li key={i} style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 10, alignItems: "baseline" }}>
              <span className={`${s.small} ${first.has(i) ? "" : s.faint}`} style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{first.has(i) ? mmss(first.get(i)!) : "—"}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
        <p className={`${s.small} ${s.faint}`} style={{ margin: "12px 0 0" }}>{tt("Le minutage indique quand le participant est passé à chaque question, depuis son entrée dans la salle.", "Timings show when the participant moved to each question, from when they entered the room.")}</p>
      </section>

      <section className={s.card} style={{ marginTop: 14 }}>
        <h2 className={s.h3}>{tt("Transcription", "Transcript")}</h2>
        {p.transcript
          ? <div style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.6, marginTop: 10 }}>{p.transcript}</div>
          : <p className={`${s.small} ${s.muted}`} style={{ margin: "8px 0 0" }}>{p.status === "submitted" ? tt("En cours : elle arrive en général dans l'heure qui suit l'envoi.", "In progress: it usually arrives within an hour of sending.") : tt("Elle apparaîtra ici une fois les réponses envoyées.", "It will appear here once the answers are sent.")}</p>}
      </section>
    </div>
  );
}
