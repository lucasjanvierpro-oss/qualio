import Link from "next/link";
import { eurFmt } from "@/lib/billing/invoices";

// Liste des factures d'une marque (compte → crédits).
export default function InvoiceList({ invoices, hrefBase }: { invoices: { id: string; number: string | null; status: string; totalCents: number; createdAt: Date }[]; hrefBase: string }) {
  if (!invoices.length) return null;
  const d = (x: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(x);
  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px 48px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 12px" }}>Factures</h2>
      <div style={{ border: "1px solid var(--color-border-base, #eae6ee)", borderRadius: 12, overflow: "hidden", background: "var(--color-surface, #fff)" }}>
        {invoices.map((inv, i) => (
          <Link key={inv.id} href={`${hrefBase}/${inv.id}`} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderTop: i ? "1px solid var(--color-border-base, #eae6ee)" : undefined, textDecoration: "none", color: "inherit", fontSize: 14 }}>
            <strong style={{ minWidth: 120 }}>{inv.number ?? "En préparation"}</strong>
            <span style={{ color: "var(--color-text-secondary, #5f5868)" }}>{d(inv.createdAt)}</span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>{eurFmt(inv.totalCents)}</span>
            <span style={{ color: "var(--color-accent, #6a43db)", fontWeight: 600 }}>Voir →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
