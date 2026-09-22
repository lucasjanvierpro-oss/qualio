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
