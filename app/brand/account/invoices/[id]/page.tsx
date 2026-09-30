import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import InvoiceDocument from "@/components/billing/InvoiceDocument";
import PrintButton from "@/components/billing/PrintButton";
import { getIssuer, type Customer, type InvoiceLine, type Issuer } from "@/lib/billing/invoices";
import s from "@/components/billing/invoice.module.css";

export const dynamic = "force-dynamic";

// Une facture de la marque, imprimable en PDF.
export default async function BrandInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me?.brandProfileId) redirect("/login");
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv || inv.brandProfileId !== me.brandProfileId) notFound();
  const issuer = (inv.issuer as Issuer | null) ?? (await getIssuer());
  return (
    <div style={{ padding: "32px 16px 64px" }}>
      <div className={s.actions}>{inv.status === "issued" && <PrintButton />}</div>
      <InvoiceDocument number={inv.number} status={inv.status} issuedAt={inv.issuedAt?.toISOString() ?? null} paidAt={inv.paidAt?.toISOString() ?? null}
        issuer={issuer} customer={inv.customer as unknown as Customer} lines={inv.lines as unknown as InvoiceLine[]} amountCents={inv.amountCents} totalCents={inv.totalCents} />
      {inv.status !== "issued" && <p style={{ maxWidth: 800, margin: "16px auto 0", fontSize: 14, color: "#5f5868" }}>Votre facture est en préparation : elle sera numérotée et téléchargeable ici sous peu. Votre achat est bien enregistré.</p>}
    </div>
  );
}
