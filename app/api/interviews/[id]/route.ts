import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { completeInterview } from "@/lib/interviews/complete";
import { applyNoShow } from "@/lib/interviews/reliability";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  if (status === "completed") {
    const interview = await completeInterview(id);
    return NextResponse.json({ ok: true, interview });
  }

  const interview = await prisma.interview.update({ where: { id }, data: { status } });

  if (status === "no_show") {
    // Remboursement (une seule fois) et rapport éventuel : même logique que la détection automatique.
    await applyNoShow(interview.id);
  }

  return NextResponse.json({ ok: true, interview });
}
