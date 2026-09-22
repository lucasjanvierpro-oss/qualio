import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { fetchWherebyRecordingLink } from "@/lib/whereby/rooms";
import { RECORDING_RETENTION_DAYS } from "@/lib/interviews/schedule";

// Ouvre l'enregistrement d'un entretien. Les liens Whereby expirent : on en
// génère un frais à chaque demande, réservé à la marque de l'étude (et à l'admin).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const interview = await prisma.interview.findUnique({
    where: { id },
    select: { recordingId: true, scheduledAt: true, application: { select: { study: { select: { brandProfileId: true } } } } },
  });
  const owns = me.role === "ADMIN" || (!!me.brandProfileId && interview?.application.study.brandProfileId === me.brandProfileId);
  if (!interview || !owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!interview.recordingId) return NextResponse.json({ error: "Aucun enregistrement pour cet entretien." }, { status: 404 });

  const ageDays = (Date.now() - interview.scheduledAt.getTime()) / 86_400_000;
  if (ageDays > RECORDING_RETENTION_DAYS) {
    return NextResponse.json({ error: `Les vidéos sont conservées ${RECORDING_RETENTION_DAYS} jours. Celle-ci a été retirée.` }, { status: 410 });
  }

  const link = await fetchWherebyRecordingLink(interview.recordingId);
  if (!link) return NextResponse.json({ error: "La vidéo n'est pas encore disponible." }, { status: 404 });
  return NextResponse.redirect(link);
}
