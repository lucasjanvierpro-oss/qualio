"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEFAULT_PRICING } from "@/lib/pricing/config";

export default function BrandOnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      {/* Logo */}
      <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--color-text-primary)", marginBottom: "48px" }}>Rarelyst</div>

      <div style={{ width: "100%", maxWidth: "520px" }}>

        {step === 0 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 20px" }}>🎉</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 10px" }}>
                Bienvenue sur Rarelyst
              </h1>
              <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                Recrutez les bons profils pour vos études qualitatives en 72h. Votre compte marque est prêt.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {[
                { icon: "🔍", title: "Soumettez votre brief", desc: "Décrivez votre cible et vos critères" },
                { icon: "👥", title: "Recevez des profils matchés", desc: "Notre équipe sélectionne les meilleurs participants" },
                { icon: "🎥", title: "Conduisez vos entretiens", desc: "En visio, avec un lien direct depuis la plateforme" },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: "14px", padding: "16px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "2px" }}>{item.title}</div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              style={{ display: "block", width: "100%", padding: "14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
            >
              Commencer →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "36px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 10px" }}>
                Choisissez votre formule
              </h2>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
                Un profil coûte de {DEFAULT_PRICING.tiers.averti.baseCredits} à {DEFAULT_PRICING.tiers.rare.baseCredits} crédits selon son palier · 1 crédit = 10 € HT.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {DEFAULT_PRICING.packs.map((pk, i) => ({
                plan: pk.label,
                price: `${(pk.priceCents / 100).toLocaleString("fr-FR")} € HT`,
                credits: `${pk.credits} crédits`,
                studies: pk.note,
                cta: "Choisir",
                recommended: i === 1,
              })).map((p) => (
                <div key={p.plan} style={{ padding: "18px 20px", background: p.recommended ? "var(--color-accent-light)" : "var(--color-surface)", border: `1px solid ${p.recommended ? "var(--color-accent)" : "var(--color-border-base)"}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.plan}</span>
                      {p.recommended && <span style={{ fontSize: "11px", fontWeight: 700, background: "var(--color-accent)", color: "#fff", padding: "2px 8px", borderRadius: "999px" }}>Recommandé</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "3px" }}>{p.credits} · {p.studies}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.price}</span>
                    <button
                      onClick={() => router.push("/brand/account")}
                      style={{ padding: "8px 16px", background: p.recommended ? "var(--color-accent)" : "var(--color-surface-2)", color: p.recommended ? "#fff" : "var(--color-text-primary)", border: `1px solid ${p.recommended ? "transparent" : "var(--color-border-strong)"}`, borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {p.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
              Sans abonnement · Les crédits n&apos;expirent pas · <a href="/brand/dashboard" style={{ color: "inherit" }}>Plus tard</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
