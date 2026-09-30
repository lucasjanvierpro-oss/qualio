"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import WherebyRoom from "@/components/shared/WherebyRoom";
import LoupeMascot from "@/components/brand/LoupeMascot";
import css from "./async.module.css";
import { useTT } from "@/lib/i18n/client";

// Entretien en autonomie (bêta) : le participant est seul dans la salle vidéo.
// Les questions du guide s'affichent une par une, en noir sur fond blanc ; il
// passe à la suivante quand il a répondu. Whereby enregistre dès qu'il entre
// dans la salle, et nous notons à quel moment il change de question.

type Phase = "intro" | "room" | "done";

export default function AsyncInterview(p: {
  interviewId: string;
  title: string;
  questions: string[];
  displayName: string;
  status: string;
  joined: boolean;
  index: number;
  backHref: string;
}) {
  const tt = useTT();
  const finished = ["submitted", "completed"].includes(p.status);
  const [phase, setPhase] = useState<Phase>(finished ? "done" : "intro");
  const [consent, setConsent] = useState(false);
  const [nda, setNda] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [joined, setJoined] = useState(p.joined);
  const [index, setIndex] = useState(p.index);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const n = p.questions.length;

  const call = useCallback(async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/interviews/${p.interviewId}/async`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error ?? "error");
    return data as { roomUrl?: string; index?: number; joined?: boolean };
  }, [p.interviewId]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const r = await call({ action: "start", consent: true, nda: true });
      setRoomUrl(r.roomUrl ?? null);
      setJoined(!!r.joined);
      setIndex(r.index ?? 0);
      setPhase("room");
    } catch (e) {
      setError(e instanceof Error && e.message === "already_submitted"
        ? tt("Vos réponses ont déjà été envoyées.", "Your answers have already been sent.")
        : tt("La salle vidéo n'a pas pu s'ouvrir. Réessayez dans un instant.", "The video room could not open. Please try again in a moment."));
    }
    setBusy(false);
  }

  // Entrée dans la salle : la première question apparaît et l'horloge démarre.
  const onJoin = useCallback(() => {
    setJoined((was) => {
      if (!was) call({ action: "joined" }).then((r) => setIndex(r.index ?? 0)).catch(() => {});
      return true;
    });
  }, [call]);

  // Si Whereby ne signale pas l'entrée (navigateur particulier), un bouton de secours.
  useEffect(() => {
    if (phase !== "room" || joined) return;
    const t = setTimeout(() => setFallback(true), 10_000);
    return () => clearTimeout(t);
  }, [phase, joined]);

  async function go(to: number) {
    setBusy(true);
    try { await call({ action: "next", index: to }); setIndex(to); } catch { setError(tt("Connexion interrompue : réessayez.", "Connection lost: please try again.")); }
    setBusy(false);
  }

  async function finish() {
    setBusy(true);
    try { await call({ action: "finish" }); setPhase("done"); setRoomUrl(null); } catch { setError(tt("L'envoi n'a pas abouti : réessayez.", "Sending failed: please try again.")); }
    setBusy(false);
  }

  if (phase === "done") {
    return (
      <div className={css.page}>
        <div className={css.done}>
          <LoupeMascot size={96} mood="wow" />
          <h1>{tt("Merci, c'est envoyé.", "Thank you, it's sent.")}</h1>
          <p>{tt("La marque recevra la vidéo et la transcription de vos réponses. Votre récompense arrive dans votre solde dès que l'équipe a validé l'entretien.", "The brand will receive the video and transcript of your answers. Your reward lands in your balance once the team has validated the interview.")}</p>
          <Link className={css.primary} href="/participant/wallet">{tt("Voir mes gains", "See my earnings")}</Link>
          <Link className={css.link} href={p.backHref}>{tt("Retour à l'étude", "Back to the study")}</Link>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className={css.page}>
        <Link className={css.back} href={p.backHref}>← {tt("Retour à l'étude", "Back to the study")}</Link>
        <p className={css.eyebrow}>{tt("Entretien en autonomie", "Self-guided interview")}</p>
        <h1 className={css.h1}>{p.title}</h1>
        <div className={css.intro}>
          <ol className={css.steps}>
            <li><b>{tt("Installez-vous au calme", "Settle somewhere quiet")}</b><span>{tt("Une bonne lumière, un endroit sans bruit. Comptez une quinzaine de minutes.", "Good light, no noise. Allow about fifteen minutes.")}</span></li>
            <li><b>{tt("Entrez dans la salle vidéo", "Enter the video room")}</b><span>{tt("Autorisez la caméra et le micro, puis cliquez sur « Rejoindre ». Vous y êtes seul(e).", "Allow camera and microphone, then click “Join”. You are on your own.")}</span></li>
            <li><b>{tt("Répondez à voix haute", "Answer out loud")}</b><span>{n} {tt("questions s'affichent une par une. Prenez votre temps, puis passez à la suivante.", "questions appear one by one. Take your time, then move to the next.")}</span></li>
          </ol>
          <label className={css.consent}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{tt("J'accepte que mes réponses soient enregistrées en vidéo et transcrites, pour la marque qui mène l'étude. La vidéo n'est plus accessible après 90 jours.", "I agree that my answers are video-recorded and transcribed for the brand running the study. The video is no longer accessible after 90 days.")}</span>
          </label>
          <label className={css.consent}>
            <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} />
            <span>{tt("J'accepte l'", "I accept the ")}<a href="/accord-confidentialite" target="_blank" rel="noopener">{tt("accord de confidentialité", "confidentiality agreement")}</a>{tt(" : je garde pour moi les questions et tout ce que la marque me montre.", ": I keep the questions and everything the brand shows me to myself.")}</span>
          </label>
          {error && <p className={css.error}>{error}</p>}
          <button type="button" className={css.primary} disabled={!consent || !nda || busy} onClick={start}>
            {busy ? tt("Ouverture de la salle…", "Opening the room…") : p.joined ? tt("Reprendre", "Resume") : tt("Commencer", "Start")}
          </button>
        </div>
      </div>
    );
  }

  const last = index >= n - 1;
  return (
    <div className={css.room}>
      <section className={css.stage} aria-live="polite">
        {!joined ? (
          <div className={css.waiting}>
            <LoupeMascot size={72} mood="search" />
            <p className={css.q}>{tt("Entrez dans la salle vidéo : autorisez la caméra et le micro, puis cliquez sur « Rejoindre ».", "Enter the video room: allow camera and microphone, then click “Join”.")}</p>
            <p className={css.hint}>{tt("La première question s'affiche dès que vous y êtes.", "The first question appears as soon as you are in.")}</p>
            {fallback && <button type="button" className={css.ghost} onClick={onJoin}>{tt("Je suis dans la salle", "I'm in the room")}</button>}
          </div>
        ) : (
          <>
            <div className={css.progress} aria-hidden="true">{p.questions.map((_, i) => <i key={i} data-on={i <= index} />)}</div>
            <p className={css.count}>Question {index + 1} {tt("sur", "of")} {n}</p>
            <p className={css.q} key={index}>{p.questions[index]}</p>
            <div className={css.actions}>
              {index > 0 && <button type="button" className={css.ghost} disabled={busy} onClick={() => go(index - 1)}>← {tt("Précédente", "Previous")}</button>}
              {last ? (
                <button type="button" className={css.primary} disabled={busy} onClick={finish}>{busy ? tt("Envoi…", "Sending…") : tt("Terminer et envoyer", "Finish and send")}</button>
              ) : (
                <button type="button" className={css.primary} disabled={busy} onClick={() => go(index + 1)}>{tt("Question suivante →", "Next question →")}</button>
              )}
            </div>
            {error && <p className={css.error}>{error}</p>}
          </>
        )}
      </section>
      <section className={css.video}>
        {roomUrl && <WherebyRoom roomUrl={roomUrl} displayName={p.displayName} minimal onJoin={onJoin} height="100%" />}
        <p className={css.rec}><i /> {tt("L'enregistrement démarre dès que vous entrez dans la salle.", "Recording starts as soon as you enter the room.")}</p>
      </section>
    </div>
  );
}
