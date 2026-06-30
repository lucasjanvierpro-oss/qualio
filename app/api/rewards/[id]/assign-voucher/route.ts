import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const { code } = await req.json() as { code: string };

  if (!code?.trim()) return NextResponse.json({ error: "code_required" }, { status: 400 });

  const reward = await prisma.reward.findUnique({ where: { id } });
  if (!reward) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (reward.type !== "VOUCHER") return NextResponse.json({ error: "not_voucher" }, { status: 400 });
  if (reward.status !== "PENDING") return NextResponse.json({ error: "not_pending" }, { status: 400 });

  const updated = await prisma.reward.update({
    where: { id },
    data: {
      status: "PAID",
      voucherCode: code.trim(),
      paidAt: new Date(),
    },
  });

  return NextResponse.json({ reward: updated });
}
