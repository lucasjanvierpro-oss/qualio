import Link from "next/link";
import LoupeMascot from "@/components/brand/LoupeMascot";
import { getLang } from "@/lib/i18n/server";
import css from "./not-found.module.css";

// Page introuvable : même la loupe ne la trouve pas.
const T = {
  fr: { kicker: "Erreur 404", title: "Cette page s'est bien cachée.", text: "Même notre loupe ne la trouve pas. Le lien est peut-être ancien, ou mal recopié.", home: "Retour à l'accueil", login: "Me connecter" },
  en: { kicker: "Error 404", title: "This page is well hidden.", text: "Even our magnifier can't find it. The link may be old, or mistyped.", home: "Back to home", login: "Log in" },
};

export default async function NotFound() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <main className={css.page} lang={lang}>
      <div className={css.stage}>
        <span className={css.shadow} aria-hidden="true" />
        <LoupeMascot size={150} mood="puzzled" className={css.loupe} />
      </div>
      <p className={css.kicker}>{t.kicker}</p>
      <h1 className={css.title}>{t.title}</h1>
      <p className={css.text}>{t.text}</p>
      <div className={css.actions}>
        <Link className={css.btn} href={lang === "en" ? "/en" : "/"}>{t.home} →</Link>
        <Link className={css.ghost} href="/login">{t.login}</Link>
      </div>
    </main>
  );
}
