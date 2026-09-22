import { prisma } from "@/lib/prisma";
import { createWherebyRoom } from "@/lib/whereby/rooms";
import { sendInterviewConfirmed, scheduleInterviewReminders } from "@/lib/resend/emails";

// ── Planification d'un entretien individuel ───────────────────────────
// Deux chemins mènent au même entretien confirmé :
//   1. le participant propose ses créneaux, la marque en choisit un ;
//   2. l'admin propose des créneaux, le participant en choisit un.
// Dans les deux cas, `confirmInterview` fait le travail, une seule fois.

// Vidéos consultables par la marque 90 jours après l'entretien, puis retirées.
export const RECORDING_RETENTION_DAYS = 90;

export type Slot = { startTime: string; note?: string; proposedBy?: "participant" | "admin" };

export function readSlots(json: unknown): Slot[] {
  if (!Array.isArray(json)) return [];
  return json.filter((s): s is Slot => !!s && typeof (s as Slot).startTime === "string");
}

/** Qui doit agir pour une candidature invitée (statut INVITED) ? */
export function schedulingStep(slots: Slot[]): "participant_to_propose" | "brand_to_choose" | "participant_to_choose" {
  if (slots.length === 0) return "participant_to_propose";
  return slots.some((s) => s.proposedBy === "participant") ? "brand_to_choose" : "participant_to_choose";
}

export function joinUrls(interviewId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.rarelyst.co";
  return {
    participant: `${appUrl}/participant/interview/${interviewId}`,
    brand: `${appUrl}/brand/interview/${interviewId}`,
  };
}

type ConfirmResult =
  | { ok: true; interviewId: string }
  | { ok: false; status: number; error: string };

export async function confirmInterview(applicationId: string, startTime: string): Promise<ConfirmResult> {
  const scheduledAt = new Date(startTime);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, status: 400, error: "Créneau invalide." };
  if (scheduledAt.getTime() < Date.now() + 15 * 60_000) {
    return { ok: false, status: 400, error: "Ce créneau est déjà passé ou trop proche." };
  }

  // Réservation atomique : si deux confirmations arrivent en même temps (double
  // clic, deux onglets), une seule passe la condition « encore invité ».
  const claimed = await prisma.application.updateMany({
    where: { id: applicationId, status: "INVITED", interview: { is: null } },
    data: { status: "CONFIRMED" },
  });
  if (claimed.count === 0) return { ok: false, status: 409, error: "Cet entretien est déjà confirmé." };

  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      participantProfile: { include: { user: { select: { email: true } } } },
      study: { include: { brandProfile: { include: { user: { select: { email: true } } } } } },
    },
  });
  const durationMinutes = application.study.interviewDuration;

  // La salle reste ouverte une heure après la fin prévue.
  let room;
  try {
    room = await createWherebyRoom(new Date(scheduledAt.getTime() + (durationMinutes + 60) * 60_000));
  } catch (err) {
    console.error("[entretien] création de la salle Whereby impossible", err);
    // On rend la main : l'invitation redevient confirmable.
    await prisma.application.update({ where: { id: applicationId }, data: { status: "INVITED" } });
    return { ok: false, status: 502, error: "La salle de visio n'a pas pu être créée. Réessayez dans un instant." };
  }

  const interview = await prisma.interview.create({
    data: {
      studyId: application.studyId,
      applicationId,
      scheduledAt,
      durationMinutes,
      videoLink: room.roomUrl,
      hostRoomUrl: room.hostRoomUrl,
      wherebyMeetingId: room.meetingId,
      wherebyRoomName: room.roomName,
      recordingStatus: process.env.WHEREBY_RECORDING_ENABLED === "true" ? "pending" : null,
      status: "scheduled",
    },
  });

  const urls = joinUrls(interview.id);
  const participant = application.participantProfile;
  const brand = application.study.brandProfile;
  const title = application.study.title;
  const common = { interviewId: interview.id, durationMinutes };
  await Promise.allSettled([
    sendInterviewConfirmed(participant.user.email, participant.firstName, title, scheduledAt, urls.participant, true, common),
    sendInterviewConfirmed(brand.user.email, brand.contactFirstName ?? "", title, scheduledAt, urls.brand, false, common),
    scheduleInterviewReminders({ to: participant.user.email, firstName: participant.firstName, scheduledAt, joinUrl: urls.participant }),
    scheduleInterviewReminders({ to: brand.user.email, firstName: brand.contactFirstName || "bonjour", scheduledAt, joinUrl: urls.brand }),
  ]);

  return { ok: true, interviewId: interview.id };
}
