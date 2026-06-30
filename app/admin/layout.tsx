import Link from "next/link";
import { ReactNode } from "react";

const NAV = [
  { href: "/admin",                label: "Vue d'ensemble" },
  { href: "/admin/studies",        label: "Études" },
  { href: "/admin/participants",   label: "Participants" },
  { href: "/admin/matching",       label: "Matching" },
  { href: "/admin/payments",       label: "Paiements" },
  { href: "/admin/verifications",  label: "Vérifications" },
  { href: "/admin/access",         label: "Accès clients" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0E0D0B" }}>
      {/* Sidebar */}
      <aside style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        background: "#161512",
        borderRight: "1px solid #252320",
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
              fontStyle: "italic",
              color: "#F8F7F4",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              Qualio
            </span>
          </Link>
          <div style={{
            marginTop: "5px",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "#4A4845",
          }}>
            Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 8px" }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "7px 12px",
                fontSize: "13px",
                fontWeight: 400,
                color: "#7A7875",
                textDecoration: "none",
                borderLeft: "2px solid transparent",
                letterSpacing: "0.005em",
                marginBottom: "1px",
                transition: "color 0.12s",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "20px", borderTop: "1px solid #252320" }}>
          <div style={{ fontSize: "12px", color: "#4A4845", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 500, color: "#7A7875", marginBottom: "2px" }}>Lucas Janvier</div>
            <div>Fondateur · Qualio</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", color: "#F8F7F4", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
