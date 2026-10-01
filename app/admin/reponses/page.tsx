import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkAsyncAnswer } from "@/lib/interviews/asyncQuality";
import ReviewActions from "./ReviewActions";
import a from "../admin.module.css";

export const dynamic = "force-dynamic";

const LEVEL = {
  ok: { label: "Rien à signaler", bg: "#16291f", fg: "#6fcb98" },
  a_regarder: { label: "À regarder", bg: "#3a2a10", fg: "#f0cf78" },
  suspect: { label: "Suspect", bg: "#3a1414", fg: "#ff8f8f" },
} as const;

/**
 * Admin → Réponses à valider : les réponses vidéo en autonomie envoyées et pas
 * encore payées. Pour chacune, des indices (questions vues, temps passé, mots
 * prononcés) ; l'admin regarde la vidéo et valide (paiement) ou refuse.
 */
export default async function ReponsesPage() {
  const rows = await prisma.interview.findMany({
    where: { mode: "async", status: { in: ["submitted", "completed"] }, application: { status: "CONFIRMED" } },
    orderBy: { submittedAt: "asc" },
    take: 100,
    include: {
      application: {
        select: {
          participantPayCents: true,
          study: { select: { id: true, title: true, guide: true, brandProfile: { select: { companyName: true } } } },
          participantProfile: { select: { id: true, firstName: true, lastName: true, profession: true } },
        },
      },
    },
  });
  const d = (x: Date | null) => (x ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(x) : "—");

  return (
    <div className={a.page}>
      <p className={a.eyebrow}>Réponses à valider</p>
      <h1 className={a.h1}>Réponses vidéo en autonomie</h1>
      <p className={a.sub}>
        Une réponse n&apos;est payée qu&apos;une fois validée ici. Les indices aident à repérer une réponse bâclée (questions passées trop vite, peu de mots) ;
        regarde la vidéo avant de refuser. Refuser rembourse la marque et prévient le participant, avec ta raison.
      </p>

      <section className={a.section}>
        <div className={a.sectionHead}><h2 className={a.h2}>En attente</h2><span className={a.muted} style={{ fontSize: 12 }}>{rows.length} réponse{rows.length > 1 ? "s" : ""}</span></div>
        {rows.length === 0 && <p className={a.muted} style={{ fontSize: 13 }}>Aucune réponse en attente.</p>}
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((iv) => {
            const { study, participantProfile: pp } = iv.application;
            const c = checkAsyncAnswer(iv, study.guide);
            const lv = LEVEL[c.level];
            return (
              <div key={iv.id} className={a.card} style={{ padding: 16, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "baseline" }}>
                  <Link href={`/admin/participants/${pp.id}`} style={{ fontWeight: 700, color: "#f2f0ec" }}>{pp.firstName} {pp.lastName}</Link>
                  <span className={a.muted} style={{ fontSize: 12.5 }}>{pp.profession ?? ""}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: lv.bg, color: lv.fg }}>{lv.label}</span>
                  <span className={a.muted} style={{ fontSize: 12, marginLeft: "auto" }}>
                    <Link href={`/admin/studies/${study.id}`} style={{ color: "inherit" }}>{study.title}</Link> · {study.brandProfile.companyName} · envoyée le {d(iv.submittedAt)}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13 }}>
                  <span><b>{c.seen}/{c.total}</b> questions vues</span>
                  <span><b>{c.minutes ?? "—"}</b> min au total</span>
                  <span><b>{c.words}</b> mots</span>
                  <span><b>{((iv.application.participantPayCents ?? 0) / 100).toLocaleString("fr-FR")} €</b> à payer</span>
                </div>
                {c.flags.length > 0 && <div style={{ fontSize: 12.5, color: "#f0cf78" }}>{c.flags.join(" · ")}</div>}
                <details>
                  <summary style={{ cursor: "pointer", fontSize: 12.5, color: "#9a9792" }}>Détail par question</summary>
                  <div className={a.tableWrap} style={{ marginTop: 8 }}>
                    {c.perQuestion.map((q) => (
                      <div key={q.index} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) 70px 70px", gap: 10, padding: "6px 4px", borderTop: "1px solid #262420", fontSize: 12.5, minWidth: 520 }}>
                        <span className={a.muted}>{q.index + 1}</span>
                        <span>{q.question}</span>
                        <span style={{ color: q.seconds != null && q.seconds < 20 ? "#f0cf78" : undefined }}>{q.seconds != null ? `${q.seconds} s` : "non vue"}</span>
                        <span style={{ color: q.words < 25 ? "#f0cf78" : undefined }}>{q.words} mots</span>
                      </div>
                    ))}
                  </div>
                </details>
                {iv.transcript && (
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 12.5, color: "#9a9792" }}>Transcription</summary>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.6, marginTop: 8, maxHeight: 320, overflow: "auto", color: "#d9d6d0" }}>{iv.transcript}</div>
                  </details>
                )}
                <ReviewActions interviewId={iv.id} hasVideo={!!iv.recordingId} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
