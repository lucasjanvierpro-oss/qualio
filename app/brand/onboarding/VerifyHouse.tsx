"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hallmark from "@/components/brand/Hallmark";
import { certTitles, type CertLevel } from "@/lib/brands/certification";
import { useLang } from "@/lib/i18n/client";
import type { Company } from "@/lib/brands/registry";
import { findCompanies, claimCompany, declareForeignCompany } from "@/app/actions/brandVerification";
import { signInWithProvider } from "@/app/actions/auth";
import o from "./onboarding.module.css";

type Claimed = {
  legalName: string; siren: string | null; activity: string | null; city: string | null; employees: string | null;
  foreign: boolean; country: string | null; match: boolean; method: string | null;
};

const fmtSiren = (s: string) => s.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");

export default function VerifyHouse(p: {
  companyName: string; firstName: string; domain: string; pro: boolean; domainProven: boolean;
  level: CertLevel; claimed: Claimed | null; fromCredits: number; creditValueCents: number;
  firstPack: { credits: number; priceCents: number; label: string } | null;
}) {
  const router = useRouter();
  const en = useLang() === "en";
  const tt = (fr: string, e: string) => (en ? e : fr);
  const CERT_TITLES = certTitles(en ? "en" : "fr");
  const [pending, start] = useTransition();
  const [q, setQ] = useState(p.companyName);
  const [results, setResults] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(!p.claimed);
  const [foreign, setForeign] = useState(false);
  const [f, setF] = useState({ legalName: p.companyName, country: "", website: p.pro ? `https://${p.domain}` : "" });

  const search = () => start(async () => {
    setError(null);
    const r = await findCompanies(q);
    if ("error" in r) { setError(r.error); setResults([]); } else setResults(r.results);
  });

  const claim = (siren: string) => start(async () => {
    setError(null);
    const r = await claimCompany(siren);
    if ("error" in r) setError(r.error ?? tt("Erreur", "Error"));
    else { setChanging(false); setResults(null); router.refresh(); }
  });

  const status = !p.claimed ? null
    : p.level === 3 ? { tone: "ok", text: tt("Maison vérifiée : votre poinçon passe au titre III.", "House verified: your hallmark moves up to title III.") }
    : p.claimed.foreign ? { tone: "wait", text: tt("Société hors de France : l'équipe la vérifie et vous prévient par email.", "Company outside France: the team checks it and lets you know by email.") }
    : p.claimed.match && !p.domainProven ? { tone: "wait", text: tt("Société retrouvée. Il reste à prouver votre adresse : connectez-vous une fois avec Google ou LinkedIn, ou cliquez sur le lien de confirmation reçu.", "Company found. You still need to prove your address: log in once with Google or LinkedIn, or click the confirmation link you received.") }
    : { tone: "wait", text: tt("Le nom de cette société ne correspond pas à votre domaine : l'équipe vérifie et vous prévient par email.", "This company name doesn't match your domain: the team checks and lets you know by email.") };

  return (
    <div className={o.page}>
      <header className={o.head}>
        <div>
          <p className={o.eyebrow}>{tt("Bienvenue", "Welcome")}{p.firstName ? `, ${p.firstName}` : ""}</p>
          <h1 className={o.h1}>{tt("Vérifions votre maison", "Let's verify your house")}</h1>
          <p className={o.lead}>
            {tt("Les participants acceptent plus volontiers un entretien quand ils savent qu'une vraie maison les interroge. Ils voient votre poinçon, jamais votre nom.", "Participants are more willing to accept an interview when they know a real house is asking. They see your hallmark, never your name.")}
          </p>
        </div>
        <div className={o.hallmark}>
          <Hallmark level={p.level} size={170} initial={p.companyName} />
          <span>{p.level ? `${tt("Titre", "Title")} ${CERT_TITLES[p.level].roman} · ${CERT_TITLES[p.level].name}` : CERT_TITLES[0].name}</span>
        </div>
      </header>

      <ol className={o.titles}>
        <li data-done={p.pro}>
          <span className={o.roman}>I</span>
          <div><b>{tt("Adresse pro", "Work address")}</b><span>{p.pro ? tt(`Votre email est sur ${p.domain}.`, `Your email is on ${p.domain}.`) : tt("Votre email est une adresse personnelle : écrivez-nous depuis l'adresse de votre société pour être poinçonné.", "Your email is a personal address: write to us from your company address to get hallmarked.")}</span></div>
        </li>
        <li data-done={p.domainProven}>
          <span className={o.roman}>II</span>
          <div>
            <b>{tt("Domaine prouvé", "Domain proven")}</b>
            <span>{p.domainProven ? tt("Vous avez prouvé que cette adresse est la vôtre.", "You have proven this address is yours.") : tt(`Cliquez sur le lien de confirmation reçu par email, ou connectez-vous une fois avec le compte Google ou LinkedIn de votre adresse @${p.domain}.`, `Click the confirmation link sent by email, or log in once with the Google or LinkedIn account of your @${p.domain} address.`)}</span>
            {!p.domainProven && p.pro && (
              <div className={o.inline}>
                <button type="button" className={o.ghost} disabled={pending} onClick={() => start(async () => { await signInWithProvider("google", "BRAND"); })}>{tt("Prouver avec Google", "Prove with Google")}</button>
                <button type="button" className={o.ghost} disabled={pending} onClick={() => start(async () => { await signInWithProvider("linkedin_oidc", "BRAND"); })}>{tt("Prouver avec LinkedIn", "Prove with LinkedIn")}</button>
              </div>
            )}
          </div>
        </li>
        <li data-done={p.level === 3}>
          <span className={o.roman}>III</span>
          <div><b>{tt("Maison vérifiée", "Verified house")}</b><span>{tt("Votre société retrouvée au registre officiel des entreprises. Trente secondes, juste en dessous.", "Your company found in the official business register. Thirty seconds, just below.")}</span></div>
        </li>
      </ol>

      <section className={o.box}>
        <h2 className={o.h2}>{tt("Votre société au registre officiel", "Your company in the official register")}</h2>

        {p.claimed && !changing && (
          <div className={o.claimed}>
            <div className={o.company}>
              <b>{p.claimed.legalName}</b>
              <span>
                {p.claimed.foreign
                  ? `${tt("Hors de France", "Outside France")} · ${p.claimed.country ?? ""}`
                  : [p.claimed.siren && `SIREN ${fmtSiren(p.claimed.siren)}`, p.claimed.activity, p.claimed.city, p.claimed.employees].filter(Boolean).join(" · ")}
              </span>
            </div>
            {status && <p className={o.status} data-tone={status.tone}>{status.text}</p>}
            {p.level < 3 && <button type="button" className={o.link} onClick={() => setChanging(true)}>{tt("Ce n'est pas la bonne société", "This is not the right company")}</button>}
          </div>
        )}

        {changing && !foreign && (
          <>
            <p className={o.muted}>{tt("Cherchez par nom ou par numéro SIREN. Les sociétés de mode, de luxe et de beauté apparaissent en premier.", "Search by name or SIREN number. Fashion, luxury and beauty companies appear first.")}</p>
            <form className={o.search} onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input className={o.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt("Nom de la société ou SIREN", "Company name or SIREN")} aria-label={tt("Nom de la société ou SIREN", "Company name or SIREN")} />
              <button type="submit" className={o.btn} disabled={pending || q.trim().length < 2}>{pending && !results ? tt("Recherche…", "Searching…") : tt("Chercher", "Search")}</button>
            </form>
            {results && results.length === 0 && <p className={o.muted}>{tt("Aucune société active ne correspond. Essayez le nom légal, ou le SIREN.", "No active company matches. Try the legal name, or the SIREN.")}</p>}
            {results && results.length > 0 && (
              <ul className={o.results}>
                {results.map((c) => (
                  <li key={c.siren}>
                    <div className={o.company}>
                      <b>{c.name}</b>
                      <span>{[`SIREN ${fmtSiren(c.siren)}`, c.activity, c.city, c.employees ?? c.category].filter(Boolean).join(" · ")}</span>
                    </div>
                    <button type="button" className={o.btn} disabled={pending} onClick={() => claim(c.siren)}>{tt("C'est nous", "That's us")}</button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={o.link} onClick={() => setForeign(true)}>{tt("Société hors de France, ou introuvable", "Company outside France, or not found")}</button>
          </>
        )}

        {changing && foreign && (
          <form className={o.foreign} onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await declareForeignCompany(f);
              if ("error" in r) setError(r.error ?? tt("Erreur", "Error"));
              else { setForeign(false); setChanging(false); router.refresh(); }
            });
          }}>
            <div><label className={o.label} htmlFor="ln">{tt("Nom de la société", "Company name")}</label><input id="ln" className={o.input} value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} /></div>
            <div><label className={o.label} htmlFor="ct">{tt("Pays", "Country")}</label><input id="ct" className={o.input} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder={tt("Italie, Royaume-Uni…", "Italy, United Kingdom…")} /></div>
            <div><label className={o.label} htmlFor="ws">{tt("Site", "Website")}</label><input id="ws" className={o.input} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></div>
            <div className={o.inline}>
              <button type="submit" className={o.btn} disabled={pending}>{tt("Envoyer à l'équipe", "Send to the team")}</button>
              <button type="button" className={o.link} onClick={() => setForeign(false)}>{tt("Revenir au registre", "Back to the register")}</button>
            </div>
          </form>
        )}

        {error && <p className={o.error}>{error}</p>}
      </section>

      <section className={o.next}>
        <h2 className={o.h2}>{tt("Et maintenant", "What's next")}</h2>
        <div className={o.cards}>
          <Link href="/brand/studies/new" className={o.card}>
            <b>{tt("Décrire votre première étude", "Describe your first study")}</b>
            <span>{tt("Qui vous voulez entendre, sur quoi, et quand. Nous vous proposons les profils avec leur prix.", "Who you want to hear, about what, and when. We suggest profiles with their price.")}</span>
          </Link>
          <Link href="/brand/account" className={o.card}>
            <b>{tt("Prendre des crédits", "Get credits")}</b>
            <span>
              {p.firstPack ? (en
                ? `${p.firstPack.label} pack: ${p.firstPack.credits} credits, €${(p.firstPack.priceCents / 100).toLocaleString("en-GB")} excl. VAT. `
                : `Pack ${p.firstPack.label} : ${p.firstPack.credits} crédits, ${(p.firstPack.priceCents / 100).toLocaleString("fr-FR")} € HT. `) : ""}
              {en
                ? `A 45-minute interview costs from ${p.fromCredits} credits (€${((p.fromCredits * p.creditValueCents) / 100).toLocaleString("en-GB")} excl. VAT).`
                : `Un entretien de 45 minutes coûte dès ${p.fromCredits} crédits (${((p.fromCredits * p.creditValueCents) / 100).toLocaleString("fr-FR")} € HT).`}
            </span>
          </Link>
          <Link href="/brand/dashboard" className={o.card}>
            <b>{tt("Voir mon espace", "Go to my space")}</b>
            <span>{tt("Vos études, vos profils proposés et vos entretiens, au même endroit.", "Your studies, suggested profiles and interviews, in one place.")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
