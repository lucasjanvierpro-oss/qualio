import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createWherebyRoom } from "@/lib/whereby/rooms";
import { sendInterviewConfirmed } from "@/lib/resend/emails";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { slotIndex } = await req.json() as { slotIndex: number };

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      participantProfile: { include: { user: true } },
      study: { include: { brandProfile: { include: { user: true } } } },
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership — participant can only confirm their own application
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { role: true, participantProfile: { select: { id: true } } },
  });

  const isParticipantOwner = dbUser?.participantProfile?.id === application.participantProfileId;
  const isAdmin = dbUser?.role === "ADMIN";

  if (!isParticipantOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rawApp = await prisma.application.findUnique({ where: { id }, select: { proposedSlots: true } });
  const slots = (rawApp?.proposedSlots as Array<{ startTime: string; note?: string }>) ?? [];
  const chosenSlot = slots[slotIndex];
  if (!chosenSlot) return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });

  const scheduledDate = new Date(chosenSlot.startTime);
  const durationMinutes = application.study.interviewDuration;
  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000 + 60 * 60 * 1000);

  // Create Whereby room
  let videoLink = `https://qualio.whereby.com/interview-${id}`;
  let hostRoomUrl = videoLink;
  try {
    const room = await createWherebyRoom(endDate);
    videoLink = room.roomUrl;
    hostRoomUrl = room.hostRoomUrl;
  } catch {
    // Fall back to placeholder if not configured
  }

  const interview = await prisma.interview.create({
    data: {
      studyId: application.studyId,
      applicationId: id,
      scheduledAt: scheduledDate,
      durationMinutes,
      videoLink,
      status: "scheduled",
    },
  });

  await prisma.application.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  // Send confirmation emails
  const participantEmail = application.participantProfile.user.email;
  const brandEmail = application.study.brandProfile.user.email;

  await Promise.allSettled([
    sendInterviewConfirmed(
      participantEmail,
      application.participantProfile.firstName,
      application.study.title,
      scheduledDate,
      videoLink,
      true
    ),
    sendInterviewConfirmed(
      brandEmail,
      application.study.brandProfile.contactFirstName ?? "Team",
      application.study.title,
      scheduledDate,
      hostRoomUrl,
      false
    ),
  ]);

  return NextResponse.json({ ok: true, interview, videoLink });
}
