import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rewards = await prisma.reward.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participantProfile: {
        select: { firstName: true, lastName: true, stripeConnectId: true },
      },
      application: {
        include: { study: { select: { title: true } } },
      },
    },
  });

  return NextResponse.json(rewards);
}
