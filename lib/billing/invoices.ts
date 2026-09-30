import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

// Factures des achats de crédits (micro-entreprise, franchise en base de TVA).
// L'émetteur est réglé dans Admin → Factures. Tant que le SIRET n'y est pas,
// les factures restent en brouillon, sans numéro : elles sont numérotées dans
// l'ordre (RL-AAAA-0001) au moment où elles sont émises.

export type Issuer = {
  name: string;           // Prénom Nom
  tradeName: string;      // Nom commercial
  legalForm: string;      // « Entrepreneur individuel (EI) »
  address: string;        // Adresse complète (plusieurs lignes)
  siret: string;
  ape?: string;
  email: string;
  vatMention: string;     // Franchise en base
};

export const DEFAULT_ISSUER: Issuer = {
  name: "Lucas Janvier",
  tradeName: "Rarelyst",
  legalForm: "Entrepreneur individuel (EI)",
  address: "",
  siret: "",
  ape: "",
  email: "contact@rarelyst.co",
  vatMention: "TVA non applicable, art. 293 B du CGI",
};

export type InvoiceLine = { label: string; quantity: number; unitCents: number; totalCents: number };
export type Customer = { name: string; legalName?: string | null; siren?: string | null; address?: string | null; email?: string | null; contact?: string | null };

const ISSUER_KEY = "billing.issuer";

export async function getIssuer(): Promise<Issuer> {
  const row = await prisma.appSetting.findUnique({ where: { key: ISSUER_KEY } }).catch(() => null);
  return { ...DEFAULT_ISSUER, ...((row?.value ?? {}) as Partial<Issuer>) };
}

export async function saveIssuer(v: Issuer) {
  await prisma.appSetting.upsert({
    where: { key: ISSUER_KEY },
    create: { key: ISSUER_KEY, value: v as unknown as Prisma.InputJsonValue },
    update: { value: v as unknown as Prisma.InputJsonValue },
  });
}

/** L'émetteur est-il complet (SIRET et adresse) ? Sans ça, pas de facture émise. */
export const issuerReady = (i: Issuer) => /^\d{14}$/.test(i.siret.replace(/\s/g, "")) && i.address.trim().length > 8;

/** Crée la facture d'un achat de crédits (une seule par session Stripe), et l'émet si possible. */
export async function invoiceForCheckout(input: {
  brandProfileId: string; stripeSessionId: string; packLabel: string; credits: number; amountCents: number;
  paidAt: Date; billing?: { name?: string | null; address?: string | null; email?: string | null } | null;
}) {
  const exists = await prisma.invoice.findUnique({ where: { stripeSessionId: input.stripeSessionId }, select: { id: true } });
  if (exists) return exists.id;
  const brand = await prisma.brandProfile.findUnique({
    where: { id: input.brandProfileId },
    select: { companyName: true, legalName: true, siren: true, contactFirstName: true, contactLastName: true, user: { select: { email: true } } },
  });
  if (!brand) return null;
  const customer: Customer = {
    name: input.billing?.name || brand.legalName || brand.companyName,
    legalName: brand.legalName,
    siren: brand.siren,
    address: input.billing?.address ?? null,
    email: input.billing?.email || brand.user.email,
    contact: [brand.contactFirstName, brand.contactLastName].filter(Boolean).join(" ") || null,
  };
  const lines: InvoiceLine[] = [{
    label: `Pack ${input.packLabel} · ${input.credits} crédits Rarelyst (recrutement de participants et organisation d'entretiens pour études qualitatives)`,
    quantity: 1, unitCents: input.amountCents, totalCents: input.amountCents,
  }];
  const inv = await prisma.invoice.create({
    data: {
      brandProfileId: input.brandProfileId, stripeSessionId: input.stripeSessionId, status: "draft",
      amountCents: input.amountCents, vatCents: 0, totalCents: input.amountCents,
      lines: lines as unknown as Prisma.InputJsonValue, customer: customer as unknown as Prisma.InputJsonValue, paidAt: input.paidAt,
    },
  });
  await issueInvoice(inv.id).catch((e) => console.error("[facture]", e));
  return inv.id;
}

/** Émet une facture en brouillon : fige l'émetteur et attribue le numéro suivant. */
export async function issueInvoice(id: string): Promise<{ number: string } | { error: string }> {
  const issuer = await getIssuer();
  if (!issuerReady(issuer)) return { error: "Complétez le SIRET et l'adresse de l'émetteur (Admin → Factures)." };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.findUnique({ where: { id } });
        if (!inv) throw new Error("introuvable");
        if (inv.status === "issued" && inv.number) return { number: inv.number };
        const year = new Date().getFullYear();
        const count = await tx.invoice.count({ where: { number: { startsWith: `RL-${year}-` } } });
        const number = `RL-${year}-${String(count + 1).padStart(4, "0")}`;
        await tx.invoice.update({ where: { id }, data: { number, status: "issued", issuedAt: new Date(), issuer: issuer as unknown as Prisma.InputJsonValue } });
        return { number };
      });
    } catch (e) {
      // Deux émissions simultanées : le numéro est unique, on recommence.
      if (attempt === 3) return { error: e instanceof Error ? e.message : "échec" };
    }
  }
  return { error: "échec" };
}

/** Émet toutes les factures en brouillon (après avoir renseigné le SIRET). */
export async function issueDrafts() {
  const drafts = await prisma.invoice.findMany({ where: { status: "draft" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  let issued = 0;
  for (const d of drafts) if ("number" in (await issueInvoice(d.id))) issued++;
  return { issued, total: drafts.length };
}

export const eurFmt = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
