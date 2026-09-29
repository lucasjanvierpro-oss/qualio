"use server";

import { prisma } from "@/lib/prisma";
import { sendDemoConfirmation, sendDemoRequestAdmin } from "@/lib/resend/emails";

// Demande de démo depuis la page d'accueil : enregistrée, puis Lucas est
// prévenu par email et la personne reçoit un accusé de réception.

type Input = {
  firstName: string; lastName?: string; email: string; company: string;
  role?: string; topic?: string; timing?: string; website?: string; lang: "fr" | "en";
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cut = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function requestDemo(input: Input): Promise<{ ok: true } | { error: string }> {
  // Le champ piège n'est rempli que par les robots : on fait comme si tout allait bien.
  if (cut(input?.website, 200)) return { ok: true };
  const d = {
    firstName: cut(input.firstName, 80),
    lastName: cut(input.lastName, 80) || null,
    email: cut(input.email, 160).toLowerCase(),
    company: cut(input.company, 120),
    role: cut(input.role, 120) || null,
    topic: cut(input.topic, 600) || null,
    timing: cut(input.timing, 40) || null,
    lang: input.lang === "en" ? "en" : "fr",
  };
  if (!d.firstName || !d.company || !EMAIL.test(d.email)) return { error: "invalid" };

  // Un double clic ou un renvoi dans les dix minutes ne crée pas de doublon.
  const recent = await prisma.demoRequest.findFirst({
    where: { email: d.email, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
    select: { id: true },
  });
  if (recent) return { ok: true };

  await prisma.demoRequest.create({ data: d });
  await Promise.all([
    sendDemoRequestAdmin(d).catch((e) => console.error("[demo admin]", e)),
    sendDemoConfirmation(d.email, d.firstName, d.lang as "fr" | "en").catch((e) => console.error("[demo confirm]", e)),
  ]);
  return { ok: true };
}
