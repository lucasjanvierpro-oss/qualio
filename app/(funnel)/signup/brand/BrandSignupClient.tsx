"use client";

import { useState } from "react";
import Link from "next/link";
import { signupBrand } from "@/app/actions/auth";
import SocialSignIn from "@/components/auth/SocialSignIn";
import Hallmark from "@/components/brand/Hallmark";
import { CERT_TITLES, companyFromDomain, emailDomain, isProDomain } from "@/lib/brands/certification";
import LangSwitch from "@/components/i18n/LangSwitch";
import type { Lang } from "@/lib/i18n/detect";
import b from "./brand.module.css";

// Inscription marque : quatre champs. À droite, la carte de la maison se
// remplit pendant la saisie et le poinçon se frappe dès que l'adresse est
// reconnue comme professionnelle. Le secteur et le poste se complètent plus tard.

const ICONS = [
  "M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z M8.6 12.2l2.4 2.4 4.6-4.9",
  "M4 7h16v12H4z M4 11h16 M8 15h3",
  "M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3",
];

const T = {
  fr: {
    haveAccount: "Déjà un compte ?", login: "Se connecter", eyebrow: "Compte marque",
    h1: "Interrogez les profils que les panels ne trouvent pas",
    lead: "Une minute pour créer le compte. Votre maison est vérifiée dans la foulée, par son domaine et le registre officiel.",
    social: "En un clic, avec votre compte professionnel", or: "ou avec un mot de passe",
    email: "Email professionnel", proOk: (d: string) => `✓ Adresse sur le domaine ${d} : poinçon I obtenu.`,
    proNo: "Une adresse Gmail, Outlook ou Orange ne prouve pas votre maison. Préférez l'adresse de votre société.",
    company: "Marque", first: "Votre prénom", password: "Mot de passe", min8: "8 caractères minimum",
    loading: "Création du compte…", submit: "Créer le compte de ma maison",
    legal: <>En créant un compte, vous acceptez les <Link href="/conditions">conditions</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>. Vous êtes participant·e ? <Link href="/signup/participant">Inscription ici</Link>.</>,
    card: "Maison", yourHouse: "Votre maison", personal: "Adresse personnelle", domain: "votre-domaine.com",
    hallmark: (roman: string) => `Poinçon ${roman}`, noHallmark: "Sans poinçon", hallmarkText: "Les participants voient ce poinçon sur vos invitations, jamais votre nom.",
    steps: [
      ["Adresse pro", "votre email est sur le domaine de la société."],
      ["Domaine prouvé", "à la première connexion : lien de confirmation, Google ou LinkedIn."],
      ["Maison vérifiée", "votre société retrouvée au registre officiel, en trente secondes."],
    ],
    perks: [
      ["Des profils prouvés, pas déclarés", "Identité, emploi, LinkedIn et CV vérifiés : chaque fiche dit ce qui a été contrôlé."],
      ["Vous payez le profil, pas un abonnement", "Dès 390 € HT l'entretien de 45 minutes. Le prix de chaque profil s'affiche avant que vous l'acceptiez."],
      ["Tout est inclus", "Salle de visio, enregistrement, transcription et synthèse de l'étude."],
    ],
  },
  en: {
    haveAccount: "Already have an account?", login: "Log in", eyebrow: "Brand account",
    h1: "Interview the people panels can't find",
    lead: "One minute to create your account. Your house is verified right after, through its domain and the official company register.",
    social: "One click, with your work account", or: "or with a password",
    email: "Work email", proOk: (d: string) => `✓ Address on ${d}: hallmark I earned.`,
    proNo: "A Gmail, Outlook or Yahoo address doesn't prove your house. Use your company address instead.",
    company: "Brand", first: "Your first name", password: "Password", min8: "At least 8 characters",
    loading: "Creating your account…", submit: "Create my house's account",
    legal: <>By creating an account, you accept the <Link href="/conditions">terms</Link> and the <Link href="/confidentialite">privacy policy</Link>. Are you a participant? <Link href="/signup/participant">Sign up here</Link>.</>,
    card: "House", yourHouse: "Your house", personal: "Personal address", domain: "your-domain.com",
    hallmark: (roman: string) => `Hallmark ${roman}`, noHallmark: "No hallmark", hallmarkText: "Participants see this hallmark on your invitations, never your name.",
    steps: [
      ["Work address", "your email is on the company's domain."],
      ["Domain proven", "on first login: confirmation link, Google or LinkedIn."],
      ["Verified house", "your company found in the official register, in thirty seconds."],
    ],
    perks: [
      ["Proven profiles, not self-declared", "ID, employment, LinkedIn and CV verified: every profile says what was checked."],
      ["Pay per profile, not a subscription", "From €390 excl. VAT per 45-minute interview. Each profile's price is shown before you accept it."],
      ["Everything included", "Video room, recording, transcript and study synthesis."],
    ],
  },
};

