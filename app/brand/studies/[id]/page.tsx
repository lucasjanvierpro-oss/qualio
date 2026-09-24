import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { readSlots, schedulingStep } from "@/lib/interviews/schedule";
import { TRUST_SELECT, BADGE_PROFILE_SELECT, trustFrom } from "@/lib/participants/trust";
import { badgesForBrand, TRAIT_LABELS } from "@/lib/participants/badges";
import { priceProfiles, getPricingConfig } from "@/lib/pricing/quotes";
import { factorText } from "@/lib/pricing/engine";
import StudyDetailClient, { type Candidate } from "./StudyDetailClient";

export const dynamic = "force-dynamic";

function age(dob: Date | null): number | null {
  if (!dob) return null;
  const t = new Date();
  let a = t.getFullYear() - dob.getFullYear();
  if (t.getMonth() < dob.getMonth() || (t.getMonth() === dob.getMonth() && t.getDate() < dob.getDate())) a--;
  return a;
}

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.brandProfileId) redirect("/login");

  const [study, brand] = await Promise.all([
    prisma.study.findFirst({
      where: { id, brandProfileId: me.brandProfileId },
      include: {
        report: { select: { id: true } },
        applications: {
          orderBy: { updatedAt: "desc" },
          include: {
            interview: { select: { id: true, scheduledAt: true, status: true, transcriptStatus: true, brandRating: true, brandReviewTags: true, brandFeedback: true } },
            participantProfile: {
              select: {
                id: true,
                firstName: true, lastName: true, dateOfBirth: true, city: true,
                profession: true, brandSummary: true,
                accessNote: true,
                ...BADGE_PROFILE_SELECT,
                // Le passé d'un participant convainc plus qu'une déclaration :
                // entretiens menés, notes et avis des autres marques.
                applications: { select: TRUST_SELECT },
                ghostFile: {
                  select: {
                    behaviours: true, processingStatus: true,
                    profileType: true, primaryExpertise: true, secondaryExpertises: true,
                    aiTags: true, aiStrengths: true, generationTag: true,
                    expertiseScore: true, vocabularyScore: true, authenticityScore: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.brandProfile.findUnique({ where: { id: me.brandProfileId }, select: { credits: true } }),
  ]);
  if (!study) notFound();

  // Le prix de chaque profil pour CETTE étude : palier, durée, demande,
  // rareté, certification, avis. Figé au moment où la marque accepte.
  const [pricing, cfg] = await Promise.all([
    priceProfiles(study.applications.map((a) => a.participantProfileId), {
      durationMin: study.interviewDuration,
      focusGroup: study.studyType === "FOCUS_GROUP",
    }),
    getPricingConfig(),
  ]);

  // Seul ce qui est affiché quitte le serveur : jamais le nom complet, la date
  // de naissance ou les réponses brutes du participant.
  const candidates: Candidate[] = study.applications.map((a) => {
    const slots = readSlots(a.proposedSlots);
    const p = a.participantProfile;
    const g = p.ghostFile;

    // Les repères sont ce qui situe la personne en un coup d'œil : ses marques,
    // son vocabulaire. On retire ce qui est déjà affiché ailleurs sur la fiche
    // pour ne pas répéter la ville, la génération ou l'expertise principale.
    const shown = new Set(
      [p.city, g?.generationTag, g?.primaryExpertise, ...(g?.secondaryExpertises ?? [])]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    );
    const refs = (g?.aiTags ?? []).filter((tag) => !shown.has(tag.toLowerCase()));

    const trust = trustFrom(p.applications);
    const pr = pricing.get(p.id);
    const badges = badgesForBrand(pr?.badges ?? []);
    const frozen = a.priceCredits;

    return {
      applicationId: a.id,
      status: a.status,
      name: `${p.firstName} ${p.lastName.slice(0, 1)}.`,
      age: age(p.dateOfBirth),
      city: p.city,
      profession: p.profession,
      participantProfileId: p.id,
      portrait: p.brandSummary,
      why: a.adminMatchNote,
      tier: p.accessTier,
      accessNote: p.accessNote,
      idVerified: p.idVerificationStatus === "VERIFIED",
      linkedinVerified: p.linkedinVerified,
      interviewsDone: trust.interviewsDone,
      attendance: trust.attendance,
      trust,
      badges,
      traits: (pr?.traits ?? []).filter((t) => t.state === "confirmed").map((t) => TRAIT_LABELS[t.id].name.fr),
      certScore: pr?.certScore ?? 0,
      price: pr ? {
        credits: frozen ?? pr.quote.credits,
        euros: (frozen ?? pr.quote.credits) * cfg.creditValueCents,
        tierLabel: cfg.tiers[pr.quote.tier].label,
        why: frozen
          ? ((a.priceBreakdown as { factors?: { label: string; factor: number }[] } | null)?.factors ?? []).map((f) => factorText({ key: "", ...f })).concat("Prix fixé quand le profil vous a été proposé")
          : pr.quote.factors.map(factorText),
      } : null,
      kind: g?.profileType ?? null,
      expertise: g?.primaryExpertise ?? null,
      alsoKnows: g?.secondaryExpertises ?? [],
      strengths: (g?.aiStrengths ?? []).slice(0, 3),
      references: refs,
      generation: g?.generationTag ?? null,
      scores: {
        expertise: g?.expertiseScore ?? null,
        vocabulaire: g?.vocabularyScore ?? null,
        authenticite: g?.authenticityScore ?? null,
      },
      step: a.status === "INVITED" ? schedulingStep(slots) : null,
      proposals: slots.filter((sl) => sl.proposedBy === "participant").map((sl) => sl.startTime),
      interview: a.interview ? {
        id: a.interview.id,
        scheduledAt: a.interview.scheduledAt.toISOString(),
        status: a.interview.status,
        transcriptReady: a.interview.transcriptStatus === "done",
        review: a.interview.brandRating
          ? { rating: a.interview.brandRating, tags: a.interview.brandReviewTags, comment: a.interview.brandFeedback }
          : null,
      } : null,
    };
  });

  return (
    <StudyDetailClient
      study={{
        id: study.id,
        title: study.title,
        status: study.status,
        isFocusGroup: study.studyType === "FOCUS_GROUP",
        target: study.targetParticipantCount,
        duration: study.interviewDuration,
        deadlineAt: study.deadlineAt?.toISOString() ?? null,
        hasReport: !!study.report,
      }}
      candidates={candidates}
      credits={brand?.credits ?? 0}
    />
  );
}
