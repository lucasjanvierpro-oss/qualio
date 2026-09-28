"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/guards";
import { labDigest, runSimulation } from "@/lib/lab/simulate";

// Laboratoire (admin) : lancer une marque simulée, ou synthétiser les leçons.

export async function runLab(theme: string): Promise<{ id: string } | { error: string }> {
  await assertAdmin();
  const r = await runSimulation(theme.slice(0, 120));
  revalidatePath("/admin/labo");
  return r;
}

export async function digestLab(): Promise<{ text: string } | { error: string }> {
  await assertAdmin();
  try {
    return { text: await labDigest() };
  } catch (e) {
    console.error("[lab digest]", e);
    return { error: "La synthèse a échoué. Réessayez." };
  }
}
