"use client";

import { useState } from "react";
import { issueDraftsAction, saveIssuerAction } from "@/app/actions/billing";
import type { Issuer } from "@/lib/billing/invoices";
import a from "../admin.module.css";

export default function IssuerForm({ issuer, drafts }: { issuer: Issuer; drafts: number }) {
  const [v, setV] = useState(issuer);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const f = (k: keyof Issuer) => ({ value: v[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }) });
  async function save() {
    setBusy(true);
    const r = await saveIssuerAction(v);
    setMsg("error" in r ? { ok: false, text: r.error } : { ok: true, text: "Enregistré." });
    setBusy(false);
  }
  async function issue() {
    setBusy(true);
    const r = await issueDraftsAction();
    setMsg({ ok: r.issued > 0, text: r.issued ? `${r.issued} facture(s) émise(s).` : "Aucune facture émise : vérifiez le SIRET et l'adresse." });
    setBusy(false);
  }
  return (
    <div className={a.card} style={{ padding: 20, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div className={a.field}><label>Nom et prénom</label><input className={a.input} {...f("name")} /></div>
        <div className={a.field}><label>Nom commercial</label><input className={a.input} {...f("tradeName")} /></div>
        <div className={a.field}><label>Forme</label><input className={a.input} {...f("legalForm")} /></div>
        <div className={a.field}><label>SIRET (14 chiffres)</label><input className={a.input} {...f("siret")} placeholder="Après l'ajout de l'activité" /></div>
        <div className={a.field}><label>Code APE (facultatif)</label><input className={a.input} {...f("ape")} /></div>
        <div className={a.field}><label>Email</label><input className={a.input} {...f("email")} /></div>
      </div>
      <div className={a.field}><label>Adresse (celle déclarée pour la micro-entreprise)</label><textarea className={a.input} rows={3} {...f("address")} /></div>
      <div className={a.field}><label>Mention TVA</label><input className={a.input} {...f("vatMention")} /></div>
      <div className={a.bar2}>
        <button type="button" className={a.btn} onClick={save} disabled={busy}>Enregistrer</button>
        {drafts > 0 && <button type="button" className={`${a.btn} ${a.btnGhost}`} onClick={issue} disabled={busy}>Émettre les {drafts} facture(s) en attente</button>}
        {msg && <span className={`${a.msg} ${msg.ok ? a.good : a.warn}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
