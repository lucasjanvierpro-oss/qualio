import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./rl.module.css";
import { rlFont } from "./font";
import NavLinks, { type NavItem } from "./NavLinks";
import ShellLang from "./ShellLang";
import { LangProvider } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/detect";

// Cadre commun des espaces connectés : barre latérale sur ordinateur,
// barre de navigation défilante sur mobile.
export default function AppShell({
  nav, subtitle, footer, children, lang = "fr",
}: {
  nav: NavItem[];
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  lang?: Lang;
}) {
  return (
    <div className={`${styles.root} ${rlFont.className} ${styles.shell}`}>
      <aside className={styles.side}>
        <Link href="/" className={styles.sideBrand}>
          <Image src="/brand/logo.png" alt="" width={26} height={26} />Rarelyst
        </Link>
        {subtitle && <div className={styles.sideSub}>{subtitle}</div>}
        <nav className={styles.nav} aria-label={lang === "en" ? "Main navigation" : "Navigation principale"}><NavLinks items={nav} /></nav>
        {footer && <div className={styles.sideFoot}>{footer}</div>}
        <div style={{ padding: "0 12px 16px" }}><ShellLang lang={lang} /></div>
      </aside>
      <div className={styles.main}>
        <div className={styles.mobileBar}>
          <Link href="/" className={styles.sideBrand} style={{ padding: 0 }}>
            <Image src="/brand/logo.png" alt="" width={22} height={22} />
          </Link>
          <ShellLang lang={lang} />
          <nav aria-label={lang === "en" ? "Main navigation" : "Navigation principale"}><NavLinks items={nav} /></nav>
        </div>
        <LangProvider lang={lang}>{children}</LangProvider>
      </div>
    </div>
  );
}
