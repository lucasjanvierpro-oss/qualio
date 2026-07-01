import Link from "next/link";

const PACKS = [
  {
    name: "Essai gratuit",
    price: "0€",
    credits: 5,
    unit: null,
    features: [
      "5 crédits offerts",
      "1 étude complète (5 participants)",
      "Sélection manuelle par l'équipe Qualio",
      "Profils vérifiés et screeners qualitatifs",
    ],
    cta: "Commencer gratuitement",
    href: "/signup/brand",
    highlight: false,
    tag: null,
  },
  {
    name: "Pack M",
    price: "780€",
    credits: 12,
    unit: "65€ / participant",
    features: [
      "12 crédits (sans expiration)",
      "~2 études complètes",
      "Sélection manuelle par l'équipe Qualio",
      "Profils vérifiés + Ghost File IA",
      "Rapport de synthèse IA post-étude",
      "Support prioritaire par email",
    ],
    cta: "Acheter ce pack",
    href: "/signup/brand?pack=M",
    highlight: true,
    tag: "Le plus populaire",
  },
  {
    name: "Pack L",
    price: "1 375€",
    credits: 25,
    unit: "55€ / participant",
    features: [
      "25 crédits (sans expiration)",
      "~4–5 études complètes",
      "Sélection manuelle par l'équipe Qualio",
      "Profils vérifiés + Ghost File IA",
      "Rapport de synthèse IA post-étude",
      "Support dédié (appel de cadrage inclus)",
    ],
    cta: "Acheter ce pack",
    href: "/signup/brand?pack=L",
    highlight: false,
    tag: "−8%",
  },
];

const FAQ = [
  {
    q: "C'est quoi un crédit ?",
    a: "1 crédit = 1 participant confirmé pour votre étude. Si un participant ne se présente pas, le crédit est remboursé automatiquement.",
  },
  {
    q: "Les crédits expirent ?",
    a: "Non. Tous les crédits achetés sont sans date d'expiration. Vous pouvez les utiliser à votre rythme.",
  },
  {
    q: "Combien de temps pour recevoir des participants ?",
    a: "48 à 72h après votre brief pour les premiers profils confirmés. C'est la promesse centrale de Qualio.",
  },
  {
    q: "Que se passe-t-il si un participant annule ?",
    a: "Vous récupérez votre crédit automatiquement. On vous propose un remplaçant dans les 24h.",
  },
  {
    q: "Puis-je personnaliser mes critères ?",
    a: "Oui — âge, ville, profession, affinités marques, comportements d'achat, et tout critère libre. La sélection est manuelle, donc très précise.",
  },
  {
    q: "Quelle est la récompense pour les participants ?",
    a: "Vous choisissez le montant (20€ à 100€) et le format (virement bancaire ou bon d'achat). C'est géré par Qualio, vous n'avez rien à traiter.",
  },
];

export default function PricingPage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-base)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontStyle: "normal", color: "var(--color-text-primary)" }}>
            Qualio
          </span>
        </Link>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "var(--color-text-secondary)", textDecoration: "none" }}>Connexion</Link>
          <Link href="/signup/brand" style={{ padding: "7px 16px", background: "var(--color-accent)", color: "#fff", borderRadius: "3px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            Démarrer →
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "72px 40px 48px", textAlign: "center" }}>
        <p className="q-label" style={{ marginBottom: "14px" }}>Tarifs</p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 800, fontStyle: "normal",
          letterSpacing: "-0.03em",
          color: "var(--color-text-primary)",
          margin: "0 0 16px",
        }}>
          Simple, transparent, sans abonnement
        </h1>
        <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.65 }}>
          Achetez des crédits, utilisez-les quand vous voulez. Pas d'engagement, pas d'expiration.
        </p>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {PACKS.map((p) => (
            <div key={p.name} className={p.highlight ? "" : "hover-lift"} style={{
              background: p.highlight ? "var(--color-accent)" : "var(--color-surface)",
              border: `1px solid ${p.highlight ? "var(--color-accent)" : "var(--color-border-base)"}`,
              borderRadius: "4px",
              padding: "32px 28px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}>
              {p.tag && (
                <div style={{
                  position: "absolute", top: "-1px", right: "20px",
                  padding: "3px 10px",
                  background: p.highlight ? "#fff" : "var(--color-warning-light)",
                  color: p.highlight ? "var(--color-accent)" : "var(--color-warning)",
                  border: `1px solid ${p.highlight ? "#fff" : "var(--color-warning)"}`,
                  borderTop: "none",
                  borderRadius: "0 0 4px 4px",
                  fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  {p.tag}
                </div>
              )}

              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: p.highlight ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)", margin: "0 0 16px" }}>
                {p.name}
              </p>

              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "40px", fontWeight: 700, color: p.highlight ? "#fff" : "var(--color-text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {p.price}
                </span>
              </div>

              {p.unit ? (
                <div style={{ fontSize: "12px", color: p.highlight ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)", marginBottom: "24px" }}>
                  {p.unit}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: p.highlight ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)", marginBottom: "24px" }}>
                  Pour découvrir Qualio
                </div>
              )}

              <div style={{ borderTop: `1px solid ${p.highlight ? "rgba(255,255,255,0.15)" : "var(--color-border-base)"}`, paddingTop: "20px", marginBottom: "24px", flex: 1 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ color: p.highlight ? "rgba(255,255,255,0.6)" : "var(--color-success)", fontWeight: 700, flexShrink: 0, fontSize: "12px", marginTop: "1px" }}>✓</span>
                    <span style={{ fontSize: "13px", color: p.highlight ? "rgba(255,255,255,0.8)" : "var(--color-text-secondary)", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link href={p.href} style={{
                display: "block", textAlign: "center",
                padding: "11px", borderRadius: "2px",
                fontSize: "13px", fontWeight: 700,
                textDecoration: "none",
                background: p.highlight ? "#fff" : "var(--color-accent)",
                color: p.highlight ? "var(--color-accent)" : "#fff",
              }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Credit unit visual */}
        <div style={{ marginTop: "48px", padding: "28px 32px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "36px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>1</div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-tertiary)", marginTop: "4px" }}>crédit</div>
          </div>
          <div style={{ fontSize: "22px", color: "var(--color-border-strong)" }}>=</div>
          <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: "360px" }}>
            <strong style={{ color: "var(--color-text-primary)" }}>1 participant confirmé</strong> pour votre étude.
            Si un participant annule ou ne se présente pas, le crédit vous est restitué automatiquement.
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "72px 40px" }}>
          <p className="q-label" style={{ marginBottom: "20px", textAlign: "center" }}>Questions fréquentes</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderTop: i === 0 ? "1px solid var(--color-border-base)" : "none", borderBottom: "1px solid var(--color-border-base)", padding: "20px 0" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
                  {item.q}
                </div>
                <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.65 }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{ textAlign: "center", padding: "72px 40px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 800, fontStyle: "normal", letterSpacing: "-0.025em", color: "var(--color-text-primary)", margin: "0 0 20px" }}>
          Prêt à recruter autrement ?
        </h2>
        <Link href="/signup/brand" style={{ display: "inline-block", padding: "13px 32px", background: "var(--color-accent)", color: "#fff", borderRadius: "3px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
          Commencer gratuitement →
        </Link>
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "12px" }}>
          5 crédits offerts · Aucune carte bancaire requise
        </p>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border-base)", padding: "24px 40px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontStyle: "normal", color: "var(--color-text-primary)" }}>Qualio</span>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/" style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>Accueil</Link>
            <Link href="/login" style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>Connexion</Link>
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>© 2026 Qualio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
