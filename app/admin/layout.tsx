import Link from "next/link";
import { ReactNode } from "react";
import a from "./admin.module.css";

// Relancer une analyse IA depuis l'admin la fait tourner après la réponse.
export const maxDuration = 300;

const NAV = [
  { href: "/admin",                label: "Pilotage" },
  { href: "/admin/demo",           label: "Lancer une démo" },
  { href: "/admin/prix",           label: "Prix" },
  { href: "/admin/labo",           label: "Labo" },
  { href: "/admin/demos",          label: "Démos" },
  { href: "/admin/studies",        label: "Études" },
  { href: "/admin/participants",   label: "Participants" },
  { href: "/admin/sourcing",       label: "Sourcing" },
  { href: "/admin/reponses",       label: "Réponses à valider" },
  { href: "/admin/matching",       label: "Matching" },
  { href: "/admin/payments",       label: "Paiements" },
  { href: "/admin/invoices",       label: "Factures" },
  { href: "/admin/verifications",  label: "Vérifications" },
  { href: "/admin/access",         label: "Accès clients" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Sur téléphone, le menu latéral devient une barre défilante en haut
  // (sinon il mangeait 200 px et coupait tout le contenu).
  return (
    <div className={a.shell}>
      <aside className={a.side}>
        <div className={a.sideLogo}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className={a.sideWordmark}>Rarelyst</span>
          </Link>
          <div className={a.sideTag}>Admin</div>
        </div>

        <nav className={a.sideNav}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={a.sideLink}>{item.label}</Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={a.sideFoot}>
          <div style={{ fontSize: "12px", color: "#4A4845", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 500, color: "#7A7875", marginBottom: "2px" }}>Lucas Janvier</div>
            <div>Fondateur · Rarelyst</div>
          </div>
        </div>
      </aside>
      <main className={a.adminMain}>{children}</main>
    </div>
  );
}
