"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { digestLab, runLab } from "@/app/actions/lab";
import a from "../admin.module.css";
import l from "./labo.module.css";

const IDEAS = ["parfumerie de niche", "maison de luxe patrimoniale", "sneakers", "beauté clean", "seconde main de luxe", "marque coréenne qui arrive en France"];

export default function LabControls() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [digesting, setDigesting] = useState(false);

  const run = () => start(async () => {
    setMsg(null);
    const r = await runLab(theme);
    if ("error" in r) setMsg({ ok: false, text: r.error });
    else { setMsg({ ok: true, text: "Simulation terminée : elle est en tête de liste." }); router.refresh(); }
  });

  async function synth() {
    setDigesting(true);
    const r = await digestLab();
    setDigest("error" in r ? r.error : r.text);
    setDigesting(false);
  }

  return (
    <div className={`${a.card} ${l.controls}`}>
      <div className={a.field} style={{ flex: "1 1 260px" }}>
        <label htmlFor="theme">Terrain de la marque (facultatif)</label>
        <input id="theme" className={a.input} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Au hasard si vide" disabled={pending} />
        <small>{IDEAS.map((i) => <button key={i} type="button" className={l.idea} onClick={() => setTheme(i)} disabled={pending}>{i}</button>)}</small>
      </div>
      <div className={a.bar2}>
        <button type="button" className={a.btn} onClick={run} disabled={pending}>{pending ? "Simulation en cours… (1 à 2 min)" : "Lancer une marque simulée"}</button>
        <button type="button" className={`${a.btn} ${a.btnGhost}`} onClick={synth} disabled={digesting || pending}>{digesting ? "Synthèse…" : "Synthétiser les leçons"}</button>
      </div>
      {msg && <p className={`${a.msg} ${msg.ok ? a.good : a.warn}`} style={{ margin: 0 }}>{msg.text}</p>}
      {digest && <div className={l.digest}>{digest}</div>}
    </div>
  );
}
