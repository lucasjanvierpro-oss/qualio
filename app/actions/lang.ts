"use server";

import { getSessionUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

/** Retient la langue choisie : elle sert aussi aux emails envoyés à la personne. */
export async function saveMyLanguage(lang: "fr" | "en") {
  if (lang !== "fr" && lang !== "en") return;
  const me = await getSessionUser();
  if (me?.participantProfileId) await prisma.participantProfile.update({ where: { id: me.participantProfileId }, data: { preferredLanguage: lang } }).catch(() => null);
  if (me?.brandProfileId) await prisma.brandProfile.update({ where: { id: me.brandProfileId }, data: { preferredLanguage: lang } }).catch(() => null);
}
