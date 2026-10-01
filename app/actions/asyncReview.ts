"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/guards";
import { completeInterview, rejectAsyncAnswer } from "@/lib/interviews/complete";

// Admin → Réponses à valider : payer une réponse vidéo en autonomie, ou la refuser.

export async function validateAsyncAnswer(interviewId: string) {
  await assertAdmin();
  await completeInterview(interviewId);
  revalidatePath("/admin/reponses");
  return { ok: true as const };
}

export async function refuseAsyncAnswer(interviewId: string, reason: string) {
  await assertAdmin();
  if (reason.trim().length < 5) return { error: "Écris la raison : elle est envoyée au participant." };
  const r = await rejectAsyncAnswer(interviewId, reason.trim());
  revalidatePath("/admin/reponses");
  return r;
}
