import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { confirmInterview, readSlots } from "@/lib/interviews/schedule";

// Le participant accepte l'un des créneaux proposés par l'admin.
// Le consentement à l'enregistrement est exigé ici : sans lui, pas d'entretien.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { slotIndex, consent } = (await req.json()) as { slotIndex: number; consent?: boolean };

  const application = await prisma.application.findUnique({
    where: { id },
    select: { participantProfileId: true, proposedSlots: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = me.participantProfileId === application.participantProfileId;
  if (!isOwner && me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (isOwner && consent !== true) {
    return NextResponse.json({ error: "Merci d'accepter l'enregistrement de l'entretien pour continuer." }, { status: 400 });
  }

  const slot = readSlots(application.proposedSlots)[slotIndex];
  if (!slot) return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });

  if (isOwner) await prisma.application.update({ where: { id }, data: { recordingConsentAt: new Date() } });

  const result = await confirmInterview(id, slot.startTime);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, interviewId: result.interviewId });
}
