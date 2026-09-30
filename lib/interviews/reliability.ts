import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/appUrl";
import { generateAndStoreReportFromTranscripts } from "@/lib/reports/generate";
import { cancelScheduledEmails, langOf, sendIncidentAdmin, sendNoShowNotice, sendRescheduleNotice, sendTechnicalIssueToOther } from "@/lib/resend/emails";

// Fiabilité des entretiens : présence dans la salle, absences constatées
// toutes seules, reports et problèmes techniques signalés depuis la salle.

/** Délai après l'heure prévue au-delà duquel une absence est constatée. */
const GRACE_MS = 20 * 60_000;
/** La présence n'est enregistrée que depuis cette date : les entretiens plus anciens ne sont jamais déclarés absents. */
const TRACKING_SINCE = new Date("2026-09-30T20:00:00Z");

export type Role = "participant" | "brand";

/** Quelqu'un est entré dans la salle (événement « join » de la visio). */
export async function markJoined(interviewId: string, role: Role) {
  await prisma.interview.updateMany({
    where: { id: interviewId, ...(role === "participant" ? { participantJoinedAt: null } : { brandJoinedAt: null }) },
    data: role === "participant" ? { participantJoinedAt: new Date() } : { brandJoinedAt: new Date() },
  });
}

/**
 * Absence du participant : statut, remboursement de la marque (une seule fois),
 * puis tentative de rapport si c'était le dernier entretien attendu.
 * Utilisé par l'admin (changement de statut) et par la détection automatique.
 */
export async function applyNoShow(interviewId: string): Promise<{ refunded: number }> {
  const iv = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { study: { select: { brandProfileId: true } }, participantProfile: { select: { firstName: true } } } } },
  });
  if (!iv) return { refunded: 0 };
  const already = iv.application.status === "NO_SHOW";
  await prisma.interview.update({ where: { id: interviewId }, data: { status: "no_show" } });
  await prisma.application.update({ where: { id: iv.applicationId }, data: { status: "NO_SHOW" } });

  let refunded = 0;
  const paid = iv.application.priceCredits ?? 0;
  if (paid > 0 && !already) {
    const brandProfileId = iv.application.study.brandProfileId;
    await prisma.$transaction(async (tx) => {
      const b = await tx.brandProfile.update({ where: { id: brandProfileId }, data: { credits: { increment: paid } }, select: { credits: true } });
      await tx.creditTransaction.create({
        data: { brandProfileId, type: "REFUND", amount: paid, balanceAfter: b.credits, description: `Absence remboursée · ${iv.application.participantProfile.firstName}`, studyId: iv.studyId },
      });
    });
    refunded = paid;
  }
  await generateAndStoreReportFromTranscripts(iv.studyId, { requireAll: true }).catch(() => null);
  return { refunded };
}

/**
 * Constate les absences : un entretien en visio dont l'heure est passée de
 * 20 minutes, sans que le participant soit entré dans la salle ni qu'aucun
 * enregistrement n'ait commencé. Si c'est la marque qui manque, on prévient
 * seulement l'admin (qui paie dans ce cas reste à décider).
 */
export async function sweepNoShows(): Promise<{ noShows: number; brandAbsent: number }> {
  const cutoff = new Date(Date.now() - GRACE_MS);
  const late = await prisma.interview.findMany({
    where: {
      mode: "live",
      status: "scheduled",
      scheduledAt: { lt: cutoff, gte: TRACKING_SINCE },
      recordingUrl: null,
      transcriptStatus: null,
    },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfile: { select: { contactFirstName: true, companyName: true, preferredLanguage: true, user: { select: { email: true } } } } } },
          participantProfile: { select: { firstName: true, lastName: true, preferredLanguage: true, user: { select: { email: true } } } },
        },
      },
    },
    take: 25,
  });
  let noShows = 0;
  let brandAbsent = 0;
  const base = appUrl();
  for (const iv of late) {
    const { study, participantProfile: pp } = iv.application;
    const name = `${pp.firstName} ${pp.lastName.slice(0, 1)}.`;
    if (!iv.participantJoinedAt) {
      // Double contrôle : rien ne doit avoir bougé entre-temps.
      const claimed = await prisma.interview.updateMany({ where: { id: iv.id, status: "scheduled", participantJoinedAt: null }, data: { status: "no_show_pending" } });
      if (!claimed.count) continue;
      const { refunded } = await applyNoShow(iv.id);
      noShows++;
      await Promise.allSettled([
        sendNoShowNotice(study.brandProfile.user.email, study.brandProfile.contactFirstName ?? "", study.title, true, { participantName: name, credits: refunded, href: `${base}/brand/studies/${study.id}`, lang: langOf(study.brandProfile.preferredLanguage) }),
        sendNoShowNotice(pp.user.email, pp.firstName, study.title, false, { href: `${base}/participant/studies`, lang: langOf(pp.preferredLanguage) }),
        sendIncidentAdmin({ kind: "no_show", studyTitle: study.title, who: `${name} (participant)`, details: `Constatée automatiquement ${Math.round(GRACE_MS / 60_000)} min après l'heure prévue. ${refunded} crédits rendus à la marque.`, studyId: study.id }),
      ]);
    } else if (!iv.brandJoinedAt && !iv.brandAbsentNotifiedAt) {
      await prisma.interview.update({ where: { id: iv.id }, data: { brandAbsentNotifiedAt: new Date() } });
      brandAbsent++;
      await sendIncidentAdmin({ kind: "brand_absent", studyTitle: study.title, who: study.brandProfile.companyName, details: `${name} est entré(e) dans la salle, pas la marque. À régler à la main (qui paie le participant reste à décider).`, studyId: study.id }).catch(() => null);
    }
  }
  return { noShows, brandAbsent };
}

