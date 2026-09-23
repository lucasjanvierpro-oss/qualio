"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { sendProfileRequested } from "@/lib/resend/emails";

/**
 * Demande d'accès à un profil « sur demande ».
 *
 * Ces profils ne s'achètent pas au crédit : ce sont des accès rares, négociés
 * au cas par cas. La demande ne débite rien, ne crée pas de candidature, et
 * n'engage pas la marque — elle ouvre une conversation avec Rarelyst.
 */
export async function requestProfile(participantProfileId: string, studyId?: string, message?: string) {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return { error: "session_expired" as const };

  const participant = await prisma.participantProfile.findUnique({
    where: { id: participantProfileId },
    select: { accessTier: true, firstName: true, lastName: true, isBlacklisted: true },
  });
  if (!participant || participant.isBlacklisted) return { error: "not_found" as const };
  if (participant.accessTier !== "ON_REQUEST") return { error: "not_on_request" as const };

  // L'index unique en base garantit qu'une marque n'a qu'une demande en cours
  // par profil, même si deux clics partent en même temps.
  try {
    await prisma.profileRequest.create({
      data: {
        brandProfileId: me.brandProfileId,
        participantProfileId,
        studyId: studyId ?? null,
        message: message?.trim() || null,
      },
    });
  } catch {
    return { error: "already_requested" as const };
  }

  after(async () => {
    await sendProfileRequested(
      `${participant.firstName} ${participant.lastName}`,
      me.brandProfileId!
    ).catch(() => null);
  });

  revalidatePath("/brand/studies");
  revalidatePath("/brand/profiles");
  return { ok: true as const };
}
