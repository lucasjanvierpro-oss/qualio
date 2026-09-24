import Hallmark from "./Hallmark";
import { CERT_TITLES, type CertLevel, type CertStep } from "@/lib/brands/certification";

/** Le poinçon de la marque et ce qu'il reste à faire pour monter en titre. */
export default function CertificationCard({ level, steps, companyName }: { level: CertLevel; steps: CertStep[]; companyName: string }) {
  const t = CERT_TITLES[level];
  return (
    <section style={{
      display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center",
      padding: 24, borderRadius: 14, marginBottom: 28,
      background: "var(--color-surface)", border: "1px solid var(--color-border-base)",
    }}>
      <Hallmark level={level} size={150} initial={companyName} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Poinçon Rarelyst</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color: "var(--color-text-primary)", margin: "4px 0 4px" }}>
          {level ? `Titre ${t.roman} · ${t.name}` : t.name}
        </div>
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", margin: "0 0 14px", lineHeight: 1.5 }}>
          {t.meaning} Les participants voient ce poinçon sur vos invitations, sans jamais voir votre nom.
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s) => (
            <li key={s.level} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "baseline", fontSize: 13, lineHeight: 1.45 }}>
              <span style={{
                fontFamily: "Georgia, serif", fontWeight: 700, textAlign: "center", borderRadius: 6, padding: "1px 0",
                background: s.done ? "#1f7a4d" : "var(--color-surface-2)", color: s.done ? "#fff" : "var(--color-text-tertiary)",
              }}>{CERT_TITLES[s.level].roman}</span>
              <span style={{ color: s.done ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                <strong>{CERT_TITLES[s.level].name}</strong>{s.done ? " — obtenu" : ` — ${s.how}`}
                {!s.done && s.level === 3 && <> <a href="/brand/onboarding" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Vérifier ma maison →</a></>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
