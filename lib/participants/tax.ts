import { prisma } from "@/lib/prisma";

// Obligations fiscales de Rarelyst en tant que plateforme :
//  - informer chaque participant de ses obligations et lui adresser, avant le
//    31 janvier, un relevé du montant brut perçu l'année précédente
//    (art. 242 bis du CGI) ;
//  - déclarer ces montants à l'administration (directive DAC7, art. 1649 ter A
//    et suivants du CGI) : l'export admin fournit les données nécessaires.
// Un gain compte l'année où il est crédité sur le solde.

export type EarningItem = { date: string; kind: "entretien" | "parrainage"; amountCents: number };

export async function yearEarnings(participantProfileId: string, year: number) {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const [rewards, bonuses] = await Promise.all([
    prisma.reward.findMany({
      where: { participantProfileId, type: "CASH", status: { not: "FAILED" }, createdAt: { gte: from, lt: to } },
      select: { createdAt: true, amountCents: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.referralBonus.findMany({
      where: { beneficiaryId: participantProfileId, status: { not: "cancelled" }, createdAt: { gte: from, lt: to } },
      select: { createdAt: true, amountCents: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const items: EarningItem[] = [
    ...rewards.map((r) => ({ date: r.createdAt.toISOString(), kind: "entretien" as const, amountCents: r.amountCents })),
    ...bonuses.map((b) => ({ date: b.createdAt.toISOString(), kind: "parrainage" as const, amountCents: b.amountCents })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return { items, totalCents: items.reduce((n, i) => n + i.amountCents, 0), count: items.length };
}

/** Lignes de l'export fiscal annuel (une par participant ayant perçu quelque chose). */
export async function taxExport(year: number) {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const people = await prisma.participantProfile.findMany({
    where: {
      OR: [
        { rewards: { some: { createdAt: { gte: from, lt: to } } } },
        { referralBonuses: { some: { createdAt: { gte: from, lt: to } } } },
      ],
    },
    select: {
      id: true, firstName: true, lastName: true, dateOfBirth: true, addressLine: true, postalCode: true, city: true, country: true,
      taxId: true, taxCountry: true, user: { select: { email: true } },
    },
  });
  const rows = [];
  for (const p of people) {
    const e = await yearEarnings(p.id, year);
    if (!e.count) continue;
    const quarters = [0, 0, 0, 0];
    for (const it of e.items) quarters[new Date(it.date).getUTCMonth() / 3 | 0] += it.amountCents;
    rows.push({ ...p, totalCents: e.totalCents, count: e.count, quarters });
  }
  return rows;
}
