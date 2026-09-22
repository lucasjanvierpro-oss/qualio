import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/rl/AppShell";
import s from "@/components/rl/rl.module.css";

const NAV = [
  { href: "/brand/dashboard", label: "Vue d'ensemble" },
  { href: "/brand/studies", label: "Mes études" },
  { href: "/brand/studies/new", label: "Nouvelle étude" },
  { href: "/brand/profiles", label: "Explorer le panel" },
  { href: "/brand/messages", label: "Messages" },
  { href: "/brand/account", label: "Compte et crédits" },
];

export default async function BrandLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <span className={`${s.small} ${s.muted}`}>Crédits disponibles</span>
        <strong style={{ fontSize: 22, letterSpacing: "-0.03em", color: credits < 3 ? "var(--wait)" : undefined }}>{credits}</strong>
      </div>
      <Link href="/brand/account" className={`${s.btn} ${s.btnGhost} ${s.btnSm} ${s.btnBlock}`}>Ajouter des crédits</Link>
    </>
  ) : (
    <>
      <span className={`${s.badge} ${s.badgeWait}`}>Accès en attente</span>
      <span className={`${s.small} ${s.muted}`}>Entrez votre code d&apos;accès pour lancer une étude.</span>
      <Link href="/brand/account" className={`${s.btn} ${s.btnSm} ${s.btnBlock}`}>Activer mon accès</Link>
    </>
  );

  return (
    <AppShell nav={NAV} subtitle={companyName} footer={footer}>
      {children}
    </AppShell>
  );
}
