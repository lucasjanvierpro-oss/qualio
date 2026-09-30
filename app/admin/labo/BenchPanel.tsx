"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { benchSynthesis } from "@/app/actions/lab";
import LoupeLoading from "@/components/brand/LoupeLoading";
import type { BenchResult } from "@/lib/lab/synthesisBench";
import a from "../admin.module.css";
import l from "./labo.module.css";

type Rep = { question?: string; reponse?: string; appui?: string; confiance?: string };

/** Le banc d'essai de la synthèse pour une marque simulée. */
export default function BenchPanel({ runId, result }: { runId: string; result: BenchResult | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = () => start(async () => {
    setError(null);
    const r = await benchSynthesis(runId);
    if ("error" in r) setError(r.error); else router.refresh();
  });

  const q = result?.quality;
  const c = result?.critique;
  const reponses = (Array.isArray(result?.report.reponses) ? result!.report.reponses : []) as Rep[];
  return (
    <div className={l.bench}>
      <div className={l.benchHead}>
        <h3>Banc d&apos;essai de la synthèse</h3>
        <button type="button" className={`${a.btn} ${result ? a.btnGhost : ""}`} onClick={run} disabled={pending}>
          {pending ? "En cours (2 à 3 min)…" : result ? "Relancer" : "Tester la synthèse"}
        </button>
      </div>
      {pending && <LoupeLoading tone="dark" compact lines={["Quatre participants répondent…", "La synthèse s'écrit…", "Chaque citation est vérifiée…", "La marque relit, sans complaisance…"]} />}
      {error && <p className={a.warn} style={{ margin: 0, fontSize: 13 }}>{error}</p>}
      {!pending && !result && <p className={a.muted} style={{ margin: 0, fontSize: 12.5 }}>Quatre entretiens simulés à partir de ce brief, la synthèse produite par le même moteur que pour les vraies études, puis la note de la marque.</p>}
      {!pending && result && (
        <>
          <div className={l.benchKpis}>
            {c && <span><b>{c.note}/10</b>note de la marque</span>}
            {q && <span><b>{q.citations - q.retirees}/{q.citations}</b>citations prouvées{q.corrigees ? ` · ${q.corrigees} corrigée${q.corrigees > 1 ? "s" : ""}` : ""}</span>}
            {q && <span><b>{q.repondues}/{q.questions}</b>questions tranchées</span>}
          </div>
          {c?.verdict && <p className={l.quote} style={{ fontSize: 14 }}>« {c.verdict} »</p>}
          {typeof result.report.syntheseExecutive === "string" && <p style={{ fontSize: 13, color: "#d9d6d0", margin: "8px 0" }}><b>Synthèse :</b> {result.report.syntheseExecutive}</p>}
          <div className={l.cols}>
            <div>
              <h4>Réponses aux décisions</h4>
              <ul>{reponses.map((r, i) => <li key={i}><b>{r.question}</b> — {r.reponse} <span className={a.muted}>({[r.appui, r.confiance].filter(Boolean).join(" · ")})</span></li>)}</ul>
            </div>
            <div>
              {c?.manque?.length ? <><h4>Ce qui manque à la marque</h4><ul>{c.manque.map((x) => <li key={x}>{x}</li>)}</ul></> : null}
              {c?.generique?.length ? <><h4>Trop générique</h4><ul>{c.generique.map((x) => <li key={x}>{x}</li>)}</ul></> : null}
              {c?.aCorriger?.length ? <><h4>À corriger dans le moteur</h4><ul>{c.aCorriger.map((x) => <li key={x}>{x}</li>)}</ul></> : null}
            </div>
          </div>
          <details style={{ marginTop: 8 }}>
            <summary className={a.muted} style={{ cursor: "pointer", fontSize: 12.5 }}>Lire les {result.interviews.length} entretiens simulés</summary>
            {result.interviews.map((iv, i) => <div key={i} className={l.brief} style={{ marginTop: 8 }}><b>{iv.profil}</b>{"\n"}{iv.transcript}</div>)}
          </details>
        </>
      )}
    </div>
  );
}
