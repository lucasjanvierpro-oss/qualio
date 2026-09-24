import Link from "next/link";
import { getPricingConfig } from "@/lib/pricing/quotes";
import { TIERS } from "@/lib/pricing/config";

// Les tarifs viennent des réglages de prix (/admin/prix) : une seule grille
// pour ce site, le compte marque et le paiement.
export const revalidate = 300;

const HOW = [
  { t: "Le palier", d: "Client·e averti·e, Initié·e ou Rare : ce que la personne sait et a prouvé de son métier." },
  { t: "La durée", d: "30, 45 ou 60 minutes ; un participant de focus group coûte moins qu'un entretien seul." },
  { t: "La demande", d: "Un profil que plusieurs marques ont retenu ces trois derniers mois vaut un peu plus." },
  { t: "La rareté", d: "Moins il existe de profils comparables dans le panel, plus le prix monte." },
  { t: "La certification", d: "Identité, emploi, LinkedIn, CV vérifiés : un profil prouvé vaut plus qu'un profil déclaré." },
  { t: "Les avis", d: "Les notes laissées par les autres marques après leurs entretiens." },
];

const FAQ = [
  { q: "C'est quoi un crédit ?", a: "1 crédit vaut 10 € HT. Chaque profil affiche son prix en crédits avant que vous l'acceptiez ; rien n'est débité tant que vous n'avez pas dit oui." },
  { q: "Pourquoi tous les profils n'ont pas le même prix ?", a: "Une vendeuse d'une maison de luxe ou une directrice artistique ne s'interrogent pas au même prix qu'un client passionné. Le prix se calcule seul à partir du palier, de la durée, de la demande, de la rareté, des preuves et des avis ; il est figé au moment où le profil vous est proposé." },
  { q: "Une petite marque peut-elle commencer ?", a: "Oui. Le pack Découverte (400 € HT) couvre un premier entretien avec un·e client·e averti·e, sans abonnement ni engagement." },
  { q: "Et si le participant ne vient pas ?", a: "Les crédits du profil vous sont rendus automatiquement." },
  { q: "Les crédits expirent-ils ?", a: "Non. Utilisez-les à votre rythme." },
  { q: "Qui paie les participants ?", a: "Rarelyst, sur ce que vous avez réglé en crédits. Vous n'avez ni virement ni bon d'achat à gérer." },
];

export default async function PricingPage() {
  const cfg = await getPricingConfig();
  const euros = (credits: number) => ((credits * cfg.creditValueCents) / 100).toLocaleString("fr-FR");

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto", color: "var(--color-text-primary)" }}>
      <header style={{ textAlign: "center", marginBottom: 44 }}>
        <p className="q-label" style={{ marginBottom: 12 }}>Tarifs</p>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 12px", lineHeight: 1.05 }}>
          Vous payez le profil, pas un abonnement
        </h1>
        <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          Des crédits, sans engagement. Chaque profil affiche son prix avant que vous l&apos;acceptiez : ce qu&apos;il sait, ce qu&apos;il a prouvé, combien il est demandé.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {TIERS.map((id, i) => {
          const t = cfg.tiers[id];
          return (
            <div key={id} style={{ padding: "24px 24px 22px", borderRadius: 16, background: i === 2 ? "#1c1624" : "var(--color-surface)", color: i === 2 ? "#f1edf6" : undefined, border: `1px solid ${i === 2 ? "#1c1624" : "var(--color-border-base)"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6 }}>{i === 2 ? "Sur demande possible" : `Palier ${i + 1}`}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{t.label}</div>
              <div style={{ fontSize: 14, opacity: 0.72, marginTop: 4, minHeight: 42, lineHeight: 1.45 }}>{t.who}</div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.6 }}>dès</span>
                <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{t.baseCredits}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>crédits</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>soit {euros(t.baseCredits)} € HT l&apos;entretien de 45 min, tout compris</div>
            </div>
          );
        })}
      </section>

      <section style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Comment le prix d&apos;un profil se calcule</h2>
        <p style={{ fontSize: 14.5, color: "var(--color-text-secondary)", margin: "0 0 18px" }}>
          Automatiquement, et toujours affiché avec son détail. Le participant touche une part fixe de ce prix : plus un profil vaut, plus il est payé.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px 28px" }}>
          {HOW.map((h) => (
            <div key={h.t} style={{ borderTop: "2px solid var(--color-text-primary)", paddingTop: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{h.t}</div>
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 3, lineHeight: 1.5 }}>{h.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px" }}>Les packs de crédits</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {cfg.packs.map((p) => (
            <div key={p.id} style={{ padding: 20, borderRadius: 14, background: "var(--color-surface)", border: "1px solid var(--color-border-base)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>{p.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{p.credits} <span style={{ fontSize: 14, fontWeight: 600 }}>crédits</span></div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{(p.priceCents / 100).toLocaleString("fr-FR")} € HT</div>
              <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>{p.note}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <Link href="/signup/brand" style={{ display: "inline-block", padding: "12px 26px", background: "var(--color-accent)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Créer un compte marque →
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 56, maxWidth: 720, marginInline: "auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Questions fréquentes</h2>
        {FAQ.map((f) => (
          <div key={f.q} style={{ borderBottom: "1px solid var(--color-border-base)", padding: "16px 0" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{f.q}</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.6 }}>{f.a}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
