import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { sendAvailabilityProposed } from "@/lib/resend/emails";
import type { Slot } from "@/lib/interviews/schedule";

const MIN_LEAD_MS = 12 * 3600_000; // la marque doit avoir le temps de choisir

// Le participant propose ses créneaux pour un entretien individuel.
// La marque s'adapte : elle choisira l'un d'eux (voir choose-slot).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me?.participantProfileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { slots, consent } = (await req.json()) as { slots?: string[]; consent?: boolean };

  if (consent !== true) {
    return NextResponse.json({ error: "Merci d'accepter l'enregistrement de l'entretien pour continuer." }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      participantProfile: { select: { firstName: true } },
      study: { include: { brandProfile: { include: { user: { select: { email: true } } } } } },
    },
  });
  if (!application || application.participantProfileId !== me.participantProfileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (application.status !== "INVITED") {
    return NextResponse.json({ error: "Cette invitation n'attend plus de disponibilités." }, { status: 409 });
  }

  const now = Date.now();
  const unique = [...new Set((slots ?? []).map((s) => new Date(s)).filter((d) => !Number.isNaN(d.getTime())).map((d) => d.toISOString()))];
  if (unique.length < 1 || unique.length > 5) {
    return NextResponse.json({ error: "Proposez entre 1 et 5 créneaux." }, { status: 400 });
  }
  if (unique.some((s) => new Date(s).getTime() < now + MIN_LEAD_MS)) {
    return NextResponse.json({ error: "Chaque créneau doit commencer au moins 12 heures après maintenant." }, { status: 400 });
  }

  const proposed: Slot[] = unique.sort().map((startTime) => ({ startTime, proposedBy: "participant" }));
  await prisma.application.update({
    where: { id },
    data: { proposedSlots: proposed, recordingConsentAt: new Date() },
  });

  const brand = application.study.brandProfile;
  await sendAvailabilityProposed(
    brand.user.email, brand.contactFirstName ?? "", application.participantProfile.firstName,
    application.study.title, application.studyId, proposed.map((s) => new Date(s.startTime)),
  ).catch(() => null);

  return NextResponse.json({ ok: true, slots: proposed });
}
