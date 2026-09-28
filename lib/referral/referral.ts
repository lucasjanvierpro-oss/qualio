import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPricingConfig } from "@/lib/pricing/quotes";

// Parrainage. Principe : on ne paie jamais une inscription. Une prime ne naît
// que lorsqu'un filleul termine un entretien qu'une marque a payé ; elle sort
// donc d'une marge déjà encaissée, et un faux compte ne rapporte rien.

export const REFERRAL_COOKIE = "rl_parrain";
/** Un lien de parrainage ne vaut que pour un compte créé dans ce délai. */
const ATTACH_WINDOW_MS = 14 * 24 * 3600_000;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O ni 1/I

function suffix(n: number) {
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
}

/** Le code de la personne, créé à la première demande : PRÉNOM-XXXX. */
export async function ensureReferralCode(profileId: string): Promise<string> {
  const p = await prisma.participantProfile.findUniqueOrThrow({ where: { id: profileId }, select: { referralCode: true, firstName: true } });
  if (p.referralCode) return p.referralCode;
  const base = (p.firstName || "RARELYST")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10) || "RARELYST";
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${base}-${suffix(4)}`;
    const done = await prisma.participantProfile.updateMany({ where: { id: profileId, referralCode: null }, data: { referralCode: code } }).catch(() => null);
    if (done?.count) return code;
    const again = await prisma.participantProfile.findUnique({ where: { id: profileId }, select: { referralCode: true } });
    if (again?.referralCode) return again.referralCode;
  }
  throw new Error("referral_code_failed");
}

/** Prénom du parrain derrière un code, ou null si le code n'existe pas. */
export async function referrerByCode(code: string) {
  const c = normalizeCode(code);
  if (!c) return null;
  return prisma.participantProfile.findUnique({ where: { referralCode: c }, select: { id: true, firstName: true } });
}

/**
 * Rattache le compte au parrain dont le code est dans le cookie, une seule
 * fois, et seulement pour un compte récent : on ne se déclare pas filleul
 * de quelqu'un après coup.
 */
export async function attachReferrer(profileId: string): Promise<void> {
  const jar = await cookies();
  const code = jar.get(REFERRAL_COOKIE)?.value;
  if (!code) return;
  const [me, referrer] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { id: profileId }, select: { referredById: true, createdAt: true } }),
    referrerByCode(code),
  ]);
  if (!me || !referrer || me.referredById || referrer.id === profileId) return;
  if (Date.now() - me.createdAt.getTime() > ATTACH_WINDOW_MS) return;
  await prisma.participantProfile.updateMany({ where: { id: profileId, referredById: null }, data: { referredById: referrer.id } });
}

/**
 * À la clôture d'un entretien : primes du parrain (et bienvenue du filleul).
 * Idempotent grâce à la contrainte d'unicité.
 */
export async function grantReferralBonuses(applicationId: string): Promise<void> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { status: true, participantProfileId: true, participantProfile: { select: { referredById: true } } },
  });
  const referrerId = app?.participantProfile.referredById;
  if (!app || app.status !== "COMPLETED" || !referrerId) return;

  const cfg = (await getPricingConfig()).referral;
  // Rang de cet entretien parmi ceux menés par le filleul.
  const done = (await prisma.application.findMany({
    where: { participantProfileId: app.participantProfileId, status: "COMPLETED" },
    select: { id: true, interview: { select: { completedAt: true, scheduledAt: true } } },
  })).sort((a, b) => (a.interview?.completedAt ?? a.interview?.scheduledAt ?? new Date(0)).getTime() - (b.interview?.completedAt ?? b.interview?.scheduledAt ?? new Date(0)).getTime());
  const rank = done.findIndex((a) => a.id === applicationId) + 1;
  if (rank < 1 || rank > cfg.maxInterviews) return;

  const rows = [
    { beneficiaryId: referrerId, kind: rank === 1 ? "first" : "interview", amountCents: rank === 1 ? cfg.firstCents : cfg.perInterviewCents },
    ...(rank === 1 && cfg.welcomeCents > 0 ? [{ beneficiaryId: app.participantProfileId, kind: "welcome", amountCents: cfg.welcomeCents }] : []),
  ].filter((r) => r.amountCents > 0);

  await prisma.referralBonus.createMany({
    data: rows.map((r) => ({ ...r, refereeId: app.participantProfileId, applicationId })),
    skipDuplicates: true,
  });
}

export type ReferralSummary = {
  code: string;
  friends: { initial: string; name: string; joinedAt: string; interviews: number; earnedCents: number; active: boolean }[];
  earnedCents: number;
  pendingCents: number;
  welcomeCents: number;
};

/** Ce que voit la page de parrainage. */
export async function referralSummary(profileId: string): Promise<ReferralSummary> {
  const code = await ensureReferralCode(profileId);
  const [friends, bonuses] = await Promise.all([
    prisma.participantProfile.findMany({
      where: { referredById: profileId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, firstName: true, lastName: true, createdAt: true, onboardingStatus: true,
        applications: { where: { status: "COMPLETED" }, select: { id: true } },
      },
    }),
    prisma.referralBonus.findMany({ where: { beneficiaryId: profileId, status: { not: "cancelled" } }, select: { refereeId: true, kind: true, amountCents: true, status: true } }),
  ]);
  const byFriend = new Map<string, number>();
  for (const b of bonuses) if (b.kind !== "welcome") byFriend.set(b.refereeId, (byFriend.get(b.refereeId) ?? 0) + b.amountCents);
  return {
    code,
    friends: friends.map((f) => ({
      initial: (f.firstName[0] ?? "?").toUpperCase(),
      name: f.firstName ? `${f.firstName} ${f.lastName ? `${f.lastName[0]}.` : ""}`.trim() : "Inscription en cours",
      joinedAt: f.createdAt.toISOString(),
      interviews: f.applications.length,
      earnedCents: byFriend.get(f.id) ?? 0,
      active: f.onboardingStatus === "complete",
    })),
    earnedCents: bonuses.filter((b) => b.status === "paid").reduce((n, b) => n + b.amountCents, 0),
    pendingCents: bonuses.filter((b) => b.status === "pending").reduce((n, b) => n + b.amountCents, 0),
    welcomeCents: bonuses.filter((b) => b.kind === "welcome").reduce((n, b) => n + b.amountCents, 0),
  };
}

/** Les profils que les marques cherchent en ce moment (libellés seulement). */
export async function wantedProfiles(limit = 8): Promise<string[]> {
  const studies = await prisma.study.findMany({
    where: { status: { in: ["ACTIVE", "MATCHING", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { targetCriteria: true },
  });
  const labels = new Set<string>();
  for (const st of studies) {
    const c = (st.targetCriteria ?? {}) as { profiles?: { label?: string }[]; profession?: string };
    for (const p of c.profiles ?? []) if (p.label) labels.add(p.label.trim());
    if (!c.profiles?.length && c.profession) for (const x of c.profession.split(/[·,]/)) if (x.trim()) labels.add(x.trim());
  }
  return [...labels].slice(0, limit);
}
