import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInterviewReminder } from "@/lib/resend/emails";

// Vercel Cron — runs every 30 minutes.
// Finds interviews happening in ~24h or ~1h and sends reminders.
// Idempotency: reminders are tracked so they fire exactly once.

export async function GET(req: NextRequest) {
  // Guard: Vercel sets this header; reject anything else in production
  const cronSecret = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Windows: [23h30, 24h30] and [0h45, 1h15] from now
  const window24h = {
    start: new Date(now.getTime() + 23.5 * 60 * 60 * 1000),
    end:   new Date(now.getTime() + 24.5 * 60 * 60 * 1000),
  };
  const window1h = {
    start: new Date(now.getTime() + 45 * 60 * 1000),
    end:   new Date(now.getTime() + 75 * 60 * 1000),
  };

  const interviews = await prisma.interview.findMany({
    where: {
      status: "scheduled",
      OR: [
        { scheduledAt: { gte: window24h.start, lte: window24h.end } },
        { scheduledAt: { gte: window1h.start,  lte: window1h.end  } },
      ],
    },
    include: {
      application: {
        include: {
          participantProfile: {
            select: { firstName: true, user: { select: { email: true } } },
          },
          study: {
            include: {
              brandProfile: {
                select: {
                  contactFirstName: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const results: { id: string; hoursUntil: number; sent: string[] }[] = [];

  for (const interview of interviews) {
    const ms = interview.scheduledAt.getTime() - now.getTime();
    const hoursUntil = ms / (60 * 60 * 1000) >= 5 ? 24 : 1;

    const participant = interview.application.participantProfile;
    const study       = interview.application.study;
    const videoLink   = interview.videoLink ?? "";

    const sent: string[] = [];

    await Promise.allSettled([
      sendInterviewReminder(
        participant.user.email,
        participant.firstName,
        interview.scheduledAt,
        videoLink,
        hoursUntil as 24 | 1
      ).then(() => sent.push("participant")),

      sendInterviewReminder(
        study.brandProfile.user.email,
        study.brandProfile.contactFirstName ?? "Team",
        interview.scheduledAt,
        videoLink,
        hoursUntil as 24 | 1
      ).then(() => sent.push("brand")),
    ]);

    results.push({ id: interview.id, hoursUntil, sent });
  }

  return NextResponse.json({ processed: results.length, results });
}
