import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const NAV = [
  { href: "/participant/dashboard",     label: "Vue d'ensemble" },
  { href: "/participant/studies",       label: "Études disponibles" },
  { href: "/participant/profile",       label: "Mon profil" },
  { href: "/participant/verification",  label: "Vérification ID" },
  { href: "/participant/wallet",        label: "Mes récompenses" },
  { href: "/participant/settings",      label: "Paramètres" },
];

export default async function ParticipantLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let firstName = "";
  let verificationStatus = "";

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { participantProfile: { select: { firstName: true, idVerificationStatus: true } } },
    });
    firstName = dbUser?.participantProfile?.firstName ?? "";
    verificationStatus = dbUser?.participantProfile?.idVerificationStatus ?? "";
  }

  const initial = firstName?.[0]?.toUpperCase() ?? "P";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border-base)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 20px 24px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: 400,
              fontStyle: "normal",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              Qualio
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 8px" }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="q-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile footer */}
        <div style={{ padding: "20px", borderTop: "1px solid var(--color-border-base)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {firstName || "Profil"}
              </div>
              <div style={{ fontSize: "11px", color: verificationStatus === "VERIFIED" ? "var(--color-success)" : "var(--color-text-tertiary)" }}>
                {verificationStatus === "VERIFIED" ? "Vérifié ✓" : verificationStatus === "PENDING" ? "Vérification en cours" : "Non vérifié"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
