"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./detect";

// Langue des espaces connectés, fournie par le cadre (AppShell) à toute la page.
const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** tt("Mes études", "My studies") : le texte dans la langue de la page. */
export function useTT() {
  const lang = useContext(LangContext);
  return (fr: string, en: string) => (lang === "en" ? en : fr);
}
