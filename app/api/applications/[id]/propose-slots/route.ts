import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendParticipantInvited } from "@/lib/resend/emails";

type SlotInput = { startTime: string; note?: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const { slots } = await req.json() as { slots: SlotInput[] };

  if (!slots?.length) return NextResponse.json({ error: "Au moins un créneau requis" }, { status: 400 });

  // Fetch before update to get relations
  const existing = await prisma.application.findUnique({
    where: { id },
    include: {
      participantProfile: { include: { user: true } },
      study: { select: { title: true, deadlineAt: true } },
    },
  });

  if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  await prisma.application.update({
    where: { id },
    data: { proposedSlots: slots, status: "INVITED" },
  });

  // Email to participant
  const deadline = existing.study.deadlineAt
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(existing.study.deadlineAt)
    : "dès que possible";

  await sendParticipantInvited(
    existing.participantProfile.user.email,
    existing.participantProfile.firstName,
    existing.study.title,
    deadline
  ).catch(() => null);

  return NextResponse.json({ ok: true, applicationId: id });
}
