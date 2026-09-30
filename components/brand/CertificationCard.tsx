import Hallmark from "./Hallmark";
import { certTitles, type CertLevel, type CertStep } from "@/lib/brands/certification";

/** Le poinçon de la marque et ce qu'il reste à faire pour monter en titre. */
export default function CertificationCard({ level, steps, companyName, lang = "fr" }: { level: CertLevel; steps: CertStep[]; companyName: string; lang?: "fr" | "en" }) {
  const en = lang === "en";
  const CERT_TITLES = certTitles(lang);
  const t = CERT_TITLES[level];
  return (
    <section style={{
      // Sur téléphone, le texte passe sous le poinçon au lieu de s'écraser à côté.
      display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center",
      padding: 24, borderRadius: 14, marginBottom: 28,
      background: "var(--color-surface)", border: "1px solid var(--color-border-base)",
    }}>
      <div style={{ flex: "0 0 auto" }}><Hallmark level={level} size={150} initial={companyName} /></div>
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>{en ? "Rarelyst hallmark" : "Poinçon Rarelyst"}</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", color: "var(--color-text-primary)", margin: "4px 0 4px" }}>
          {level ? `${en ? "Title" : "Titre"} ${t.roman} · ${t.name}` : t.name}
        </div>
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", margin: "0 0 14px", lineHeight: 1.5 }}>
          {t.meaning} {en ? "Participants see this hallmark on your invitations, without ever seeing your name." : "Les participants voient ce poinçon sur vos invitations, sans jamais voir votre nom."}
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s) => (
            <li key={s.level} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "baseline", fontSize: 13, lineHeight: 1.45 }}>
              <span style={{
                fontFamily: "Georgia, serif", fontWeight: 700, textAlign: "center", borderRadius: 6, padding: "1px 0",
                background: s.done ? "#1f7a4d" : "var(--color-surface-2)", color: s.done ? "#fff" : "var(--color-text-tertiary)",
              }}>{CERT_TITLES[s.level].roman}</span>
              <span style={{ color: s.done ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                <strong>{CERT_TITLES[s.level].name}</strong>{s.done ? (en ? " — done" : " — obtenu") : ` — ${s.how}`}
                {!s.done && s.level === 3 && <> <a href="/brand/onboarding" style={{ color: "var(--color-accent)", fontWeight: 600 }}>{en ? "Verify my house" : "Vérifier ma maison"} →</a></>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
