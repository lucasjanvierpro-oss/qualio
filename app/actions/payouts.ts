"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, getSessionUser } from "@/lib/auth/guards";
import { cancelPayout, listPayouts, markPayoutManual, requestPayout, sendPayout } from "@/lib/payouts/payouts";

// Retraits : le participant vide son solde ; l'admin relance, solde à la main
// ou annule un retrait bloqué.

export async function withdraw() {
  const u = await getSessionUser();
  if (!u?.participantProfileId) return { error: "Connectez-vous pour retirer vos gains." };
  const r = await requestPayout(u.participantProfileId);
  revalidatePath("/participant/wallet");
  return r;
}

export async function adminListPayouts() {
  await assertAdmin();
  return listPayouts();
}

export async function adminPayoutAction(id: string, action: "retry" | "manual" | "cancel") {
  await assertAdmin();
  const r = action === "retry" ? await sendPayout(id, { force: true })
    : action === "manual" ? await markPayoutManual(id)
    : await cancelPayout(id);
  revalidatePath("/admin/payments");
  return r;
}