export default function BrandSignupClient({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [companyTouched, setCompanyTouched] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const domain = emailDomain(email);
  const complete = email.includes("@") && domain.includes(".");
  const pro = complete && isProDomain(domain);
  const suggested = pro ? companyFromDomain(domain) : "";
  const companyValue = companyTouched ? company : company || suggested;
  const ok = complete && password.length >= 8 && companyValue.trim().length >= 2 && firstName.trim();
  const level = pro ? 1 : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("email", email.trim());
    fd.set("password", password);
    fd.set("companyName", companyValue.trim());
    fd.set("contactFirstName", firstName.trim());
    const r = await signupBrand(fd);
    if (r?.error) { setError(r.error); setLoading(false); }
  }

  return (
    <div className={b.root}>
      <header className={b.top}>
        <Link href="/" className={b.brand}>Rarelyst</Link>
        <nav className={b.topLinks}>
          <span>{t.haveAccount} <Link href="/login">{t.login}</Link></span>
          <LangSwitch lang={lang} />
        </nav>
      </header>

      <div className={b.layout}>
        <main className={b.main}>
          <p className={b.eyebrow}>{t.eyebrow}</p>
          <h1 className={b.h1}>{t.h1}</h1>
          <p className={b.lead}>{t.lead}</p>

          <SocialSignIn role="BRAND" label={t.social} lang={lang} />
          <div className={b.divider}>{t.or}</div>

          <form onSubmit={submit} className={b.form}>
            <div>
              <label className={b.label} htmlFor="email">{t.email}</label>
              <input id="email" type="email" autoComplete="email" className={b.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@maison.com" />
              {complete && (
                <div className={b.hint} data-ok={pro}>
                  {pro ? t.proOk(domain) : t.proNo}
                </div>
              )}
            </div>
            <div className={b.row}>
              <div>
                <label className={b.label} htmlFor="company">{t.company}</label>
                <input id="company" className={b.input} value={companyValue} placeholder="Lacoste"
                  onChange={(e) => { setCompanyTouched(true); setCompany(e.target.value); }} />
              </div>
              <div>
                <label className={b.label} htmlFor="first">{t.first}</label>
                <input id="first" autoComplete="given-name" className={b.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sophie" />
              </div>
            </div>
            <div>
              <label className={b.label} htmlFor="pw">{t.password}</label>
              <input id="pw" type="password" autoComplete="new-password" className={b.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.min8} />
            </div>

            {error && <p className={b.error}>{error}</p>}

            <button type="submit" className={b.btn} disabled={!ok || loading}>
              {loading ? t.loading : t.submit}
            </button>
            <p className={b.legal}>{t.legal}</p>
          </form>
        </main>

        <aside className={b.aside}>
          <div className={b.card}>
            <div className={b.cardTop}><span>Rarelyst</span><span>{t.card}</span></div>
            <div className={b.cardName}>{companyValue || t.yourHouse}</div>
            <div className={b.cardDomain}>{pro ? domain : complete ? t.personal : t.domain}</div>
            <div className={b.stamp} data-level={level}>
              <Hallmark key={level} level={level} size={130} initial={companyValue || "R"} />
              <span className={b.stampText}>
                <b>{level ? t.hallmark(CERT_TITLES[1].roman) : t.noHallmark}</b>
                {t.hallmarkText}
              </span>
            </div>
            <ol className={b.steps}>
              {t.steps.map(([title, text], i) => (
                <li key={title} className={b.step} data-done={i === 0 ? pro : false}><span className={b.roman}>{["I", "II", "III"][i]}</span><span><b>{title}</b> · {text}</span></li>
              ))}
            </ol>
          </div>
          <div className={b.perks}>
            {t.perks.map(([title, text], i) => (
              <div key={title} className={b.perk}>
                <span className={b.perkIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[i]} /></svg></span>
                <span><b>{title}</b>{text}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
