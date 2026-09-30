"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finishDemo, startDemo } from "@/app/actions/demoSessions";
import LoupeLoading from "@/components/brand/LoupeLoading";
import a from "../admin.module.css";

const IDEAS = ["Lacoste", "Sézane", "Sephora", "Maison Kitsuné", "Ami Paris"];

export default function DemoLauncher() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [step, setStep] = useState<"idle" | "brief" | "synthesis">("idle");
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setError(null);
    setStep("brief");
    const r = await startDemo({ brandName: brand, topic, lang });
    if ("error" in r) { setError(r.error); setStep("idle"); router.refresh(); return; }
    setStep("synthesis");
    const f = await finishDemo(r.id);
    setStep("idle");
    router.refresh();
    if ("error" in f) { setError(`${f.error} Le brief et les profils sont prêts : vous pouvez déjà présenter.`); return; }
    router.push(`/demo/${r.id}`);
  }

  const busy = step !== "idle";
  return (
    <div className={a.card} style={{ padding: 20, display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) auto", gap: 12, alignItems: "end" }}>
        <div className={a.field}>
          <label htmlFor="demo-brand">Marque</label>
          <input id="demo-brand" className={a.input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Lacoste" disabled={busy} />
        </div>
        <div className={a.field}>
          <label htmlFor="demo-topic">Sujet de l&apos;étude (facultatif)</label>
          <input id="demo-topic" className={a.input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Choisi par Claude si vide, ex. une ligne tennis premium pour la Gen Z" disabled={busy} />
        </div>
        <div className={a.field}>
          <label htmlFor="demo-lang">Langue</label>
          <select id="demo-lang" className={a.select} value={lang} onChange={(e) => setLang(e.target.value as "fr" | "en")} disabled={busy}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <small className={a.muted} style={{ fontSize: 11.5 }}>{IDEAS.map((i) => <button key={i} type="button" onClick={() => setBrand(i)} disabled={busy} style={{ font: "inherit", background: "none", border: 0, color: "#a58bf5", cursor: "pointer", padding: "0 10px 0 0" }}>{i}</button>)}</small>
      <div className={a.bar2}>
        <button type="button" className={a.btn} onClick={launch} disabled={busy || brand.trim().length < 2}>{busy ? "Préparation en cours…" : "Lancer la démo"}</button>
        <span className={a.muted} style={{ fontSize: 12 }}>Environ 3 minutes. Rien ne touche aux vraies études ni au panel.</span>
      </div>
      {step === "brief" && <LoupeLoading tone="dark" compact lines={["Claude écrit le brief de la marque…", "Notre lecteur de brief le lit…", "Il cherche huit profils très précis…"]} />}
      {step === "synthesis" && <LoupeLoading tone="dark" compact lines={["Brief et profils prêts.", "Quatre entretiens simulés…", "La synthèse s'écrit…", "Chaque citation est vérifiée…"]} />}
      {error && <p className={`${a.msg} ${a.warn}`} style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
