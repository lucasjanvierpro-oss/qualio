import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/rl/AppShell";
import s from "@/components/rl/rl.module.css";

const NAV = [
  { href: "/participant/dashboard", label: "Vue d'ensemble" },
  { href: "/participant/studies", label: "Mes études" },
  { href: "/participant/profile", label: "Mon profil" },
  { href: "/participant/verification", label: "Vérification" },
  { href: "/participant/wallet", label: "Mes gains" },
  { href: "/participant/settings", label: "Paramètres" },
];

const VERIFICATION: Record<string, { label: string; tone: string }> = {
  VERIFIED: { label: "Identité vérifiée", tone: s.badgeOk },
  PENDING: { label: "Vérification en cours", tone: s.badgeWait },
  REJECTED: { label: "Vérification refusée", tone: s.badgeBad },
};

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let firstName = "";
  let verification = "";
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { participantProfile: { select: { firstName: true, idVerificationStatus: true } } },
    });
    firstName = dbUser?.participantProfile?.firstName ?? "";
    verification = dbUser?.participantProfile?.idVerificationStatus ?? "";
  }
  const v = VERIFICATION[verification];

  const footer = (
    <div className={s.sideMeta}>
      <span className={s.avatar}>{(firstName[0] ?? "R").toUpperCase()}</span>
      <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
        <strong style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName || "Mon profil"}</strong>
        {v && <span className={`${s.badge} ${v.tone}`} style={{ justifySelf: "start" }}>{v.label}</span>}
      </span>
    </div>
  );

  return (
    <AppShell nav={NAV} footer={footer}>
      {children}
    </AppShell>
  );
}
