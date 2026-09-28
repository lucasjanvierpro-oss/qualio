"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import SocialSignIn from "@/components/auth/SocialSignIn";
import EmailCodeSignIn from "@/components/auth/EmailCodeSignIn";
import LoginNotice from "@/components/auth/LoginNotice";
import LangSwitch from "@/components/i18n/LangSwitch";
import Hallmark from "@/components/brand/Hallmark";
import Medallion from "@/components/badges/Medallion";
import type { Lang } from "@/lib/i18n/detect";
import l from "./login.module.css";

// Connexion : le formulaire à gauche, à droite les deux espaces qui attendent
// derrière (maison et participant). Mêmes couleurs que l'inscription marque.

const T = {
  fr: {
    eyebrow: "Connexion", title: "Bon retour sur Rarelyst", lead: "Marques et participants se connectent ici : vous arrivez directement dans votre espace.",
    social: "En un clic", or: "ou avec votre email", email: "Email", password: "Mot de passe", forgot: "Mot de passe oublié ? Recevez un code à la place.",
    submit: "Se connecter", loading: "Connexion…", noAccount: "Pas encore de compte ?", brand: "Je suis une marque", participant: "Je veux participer",
    emailRequired: "Indiquez votre email et votre mot de passe.",
    house: { top: "Maison", name: "Maison Démo", studies: "3 études en cours", profiles: "12 profils proposés", title: "Votre espace marque" },
    member: { top: "Membre", role: "Acheteuse luxe · Paris", next: "Prochain entretien", nextV: "Jeudi · 180 €", title: "Votre espace participant" },
    errors: {} as Record<string, string>,
  },
  en: {
    eyebrow: "Log in", title: "Welcome back to Rarelyst", lead: "Brands and participants log in here: you land straight in your own space.",
    social: "One click", or: "or with your email", email: "Email", password: "Password", forgot: "Forgot your password? Get a code instead.",
    submit: "Log in", loading: "Logging in…", noAccount: "No account yet?", brand: "I'm a brand", participant: "I want to take part",
    emailRequired: "Enter your email and password.",
    house: { top: "House", name: "Maison Démo", studies: "3 studies running", profiles: "12 profiles suggested", title: "Your brand space" },
    member: { top: "Member", role: "Luxury shopper · Paris", next: "Next interview", nextV: "Thursday · €180", title: "Your participant space" },
    // Les messages du serveur sont en français : on traduit les connus.
    errors: {
      "Email ou mot de passe incorrect": "Wrong email or password.",
      "Votre adresse n'est pas encore confirmée. Un nouveau lien vient de vous être envoyé : vérifiez votre boîte mail.": "Your address isn't confirmed yet. We've just sent you a new link: check your inbox.",
    } as Record<string, string>,
  },
};

export default function LoginClient({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { setError(t.emailRequired); return; }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", email.trim());
    fd.set("password", password);
    const r = await login(fd);
    if (r?.error) {
      setError(t.errors[r.error] ?? r.error);
      setLoading(false);
    }
  }

  return (
    <div className={l.root} lang={lang}>
      <header className={l.top}>
        <Link href={lang === "en" ? "/en" : "/"} className={l.brand}>
          <Image src="/brand/logo.png" alt="" width={26} height={26} priority />Rarelyst
        </Link>
        <LangSwitch lang={lang} />
      </header>

      <div className={l.layout}>
        <main className={l.main}>
          <p className={l.eyebrow}>{t.eyebrow}</p>
          <h1 className={l.h1}>{t.title}</h1>
          <p className={l.lead}>{t.lead}</p>

          <Suspense fallback={null}><LoginNotice lang={lang} className={l.notice} /></Suspense>

          <div className={l.socials}>
            <SocialSignIn label={t.social} lang={lang} />
          </div>
          <div className={l.divider}>{t.or}</div>

          <form className={l.form} onSubmit={submit}>
            <div>
              <label className={l.label} htmlFor="email">{t.email}</label>
              <input id="email" type="email" autoComplete="email" className={l.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={lang === "en" ? "you@company.com" : "vous@entreprise.com"} />
            </div>
            <div>
              <label className={l.label} htmlFor="password">{t.password}</label>
              <input id="password" type="password" autoComplete="current-password" className={l.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className={l.error}>{error}</p>}
            <button type="submit" className={l.btn} disabled={loading}>{loading ? t.loading : t.submit}</button>
          </form>

          <div className={l.code}>
            <p>{t.forgot}</p>
            <EmailCodeSignIn lang={lang} />
          </div>

          <div className={l.signup}>
            <span>{t.noAccount}</span>
            <Link href="/signup/brand" className={l.pill}>{t.brand} →</Link>
            <Link href="/signup/participant" className={l.pill}>{t.participant} →</Link>
          </div>
        </main>

        <aside className={l.aside} aria-hidden="true">
          <div className={l.stack}>
            <div className={l.house}>
              <div className={l.cardTop}><span>Rarelyst</span><span>{t.house.top}</span></div>
              <div className={l.houseRow}>
                <Hallmark level={3} size={92} initial="M" />
                <span><b>{t.house.name}</b><small>{t.house.studies}</small><small>{t.house.profiles}</small></span>
              </div>
              <span className={l.cardTitle}>{t.house.title}</span>
            </div>
            <div className={l.member}>
              <div className={l.cardTop}><span>Rarelyst</span><span>{t.member.top}</span></div>
              <b className={l.memberName}>Camille R.</b>
              <small className={l.memberRole}>{t.member.role}</small>
              <div className={l.medals}>
                <Medallion id="verifie" size={36} lang={lang} />
                <Medallion id="linkedin" size={36} lang={lang} />
                <Medallion id="recommande" size={36} lang={lang} />
              </div>
              <div className={l.next}><small>{t.member.next}</small><b>{t.member.nextV}</b></div>
              <span className={l.cardTitle}>{t.member.title}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
