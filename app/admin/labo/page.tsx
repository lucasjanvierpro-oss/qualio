import { prisma } from "@/lib/prisma";
import { demandOverview } from "@/lib/lab/demand";
import type { LabBrand, LabReview } from "@/lib/lab/simulate";
import type { BriefDraft } from "@/lib/studies/briefTypes";
import LabControls from "./LabControls";
import a from "../admin.module.css";
import l from "./labo.module.css";

export const dynamic = "force-dynamic";

const CATEGORY: Record<string, string> = { pro: "Métier", consumer: "Client", creator: "Créateur", expert: "Expert" };
const fmt = (iso: Date | string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/**
 * Le laboratoire : des marques inventées testent Rarelyst tous les jours, et
 * la demande apprise montre quels profils les marques réclament face à ce que
 * le panel contient.
 */
export default async function LabPage() {
  const [runs, demand] = await Promise.all([
    prisma.labRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    demandOverview().catch(() => []),
  ]);
  const done = runs.filter((r) => r.status === "done");
  const reviews = done.map((r) => r.review as unknown as LabReview);
  const buy = { oui: 0, "peut-être": 0, non: 0 } as Record<string, number>;
  for (const v of reviews) buy[v.wouldBuy] = (buy[v.wouldBuy] ?? 0) + 1;
  const understood = reviews.filter((v) => v.understood === "oui").length;

  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Laboratoire</p>
      <h1 className={a.h1}>Des marques inventées testent Rarelyst</h1>
      <p className={a.sub}>
        Claude invente une marque avec ses vrais problèmes, écrit son brief comme elle l&apos;écrirait, le soumet au lecteur de brief, puis réagit :
        ce qui est mal compris, ce qui manque, ce qu&apos;elle paierait. Une simulation tourne chaque matin ; vous pouvez en lancer quand vous voulez.
      </p>

      <LabControls />

      <div className={`${a.kpis} ${a.section}`}>
        <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{done.length}</div><div className={a.kpiLabel}>Marques simulées</div><div className={a.kpiNote}>sur les 20 dernières</div></div>
        <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{buy.oui}<small>/ {done.length}</small></div><div className={a.kpiLabel}>Achèteraient</div><div className={a.kpiNote}>{buy["peut-être"]} peut-être · {buy.non} non</div></div>
        <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{understood}<small>/ {done.length}</small></div><div className={a.kpiLabel}>Brief bien compris</div><div className={a.kpiNote}>par le lecteur automatique</div></div>
        <div className={`${a.card} ${a.kpi}`}><div className={a.kpiValue}>{demand.length}</div><div className={a.kpiLabel}>Types de profils appris</div><div className={a.kpiNote}>{demand.filter((d) => d.isNew).length} nouveaux en 14 jours</div></div>
      </div>

      <section className={a.section}>
        <div className={a.sectionHead}>
          <h2 className={a.h2}>Ce que les marques demandent, face au panel</h2>
          <span className={a.muted} style={{ fontSize: 12 }}>vraies marques ×3, simulées ×1</span>
        </div>
        <div className={`${a.card} ${a.tableWrap}`}>
          <div className={`${l.drow} ${a.rowHead}`}><span>Type de profil</span><span>Vraies</span><span>Simulées</span><span>Panel</span><span>État</span></div>
          {demand.length === 0 && <div className={l.drow}><span className={a.muted}>Rien encore : lancez une simulation ou attendez le premier brief.</span></div>}
          {demand.slice(0, 40).map((d) => (
            <div key={d.canonical} className={l.drow}>
              <span className={a.rowMain}>{d.canonical}<small>{CATEGORY[d.category] ?? d.category} · {d.labels.slice(0, 2).join(" · ")}</small></span>
              <span className={a.num}>{d.real}</span>
              <span className={a.num}>{d.simulated}</span>
              <span className={`${a.num} ${d.panel === 0 ? a.warn : ""}`}>{d.panel}</span>
              <span>
                {d.isNew && <span className={a.pill} data-t="initie">nouveau</span>}{" "}
                {d.panel === 0 ? <span className={a.pill} data-t="rare">à recruter</span> : d.panel < 3 ? <span className={a.pill}>rare</span> : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Les dernières simulations</h2></div>
        <div className={l.runs}>
          {runs.length === 0 && <p className={a.muted}>Aucune simulation pour l&apos;instant.</p>}
          {runs.map((r) => {
            const b = r.brand as unknown as LabBrand;
            if (r.status !== "done") {
              return (
                <div key={r.id} className={`${a.card} ${l.run}`}>
                  <div className={l.runHead}><b>{b?.name ?? "Marque"}</b><span className={a.warn}>échec · {fmt(r.createdAt)}</span></div>
                  <p className={a.muted} style={{ margin: 0, fontSize: 12.5 }}>{r.error}</p>
                </div>
              );
            }
            const v = r.review as unknown as LabReview;
            const d = r.draft as unknown as BriefDraft;
            return (
              <details key={r.id} className={`${a.card} ${l.run}`}>
                <summary className={l.runHead}>
                  <span>
                    <b>{b.name}</b> <span className={a.muted}>· {b.sector} · {b.persona?.role}</span>
                    <small>{b.tension}</small>
                  </span>
                  <span className={l.verdict} data-v={v.wouldBuy}>{v.wouldBuy === "oui" ? "Achèterait" : v.wouldBuy === "non" ? "N'achèterait pas" : "Peut-être"}</span>
                </summary>
                <div className={l.body}>
                  <p className={l.quote}>« {v.quote} »</p>
                  <div className={l.cols}>
                    <div>
                      <h3>La marque</h3>
                      <p>{b.positioning} · {b.priceRange} · {b.markets?.join(", ")}</p>
                      <p><b>Décision à prendre :</b> {b.decision}</p>
                      <p><b>Ce qu&apos;elle redoute :</b> {b.persona?.fears}</p>
                      <h3>Son brief</h3>
                      <p className={l.brief}>{r.brief}</p>
                    </div>
                    <div>
                      <h3>Ce que notre lecteur a compris <span className={l.tag} data-v={v.understood}>{v.understood}</span></h3>
                      <p>{d?.profiles?.map((p) => `${p.count} ${p.label}`).join(" · ")}</p>
                      {v.misread?.length > 0 && <><h4>Mal lu ou oublié</h4><ul>{v.misread.map((x) => <li key={x}>{x}</li>)}</ul></>}
                      {v.missingQuestions?.length > 0 && <><h4>Questions qu&apos;il aurait fallu poser</h4><ul>{v.missingQuestions.map((x) => <li key={x}>{x}</li>)}</ul></>}
                      <h4>Prix</h4><p>{v.priceReaction}</p>
                      {v.objections?.length > 0 && <><h4>Objections</h4><ul>{v.objections.map((x) => <li key={x}>{x}</li>)}</ul></>}
                    </div>
                  </div>
                  <div className={l.cols}>
                    <div>
                      <h3>L&apos;échange avec un commercial</h3>
                      <div className={l.dialogue}>
                        {v.dialogue?.map((m, i) => <p key={i} data-who={m.who}><b>{m.who === "marque" ? b.persona?.role ?? "Marque" : "Rarelyst"}</b>{m.text}</p>)}
                      </div>
                      {v.unanswered?.length > 0 && <><h4>Restées sans réponse</h4><ul>{v.unanswered.map((x) => <li key={x}>{x}</li>)}</ul></>}
                    </div>
                    <div>
                      <h3>Leçons pour Rarelyst</h3>
                      {v.unmetNeeds?.length > 0 && <><h4>Besoins non couverts</h4><ul>{v.unmetNeeds.map((n) => <li key={n.need}><b>{n.need}</b> — {n.why} <span className={a.muted}>({n.frequency})</span></li>)}</ul></>}
                      {v.productIdeas?.length > 0 && <><h4>Idées produit</h4><ul>{v.productIdeas.map((n) => <li key={n.idea}>{n.idea} <span className={a.muted}>({n.impact})</span></li>)}</ul></>}
                      {v.hardProfiles?.length > 0 && <><h4>Profils difficiles</h4><ul>{v.hardProfiles.map((n) => <li key={n.profile}><b>{n.profile}</b> — {n.why}</li>)}</ul></>}
                      {v.unknowns?.length > 0 && <><h4>Ce que nous ne savons pas encore</h4><ul>{v.unknowns.map((x) => <li key={x}>{x}</li>)}</ul></>}
                    </div>
                  </div>
                  <p className={a.muted} style={{ fontSize: 11.5, margin: "8px 0 0" }}>Terrain : {r.theme} · {fmt(r.createdAt)}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
