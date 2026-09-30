import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InvoiceDocument from "@/components/billing/InvoiceDocument";
import PrintButton from "@/components/billing/PrintButton";
import { getIssuer, type Customer, type InvoiceLine, type Issuer } from "@/lib/billing/invoices";
import s from "@/components/billing/invoice.module.css";

export const dynamic = "force-dynamic";

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) notFound();
  const issuer = (inv.issuer as Issuer | null) ?? (await getIssuer());
  return (
    <div style={{ padding: "32px 16px 64px", background: "#f6f4f8", minHeight: "100vh" }}>
      <div className={s.actions}><PrintButton label="Imprimer / PDF" /></div>
      <InvoiceDocument number={inv.number} status={inv.status} issuedAt={inv.issuedAt?.toISOString() ?? null} paidAt={inv.paidAt?.toISOString() ?? null}
        issuer={issuer} customer={inv.customer as unknown as Customer} lines={inv.lines as unknown as InvoiceLine[]} amountCents={inv.amountCents} totalCents={inv.totalCents} />
    </div>
  );
}
