import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { confirmInterview, readSlots } from "@/lib/interviews/schedule";

// La marque choisit l'un des créneaux proposés par le participant.
// L'entretien est confirmé immédiatement : salle créée, emails envoyés.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { slotIndex } = (await req.json()) as { slotIndex: number };

  const application = await prisma.application.findUnique({
    where: { id },
    select: { proposedSlots: true, study: { select: { brandProfileId: true } } },
  });
  const owns = me.role === "ADMIN" || (!!me.brandProfileId && application?.study.brandProfileId === me.brandProfileId);
  if (!application || !owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slot = readSlots(application.proposedSlots)[slotIndex];
  if (!slot || slot.proposedBy !== "participant") {
    return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
  }

  const result = await confirmInterview(id, slot.startTime);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, interviewId: result.interviewId });
}
