"use client";

import { useState } from "react";
import Link from "next/link";
import { signupBrand } from "@/app/actions/auth";
import SocialSignIn from "@/components/auth/SocialSignIn";
import Hallmark from "@/components/brand/Hallmark";
import { CERT_TITLES, companyFromDomain, emailDomain, isProDomain } from "@/lib/brands/certification";
import b from "./brand.module.css";

// Inscription marque : quatre champs. À droite, la carte de la maison se
// remplit pendant la saisie et le poinçon se frappe dès que l'adresse est
// reconnue comme professionnelle. Le secteur et le poste se complètent plus tard.

const PERKS = [
  { title: "Des profils prouvés, pas déclarés", text: "Identité, emploi, LinkedIn et CV vérifiés : chaque fiche dit ce qui a été contrôlé.", icon: "M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z M8.6 12.2l2.4 2.4 4.6-4.9" },
  { title: "Vous payez le profil, pas un abonnement", text: "Dès 390 € HT l'entretien de 45 minutes. Le prix de chaque profil s'affiche avant que vous l'acceptiez.", icon: "M4 7h16v12H4z M4 11h16 M8 15h3" },
  { title: "Tout est inclus", text: "Salle de visio, enregistrement, transcription et synthèse de l'étude.", icon: "M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3" },
];

export default function BrandSignupPage() {
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
          <span>Déjà un compte ? <Link href="/login">Se connecter</Link></span>
        </nav>
      </header>

      <div className={b.layout}>
        <main className={b.main}>
          <p className={b.eyebrow}>Compte marque</p>
          <h1 className={b.h1}>Interrogez les profils que les panels ne trouvent pas</h1>
          <p className={b.lead}>Une minute pour créer le compte. Votre maison est vérifiée dans la foulée, par son domaine et le registre officiel.</p>

          <SocialSignIn role="BRAND" label="En un clic, avec votre compte professionnel" />
          <div className={b.divider}>ou avec un mot de passe</div>

          <form onSubmit={submit} className={b.form}>
            <div>
              <label className={b.label} htmlFor="email">Email professionnel</label>
              <input id="email" type="email" autoComplete="email" className={b.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@maison.com" />
              {complete && (
                <div className={b.hint} data-ok={pro}>
                  {pro ? `✓ Adresse sur le domaine ${domain} : poinçon I obtenu.` : "Une adresse Gmail, Outlook ou Orange ne prouve pas votre maison. Préférez l'adresse de votre société."}
                </div>
              )}
            </div>
            <div className={b.row}>
              <div>
                <label className={b.label} htmlFor="company">Marque</label>
                <input id="company" className={b.input} value={companyValue} placeholder="Lacoste"
                  onChange={(e) => { setCompanyTouched(true); setCompany(e.target.value); }} />
              </div>
              <div>
                <label className={b.label} htmlFor="first">Votre prénom</label>
                <input id="first" autoComplete="given-name" className={b.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sophie" />
              </div>
            </div>
            <div>
              <label className={b.label} htmlFor="pw">Mot de passe</label>
              <input id="pw" type="password" autoComplete="new-password" className={b.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" />
            </div>

            {error && <p className={b.error}>{error}</p>}

            <button type="submit" className={b.btn} disabled={!ok || loading}>
              {loading ? "Création du compte…" : "Créer le compte de ma maison"}
            </button>
            <p className={b.legal}>
              En créant un compte, vous acceptez les <Link href="/conditions">conditions</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
              Vous êtes participant·e ? <Link href="/signup/participant">Inscription ici</Link>.
            </p>
          </form>
        </main>

        <aside className={b.aside}>
          <div className={b.card}>
            <div className={b.cardTop}><span>Rarelyst</span><span>Maison</span></div>
            <div className={b.cardName}>{companyValue || "Votre maison"}</div>
            <div className={b.cardDomain}>{pro ? domain : complete ? "Adresse personnelle" : "votre-domaine.com"}</div>
            <div className={b.stamp} data-level={level}>
              <Hallmark key={level} level={level} size={130} initial={companyValue || "R"} />
              <span className={b.stampText}>
                <b>{level ? `Poinçon ${CERT_TITLES[1].roman}` : "Sans poinçon"}</b>
                Les participants voient ce poinçon sur vos invitations, jamais votre nom.
              </span>
            </div>
            <ol className={b.steps}>
              <li className={b.step} data-done={pro}><span className={b.roman}>I</span><span><b>Adresse pro</b> · votre email est sur le domaine de la société.</span></li>
              <li className={b.step} data-done={false}><span className={b.roman}>II</span><span><b>Domaine prouvé</b> · à la première connexion : lien de confirmation, Google ou LinkedIn.</span></li>
              <li className={b.step} data-done={false}><span className={b.roman}>III</span><span><b>Maison vérifiée</b> · votre société retrouvée au registre officiel, en trente secondes.</span></li>
            </ol>
          </div>
          <div className={b.perks}>
            {PERKS.map((p) => (
              <div key={p.title} className={b.perk}>
                <span className={b.perkIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg></span>
                <span><b>{p.title}</b>{p.text}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
