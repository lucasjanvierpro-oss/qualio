import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateGhostFile } from "@/lib/participants/ghostFile";

// Régénération manuelle d'un ghost file.
// La génération automatique en fin de tunnel n'passe PAS par ici : elle appelle
// `generateGhostFile()` directement (cf. app/actions/funnel.ts). Un fetch
// serveur→serveur vers cette route serait intercepté par `proxy.ts` faute de cookie.
//
// Accès : l'admin, ou le participant sur son propre profil.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true, participantProfile: { select: { id: true } } },
  });

  const isAdmin = dbUser?.role === "ADMIN";
  const isOwner = dbUser?.participantProfile?.id === id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await generateGhostFile(id);
  if (result.ok) return NextResponse.json({ ok: true });

  const status = result.reason === "not_found" ? 404 : 500;
  return NextResponse.json({ error: result.reason }, { status });
}
