import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createWherebyRoom } from "@/lib/whereby/rooms";
import { sendInterviewConfirmed } from "@/lib/resend/emails";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId, scheduledAt, timeSlotId, durationMinutes = 30 } = await request.json() as {
    applicationId: string;
    scheduledAt: string;
    timeSlotId?: string;
    durationMinutes?: number;
  };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      participantProfile: { include: { user: true } },
      study: { include: { brandProfile: { include: { user: true } } } },
    },
  });

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const scheduledDate = new Date(scheduledAt);
  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000 + 60 * 60 * 1000);

  // Create Whereby room
  let videoLink = `https://qualio.whereby.com/interview-${applicationId}`;
  let hostRoomUrl = videoLink;
  try {
    const room = await createWherebyRoom(endDate);
    videoLink = room.roomUrl;
    hostRoomUrl = room.hostRoomUrl;
  } catch {
    // Fall back to placeholder if Whereby not configured
  }

  const interview = await prisma.interview.create({
    data: {
      studyId: application.studyId,
      applicationId,
      timeSlotId: timeSlotId ?? null,
      scheduledAt: scheduledDate,
      durationMinutes,
      videoLink,
      status: "scheduled",
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "CONFIRMED" },
  });

  // Send confirmation emails
  const participantEmail = application.participantProfile.user.email;
  const brandEmail = application.study.brandProfile.user.email;

  await Promise.allSettled([
    sendInterviewConfirmed(participantEmail, application.participantProfile.firstName, application.study.title, scheduledDate, videoLink, true),
    sendInterviewConfirmed(brandEmail, application.study.brandProfile.contactFirstName ?? "Team", application.study.title, scheduledDate, hostRoomUrl, false),
  ]);

  return NextResponse.json({ interview, videoLink });
}
