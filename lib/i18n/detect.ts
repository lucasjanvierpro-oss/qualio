export type Lang = "fr" | "en";

// Détection de langue : ?lang= dans l'URL > localStorage > langue du navigateur > fr
export function detectLanguage(): Lang {
  if (typeof window === "undefined") return "fr";
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("lang");
  if (forced === "en" || forced === "fr") return forced;
  const stored = localStorage.getItem("preferred_lang");
  if (stored === "en" || stored === "fr") return stored;
  const nav = navigator.language || "fr";
  return nav.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function setLanguage(lang: Lang) {
  if (typeof window !== "undefined") localStorage.setItem("preferred_lang", lang);
}
