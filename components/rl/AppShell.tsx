import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./rl.module.css";
import { rlFont } from "./font";
import NavLinks, { type NavItem } from "./NavLinks";

// Cadre commun des espaces connectés : barre latérale sur ordinateur,
// barre de navigation défilante sur mobile.
export default function AppShell({
  nav, subtitle, footer, children,
}: {
  nav: NavItem[];
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.root} ${rlFont.className} ${styles.shell}`}>
      <aside className={styles.side}>
        <Link href="/" className={styles.sideBrand}>
          <Image src="/brand/logo.png" alt="" width={26} height={26} />Rarelyst
        </Link>
        {subtitle && <div className={styles.sideSub}>{subtitle}</div>}
        <nav className={styles.nav} aria-label="Navigation principale"><NavLinks items={nav} /></nav>
        {footer && <div className={styles.sideFoot}>{footer}</div>}
      </aside>
      <div className={styles.main}>
        <div className={styles.mobileBar}>
          <Link href="/" className={styles.sideBrand} style={{ padding: 0 }}>
            <Image src="/brand/logo.png" alt="" width={22} height={22} />
          </Link>
          <nav aria-label="Navigation principale"><NavLinks items={nav} /></nav>
        </div>
        {children}
      </div>
    </div>
  );
}
