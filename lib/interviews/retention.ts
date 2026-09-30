import { prisma } from "@/lib/prisma";
import { deleteWherebyRecording } from "@/lib/whereby/rooms";

// Les vidéos d'entretien ne sont plus consultables après 90 jours (politique de
// confidentialité) : on les efface aussi chez Whereby. La transcription écrite
// reste, elle sert la synthèse.
export const VIDEO_RETENTION_DAYS = 90;

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
