import Link from "next/link";
import type { ReactNode } from "react";
import { rlFont } from "@/components/rl/font";
import s from "./legal.module.css";

/**
 * Cadre commun aux trois pages légales.
 *
 * Elles doivent rester accessibles sans compte : Google les consulte pour
 * publier l'application OAuth, et un participant doit pouvoir les lire avant
 * de s'inscrire, pas après. Les chemins sont donc listés dans PUBLIC_ROUTES
 * de proxy.ts — sans ça, elles redirigent vers la page de connexion.
 */

const PAGES = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${s.root} ${rlFont.className}`}>
      <header className={s.top}>
        <div className={s.topInner}>
          <Link href="/" className={s.wordmark}>Rarelyst</Link>
          <nav className={s.tabs}>
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} className={s.tab}>{p.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      {children}

      <footer className={s.foot}>
        <div className={s.footInner}>
          <span>© {new Date().getFullYear()} Rarelyst</span>
          <Link href="/">Accueil</Link>
          <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>
          <span className={s.spacer}>Plateforme de recrutement pour études qualitatives</span>
        </div>
      </footer>
    </div>
  );
}
