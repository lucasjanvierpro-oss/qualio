"use server";

import { createHash, randomInt } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { emailDomain, isProDomain } from "@/lib/brands/certification";
import { sendWorkEmailCode } from "@/lib/resend/emails";
import { generateGhostFile } from "@/lib/participants/ghostFile";

// Les preuves qu'un participant ajoute depuis son profil. Chacune fait monter
// son niveau de certification, donc sa rémunération.

const CODE_TTL_MS = 15 * 60_000;
const RESEND_AFTER_MS = 60_000;

const hash = (profileId: string, code: string) =>
  createHash("sha256").update(`${profileId}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex");

async function me() {
  const u = await getSessionUser();
  return u?.participantProfileId ?? null;
}

/** Envoie un code à l'adresse professionnelle. */
export async function sendWorkCode(rawEmail: string) {
  const profileId = await me();
  if (!profileId) return { error: "Session expirée, reconnectez-vous." };

  const email = rawEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Adresse invalide." };
  if (!isProDomain(emailDomain(email))) {
    return { error: "Il faut une adresse professionnelle (pas Gmail, Outlook, Orange…)." };
  }

  const p = await prisma.participantProfile.findUnique({
    where: { id: profileId },
    select: { firstName: true, workEmailCodeExpiresAt: true },
  });
  if (!p) return { error: "Profil introuvable." };
  // Un code par minute au plus : le formulaire ne doit pas servir à inonder une boîte.
  if (p.workEmailCodeExpiresAt && p.workEmailCodeExpiresAt.getTime() - CODE_TTL_MS + RESEND_AFTER_MS > Date.now()) {
    return { error: "Un code vient de partir. Patientez une minute avant d'en redemander un." };
  }

  const code = String(randomInt(100000, 1000000));
  await prisma.participantProfile.update({
    where: { id: profileId },
    data: {
      workEmail: email,
      workEmailVerifiedAt: null,
      workEmailCodeHash: hash(profileId, code),
      workEmailCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  try {
    await sendWorkEmailCode(email, p.firstName, code);
  } catch {
    return { error: "L'email n'a pas pu partir. Réessayez dans un instant." };
  }
  return { ok: true as const };
}

/** Vérifie le code reçu : l'emploi est alors certifié. */
export async function verifyWorkCode(rawCode: string) {
  const profileId = await me();
  if (!profileId) return { error: "Session expirée, reconnectez-vous." };
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) return { error: "Le code comporte six chiffres." };

  const p = await prisma.participantProfile.findUnique({
    where: { id: profileId },
    select: { workEmailCodeHash: true, workEmailCodeExpiresAt: true },
  });
  if (!p?.workEmailCodeHash || !p.workEmailCodeExpiresAt || p.workEmailCodeExpiresAt < new Date()) {
    return { error: "Code expiré. Demandez-en un nouveau." };
  }
  if (p.workEmailCodeHash !== hash(profileId, code)) return { error: "Code incorrect." };

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: { workEmailVerifiedAt: new Date(), workEmailCodeHash: null, workEmailCodeExpiresAt: null },
  });
  revalidatePath("/participant/profile");
  return { ok: true as const };
}

/** Enregistre un CV ou un book déposé depuis le profil, puis relance l'analyse. */
export async function saveProofDocument(kind: "cv" | "portfolio", path: string) {
  const profileId = await me();
  if (!profileId) return { error: "Session expirée, reconnectez-vous." };
  if (!path.startsWith(`${profileId}/`) || path.includes("..")) return { error: "Fichier invalide." };

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: kind === "cv" ? { cvUrl: path } : { portfolioUrl: path },
  });
  // Le portrait vu par les marques et les traits confirmés s'appuient sur ces
  // documents : on les régénère, après la réponse.
  after(async () => { await generateGhostFile(profileId).catch(() => null); });
  revalidatePath("/participant/profile");
  return { ok: true as const };
}
