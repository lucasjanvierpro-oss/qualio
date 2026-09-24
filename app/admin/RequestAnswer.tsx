"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerProfileRequest } from "@/app/actions/admin";
import a from "./admin.module.css";

/** Répondre à une demande de profil sur demande, sans quitter le pilotage. */
export default function RequestAnswer({ id }: { id: string }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();
  const go = (status: "accepted" | "declined") => start(async () => { await answerProfileRequest(id, status, reply); router.refresh(); });
  return (
    <div className={a.bar2}>
      <input className={a.input} style={{ flex: 1, minWidth: 140 }} placeholder="Réponse à la marque (prix, délai…)" value={reply} onChange={(e) => setReply(e.target.value)} aria-label="Réponse" />
      <button type="button" className={a.btn} disabled={pending} onClick={() => go("accepted")}>Accepter</button>
      <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={pending} onClick={() => go("declined")}>Refuser</button>
    </div>
  );
}
