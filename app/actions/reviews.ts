"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { REVIEW_TAGS } from "@/lib/participants/trust";

/**
 * Avis d'une marque sur un entretien terminé.
 *
 * L'avis est lu par les autres marques sur la fiche du participant — jamais
 * par le participant lui-même. Une seule note par entretien : la marque peut la
 * corriger, pas la multiplier.
 */
export async function reviewInterview(input: { interviewId: string; rating: number; tags: string[]; comment: string }) {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return { error: "session_expired" as const };

  const rating = Math.round(Number(input.rating));
  if (!(rating >= 1 && rating <= 5)) return { error: "invalid_rating" as const };
  const tags = input.tags.filter((t) => (REVIEW_TAGS as readonly string[]).includes(t)).slice(0, 4);
  const comment = input.comment.trim().slice(0, 600) || null;

  const interview = await prisma.interview.findUnique({
    where: { id: input.interviewId },
    select: { studyId: true, application: { select: { status: true, study: { select: { brandProfileId: true } } } } },
  });
  if (!interview || interview.application.study.brandProfileId !== me.brandProfileId) return { error: "not_found" as const };
  if (interview.application.status !== "COMPLETED") return { error: "not_completed" as const };

  await prisma.interview.update({
    where: { id: input.interviewId },
    data: { brandRating: rating, brandReviewTags: tags, brandFeedback: comment, brandReviewedAt: new Date() },
  });

  revalidatePath(`/brand/studies/${interview.studyId}`);
  return { ok: true as const };
}
