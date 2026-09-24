import type { EarnedBadge } from "@/lib/participants/badges";
import { BadgeTile } from "@/components/badges/BadgeShelf";
import { TrustLocked } from "@/components/badges/TrustBlock";

const GROUPS: { state: EarnedBadge["state"]; title: string; note: string }[] = [
  { state: "earned", title: "Acquises", note: "Visibles par les marques sur votre fiche." },
  { state: "pending", title: "À confirmer", note: "Notre IA les examine à partir de vos exemples et de vos liens." },
  { state: "locked", title: "À débloquer", note: "Chaque médaille dit comment l'obtenir." },
];

/**
 * La vitrine du participant : ses médailles, et l'historique que seules les
 * marques peuvent lire. Le montrer voilé plutôt que le cacher : la personne
 * sait que ses entretiens construisent quelque chose.
 */
export default function Showcase({ badges, interviewsDone }: { badges: EarnedBadge[]; interviewsDone: number }) {
  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 0" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px", color: "var(--color-text-primary)" }}>
        Vos médailles
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 26px", lineHeight: 1.55 }}>
        Une déclaration ne suffit pas : une médaille s&apos;obtient par un exemple, un lien ou un entretien. Seules les médailles acquises apparaissent aux marques.
      </p>
      {GROUPS.map((g) => {
        const list = badges.filter((b) => b.state === g.state);
        if (!list.length) return null;
        return (
          <div key={g.state} style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>{g.title} <span style={{ color: "var(--color-text-tertiary)", fontWeight: 600 }}>{list.length}</span></h2>
              <span style={{ fontSize: 12.5, color: "var(--color-text-tertiary)" }}>{g.note}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: "22px 14px" }}>
              {list.map((b) => <BadgeTile key={b.id} b={b} size={g.state === "locked" ? 72 : 92} explain={g.state === "earned" ? "meaning" : "unlock"} />)}
            </div>
          </div>
        );
      })}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "8px 0 12px", color: "var(--color-text-primary)" }}>Ce que les marques voient en plus</h2>
      <TrustLocked interviewsDone={interviewsDone} style={{ margin: 0 }} />
    </section>
  );
}
