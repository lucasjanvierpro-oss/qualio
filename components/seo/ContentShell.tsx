import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { rlFont } from "@/components/rl/font";
import s from "./content.module.css";

// Cadre des guides : en-tête, pied de page, langue de la page.
const T = {
  fr: { guides: "Guides", pricing: "Tarifs", demo: "Démo", home: "/", cta: "Demander une étude", join: "Rejoindre le panel", legal: "Mentions légales", privacy: "Confidentialité", tagline: "Recrutement de participants pour études qualitatives · mode, luxe, beauté" },
  en: { guides: "Guides", pricing: "Pricing", demo: "Demo", home: "/en", cta: "Start a study", join: "Join the panel", legal: "Legal notice", privacy: "Privacy", tagline: "Participant recruitment for qualitative research · fashion, luxury, beauty" },
};

export default function ContentShell({ lang, audience = "marques", children }: { lang: "fr" | "en"; audience?: "marques" | "participants"; children: ReactNode }) {
  const t = T[lang];
  const home = t.home;
  return (
    <div className={`${s.root} ${rlFont.className}`} lang={lang}>
      <header className={s.top}>
        <div className={s.topInner}>
          <Link href={home} className={s.brand}><Image src="/brand/logo.png" alt="" width={24} height={24} />Rarelyst</Link>
          <nav className={s.nav}>
            <Link href={lang === "en" ? "/en/guides" : "/guides"}>{t.guides}</Link>
            <Link href="/pricing">{t.pricing}</Link>
            <Link href={lang === "en" ? "/en#demo" : "/#demo"}>{t.demo}</Link>
          </nav>
          <Link className={s.cta} href={audience === "participants" ? "/signup/participant" : "/signup/brand"}>{audience === "participants" ? t.join : t.cta} →</Link>
        </div>
      </header>
      {children}
      <footer className={s.foot}>
        <div className={s.footInner}>
          <span>© {new Date().getFullYear()} Rarelyst</span>
          <Link href={home}>rarelyst.co</Link>
          <Link href={lang === "en" ? "/en/guides" : "/guides"}>{t.guides}</Link>
          <Link href="/mentions-legales">{t.legal}</Link>
          <Link href="/confidentialite">{t.privacy}</Link>
          <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>
          <a href="https://www.linkedin.com/company/rarelyst" rel="me noopener" target="_blank">LinkedIn</a>
          <span>{t.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
