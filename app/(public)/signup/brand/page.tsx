"use client";

import { useState } from "react";
import Link from "next/link";
import { signupBrand } from "@/app/actions/auth";
import SocialSignIn from "@/components/auth/SocialSignIn";
import Hallmark from "@/components/brand/Hallmark";
import { CERT_TITLES, companyFromDomain, emailDomain, isProDomain } from "@/lib/brands/certification";

// Inscription marque : quatre champs, et le poinçon qui se frappe pendant la
// saisie. Le secteur, le nom et le poste se complètent plus tard.

const field: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 13px",
  borderRadius: 10,
  border: "1px solid var(--color-border-base)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontSize: 14,
  outline: "none",
};
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 };

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
    <div style={{ width: "100%", maxWidth: 440 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 30, margin: "0 0 6px", color: "var(--color-text-primary)" }}>Créer un compte marque</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>Une minute. Vos premiers profils sous 72 h.</p>
      </div>

      <SocialSignIn role="BRAND" label="En un clic, avec votre compte pro" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
        <span style={{ flex: 1, height: 1, background: "var(--color-border-base)" }} />ou avec un mot de passe<span style={{ flex: 1, height: 1, background: "var(--color-border-base)" }} />
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
        <div>
          <label style={label} htmlFor="email">Email professionnel</label>
          <input id="email" type="email" autoComplete="email" style={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@maison.com" />
        </div>

        {/* Le poinçon se frappe dès que l'adresse est reconnue */}
        {complete && (
          <div style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12,
            background: pro ? "var(--color-accent-light)" : "var(--color-surface-2)",
            border: `1px solid ${pro ? "var(--color-accent)" : "var(--color-border-base)"}`,
          }}>
            <Hallmark level={pro ? 1 : 0} size={104} initial={companyValue || "R"} />
            <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--color-text-secondary)" }}>
              {pro ? (
                <><strong style={{ color: "var(--color-text-primary)" }}>Poinçon {CERT_TITLES[1].roman} · {CERT_TITLES[1].name}</strong><br />
                  Prouvez ensuite que l&apos;adresse est la vôtre (Google, LinkedIn ou code par email) pour le titre II. Les participants voient votre poinçon, jamais votre nom.</>
              ) : (
                <>Avec une adresse sur le domaine de votre société, votre marque est poinçonnée dès l&apos;inscription.</>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={label} htmlFor="company">Marque</label>
            <input id="company" style={field} value={companyValue} placeholder="Lacoste"
              onChange={(e) => { setCompanyTouched(true); setCompany(e.target.value); }} />
          </div>
          <div>
            <label style={label} htmlFor="first">Votre prénom</label>
            <input id="first" autoComplete="given-name" style={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sophie" />
          </div>
        </div>

        <div>
          <label style={label} htmlFor="pw">Mot de passe</label>
          <input id="pw" type="password" autoComplete="new-password" style={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" />
        </div>

        {error && (
          <p style={{ fontSize: 13, textAlign: "center", padding: "8px 12px", borderRadius: 8, background: "var(--color-error-light)", color: "var(--color-error)", margin: 0 }}>{error}</p>
        )}

        <button type="submit" disabled={!ok || loading} style={{
          padding: "12px 16px", borderRadius: 10, border: 0, fontSize: 15, fontWeight: 600, cursor: ok ? "pointer" : "default",
          background: "var(--color-accent)", color: "var(--color-accent-text)", opacity: !ok || loading ? 0.55 : 1,
        }}>
          {loading ? "Création du compte…" : "Créer mon compte"}
        </button>
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", margin: 0 }}>
          En créant un compte, vous acceptez les <Link href="/conditions" style={{ textDecoration: "underline" }}>conditions</Link> et la <Link href="/confidentialite" style={{ textDecoration: "underline" }}>politique de confidentialité</Link>.
        </p>
      </form>

      <p style={{ fontSize: 14, textAlign: "center", color: "var(--color-text-secondary)", marginTop: 22 }}>
        Déjà un compte ?{" "}
        <Link href="/login" style={{ fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4, color: "var(--color-text-primary)" }}>Se connecter</Link>
      </p>
    </div>
  );
}
