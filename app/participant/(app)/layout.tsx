import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/rl/AppShell";
import s from "@/components/rl/rl.module.css";
import { getLang } from "@/lib/i18n/server";
import { pickTT } from "@/lib/i18n/tt";

const NAV = (tt: (fr: string, en: string) => string) => [
  { href: "/participant/dashboard", label: tt("Vue d'ensemble", "Overview") },
  { href: "/participant/studies", label: tt("Mes études", "My studies") },
  { href: "/participant/profile", label: tt("Mon profil", "My profile") },
  { href: "/participant/verification", label: tt("Vérification", "Verification") },
  { href: "/participant/wallet", label: tt("Mes gains", "My earnings") },
  { href: "/participant/parrainage", label: tt("Parrainage", "Referrals") },
  { href: "/participant/settings", label: tt("Paramètres", "Settings") },
];

const VERIFICATION = (tt: (fr: string, en: string) => string): Record<string, { label: string; tone: string }> => ({
  VERIFIED: { label: tt("Identité vérifiée", "Identity verified"), tone: s.badgeOk },
  PENDING: { label: tt("Vérification en cours", "Verification in progress"), tone: s.badgeWait },
  REJECTED: { label: tt("Vérification refusée", "Verification declined"), tone: s.badgeBad },
});

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const lang = await getLang();
  const tt = pickTT(lang);

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
  const v = VERIFICATION(tt)[verification];

  const footer = (
    <div className={s.sideMeta}>
      <span className={s.avatar}>{(firstName[0] ?? "R").toUpperCase()}</span>
      <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
        <strong style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName || tt("Mon profil", "My profile")}</strong>
        {v && <span className={`${s.badge} ${v.tone}`} style={{ justifySelf: "start" }}>{v.label}</span>}
      </span>
    </div>
  );

  return (
    <AppShell nav={NAV(tt)} footer={footer} lang={lang}>
      {children}
    </AppShell>
  );
}
