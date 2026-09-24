"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setProfilePricing, rerunGhostFile } from "@/app/actions/admin";
import type { Tier } from "@/lib/pricing/config";
import a from "../admin.module.css";

export type Row = {
  id: string; name: string; city: string | null; complete: boolean;
  tier: Tier; tierReason: string; tierManual: boolean; override: number | null;
  certScore: number; credits: number; priceCents: number; payCents: number; marginCents: number;
  why: string[];
};

const eur = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;

function Line({ r, tierLabels }: { r: Row; tierLabels: Record<Tier, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tier, setTier] = useState<string>(r.tierManual ? r.tier : "");
  const [credits, setCredits] = useState(r.override ? String(r.override) : "");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const dirty = tier !== (r.tierManual ? r.tier : "") || credits !== (r.override ? String(r.override) : "");

  return (
    <>
      <div className={a.row} style={{ gridTemplateColumns: "minmax(0,1.5fr) 150px 70px 90px 90px 90px minmax(0,1.6fr)" }}>
        <Link href={`/admin/participants/${r.id}`} className={a.rowMain} style={{ textDecoration: "none" }}>
          {r.name}<small>{r.city ?? "—"}{r.complete ? "" : " · tunnel inachevé"}</small>
        </Link>
        <span title={r.tierReason}><span className={a.pill} data-t={r.tier} data-manual={r.tierManual}>{tierLabels[r.tier]}</span></span>
        <span className={a.num}>{r.certScore} %</span>
        <button type="button" className={a.num} onClick={() => setOpen((v) => !v)} style={{ background: "none", border: 0, color: "#f2f0ec", font: "inherit", cursor: "pointer", textAlign: "left", padding: 0 }} aria-expanded={open}>
          <b>{r.credits} cr.</b><br /><span className={a.muted}>{eur(r.priceCents)}</span>
        </button>
        <span className={a.num}>{eur(r.payCents)}</span>
        <span className={`${a.num} ${a.good}`}>{eur(r.marginCents)}</span>
        <span className={a.bar2}>
          <select className={a.select} style={{ width: 120 }} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Palier imposé">
            <option value="">Palier auto</option>
            <option value="averti">{tierLabels.averti}</option>
            <option value="initie">{tierLabels.initie}</option>
            <option value="rare">{tierLabels.rare}</option>
          </select>
          <input className={`${a.input} ${a.inlineInput}`} placeholder="Prix auto" value={credits} onChange={(e) => setCredits(e.target.value.replace(/\D/g, ""))} aria-label="Prix fixé en crédits" />
          {dirty && (
            <button type="button" className={a.btn} disabled={pending} onClick={() => start(async () => {
              const r2 = await setProfilePricing(r.id, (tier || null) as Tier | null, credits ? Number(credits) : null);
              setNote("error" in r2 ? r2.error ?? "Erreur" : null);
              router.refresh();
            })}>OK</button>
          )}
        </span>
      </div>
      {open && (
        <div className={a.row} style={{ gridTemplateColumns: "1fr auto", background: "#141311" }}>
          <span className={a.muted} style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            <b style={{ color: "#d9d6d0" }}>Palier :</b> {r.tierReason}<br />
            {r.why.length ? r.why.join(" · ") : "Aucun coefficient : prix de base du palier."}
            {note && <><br /><span className={a.warn}>{note}</span></>}
          </span>
          <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={pending} onClick={() => start(async () => { await rerunGhostFile(r.id); setNote("Analyse relancée : résultat dans une à deux minutes."); })}>
            Relancer l&apos;analyse IA
          </button>
        </div>
      )}
    </>
  );
}

/** Tous les profils, du plus cher au moins cher, avec la main sur le palier et le prix. */
export default function ProfilesPricing({ rows, tierLabels }: { rows: Row[]; tierLabels: Record<Tier, string> }) {
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input className={a.input} style={{ maxWidth: 280 }} placeholder="Chercher un profil…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher un profil" />
      <div className={a.tableWrap}>
        <div className={`${a.card} ${a.rows}`} style={{ minWidth: 900 }}>
          <div className={`${a.row} ${a.rowHead}`} style={{ gridTemplateColumns: "minmax(0,1.5fr) 150px 70px 90px 90px 90px minmax(0,1.6fr)" }}>
            <span>Profil</span><span>Palier</span><span>Certif.</span><span>Prix</span><span>Reversé</span><span>Marge</span><span>Réglage manuel</span>
          </div>
          {shown.map((r) => <Line key={r.id} r={r} tierLabels={tierLabels} />)}
          {shown.length === 0 && <div className={a.row}><span className={a.muted}>Aucun profil.</span></div>}
        </div>
      </div>
    </div>
  );
}
