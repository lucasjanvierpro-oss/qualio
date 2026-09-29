"use client";

import { useCallback, useEffect, useState } from "react";
import { adminListPayouts, adminPayoutAction } from "@/app/actions/payouts";
import a from "../admin.module.css";

type Payout = Awaited<ReturnType<typeof adminListPayouts>>[number];

const STATUS: Record<string, { label: string; tone?: "good" | "warn" }> = {
  requested: { label: "Demandé", tone: "warn" },
  sending: { label: "Envoi en cours", tone: "warn" },
  failed: { label: "Bloqué", tone: "warn" },
  sent: { label: "Envoyé", tone: "good" },
  cancelled: { label: "Annulé" },
};

const eur = (c: number) => `${(c / 100).toLocaleString("fr-FR", { maximumFractionDigits: c % 100 ? 2 : 0 })} €`;
const fmt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/**
 * Les retraits demandés par les participants. Ils partent seuls par Stripe ;
 * ici, on relance ceux qui ont échoué, on solde un virement fait à la main, ou
 * on annule (les gains retournent dans le solde du participant).
 */
export default function PayoutsPanel() {
  const [rows, setRows] = useState<Payout[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(() => adminListPayouts().then(setRows).catch(() => setRows([])), []);
  useEffect(() => { void load(); }, [load]);

  async function act(p: Payout, action: "retry" | "manual" | "cancel") {
    if (action === "manual" && !confirm(`Confirmer que ${eur(p.amountCents)} ont été virés à la main à ${p.name} ?`)) return;
    if (action === "cancel" && !confirm(`Annuler ce retrait ? Les ${eur(p.amountCents)} retournent dans le solde de ${p.name}.`)) return;
    setBusy(p.id);
    const r = await adminPayoutAction(p.id, action);
    setNote((n) => ({ ...n, [p.id]: "error" in r ? r.error : action === "retry" ? "Virement envoyé." : action === "manual" ? "Soldé." : "Annulé." }));
    setBusy(null);
    await load();
  }

  const open = rows?.filter((p) => p.status !== "sent" && p.status !== "cancelled") ?? [];
  const recent = rows?.filter((p) => p.status === "sent" || p.status === "cancelled").slice(0, 8) ?? [];

  return (
    <section style={{ marginBottom: 36 }}>
      <div className={a.sectionHead}>
        <h2 className={a.h2}>Retraits des participants</h2>
        <span className={a.muted} style={{ fontSize: 12 }}>
          {rows === null ? "Chargement…" : open.length ? `${open.length} à traiter · ${eur(open.reduce((n, p) => n + p.amountCents, 0))}` : "Tout est parti"}
        </span>
      </div>
      <div className={`${a.card} ${a.tableWrap}`}>
        <div className={`${a.row} ${a.rowHead}`}><span>Participant</span><span>Montant</span><span>Statut</span><span>Demandé</span><span>Versé</span><span /></div>
        {rows !== null && rows.length === 0 && (
          <div className={a.row}><span className={a.muted}>Aucun retrait pour l&apos;instant. Ils apparaîtront ici dès qu&apos;un participant retirera son solde.</span></div>
        )}
        {[...open, ...recent].map((p) => {
          const st = STATUS[p.status] ?? { label: p.status };
          return (
            <div key={p.id} className={a.row}>
              <span className={a.rowMain}>
                {p.name}
                <small>{p.error ?? (p.connect === "active" ? "Compte bancaire connecté" : "Compte bancaire non connecté")}</small>
              </span>
              <span className={a.num}>{eur(p.amountCents)}</span>
              <span><span className={`${a.pill} ${st.tone === "good" ? a.good : st.tone === "warn" ? a.warn : ""}`} data-manual={p.method === "manual" && p.status === "sent"}>{st.label}</span></span>
              <span className={a.muted}>{fmt(p.createdAt)}</span>
              <span className={a.muted}>{p.paidAt ? fmt(p.paidAt) : "—"}</span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {note[p.id] ? <span className={a.msg}>{note[p.id]}</span> : p.status !== "sent" && p.status !== "cancelled" && (
                  <>
                    <button type="button" className={a.btn} disabled={busy === p.id} onClick={() => act(p, "retry")}>Relancer</button>
                    <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={busy === p.id} onClick={() => act(p, "manual")}>Payé à la main</button>
                    <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={busy === p.id} onClick={() => act(p, "cancel")}>Annuler</button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
