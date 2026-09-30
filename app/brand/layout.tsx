import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/rl/AppShell";
import s from "@/components/rl/rl.module.css";
import { getLang } from "@/lib/i18n/server";
import { pickTT } from "@/lib/i18n/tt";

const NAV = (tt: (fr: string, en: string) => string) => [
  { href: "/brand/dashboard", label: tt("Vue d'ensemble", "Overview") },
  { href: "/brand/studies", label: tt("Mes études", "My studies") },
  { href: "/brand/studies/new", label: tt("Nouvelle étude", "New study") },
  { href: "/brand/profiles", label: tt("Explorer le panel", "Explore the panel") },
  { href: "/brand/messages", label: "Messages" },
  { href: "/brand/account", label: tt("Compte et crédits", "Account & credits") },
];

export default async function BrandLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const lang = await getLang();
  const tt = pickTT(lang);

  let isActivated = false;
  let credits = 0;
  let companyName = "";
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { brandProfile: { select: { isActivated: true, credits: true, companyName: true } } },
    });
    isActivated = dbUser?.brandProfile?.isActivated ?? false;
    credits = dbUser?.brandProfile?.credits ?? 0;
    companyName = dbUser?.brandProfile?.companyName ?? "";
  }

  const footer = isActivated ? (
    <>
      <div className={s.spread}>
        <span className={`${s.small} ${s.muted}`}>{tt("Crédits disponibles", "Available credits")}</span>
        <strong style={{ fontSize: 22, letterSpacing: "-0.03em", color: credits < 40 ? "var(--wait)" : undefined }}>{credits}</strong>
      </div>
      <Link href="/brand/account" className={`${s.btn} ${s.btnGhost} ${s.btnSm} ${s.btnBlock}`}>{tt("Ajouter des crédits", "Add credits")}</Link>
    </>
  ) : (
    <>
      <span className={`${s.badge} ${s.badgeWait}`}>{tt("Accès en attente", "Access pending")}</span>
      <span className={`${s.small} ${s.muted}`}>{tt("Entrez votre code d'accès pour lancer une étude.", "Enter your access code to launch a study.")}</span>
      <Link href="/brand/account" className={`${s.btn} ${s.btnSm} ${s.btnBlock}`}>{tt("Activer mon accès", "Activate my access")}</Link>
    </>
  );

  return (
    <AppShell nav={NAV(tt)} subtitle={companyName} footer={footer} lang={lang}>
      {children}
    </AppShell>
  );
}
