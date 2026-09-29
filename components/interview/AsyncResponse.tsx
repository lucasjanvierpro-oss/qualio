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
}) {
  // Premier passage sur chaque question.
  const first = new Map<number, number>();
  for (const x of p.prompts) if (!first.has(x.i)) first.set(x.i, x.at);
  const state =
    p.status === "scheduled" ? { label: "Pas encore commencé", tone: "wait" } :
    p.status === "in_progress" ? { label: "En train de répondre", tone: "wait" } :
    p.transcriptStatus === "done" ? { label: "Réponse complète", tone: "ok" } :
    { label: "Envoyé · transcription en cours", tone: "wait" };

  return (
    <div className={s.page}>
      <Link href={p.studyHref} className={`${s.small} ${s.muted}`}>← {p.title}</Link>
      <p className={s.eyebrow} style={{ marginTop: 18 }}>Entretien en autonomie · bêta</p>
      <h1 className={s.h1}>{p.person.name}</h1>
      <p className={s.lead}>{p.person.facts}</p>
      <p style={{ margin: "10px 0 0" }}>
        <span className={`${s.badge} ${state.tone === "ok" ? s.badgeOk : s.badgeWait}`}>{state.label}</span>
        {p.submittedAt && <span className={`${s.small} ${s.muted}`} style={{ marginLeft: 10 }}>Envoyé le {new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(p.submittedAt))}</span>}
      </p>

      <section className={s.card} style={{ marginTop: 20 }}>
        <div className={s.spread}>
          <h2 className={s.h3}>Les questions</h2>
          {p.hasRecording
            ? <a className={`${s.btn} ${s.btnGhost}`} href={`/api/interviews/${p.interviewId}/recording`} target="_blank" rel="noreferrer">Voir la vidéo</a>
            : <span className={`${s.small} ${s.muted}`}>La vidéo arrive quelques minutes après l&apos;envoi.</span>}
        </div>
        <ol style={{ margin: "12px 0 0", paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {p.questions.map((q, i) => (
            <li key={i} style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 10, alignItems: "baseline" }}>
              <span className={`${s.small} ${first.has(i) ? "" : s.faint}`} style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{first.has(i) ? mmss(first.get(i)!) : "—"}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
        <p className={`${s.small} ${s.faint}`} style={{ margin: "12px 0 0" }}>Le minutage indique quand le participant est passé à chaque question, depuis son entrée dans la salle.</p>
      </section>

      <section className={s.card} style={{ marginTop: 14 }}>
        <h2 className={s.h3}>Transcription</h2>
        {p.transcript
          ? <div style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.6, marginTop: 10 }}>{p.transcript}</div>
          : <p className={`${s.small} ${s.muted}`} style={{ margin: "8px 0 0" }}>{p.status === "submitted" ? "En cours : elle arrive en général dans l'heure qui suit l'envoi." : "Elle apparaîtra ici une fois les réponses envoyées."}</p>}
      </section>
    </div>
  );
}
