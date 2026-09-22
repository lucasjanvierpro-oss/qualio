"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";

// Sans 0/O ni 1/I/L : un code se dicte au téléphone ou se recopie d'un email.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateCode(label?: string): string {
  // ex. LACOSTE-X4K9R7 ou RARELYS-A7B2C9
  const prefix = label
    ? label.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7) || "RARELYS"
    : "RARELYS";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${prefix}-${suffix}`;
}

export async function createInviteCode(label?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") throw new Error("Admin only");

  const code = generateCode(label);
  const invite = await prisma.inviteCode.create({
    data: { code, label: label ?? null },
  });

  revalidatePath("/admin");
  return invite;
}

export async function listInviteCodes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") throw new Error("Admin only");

  return prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// La marque est celle de la session — jamais un identifiant envoyé par le
// navigateur : une server action est appelable avec n'importe quels arguments.
export async function redeemInviteCode(code: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour utiliser un code." };

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { brandProfile: { select: { id: true, isActivated: true } } },
  });
  const brand = dbUser?.brandProfile;
  if (!brand) return { ok: false, error: "Ce code est réservé aux comptes marque." };
  if (brand.isActivated) return { ok: true };

  const invite = await prisma.inviteCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!invite) return { ok: false, error: "Code invalide" };
  if (invite.usedAt) return { ok: false, error: "Ce code a déjà été utilisé" };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { ok: false, error: "Code expiré" };

  // Consommation atomique : si deux personnes valident le même code au même
  // instant, une seule mise à jour passe la condition `usedAt: null`.
  const claimed = await prisma.inviteCode.updateMany({
    where: { id: invite.id, usedAt: null },
    data: { usedAt: new Date(), usedByBrandProfileId: brand.id },
  });
  if (claimed.count === 0) return { ok: false, error: "Ce code a déjà été utilisé" };

  await prisma.brandProfile.update({ where: { id: brand.id }, data: { isActivated: true } });
  return { ok: true };
}

export async function activateBrandManually(brandProfileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") throw new Error("Admin only");

  await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { isActivated: true },
  });

  revalidatePath("/admin");
}
