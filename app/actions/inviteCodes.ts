"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function generateCode(label?: string): string {
  // e.g. LACOSTE-X4K9R or QUALIO-A7B2C
  const prefix = label
    ? label.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
    : "QUALIO";
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
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

export async function redeemInviteCode(code: string, brandProfileId: string): Promise<{ ok: boolean; plan?: string; error?: string }> {
  const invite = await prisma.inviteCode.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!invite) return { ok: false, error: "Code invalide" };
  if (invite.usedAt) return { ok: false, error: "Ce code a déjà été utilisé" };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { ok: false, error: "Code expiré" };

  await prisma.$transaction([
    prisma.brandProfile.update({
      where: { id: brandProfileId },
      data: { isActivated: true },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByBrandProfileId: brandProfileId },
    }),
  ]);

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
