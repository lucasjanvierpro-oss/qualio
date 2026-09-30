import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { taxExport } from "@/lib/participants/tax";

// Export fiscal annuel (CSV) : les données à déclarer pour chaque participant
// rémunéré (DAC7). Réservé à l'admin.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear() - 1;
  const rows = await taxExport(year);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Prénom", "Nom", "Email", "Date de naissance", "Adresse", "Code postal", "Ville", "Pays", "Pays fiscal", "Numéro fiscal", "Opérations", "Total brut (€)", "T1 (€)", "T2 (€)", "T3 (€)", "T4 (€)", "Informations fiscales complètes"];
  const lines = rows.map((r) => [
    r.firstName, r.lastName, r.user.email, r.dateOfBirth?.toISOString().slice(0, 10) ?? "", r.addressLine ?? "", r.postalCode ?? "", r.city ?? "", r.country ?? "", r.taxCountry ?? "", r.taxId ?? "",
    r.count, (r.totalCents / 100).toFixed(2), ...r.quarters.map((q) => (q / 100).toFixed(2)),
    r.taxId && r.addressLine && r.dateOfBirth ? "oui" : "NON",
  ].map(esc).join(";"));
  const csv = "﻿" + [head.map(esc).join(";"), ...lines].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rarelyst-export-fiscal-${year}.csv"` } });
}
