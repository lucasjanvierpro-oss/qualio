import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DemoLauncher from "./DemoLauncher";
import DeleteDemo from "./DeleteDemo";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { brief: "Brief en cours", synthesis: "Synthèse en cours", done: "Prête", failed: "Incomplète" };
const fmt = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(d);

/** Admin → Lancer une démo : une présentation prête à montrer à une marque. */
export default async function DemoPage() {
  const demos = await prisma.demoSession.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { id: true, brandName: true, topic: true, lang: true, status: true, createdAt: true, data: true } });
  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Démo</p>
      <h1 className={a.h1}>Lancer une démo pour une marque</h1>
      <p className={a.sub}>
        Claude écrit le brief que la marque pourrait vous envoyer. Notre lecteur de brief le lit, huit profils très précis sont proposés,
        et une synthèse est tirée de quatre entretiens simulés. Vous présentez ensuite en plein écran, étape par étape (flèches du clavier).
        Profils et entretiens sont des exemples, présentés comme tels.
      </p>
      <div className={a.section}><DemoLauncher /></div>
      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Démos préparées</h2></div>
        <div className={a.card}>
          {demos.length === 0 && <p className={a.muted} style={{ margin: 0, padding: 16, fontSize: 13 }}>Aucune démo pour l&apos;instant.</p>}
          {demos.map((d) => {
            const topic = (d.data as { topic?: string } | null)?.topic ?? d.topic;
            const ready = d.status === "done" || d.status === "synthesis" || (d.status === "failed" && !!(d.data as object | null));
            return (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 14, alignItems: "center", padding: "14px 16px", borderTop: "1px solid #262420" }}>
                <span>
                  <b style={{ color: "#f8f7f4" }}>{d.brandName}</b> <span className={a.muted} style={{ fontSize: 12 }}>· {d.lang.toUpperCase()} · {fmt(d.createdAt)} · {STATUS[d.status] ?? d.status}</span>
                  {topic && <span className={a.muted} style={{ display: "block", fontSize: 12.5, marginTop: 3 }}>{topic}</span>}
                </span>
                {ready ? <Link className={a.btn} href={`/demo/${d.id}`} style={{ textDecoration: "none" }}>Présenter →</Link> : <span />}
                <DeleteDemo id={d.id} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
