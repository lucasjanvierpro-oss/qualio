"use client";

import { useRouter } from "next/navigation";
import { setLanguage, type Lang } from "@/lib/i18n/detect";
import css from "./langSwitch.module.css";

/**
 * Sélecteur FR / EN, comme sur la plupart des grands sites : deux lettres,
 * la langue en cours en évidence. `hrefs` renvoie vers l'adresse de chaque
 * langue (page d'accueil) ; sans lui, la page se recharge dans la langue choisie.
 */
export default function LangSwitch({ lang, hrefs, onChange, tone = "light" }: {
  lang: Lang;
  hrefs?: Record<Lang, string>;
  onChange?: (l: Lang) => void;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  function pick(l: Lang) {
    if (l === lang) return;
    setLanguage(l);
    onChange?.(l);
    if (hrefs) router.push(hrefs[l]);
    else if (!onChange) router.refresh();
  }
  return (
    <div className={css.switch} data-tone={tone} role="group" aria-label={lang === "fr" ? "Langue" : "Language"}>
      {(["fr", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => pick(l)}
          title={l === "fr" ? "Français" : "English"}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
