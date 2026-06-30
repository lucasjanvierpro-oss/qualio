import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.reward.update({
    where: { id },
    data: { status: "REVEALED", voucherRevealedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
