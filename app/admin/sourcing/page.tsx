import { prisma } from "@/lib/prisma";
import { SEARCHES, PROFILE_TYPES, STATUSES, type Status } from "@/lib/sourcing/sourcing";
import SourcingClient from "./SourcingClient";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

/** Admin → Sourcing : chercher des profils rares, les noter, suivre les messages. */
export default async function SourcingPage() {
  const contacts = await prisma.sourcingContact.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const count = (s: Status) => contacts.filter((c) => c.status === s).length;
  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Sourcing</p>
      <h1 className={a.h1}>Profils à contacter</h1>
      <p className={a.sub}>
        Ouvre une recherche, repère les bonnes personnes, ajoute-les ici avec la raison de les contacter. Le premier message se prépare tout seul,
        à son prénom ; tu l&apos;envoies toi-même. Objectif : 20 messages par jour.
      </p>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Où chercher</h2><span className={a.muted} style={{ fontSize: 12 }}>S&apos;ouvre dans ton compte LinkedIn ou Instagram</span></div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {SEARCHES.map((g) => (
            <div key={g.label} className={a.card} style={{ padding: 16, display: "grid", gap: 8, alignContent: "start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <strong style={{ fontSize: 13.5 }}>{g.label}</strong>
                <span className={a.pill} data-t={g.type === "rare" ? "rare" : g.type === "initie" ? "initie" : undefined}>{PROFILE_TYPES[g.type].label}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {g.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={`${a.btn} ${a.btnGhost}`} style={{ fontSize: 12, padding: "5px 10px", textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={a.section}>
        <div className={a.sectionHead}>
          <h2 className={a.h2}>La liste</h2>
          <span className={a.muted} style={{ fontSize: 12 }}>
            {contacts.length} personnes · {count("a_contacter")} à contacter · {count("contacte") + count("accepte")} en attente · {count("repondu")} réponses · {count("inscrit")} inscrites
          </span>
        </div>
        <SourcingClient
          contacts={contacts.map((c) => ({
            id: c.id, name: c.name, url: c.url, platform: c.platform, profileType: c.profileType, role: c.role, why: c.why,
            status: c.status, notes: c.notes, lastContactAt: c.lastContactAt?.toISOString() ?? null,
          }))}
          statuses={STATUSES}
        />
      </section>
    </div>
  );
}
