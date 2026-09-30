"use client";

import { useState } from "react";
import { saveTaxInfo } from "@/app/actions/tax";
import { useTT } from "@/lib/i18n/client";

type V = { addressLine: string; postalCode: string; city: string; taxCountry: string; taxId: string; dateOfBirth: string };

// Informations demandées par la loi aux plateformes qui rémunèrent des particuliers.
export default function TaxInfoForm({ initial }: { initial: V }) {
  const tt = useTT();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = { padding: "10px 12px", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 14, width: "100%", background: "var(--color-surface)", color: "var(--color-text-primary)" } as const;
  const f = (k: keyof V) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }), style: input });
  async function save() {
    setBusy(true);
    const r = await saveTaxInfo(v);
    setMsg("error" in r ? { ok: false, text: r.error } : { ok: true, text: tt("Enregistré.", "Saved.") });
    setBusy(false);
  }
  const label = { fontSize: 12.5, fontWeight: 600, color: "var(--color-text-secondary)", display: "grid", gap: 5 } as const;
  return (
    <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{tt("Informations fiscales", "Tax information")}</h2>
      <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.55 }}>
        {tt("Comme toute plateforme qui rémunère des particuliers, Rarelyst doit déclarer chaque année vos gains à l'administration fiscale (directive européenne DAC7) et vous en envoyer un relevé avant le 31 janvier. Ces informations ne sont jamais transmises aux marques.", "Like any platform that pays individuals, Rarelyst must report your earnings to the tax authorities each year (EU DAC7 directive) and send you a statement before 31 January. This information is never shared with brands.")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <label style={{ ...label, gridColumn: "1 / -1" }}>{tt("Adresse", "Address")}<input {...f("addressLine")} placeholder="12 rue des Martyrs" /></label>
        <label style={label}>{tt("Code postal", "Postcode")}<input {...f("postalCode")} /></label>
        <label style={label}>{tt("Ville", "City")}<input {...f("city")} /></label>
        <label style={label}>{tt("Pays de résidence fiscale", "Country of tax residence")}<input {...f("taxCountry")} placeholder="FR" maxLength={2} /></label>
        <label style={label}>{tt("Date de naissance", "Date of birth")}<input type="date" {...f("dateOfBirth")} /></label>
        <label style={{ ...label, gridColumn: "1 / -1" }}>{tt("Numéro fiscal (13 chiffres, sur votre avis d'impôt)", "Tax identification number")}<input {...f("taxId")} inputMode="numeric" /></label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button type="button" onClick={save} disabled={busy} style={{ padding: "10px 18px", border: 0, borderRadius: 8, background: "var(--color-accent)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{busy ? "…" : tt("Enregistrer", "Save")}</button>
        {msg && <span style={{ fontSize: 13.5, fontWeight: 600, color: msg.ok ? "var(--color-success)" : "var(--color-error)" }}>{msg.text}</span>}
      </div>
    </section>
  );
}
