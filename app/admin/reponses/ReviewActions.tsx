"use client";

import { useState, useTransition } from "react";
import { refuseAsyncAnswer, validateAsyncAnswer } from "@/app/actions/asyncReview";
import a from "../admin.module.css";

export default function ReviewActions({ interviewId, hasVideo }: { interviewId: string; hasVideo: boolean }) {
  const [pending, start] = useTransition();
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className={a.bar2}>
        {hasVideo
          ? <a className={`${a.btn} ${a.btnGhost}`} href={`/api/interviews/${interviewId}/recording`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>Regarder la vidéo</a>
          : <span className={a.muted} style={{ fontSize: 12 }}>Vidéo pas encore arrivée</span>}
        <button type="button" className={a.btn} disabled={pending} onClick={() => start(async () => {
          const r = await validateAsyncAnswer(interviewId);
          setMsg(r.ok ? { ok: true, text: "Validée : le participant est payé et prévenu." } : { ok: false, text: "Échec." });
        })}>Valider et payer</button>
        <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={pending} onClick={() => setRefusing((v) => !v)}>Refuser…</button>
        {msg && <span className={`${a.msg} ${msg.ok ? a.good : a.warn}`}>{msg.text}</span>}
      </div>
      {refusing && (
        <div className={a.bar2}>
          <input id={`reason-${interviewId}`} className={a.input} style={{ flex: 1, minWidth: 220 }} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Raison envoyée au participant (ex. : réponses de quelques mots, questions passées sans répondre)" aria-label="Raison du refus" />
          <button type="button" className={a.btn} disabled={pending || reason.trim().length < 5} onClick={() => start(async () => {
            const r = await refuseAsyncAnswer(interviewId, reason);
            setMsg("error" in r ? { ok: false, text: r.error ?? "Échec." } : { ok: true, text: "Refusée : la marque est remboursée, le participant prévenu." });
            if (!("error" in r)) setRefusing(false);
          })}>Confirmer le refus</button>
        </div>
      )}
    </div>
  );
}
