import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import Stage from "@/components/studio/Stage";
import { COMPOSITIONS, SIZES } from "@/components/studio/compositions";

export const dynamic = "force-dynamic";

// Le studio : tous les formats réseaux, joués en direct. Réservé à l'admin.
export default async function Studio() {
  const me = await getSessionUser();
  if (me?.role !== "ADMIN") notFound();
  return (
    <main style={{ padding: "32px 28px 60px", background: "#f4f2f6", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.04em" }}>Studio Rarelyst</h1>
      <p style={{ margin: "6px 0 26px", color: "#5f5868" }}>Les formats pour Instagram, TikTok et LinkedIn, joués en direct. Chaque format s&apos;ouvre seul pour être filmé ou capturé.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "flex-start" }}>
        {COMPOSITIONS.map((c) => {
          const [w, h] = SIZES[c.format];
          const scale = Math.min(270 / w, 480 / h);
          return (
            <figure key={c.id} style={{ margin: 0, display: "grid", gap: 8, width: w * scale }}>
              <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 40px -28px rgba(40,20,90,.5)" }}><Stage id={c.id} lang="fr" scale={scale} /></div>
              <figcaption style={{ fontSize: 13, lineHeight: 1.35 }}>
                <b>{c.title}</b><br />
                <span style={{ color: "#8a8490" }}>{c.duration ? `Vidéo ${c.duration} s` : "Visuel fixe"} · {w * 2}×{h * 2}</span>
                {c.langs.map((l) => <Link key={l} href={`/studio/${c.id}?lang=${l}`} style={{ marginLeft: 8, color: "#6a43db" }}>{l.toUpperCase()}</Link>)}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </main>
  );
}
