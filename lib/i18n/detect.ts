// Langue du site : un cookie lisible des deux côtés (serveur et navigateur).
// Ordre de priorité côté navigateur : ?lang= dans l'URL > cookie > ancien
// réglage local > langue du navigateur > français.

export type Lang = "fr" | "en";

export const LANG_COOKIE = "rl_lang";
export const isLang = (v: unknown): v is Lang => v === "fr" || v === "en";

/** Première langue connue dans un en-tête Accept-Language, ou null. */
export function langFromAcceptLanguage(header: string | null | undefined): Lang | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

function readCookie(): Lang | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=(fr|en)`));
  return m ? (m[1] as Lang) : null;
}

export function detectLanguage(): Lang {
  if (typeof window === "undefined") return "fr";
  const forced = new URLSearchParams(window.location.search).get("lang");
  if (isLang(forced)) return forced;
  const cookie = readCookie();
  if (cookie) return cookie;
  try {
    const stored = localStorage.getItem("preferred_lang");
    if (isLang(stored)) return stored;
  } catch { /* stockage indisponible */ }
  return (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

export function setLanguage(lang: Lang) {
  if (typeof window === "undefined") return;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  try { localStorage.setItem("preferred_lang", lang); } catch { /* stockage indisponible */ }
}
