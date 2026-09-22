"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./rl.module.css";

export type NavItem = { href: string; label: string; exact?: boolean };

// Liens de navigation : le lien de la section courante est mis en évidence.
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Le lien le plus précis gagne : /brand/studies/new ne doit pas allumer /brand/studies.
  const active = items
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`${styles.navLink} ${i.href === active ? styles.navActive : ""}`} aria-current={i.href === active ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </>
  );
}