/** Qui est la personne connectée par rapport à cet entretien ? */
export async function roleFor(interviewId: string, me: { participantProfileId?: string | null; brandProfileId?: string | null; role?: string }) {
  const iv = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: { id: true, application: { select: { participantProfileId: true, study: { select: { brandProfileId: true } } } } },
  });
  if (!iv) return null;
  if (me.participantProfileId && iv.application.participantProfileId === me.participantProfileId) return "participant" as const;
  if (me.brandProfileId && iv.application.study.brandProfileId === me.brandProfileId) return "brand" as const;
  return null;
}

/**
 * Report demandé depuis la salle. L'ancien créneau est libéré (rappels annulés,
 * entretien retiré) et l'invitation revient à l'étape « le participant propose
 * ses créneaux ». Impossible une fois l'entretien enregistré.
 */
export async function requestReschedule(interviewId: string, byRole: Role, reason: string): Promise<{ ok: true } | { error: string }> {
  const iv = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfile: { select: { contactFirstName: true, companyName: true, preferredLanguage: true, user: { select: { email: true } } } } } },
          participantProfile: { select: { firstName: true, lastName: true, preferredLanguage: true, user: { select: { email: true } } } },
        },
      },
    },
  });
  if (!iv) return { error: "Entretien introuvable." };
  if (iv.mode !== "live") return { error: "Cet entretien se fait en autonomie : il n'a pas de créneau à reporter." };
  if (iv.recordingUrl || iv.transcript || ["completed", "no_show"].includes(iv.status)) return { error: "Cet entretien a déjà eu lieu : il ne peut plus être reporté." };

  const { study, participantProfile: pp } = iv.application;
  await prisma.$transaction(async (tx) => {
    await tx.interviewIncident.create({
      data: {
        interviewId, applicationId: iv.applicationId, studyId: study.id, byRole, kind: "reschedule", reason: reason.slice(0, 1000),
        details: { previousScheduledAt: iv.scheduledAt.toISOString(), room: iv.wherebyRoomName },
      },
    });
    await tx.interview.delete({ where: { id: interviewId } });
    await tx.application.update({ where: { id: iv.applicationId }, data: { status: "INVITED", proposedSlots: [] } });
  });
  if (iv.reminderIds.length) await cancelScheduledEmails(iv.reminderIds).catch(() => null);

  const base = appUrl();
  const who = byRole === "participant" ? `${pp.firstName} ${pp.lastName.slice(0, 1)}.` : study.brandProfile.companyName;
  await Promise.allSettled([
    sendRescheduleNotice(pp.user.email, pp.firstName, study.title, { byWhom: who, self: byRole === "participant", reason, forParticipant: true, href: `${base}/participant/studies/${iv.applicationId}`, lang: langOf(pp.preferredLanguage) }),
    sendRescheduleNotice(study.brandProfile.user.email, study.brandProfile.contactFirstName ?? "", study.title, { byWhom: who, self: byRole === "brand", reason, forParticipant: false, href: `${base}/brand/studies/${study.id}`, lang: langOf(study.brandProfile.preferredLanguage) }),
    sendIncidentAdmin({ kind: "reschedule", studyTitle: study.title, who: `${who} (${byRole === "participant" ? "participant" : "marque"})`, reason, details: `Créneau libéré : ${iv.scheduledAt.toISOString()}`, studyId: study.id }),
  ]);
  return { ok: true };
}

/** Problème technique signalé depuis la salle : l'admin et l'autre partie sont prévenus. */
export async function reportTechnical(interviewId: string, byRole: Role, problem: string, details: { network?: string; userAgent?: string }) {
  const iv = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          study: { select: { id: true, title: true, brandProfile: { select: { contactFirstName: true, companyName: true, preferredLanguage: true, user: { select: { email: true } } } } } },
          participantProfile: { select: { firstName: true, lastName: true, preferredLanguage: true, user: { select: { email: true } } } },
        },
      },
    },
  });
  if (!iv) return { error: "Entretien introuvable." };
  const { study, participantProfile: pp } = iv.application;
  await prisma.interviewIncident.create({
    data: { interviewId, applicationId: iv.applicationId, studyId: study.id, byRole, kind: "technical", reason: problem.slice(0, 1000), details },
  });
  const base = appUrl();
  const who = byRole === "participant" ? `${pp.firstName} ${pp.lastName.slice(0, 1)}.` : study.brandProfile.companyName;
  const other = byRole === "participant"
    ? { to: study.brandProfile.user.email, name: study.brandProfile.contactFirstName ?? "", href: `${base}/brand/interview/${interviewId}`, lang: langOf(study.brandProfile.preferredLanguage) }
    : { to: pp.user.email, name: pp.firstName, href: `${base}/participant/interview/${interviewId}`, lang: langOf(pp.preferredLanguage) };
  await Promise.allSettled([
    sendIncidentAdmin({ kind: "technical", studyTitle: study.title, who: `${who} (${byRole === "participant" ? "participant" : "marque"})`, reason: problem, details: [details.network && `Réseau : ${details.network}`, details.userAgent && `Navigateur : ${details.userAgent}`].filter(Boolean).join(" · "), studyId: study.id }),
    sendTechnicalIssueToOther(other.to, other.name, study.title, who, problem, other.href, other.lang),
  ]);
  return { ok: true as const };
}

// Au plus un passage toutes les deux minutes par serveur : appelé à l'ouverture
// des pages d'entretien et du pilotage, après l'envoi de la page.
let lastSweep = 0;
export function sweepNoShowsSoon() {
  if (Date.now() - lastSweep < 2 * 60_000) return;
  lastSweep = Date.now();
  after(() => sweepNoShows().then(() => undefined).catch((e) => console.error("[absences]", e)));
}
