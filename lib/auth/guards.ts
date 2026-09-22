import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Exige un admin connecté.
 *
 * À appeler dans TOUTE route `/api/admin/*` : `proxy.ts` protège le préfixe
 * `/admin` mais pas `/api/admin` — sans ce garde, n'importe quel compte
 * connecté peut appeler ces endpoints.
 *
 * Renvoie `null` si l'accès est autorisé, sinon la réponse d'erreur à retourner.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return null;
}

/** Exige un compte marque connecté. Même raison que ci-dessus pour `/api/*`. */
export async function requireBrand(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "BRAND" && dbUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}

// ── Pour les server actions ───────────────────────────────────────────
// Une server action est un point d'entrée public : son identifiant figure
// dans le code envoyé au navigateur, et n'importe qui peut l'appeler avec
// n'importe quels arguments. Chaque action doit donc vérifier elle-même QUI
// l'appelle, et déduire l'identité de la session — jamais d'un argument.

type SessionUser = {
  id: string;
  role: "ADMIN" | "BRAND" | "PARTICIPANT";
  brandProfileId: string | null;
  participantProfileId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true, role: true,
      brandProfile: { select: { id: true } },
      participantProfile: { select: { id: true } },
    },
  });
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    role: dbUser.role,
    brandProfileId: dbUser.brandProfile?.id ?? null,
    participantProfileId: dbUser.participantProfile?.id ?? null,
  };
}

/** Lève une erreur si l'appelant n'est pas admin. */
export async function assertAdmin(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (u?.role !== "ADMIN") throw new Error("forbidden");
  return u;
}
