import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createWherebyRoom } from "@/lib/whereby/rooms";
import { sendInterviewConfirmed, scheduleInterviewReminders } from "@/lib/resend/emails";

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

  // Un créneau ne se confirme qu'une fois, et seulement après une invitation.
  // Sans ce garde, un double clic créait une seconde salle Whereby puis
  // échouait sur la contrainte d'unicité de l'entretien.
  if (application.status !== "INVITED") {
    return NextResponse.json({ error: "Cette invitation n'est plus en attente de confirmation." }, { status: 409 });
  }
  const existingInterview = await prisma.interview.findUnique({ where: { applicationId: id }, select: { id: true } });
  if (existingInterview) {
    return NextResponse.json({ error: "Ce créneau est déjà confirmé." }, { status: 409 });
  }

  const slots = (application.proposedSlots as Array<{ startTime: string; note?: string }> | null) ?? [];
  const chosenSlot = slots[slotIndex];
  if (!chosenSlot) return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });

  const scheduledDate = new Date(chosenSlot.startTime);
  const durationMinutes = application.study.interviewDuration;
  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000 + 60 * 60 * 1000);

  // Salle Whereby (avec enregistrement cloud si activé). Pas de lien de
  // secours inventé : un lien mort envoyé par email est pire qu'une erreur
  // visible, que le participant peut signaler et réessayer.
  let room;
  try {
    room = await createWherebyRoom(endDate);
  } catch (err) {
    console.error("[confirm-slot] création de la salle Whereby impossible", err);
    return NextResponse.json({ error: "La salle de visio n'a pas pu être créée. Réessayez dans un instant." }, { status: 502 });
  }
  const videoLink = room.roomUrl;
  const hostRoomUrl = room.hostRoomUrl;
  const wherebyMeetingId = room.meetingId;
  const wherebyRoomName = room.roomName;

  const interview = await prisma.interview.create({
    data: {
      studyId: application.studyId,
      applicationId: id,
      scheduledAt: scheduledDate,
      durationMinutes,
      videoLink,
      hostRoomUrl,
      wherebyMeetingId,
      wherebyRoomName,
      recordingStatus: process.env.WHEREBY_RECORDING_ENABLED === "true" ? "pending" : null,
      status: "scheduled",
    },
  });

  await prisma.application.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  // Send confirmation emails — le lien pointe vers la visio DANS qualio (backup mail),
  // pas vers le lien Whereby brut. Chacun rejoint depuis son espace.
  const participantEmail = application.participantProfile.user.email;
  const brandEmail = application.study.brandProfile.user.email;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const participantJoinUrl = `${appUrl}/participant/interview/${interview.id}`;
  const brandJoinUrl = `${appUrl}/brand/interview/${interview.id}`;

  const brandFirstName = application.study.brandProfile.contactFirstName ?? "";
  const common = { interviewId: interview.id, durationMinutes };
  await Promise.allSettled([
    sendInterviewConfirmed(participantEmail, application.participantProfile.firstName, application.study.title, scheduledDate, participantJoinUrl, true, common),
    sendInterviewConfirmed(brandEmail, brandFirstName, application.study.title, scheduledDate, brandJoinUrl, false, common),
    scheduleInterviewReminders({ to: participantEmail, firstName: application.participantProfile.firstName, scheduledAt: scheduledDate, joinUrl: participantJoinUrl }),
    scheduleInterviewReminders({ to: brandEmail, firstName: brandFirstName || "bonjour", scheduledAt: scheduledDate, joinUrl: brandJoinUrl }),
  ]);

  return NextResponse.json({ ok: true, interview, videoLink });
}
