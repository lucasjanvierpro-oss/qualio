"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth/guards";
import { PLATFORMS, PROFILE_TYPES, STATUSES, type Platform, type ProfileType, type Status } from "@/lib/sourcing/sourcing";

// Admin → Sourcing : la liste des personnes repérées à la main.

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function addSourcingContact(v: { name: string; url?: string; platform: string; profileType: string; role?: string; why?: string }): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const name = clip(v.name, 120);
  if (name.length < 2) return { error: "Indique au moins un nom ou un pseudo." };
  const url = clip(v.url, 500);
  if (url && !/^https?:\/\//i.test(url)) return { error: "Le lien doit commencer par https://" };
  if (url && (await prisma.sourcingContact.findFirst({ where: { url }, select: { id: true } }))) return { error: "Cette personne est déjà dans la liste." };
  await prisma.sourcingContact.create({
    data: {
      name,
      url: url || null,
      platform: v.platform in PLATFORMS ? (v.platform as Platform) : "autre",
      profileType: v.profileType in PROFILE_TYPES ? (v.profileType as ProfileType) : "initie",
      role: clip(v.role, 200) || null,
      why: clip(v.why, 300) || null,
    },
  });
  revalidatePath("/admin/sourcing");
  return { ok: true };
}

export async function updateSourcingContact(id: string, v: { status?: string; notes?: string }) {
  await assertAdmin();
  const data: { status?: Status; lastContactAt?: Date; notes?: string | null } = {};
  if (v.status && v.status in STATUSES) {
    data.status = v.status as Status;
    if (v.status !== "a_contacter") data.lastContactAt = new Date();
  }
  if (v.notes !== undefined) data.notes = clip(v.notes, 1000) || null;
  await prisma.sourcingContact.update({ where: { id }, data });
  revalidatePath("/admin/sourcing");
  return { ok: true as const };
}

export async function deleteSourcingContact(id: string) {
  await assertAdmin();
  await prisma.sourcingContact.delete({ where: { id } });
  revalidatePath("/admin/sourcing");
  return { ok: true as const };
}
