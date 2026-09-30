"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

// Participant → Paramètres → Informations fiscales.
export async function saveTaxInfo(v: { addressLine: string; postalCode: string; city: string; taxCountry: string; taxId: string; dateOfBirth: string }): Promise<{ ok: true } | { error: string }> {
  const me = await getSessionUser();
  if (!me?.participantProfileId) return { error: "Session expirée." };
  const clean = (s: string, n: number) => s.trim().slice(0, n);
  const dob = v.dateOfBirth ? new Date(v.dateOfBirth) : null;
  if (dob && (Number.isNaN(dob.getTime()) || dob.getFullYear() < 1900 || dob > new Date())) return { error: "Date de naissance invalide." };
  const taxId = clean(v.taxId, 30).replace(/\s/g, "");
  const country = clean(v.taxCountry, 2).toUpperCase() || "FR";
  if (country === "FR" && taxId && !/^[0-3]\d{12}$/.test(taxId)) return { error: "En France, le numéro fiscal compte 13 chiffres (il figure sur votre avis d'impôt)." };
  await prisma.participantProfile.update({
    where: { id: me.participantProfileId },
    data: {
      addressLine: clean(v.addressLine, 200) || null, postalCode: clean(v.postalCode, 12) || null, city: clean(v.city, 80) || null,
      taxCountry: country, taxId: taxId || null, ...(dob ? { dateOfBirth: dob } : {}), taxInfoUpdatedAt: new Date(),
    },
  });
  revalidatePath("/participant/settings");
  return { ok: true };
}
