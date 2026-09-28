import { cookies, headers } from "next/headers";
import { LANG_COOKIE, isLang, langFromAcceptLanguage, type Lang } from "./detect";

/** Langue de la requête : choix enregistré, sinon celle du navigateur, sinon français. */
export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const saved = jar.get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const h = await headers();
  return langFromAcceptLanguage(h.get("accept-language")) ?? "fr";
}
