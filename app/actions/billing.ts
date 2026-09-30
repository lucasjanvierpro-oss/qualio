"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/guards";
import { issueDrafts, saveIssuer, type Issuer } from "@/lib/billing/invoices";

// Admin → Factures : l'émetteur, et l'émission des brouillons.

export async function saveIssuerAction(v: Issuer): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const siret = v.siret.replace(/\s/g, "");
  if (siret && !/^\d{14}$/.test(siret)) return { error: "Le SIRET compte 14 chiffres." };
  await saveIssuer({ ...v, siret, name: v.name.trim(), address: v.address.trim(), tradeName: v.tradeName.trim() || "Rarelyst" });
  revalidatePath("/admin/invoices");
  return { ok: true };
}

export async function issueDraftsAction() {
  await assertAdmin();
  const r = await issueDrafts();
  revalidatePath("/admin/invoices");
  return r;
}
