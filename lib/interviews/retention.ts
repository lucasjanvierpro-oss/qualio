import { prisma } from "@/lib/prisma";
import { deleteWherebyRecording } from "@/lib/whereby/rooms";
import { langOf, sendVideoExpiryNotice } from "@/lib/resend/emails";

// Les vidéos d'entretien ne sont plus consultables après 90 jours (politique de
// confidentialité) : on les efface aussi chez Whereby. La transcription écrite
// reste, elle sert la synthèse.
export const VIDEO_RETENTION_DAYS = 90;
/** La marque est prévenue ce nombre de jours avant l'effacement, pour télécharger ses vidéos. */
export const VIDEO_REMINDER_DAYS = 7;

/** Date à laquelle la vidéo d'un entretien sera effacée. */
export const videoDeletedOn = (scheduledAt: Date) => new Date(scheduledAt.getTime() + VIDEO_RETENTION_DAYS * 86400_000);

/**
 * Prévient chaque marque, une fois, quand des vidéos approchent de leur
 * effacement : elle peut les télécharger avant (elle y tient pour ses comités).
 */
export async function remindVideoExpiry(): Promise<{ reminded: number }> {
  const now = Date.now();
  const soon = await prisma.interview.findMany({
    where: {
      recordingId: { not: null }, recordingDeletedAt: null, videoReminderAt: null,
      scheduledAt: { lt: new Date(now - (VIDEO_RETENTION_DAYS - VIDEO_REMINDER_DAYS) * 86400_000), gte: new Date(now - VIDEO_RETENTION_DAYS * 86400_000) },
    },
    select: {
      id: true, scheduledAt: true,
      application: { select: { study: { select: { id: true, title: true, brandProfile: { select: { contactFirstName: true, preferredLanguage: true, user: { select: { email: true } } } } } } } },
    },
    take: 200,
  });
  // Un seul email par étude, avec la date de la première vidéo effacée.
  const byStudy = new Map<string, typeof soon>();
  for (const iv of soon) byStudy.set(iv.application.study.id, [...(byStudy.get(iv.application.study.id) ?? []), iv]);
  let reminded = 0;
  for (const ivs of byStudy.values()) {
    const { study } = ivs[0].application;
    const first = new Date(Math.min(...ivs.map((iv) => videoDeletedOn(iv.scheduledAt).getTime())));
    const sent = await sendVideoExpiryNotice(study.brandProfile.user.email, study.brandProfile.contactFirstName ?? "", study.title, study.id, ivs.length, first, langOf(study.brandProfile.preferredLanguage)).then(() => true, () => false);
    if (!sent) continue;
    await prisma.interview.updateMany({ where: { id: { in: ivs.map((iv) => iv.id) } }, data: { videoReminderAt: new Date() } });
    reminded += ivs.length;
  }
  return { reminded };
}

export async function purgeOldRecordings(): Promise<{ deleted: number; failed: number }> {
  const before = new Date(Date.now() - VIDEO_RETENTION_DAYS * 86400_000);
  const old = await prisma.interview.findMany({
    where: { recordingId: { not: null }, recordingDeletedAt: null, scheduledAt: { lt: before } },
    select: { id: true, recordingId: true },
    take: 50,
  });
  let deleted = 0;
  let failed = 0;
  for (const iv of old) {
    const ok = await deleteWherebyRecording(iv.recordingId!).catch(() => false);
    if (!ok) { failed++; continue; }
    await prisma.interview.update({ where: { id: iv.id }, data: { recordingDeletedAt: new Date(), recordingUrl: null, recordingStatus: "deleted" } });
    deleted++;
  }
  return { deleted, failed };
}
