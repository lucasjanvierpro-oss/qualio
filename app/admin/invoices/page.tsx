import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { eurFmt, getIssuer, issuerReady } from "@/lib/billing/invoices";
import IssuerForm from "./IssuerForm";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

/** Admin → Factures : émetteur (micro-entreprise) et factures des achats de crédits. */
export default async function InvoicesPage() {
  const [issuer, invoices] = await Promise.all([
    getIssuer(),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { brandProfile: { select: { companyName: true } } } }),
  ]);
  const drafts = invoices.filter((i) => i.status !== "issued").length;
  const d = (x: Date | null) => (x ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(x) : "—");
  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Factures</p>
      <h1 className={a.h1}>Factures des achats de crédits</h1>
      <p className={a.sub}>
        Une facture est créée à chaque achat de crédits. Tant que le SIRET et l&apos;adresse ne sont pas renseignés, elle reste en brouillon, sans numéro ;
        elle est numérotée dans l&apos;ordre (RL-AAAA-0001) quand elle est émise. Mentions de micro-entreprise en franchise de TVA.
      </p>
      {!issuerReady(issuer) && <p className={`${a.msg} ${a.warn}`} style={{ marginTop: 14 }}>À faire : renseigner le SIRET (après l&apos;ajout de l&apos;activité Rarelyst à ta micro-entreprise) et ton adresse.</p>}
      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Émetteur</h2></div>
        <IssuerForm issuer={issuer} drafts={drafts} />
      </section>
      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>Factures</h2><span className={a.muted} style={{ fontSize: 12 }}>{invoices.length} au total · {drafts} en attente</span></div>
        <div className={`${a.card} ${a.tableWrap}`}>
          {invoices.length === 0 && <p className={a.muted} style={{ margin: 0, padding: 16, fontSize: 13 }}>Aucune facture pour l&apos;instant.</p>}
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/admin/invoices/${inv.id}`} style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr) 110px 110px", gap: 12, padding: "12px 16px", borderTop: "1px solid #262420", textDecoration: "none", color: "#f2f0ec", fontSize: 13, minWidth: 560 }}>
              <strong>{inv.number ?? "Brouillon"}</strong>
              <span>{inv.brandProfile.companyName}</span>
              <span className={a.muted}>{d(inv.issuedAt ?? inv.createdAt)}</span>
              <span style={{ textAlign: "right", fontWeight: 700 }}>{eurFmt(inv.totalCents)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
