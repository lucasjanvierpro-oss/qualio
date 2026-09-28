"use server";

import { cookies } from "next/headers";
import { REFERRAL_COOKIE, normalizeCode, referrerByCode } from "@/lib/referral/referral";
import { getPricingConfig } from "@/lib/pricing/quotes";

// Arrivée par un lien d'invitation (?parrain=CODE) : retient le code comme le
// ferait /r/CODE, et renvoie de quoi afficher « Camille vous invite ».
export async function acceptInvite(code: string): Promise<{ firstName: string; welcomeCents: number } | null> {
  const referrer = await referrerByCode(code).catch(() => null);
  if (!referrer) return null;
  const jar = await cookies();
  jar.set(REFERRAL_COOKIE, normalizeCode(code), { maxAge: 30 * 24 * 3600, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  const cfg = await getPricingConfig();
  return { firstName: referrer.firstName || "Un membre", welcomeCents: cfg.referral.welcomeCents };
}
