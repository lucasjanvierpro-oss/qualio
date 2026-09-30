"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import WherebyRoom from "@/components/shared/WherebyRoom";
import LoupeMascot from "@/components/brand/LoupeMascot";
import css from "./async.module.css";

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
        ? "Vos réponses ont déjà été envoyées."
        : "La salle vidéo n'a pas pu s'ouvrir. Réessayez dans un instant.");
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
    try { await call({ action: "next", index: to }); setIndex(to); } catch { setError("Connexion interrompue : réessayez."); }
    setBusy(false);
  }

  async function finish() {
    setBusy(true);
    try { await call({ action: "finish" }); setPhase("done"); setRoomUrl(null); } catch { setError("L'envoi n'a pas abouti : réessayez."); }
    setBusy(false);
  }

  if (phase === "done") {
    return (
      <div className={css.page}>
        <div className={css.done}>
          <LoupeMascot size={96} mood="wow" />
          <h1>Merci, c&apos;est envoyé.</h1>
          <p>La marque recevra la vidéo et la transcription de vos réponses. Votre récompense arrive dans votre solde dès que l&apos;équipe a validé l&apos;entretien.</p>
          <Link className={css.primary} href="/participant/wallet">Voir mes gains</Link>
          <Link className={css.link} href={p.backHref}>Retour à l&apos;étude</Link>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className={css.page}>
        <Link className={css.back} href={p.backHref}>← Retour à l&apos;étude</Link>
        <p className={css.eyebrow}>Entretien en autonomie</p>
        <h1 className={css.h1}>{p.title}</h1>
        <div className={css.intro}>
          <ol className={css.steps}>
            <li><b>Installez-vous au calme</b><span>Une bonne lumière, un endroit sans bruit. Comptez une quinzaine de minutes.</span></li>
            <li><b>Entrez dans la salle vidéo</b><span>Autorisez la caméra et le micro, puis cliquez sur « Rejoindre ». Vous y êtes seul(e).</span></li>
            <li><b>Répondez à voix haute</b><span>{n} questions s&apos;affichent une par une. Prenez votre temps, puis passez à la suivante.</span></li>
          </ol>
          <label className={css.consent}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>J&apos;accepte que mes réponses soient enregistrées en vidéo et transcrites, pour la marque qui mène l&apos;étude. La vidéo n&apos;est plus accessible après 90 jours.</span>
          </label>
          <label className={css.consent}>
            <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} />
            <span>J&apos;accepte l&apos;<a href="/accord-confidentialite" target="_blank" rel="noopener">accord de confidentialité</a> : je garde pour moi les questions et tout ce que la marque me montre.</span>
          </label>
          {error && <p className={css.error}>{error}</p>}
          <button type="button" className={css.primary} disabled={!consent || !nda || busy} onClick={start}>
            {busy ? "Ouverture de la salle…" : p.joined ? "Reprendre" : "Commencer"}
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
            <p className={css.q}>Entrez dans la salle vidéo : autorisez la caméra et le micro, puis cliquez sur « Rejoindre ».</p>
            <p className={css.hint}>La première question s&apos;affiche dès que vous y êtes.</p>
            {fallback && <button type="button" className={css.ghost} onClick={onJoin}>Je suis dans la salle</button>}
          </div>
        ) : (
          <>
            <div className={css.progress} aria-hidden="true">{p.questions.map((_, i) => <i key={i} data-on={i <= index} />)}</div>
            <p className={css.count}>Question {index + 1} sur {n}</p>
            <p className={css.q} key={index}>{p.questions[index]}</p>
            <div className={css.actions}>
              {index > 0 && <button type="button" className={css.ghost} disabled={busy} onClick={() => go(index - 1)}>← Précédente</button>}
              {last ? (
                <button type="button" className={css.primary} disabled={busy} onClick={finish}>{busy ? "Envoi…" : "Terminer et envoyer"}</button>
              ) : (
                <button type="button" className={css.primary} disabled={busy} onClick={() => go(index + 1)}>Question suivante →</button>
              )}
            </div>
            {error && <p className={css.error}>{error}</p>}
          </>
        )}
      </section>
      <section className={css.video}>
        {roomUrl && <WherebyRoom roomUrl={roomUrl} displayName={p.displayName} minimal onJoin={onJoin} height="100%" />}
        <p className={css.rec}><i /> L&apos;enregistrement démarre dès que vous entrez dans la salle.</p>
      </section>
    </div>
  );
}
