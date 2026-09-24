"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAdminPricing } from "@/app/actions/admin";
import { DEFAULT_PRICING, TIERS, type PricingConfig } from "@/lib/pricing/config";
import { quote } from "@/lib/pricing/engine";
import a from "../admin.module.css";

const eur = (cents: number) => `${(cents / 100).toLocaleString("fr-FR")} €`;

/** Les réglages du moteur, avec l'effet immédiat sur un profil type. */
export default function PricingForm({ initial }: { initial: PricingConfig }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<PricingConfig>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (fn: (c: PricingConfig) => PricingConfig) => { setMsg(null); setCfg((c) => fn(structuredClone(c))); };
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));

  const save = () => start(async () => {
    const r = await saveAdminPricing(cfg);
    setMsg("error" in r ? { ok: false, text: r.error ?? "Erreur" } : { ok: true, text: "Enregistré. Les nouveaux prix s'appliquent aux profils proposés à partir de maintenant." });
    router.refresh();
  });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className={a.grid}>
        {TIERS.map((t) => {
          const tier = cfg.tiers[t];
          const typical = quote(cfg, { tier: t, durationMin: 45, focusGroup: false, certScore: 50, ratings: [], signals: { brandsAccepted90d: 0, shortlisted90d: 0, peers: 30, panelSize: 0 }, overrideCredits: null });
          const top = quote(cfg, { tier: t, durationMin: 45, focusGroup: false, certScore: 100, ratings: [5, 5], signals: { brandsAccepted90d: 3, shortlisted90d: 4, peers: 2, panelSize: 1000 }, overrideCredits: null });
          return (
            <div key={t} className={`${a.card} ${a.tierCard}`}>
              <h3>{tier.label}</h3>
              <div className={a.field}><label htmlFor={`b-${t}`}>Prix de base (crédits, 45 min)</label>
                <input id={`b-${t}`} className={a.input} inputMode="numeric" value={tier.baseCredits}
                  onChange={(e) => set((c) => { c.tiers[t].baseCredits = num(e.target.value); return c; })} /></div>
              <div className={a.field} style={{ marginTop: 8 }}><label htmlFor={`p-${t}`}>Rémunération de base (€)</label>
                <input id={`p-${t}`} className={a.input} inputMode="decimal" value={tier.participantPayCents / 100}
                  onChange={(e) => set((c) => { c.tiers[t].participantPayCents = Math.round(num(e.target.value) * 100); return c; })} /></div>
              <div className={a.tierMeta}>
                Profil type : {typical.credits} cr. = {eur(typical.priceCents)}, reversé {eur(typical.participantPayCents)}, marge {eur(typical.marginCents)}.<br />
                Profil très demandé et certifié : {top.credits} cr. = {eur(top.priceCents)}, reversé {eur(top.participantPayCents)}.
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${a.card} ${a.tierCard}`}>
        <h3>Coefficients</h3>
        <div className={a.grid}>
          <div className={a.field}><label htmlFor="cv">Valeur d&apos;un crédit (€ HT)</label>
            <input id="cv" className={a.input} value={cfg.creditValueCents / 100} onChange={(e) => set((c) => { c.creditValueCents = Math.round(num(e.target.value) * 100); return c; })} /></div>
          <div className={a.field}><label htmlFor="fg">Focus group (× par participant)</label>
            <input id="fg" className={a.input} value={cfg.focusGroupFactor} onChange={(e) => set((c) => { c.focusGroupFactor = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="db">Demande : + par marque ayant retenu le profil</label>
            <input id="db" className={a.input} value={cfg.demand.perBrand} onChange={(e) => set((c) => { c.demand.perBrand = num(e.target.value); return c; })} /><small>0,05 = +5 %</small></div>
          <div className={a.field}><label htmlFor="ds">Demande : + par présélection</label>
            <input id="ds" className={a.input} value={cfg.demand.perShortlist} onChange={(e) => set((c) => { c.demand.perShortlist = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="dm">Demande : bonus maximum</label>
            <input id="dm" className={a.input} value={cfg.demand.max} onChange={(e) => set((c) => { c.demand.max = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="cb">Certification à 100 % : bonus</label>
            <input id="cb" className={a.input} value={cfg.certificationMaxBonus} onChange={(e) => set((c) => { c.certificationMaxBonus = num(e.target.value); return c; })} /><small>0,25 = +25 %</small></div>
          <div className={a.field}><label htmlFor="rg">Avis ≥ {cfg.reputation.goodAvg}/5 : coefficient</label>
            <input id="rg" className={a.input} value={cfg.reputation.goodFactor} onChange={(e) => set((c) => { c.reputation.goodFactor = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="rb">Avis &lt; {cfg.reputation.badAvg}/5 : coefficient</label>
            <input id="rb" className={a.input} value={cfg.reputation.badFactor} onChange={(e) => set((c) => { c.reputation.badFactor = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="bmin">Coefficient total : minimum</label>
            <input id="bmin" className={a.input} value={cfg.bounds.min} onChange={(e) => set((c) => { c.bounds.min = num(e.target.value); return c; })} /></div>
          <div className={a.field}><label htmlFor="bmax">Coefficient total : maximum</label>
            <input id="bmax" className={a.input} value={cfg.bounds.max} onChange={(e) => set((c) => { c.bounds.max = num(e.target.value); return c; })} /></div>
        </div>
        <div className={a.grid} style={{ marginTop: 12 }}>
          {cfg.duration.map((d, i) => (
            <div key={i} className={a.field}><label htmlFor={`du-${i}`}>Durée jusqu&apos;à {d.upTo >= 999 ? "plus" : `${d.upTo} min`} : ×</label>
              <input id={`du-${i}`} className={a.input} value={d.factor} onChange={(e) => set((c) => { c.duration[i].factor = num(e.target.value); return c; })} /></div>
          ))}
          <div className={a.field}><label htmlFor="smp">Rareté active à partir de (profils dans le panel)</label>
            <input id="smp" className={a.input} value={cfg.scarcityMinPanel} onChange={(e) => set((c) => { c.scarcityMinPanel = num(e.target.value); return c; })} /></div>
          {cfg.scarcity.map((sc, i) => (
            <div key={`s${i}`} className={a.field}><label htmlFor={`sc-${i}`}>Rareté : {sc.minPeers}+ profils comparables ×</label>
              <input id={`sc-${i}`} className={a.input} value={sc.factor} onChange={(e) => set((c) => { c.scarcity[i].factor = num(e.target.value); return c; })} /></div>
          ))}
        </div>
      </div>

      <div className={`${a.card} ${a.tierCard}`}>
        <h3>Packs de crédits</h3>
        <div className={a.grid}>
          {cfg.packs.map((p, i) => (
            <div key={p.id} className={a.field}>
              <label htmlFor={`pk-${i}`}>{p.label} : crédits · prix (€ HT)</label>
              <div className={a.bar2}>
                <input id={`pk-${i}`} className={a.input} style={{ width: 90 }} value={p.credits} onChange={(e) => set((c) => { c.packs[i].credits = num(e.target.value); return c; })} />
                <input aria-label={`Prix du pack ${p.label}`} className={a.input} style={{ width: 110 }} value={p.priceCents / 100} onChange={(e) => set((c) => { c.packs[i].priceCents = Math.round(num(e.target.value) * 100); return c; })} />
              </div>
              <small>{p.credits ? `${(p.priceCents / p.credits / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} € le crédit` : ""}</small>
            </div>
          ))}
        </div>
      </div>

      <div className={a.bar2}>
        <button type="button" className={a.btn} disabled={pending} onClick={save}>{pending ? "Enregistrement…" : "Enregistrer les réglages"}</button>
        <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={pending} onClick={() => set(() => structuredClone(DEFAULT_PRICING))}>Revenir aux valeurs recommandées</button>
        {msg && <span className={`${a.msg} ${msg.ok ? a.good : a.warn}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
