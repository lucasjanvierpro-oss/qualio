import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const NAV = [
  { href: "/brand/dashboard",   label: "Vue d'ensemble" },
  { href: "/brand/studies",     label: "Études" },
  { href: "/brand/studies/new", label: "Nouvelle étude" },
  { href: "/brand/profiles",    label: "Explorer les profils" },
  { href: "/brand/messages",    label: "Messages" },
  { href: "/brand/account",     label: "Compte & crédits" },
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
      include: { brandProfile: true },
    });
    isActivated = dbUser?.brandProfile?.isActivated ?? false;
    credits = dbUser?.brandProfile?.credits ?? 0;
    companyName = dbUser?.brandProfile?.companyName ?? "";
  }

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
          <Link href="/" style={{ textDecoration: "none", display: "block" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              Qualio
            </span>
          </Link>
          {companyName && (
            <div style={{
              marginTop: "6px",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {companyName}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 8px" }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="q-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Credits / activation */}
        <div style={{ padding: "20px", borderTop: "1px solid var(--color-border-base)" }}>
          {isActivated ? (
            <div>
              <div style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "var(--color-text-tertiary)",
                marginBottom: "6px",
              }}>
                Crédits
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                <span style={{
                  fontFamily: "var(--font-mono-base)",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: credits < 3 ? "var(--color-warning)" : "var(--color-text-primary)",
                  lineHeight: 1,
                }}>
                  {credits}
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>disponibles</span>
              </div>
              <Link href="/brand/account" style={{
                fontSize: "12px",
                color: "var(--color-accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}>
                Acheter des crédits →
              </Link>
            </div>
          ) : (
            <div style={{
              padding: "12px",
              background: "var(--color-warning-light)",
              border: "1px solid var(--color-warning)",
              borderRadius: "3px",
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                Accès preview
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-warning)", lineHeight: 1.5, marginBottom: "8px" }}>
                Entrez un code d'accès pour débloquer la plateforme.
              </div>
              <Link href="/brand/account" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-warning)", textDecoration: "none" }}>
                Activer →
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {!isActivated && (
          <div style={{
            background: "var(--color-warning-light)",
            borderBottom: "1px solid var(--color-warning)",
            padding: "11px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "13px", color: "var(--color-warning)", fontWeight: 500 }}>
              Accès preview — études non disponibles sans code d'activation.
            </span>
            <Link href="/brand/account" style={{
              padding: "6px 14px",
              background: "var(--color-warning)",
              color: "#fff",
              borderRadius: "2px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}>
              Activer →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
