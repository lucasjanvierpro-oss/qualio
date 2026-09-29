import { prisma } from "@/lib/prisma";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(d);

/** Les demandes de démo laissées sur la page d'accueil, les plus récentes d'abord. */
export default async function DemosPage() {
  const rows = await prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Démos</p>
      <h1 className={a.h1}>Demandes de démo</h1>
      <p className={a.sub}>Laissées depuis la page d&apos;accueil. Chacune vous arrive aussi par email ; la personne reçoit un accusé de réception.</p>
      <div className={`${a.card} ${a.tableWrap} ${a.section}`}>
        <div className={`${a.row} ${a.rowHead}`}><span>Qui</span><span>Maison</span><span>Quand</span><span>Langue</span><span>Reçue</span><span /></div>
        {rows.length === 0 && <div className={a.row}><span className={a.muted}>Aucune demande pour l&apos;instant.</span></div>}
        {rows.map((r) => (
          <div key={r.id} className={a.row}>
            <span className={a.rowMain}>{r.firstName} {r.lastName ?? ""}<small>{r.role ?? r.email}{r.topic ? ` · « ${r.topic} »` : ""}</small></span>
            <span>{r.company}</span>
            <span className={a.muted}>{r.timing ?? "—"}</span>
            <span className={a.muted}>{r.lang === "en" ? "anglais" : "français"}</span>
            <span className={a.muted}>{fmt(r.createdAt)}</span>
            <span><a className={`${a.btn} ${a.btnGhost}`} href={`mailto:${r.email}?subject=${encodeURIComponent(r.lang === "en" ? "Your Rarelyst demo" : "Votre démo Rarelyst")}`}>Écrire</a></span>
          </div>
        ))}
      </div>
    </div>
  );
}
