"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hallmark from "@/components/brand/Hallmark";
import { CERT_TITLES, type CertLevel } from "@/lib/brands/certification";
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
    if ("error" in r) setError(r.error ?? "Erreur");
    else { setChanging(false); setResults(null); router.refresh(); }
  });

  const status = !p.claimed ? null
    : p.level === 3 ? { tone: "ok", text: "Maison vérifiée : votre poinçon passe au titre III." }
    : p.claimed.foreign ? { tone: "wait", text: "Société hors de France : l'équipe la vérifie et vous prévient par email." }
    : p.claimed.match && !p.domainProven ? { tone: "wait", text: "Société retrouvée. Il reste à prouver votre adresse : connectez-vous une fois avec Google ou LinkedIn, ou cliquez sur le lien de confirmation reçu." }
    : { tone: "wait", text: "Le nom de cette société ne correspond pas à votre domaine : l'équipe vérifie et vous prévient par email." };

  return (
    <div className={o.page}>
      <header className={o.head}>
        <div>
          <p className={o.eyebrow}>Bienvenue{p.firstName ? `, ${p.firstName}` : ""}</p>
          <h1 className={o.h1}>Vérifions votre maison</h1>
          <p className={o.lead}>
            Les participants acceptent plus volontiers un entretien quand ils savent qu&apos;une vraie maison les interroge.
            Ils voient votre poinçon, jamais votre nom.
          </p>
        </div>
        <div className={o.hallmark}>
          <Hallmark level={p.level} size={170} initial={p.companyName} />
          <span>{p.level ? `Titre ${CERT_TITLES[p.level].roman} · ${CERT_TITLES[p.level].name}` : CERT_TITLES[0].name}</span>
        </div>
      </header>

      <ol className={o.titles}>
        <li data-done={p.pro}>
          <span className={o.roman}>I</span>
          <div><b>Adresse pro</b><span>{p.pro ? `Votre email est sur ${p.domain}.` : "Votre email est une adresse personnelle : écrivez-nous depuis l'adresse de votre société pour être poinçonné."}</span></div>
        </li>
        <li data-done={p.domainProven}>
          <span className={o.roman}>II</span>
          <div>
            <b>Domaine prouvé</b>
            <span>{p.domainProven ? "Vous avez prouvé que cette adresse est la vôtre." : `Cliquez sur le lien de confirmation reçu par email, ou connectez-vous une fois avec le compte Google ou LinkedIn de votre adresse @${p.domain}.`}</span>
            {!p.domainProven && p.pro && (
              <div className={o.inline}>
                <button type="button" className={o.ghost} disabled={pending} onClick={() => start(async () => { await signInWithProvider("google", "BRAND"); })}>Prouver avec Google</button>
                <button type="button" className={o.ghost} disabled={pending} onClick={() => start(async () => { await signInWithProvider("linkedin_oidc", "BRAND"); })}>Prouver avec LinkedIn</button>
              </div>
            )}
          </div>
        </li>
        <li data-done={p.level === 3}>
          <span className={o.roman}>III</span>
          <div><b>Maison vérifiée</b><span>Votre société retrouvée au registre officiel des entreprises. Trente secondes, juste en dessous.</span></div>
        </li>
      </ol>

      <section className={o.box}>
        <h2 className={o.h2}>Votre société au registre officiel</h2>

        {p.claimed && !changing && (
          <div className={o.claimed}>
            <div className={o.company}>
              <b>{p.claimed.legalName}</b>
              <span>
                {p.claimed.foreign
                  ? `Hors de France · ${p.claimed.country ?? ""}`
                  : [p.claimed.siren && `SIREN ${fmtSiren(p.claimed.siren)}`, p.claimed.activity, p.claimed.city, p.claimed.employees].filter(Boolean).join(" · ")}
              </span>
            </div>
            {status && <p className={o.status} data-tone={status.tone}>{status.text}</p>}
            {p.level < 3 && <button type="button" className={o.link} onClick={() => setChanging(true)}>Ce n&apos;est pas la bonne société</button>}
          </div>
        )}

        {changing && !foreign && (
          <>
            <p className={o.muted}>Cherchez par nom ou par numéro SIREN. Les sociétés de mode, de luxe et de beauté apparaissent en premier.</p>
            <form className={o.search} onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input className={o.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom de la société ou SIREN" aria-label="Nom de la société ou SIREN" />
              <button type="submit" className={o.btn} disabled={pending || q.trim().length < 2}>{pending && !results ? "Recherche…" : "Chercher"}</button>
            </form>
            {results && results.length === 0 && <p className={o.muted}>Aucune société active ne correspond. Essayez le nom légal, ou le SIREN.</p>}
            {results && results.length > 0 && (
              <ul className={o.results}>
                {results.map((c) => (
                  <li key={c.siren}>
                    <div className={o.company}>
                      <b>{c.name}</b>
                      <span>{[`SIREN ${fmtSiren(c.siren)}`, c.activity, c.city, c.employees ?? c.category].filter(Boolean).join(" · ")}</span>
                    </div>
                    <button type="button" className={o.btn} disabled={pending} onClick={() => claim(c.siren)}>C&apos;est nous</button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={o.link} onClick={() => setForeign(true)}>Société hors de France, ou introuvable</button>
          </>
        )}

        {changing && foreign && (
          <form className={o.foreign} onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await declareForeignCompany(f);
              if ("error" in r) setError(r.error ?? "Erreur");
              else { setForeign(false); setChanging(false); router.refresh(); }
            });
          }}>
            <div><label className={o.label} htmlFor="ln">Nom de la société</label><input id="ln" className={o.input} value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} /></div>
            <div><label className={o.label} htmlFor="ct">Pays</label><input id="ct" className={o.input} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Italie, Royaume-Uni…" /></div>
            <div><label className={o.label} htmlFor="ws">Site</label><input id="ws" className={o.input} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></div>
            <div className={o.inline}>
              <button type="submit" className={o.btn} disabled={pending}>Envoyer à l&apos;équipe</button>
              <button type="button" className={o.link} onClick={() => setForeign(false)}>Revenir au registre</button>
            </div>
          </form>
        )}

        {error && <p className={o.error}>{error}</p>}
      </section>

      <section className={o.next}>
        <h2 className={o.h2}>Et maintenant</h2>
        <div className={o.cards}>
          <Link href="/brand/studies/new" className={o.card}>
            <b>Décrire votre première étude</b>
            <span>Qui vous voulez entendre, sur quoi, et quand. Nous vous proposons les profils avec leur prix.</span>
          </Link>
          <Link href="/brand/account" className={o.card}>
            <b>Prendre des crédits</b>
            <span>
              {p.firstPack ? `Pack ${p.firstPack.label} : ${p.firstPack.credits} crédits, ${(p.firstPack.priceCents / 100).toLocaleString("fr-FR")} € HT. ` : ""}
              Un entretien de 45 minutes coûte dès {p.fromCredits} crédits ({((p.fromCredits * p.creditValueCents) / 100).toLocaleString("fr-FR")} € HT).
            </span>
          </Link>
          <Link href="/brand/dashboard" className={o.card}>
            <b>Voir mon espace</b>
            <span>Vos études, vos profils proposés et vos entretiens, au même endroit.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
