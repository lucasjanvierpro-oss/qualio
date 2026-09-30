"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { prepareDemoBrief, prepareDemoSynthesis } from "@/lib/demo/prepare";

// Admin → Lancer une démo : préparer une présentation pour une marque.

export async function startDemo(input: { brandName: string; topic?: string; lang?: "fr" | "en" }): Promise<{ id: string } | { error: string }> {
  await assertAdmin();
  const brandName = input.brandName.trim().slice(0, 80);
  if (brandName.length < 2) return { error: "Indiquez le nom de la marque." };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Clé Claude absente." };
  const demo = await prisma.demoSession.create({
    data: { brandName, topic: input.topic?.trim().slice(0, 300) || null, lang: input.lang === "en" ? "en" : "fr" },
  });
  const r = await prepareDemoBrief(demo.id);
  revalidatePath("/admin/demo");
  return "error" in r ? r : { id: demo.id };
}

export async function finishDemo(id: string): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const r = await prepareDemoSynthesis(id);
  revalidatePath("/admin/demo");
  return r;
}

export async function deleteDemo(id: string): Promise<void> {
  await assertAdmin();
  await prisma.demoSession.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/demo");
}
