import { NextRequest, NextResponse } from "next/server";
import { NDA_VERSION } from "@/lib/legal/nda";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { createWherebyRoom } from "@/lib/whereby/rooms";

// Entretien en autonomie (bêta), côté participant :
//   start  → consentement enregistré, salle Whereby créée (enregistrement
//            automatique dès qu'il y entre) ;
//   joined → il est entré dans la salle : l'horloge des questions démarre ;
//   next   → il passe à une question : on note le moment, pour retrouver
//            ensuite chaque réponse dans la vidéo et la transcription ;
//   finish → il envoie. La transcription arrive par le webhook Whereby.

type Prompt = { i: number; at: number };
const ROOM_HOURS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me?.participantProfileId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; index?: number; consent?: boolean; nda?: boolean };
  const iv = await prisma.interview.findUnique({
    where: { id },
    include: { application: { select: { id: true, participantProfileId: true, study: { select: { guide: true, status: true } } } } },
  });
  if (!iv || iv.mode !== "async" || iv.application.participantProfileId !== me.participantProfileId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (["submitted", "completed", "cancelled", "no_show"].includes(iv.status)) {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }
  const questions = iv.application.study.guide.length;
  const prompts = (Array.isArray(iv.prompts) ? iv.prompts : []) as Prompt[];

  if (body.action === "start") {
    if (!body.consent) return NextResponse.json({ error: "consent_required" }, { status: 400 });
    if (!body.nda) return NextResponse.json({ error: "nda_required" }, { status: 400 });
    await prisma.application.update({ where: { id: iv.applicationId }, data: { ndaAcceptedAt: new Date(), ndaVersion: NDA_VERSION } });
    // Une salle vit quelques heures : au-delà, on en ouvre une nouvelle et on
    // reprend depuis la première question.
    const expired = iv.startedAt && Date.now() - iv.startedAt.getTime() > (ROOM_HOURS - 0.5) * 3600_000;
    if (iv.videoLink && !expired) {
      // Il reprend dans la même salle : la transcription d'une session
      // précédente ne doit pas empêcher de récupérer la suivante.
      if (iv.transcriptStatus) await prisma.interview.update({ where: { id }, data: { transcriptStatus: null, transcriptId: null } });
      return NextResponse.json({ roomUrl: iv.videoLink, index: prompts.at(-1)?.i ?? 0, joined: !!iv.startedAt });
    }
    let room;
    try {
      room = await createWherebyRoom(new Date(Date.now() + ROOM_HOURS * 3600_000));
    } catch (e) {
      console.error("[async] salle Whereby", e);
      return NextResponse.json({ error: "room_failed" }, { status: 502 });
    }
    await prisma.$transaction([
      prisma.interview.update({
        where: { id },
        data: {
          videoLink: room.roomUrl, hostRoomUrl: room.hostRoomUrl, wherebyMeetingId: room.meetingId, wherebyRoomName: room.roomName,
          status: "in_progress", startedAt: null, prompts: [],
        },
      }),
      prisma.application.update({ where: { id: iv.application.id }, data: { recordingConsentAt: new Date() } }),
    ]);
    return NextResponse.json({ roomUrl: room.roomUrl, index: 0, joined: false });
  }

  if (body.action === "joined") {
    if (iv.startedAt) return NextResponse.json({ ok: true, index: prompts.at(-1)?.i ?? 0 });
    await prisma.interview.update({ where: { id }, data: { startedAt: new Date(), prompts: [{ i: 0, at: 0 }] } });
    return NextResponse.json({ ok: true, index: 0 });
  }

  if (body.action === "next") {
    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= questions) return NextResponse.json({ error: "bad_index" }, { status: 400 });
    if (!iv.startedAt) return NextResponse.json({ error: "not_started" }, { status: 409 });
    const at = Date.now() - iv.startedAt.getTime();
    await prisma.interview.update({ where: { id }, data: { prompts: [...prompts, { i: index, at }] } });
    return NextResponse.json({ ok: true, index });
  }

  if (body.action === "finish") {
    if (!iv.startedAt) return NextResponse.json({ error: "not_started" }, { status: 409 });
    await prisma.interview.update({ where: { id }, data: { status: "submitted", submittedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
