import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import WherebyRoom from "@/components/shared/WherebyRoom";

export const dynamic = "force-dynamic";

export default async function ParticipantInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { participantProfile: { select: { id: true, firstName: true } } },
  });
  if (!dbUser?.participantProfile) redirect("/participant/onboarding");

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { application: { include: { study: { select: { title: true } } } } },
  });

  // Sécurité : le participant ne peut ouvrir que son propre entretien.
  if (!interview || interview.application.participantProfileId !== dbUser.participantProfile.id) notFound();

  const scheduled = interview.scheduledAt;
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(scheduled);

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 32px 64px" }}>
      <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "18px", display: "flex", gap: "8px" }}>
        <Link href="/participant/dashboard" style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}>Mes études</Link>
        <span>›</span><span style={{ color: "var(--color-plum)" }}>Entretien</span>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p className="q-label" style={{ marginBottom: "8px", color: "var(--color-accent)" }}>Entretien en visio</p>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-plum-deep)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          {interview.application.study.title}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{fmt} · {interview.durationMinutes} min</p>
      </div>

      {interview.videoLink ? (
        <WherebyRoom roomUrl={interview.videoLink} displayName={dbUser.participantProfile.firstName} />
      ) : (
        <div className="q-card" style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>La salle n'est pas encore prête. Revenez à l'heure de l'entretien.</p>
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "14px", textAlign: "center" }}>
        🔒 L'entretien peut être enregistré pour produire la synthèse de l'étude. Votre identité n'est jamais partagée avec la marque.
      </p>
    </div>
  );
}
