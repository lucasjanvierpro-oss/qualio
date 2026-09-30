"use client";

import { useRouter } from "next/navigation";
import LangSwitch from "@/components/i18n/LangSwitch";
import { saveMyLanguage } from "@/app/actions/lang";
import type { Lang } from "@/lib/i18n/detect";

/** Sélecteur de langue des espaces connectés : recharge la page et retient le choix pour les emails. */
export default function ShellLang({ lang }: { lang: Lang }) {
  const router = useRouter();
  return <LangSwitch lang={lang} onChange={(l) => { void saveMyLanguage(l).finally(() => router.refresh()); }} />;
}
