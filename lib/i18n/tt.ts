import type { Lang } from "./detect";

/** Côté serveur : const tt = pickTT(await getLang()); tt("Mes études", "My studies"). */
export const pickTT = (lang: Lang) => (fr: string, en: string) => (lang === "en" ? en : fr);

/** Dates et nombres dans la langue de la page. */
export const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "fr-FR");
