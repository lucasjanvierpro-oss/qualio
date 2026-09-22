"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import { acceptApplication, rejectApplication } from "@/app/actions/studies";

export type Candidate = {
  applicationId: string;
  status: string;
  name: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  summary: string | null;
  why: string | null;
  step: "participant_to_propose" | "brand_to_choose" | "participant_to_choose" | null;
  proposals: string[];
  interview: { id: string; scheduledAt: string; status: string; transcriptReady: boolean } | null;
};

type Study = {
  id: string;
  title: string;
  status: string;
  isFocusGroup: boolean;
  target: number;
  duration: number;
  deadlineAt: string | null;
  hasReport: boolean;
};

const TZ = "Europe/Paris";
const fmtDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
const fmtTime = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const STUDY_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Brouillon", tone: "" },
  ACTIVE: { label: "Recrutement en cours", tone: s.badgeAccent },
  MATCHING: { label: "Recrutement en cours", tone: s.badgeAccent },
  IN_PROGRESS: { label: "Entretiens en cours", tone: s.badgeWait },
  COMPLETED: { label: "Terminée", tone: s.badgeOk },
  CANCELLED: { label: "Annulée", tone: s.badgeBad },
};

function Person({ c }: { c: Candidate }) {
  const facts = [c.profession, c.age ? `${c.age} ans` : null, c.city].filter(Boolean).join(" · ");
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span className={s.avatar} style={{ width: 42, height: 42, fontSize: 17 }}>{c.name[0]}</span>
      <span>
        <strong style={{ fontSize: 17, letterSpacing: "-0.02em" }}>{c.name}</strong>
        {facts && <span className={`${s.small} ${s.muted}`} style={{ display: "block" }}>{facts}</span>}
      </span>
    </div>
  );
}

export default function StudyDetailClient({ study, candidates, credits }: { study: Study; candidates: Candidate[]; credits: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  const [showDeclined, setShowDeclined] = useState(false);

  const toReview = candidates.filter((c) => c.status === "SHORTLISTED" || c.status === "PENDING");
  const scheduling = candidates.filter((c) => c.status === "INVITED");
  const interviews = candidates.filter((c) => ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(c.status))
    .sort((a, b) => (a.interview?.scheduledAt ?? "").localeCompare(b.interview?.scheduledAt ?? ""));
  const declined = candidates.filter((c) => c.status === "REJECTED");
  const confirmed = candidates.filter((c) => c.status === "CONFIRMED" || c.status === "COMPLETED").length;
  const meta = STUDY_STATUS[study.status] ?? STUDY_STATUS.ACTIVE;

  async function run(id: string, fn: () => Promise<{ error?: string; ok?: boolean } | undefined>) {
    setBusy(id); setError(null);
    try {
      const r = await fn();
      if (r?.error) {
        const msg = r.error === "not_enough_credits" ? "Crédits insuffisants pour accepter ce profil."
          : r.error === "already_decided" ? "Ce profil a déjà été traité."
          : "Action impossible. Réessayez.";
        setError({ id, msg });
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function choose(c: Candidate, index: number) {
    setBusy(c.applicationId); setError(null);
    try {
      const res = await fetch(`/api/applications/${c.applicationId}/choose-slot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotIndex: index }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError({ id: c.applicationId, msg: data.error ?? "Impossible de confirmer ce créneau." });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <nav className={s.crumbs}><Link href="/brand/studies">Mes études</Link><span>›</span><span>{study.title}</span></nav>

      <header className={s.spread} style={{ alignItems: "flex-end" }}>
        <div>
          <p className={s.eyebrow}>{study.isFocusGroup ? "Focus group" : "Entretiens individuels"} · {study.duration} min</p>
          <h1 className={s.h1}>{study.title}</h1>
          <div className={s.meta}>
            <span className={`${s.badge} ${meta.tone}`}>{meta.label}</span>
            <span>{confirmed} / {study.target} entretiens planifiés</span>
            {study.deadlineAt && <span>Jusqu&apos;au {fmtDay(study.deadlineAt)}</span>}
          </div>
        </div>
        {study.hasReport && <Link href={`/brand/studies/${study.id}/report`} className={s.btn}>Lire la synthèse →</Link>}
      </header>

      {/* ── Profils à valider ── */}
      <section className={s.sectionGap}>
        <div className={s.spread}>
          <h2 className={s.h2}>Profils proposés <span className={s.faint}>({toReview.length})</span></h2>
          <span className={`${s.small} ${s.muted}`}>1 crédit par profil accepté · {credits} disponible{credits > 1 ? "s" : ""}</span>
        </div>
        {toReview.length === 0 ? (
          <p className={`${s.cardSoft} ${s.muted}`} style={{ marginTop: 12 }}>
            {candidates.length === 0
              ? "Nous sélectionnons vos premiers profils. Ils apparaîtront ici, avec la raison de chaque choix."
              : "Aucun profil en attente de votre avis."}
          </p>
        ) : (
          <div className={s.grid2} style={{ marginTop: 12 }}>
            {toReview.map((c) => (
              <article key={c.applicationId} className={s.card} style={{ display: "grid", gap: 14, alignContent: "start" }}>
                <Person c={c} />
                {c.why && (
                  <div className={s.cardSoft} style={{ padding: "12px 14px" }}>
                    <p className={s.eyebrow} style={{ fontSize: 13, margin: "0 0 4px" }}>Pourquoi ce profil</p>
                    <p style={{ margin: 0, fontSize: 15 }}>{c.why}</p>
                  </div>
                )}
                {c.summary && <p className={s.muted} style={{ margin: 0, fontSize: 15 }}>{c.summary}</p>}
                {error?.id === c.applicationId && <p className={s.error}>{error.msg}</p>}
                <div className={s.row}>
                  <button type="button" className={s.btn} disabled={busy === c.applicationId || credits < 1}
                    onClick={() => run(c.applicationId, () => acceptApplication(c.applicationId))}>
                    {busy === c.applicationId ? "…" : "Je veux l'entendre"}
                  </button>
                  <button type="button" className={`${s.btn} ${s.btnGhost}`} disabled={busy === c.applicationId}
                    onClick={() => run(c.applicationId, () => rejectApplication(c.applicationId))}>
                    Décliner
                  </button>
                </div>
                {credits < 1 && <Link href="/brand/account" className={s.small} style={{ color: "var(--accent)" }}>Ajouter des crédits pour accepter ce profil →</Link>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Planification ── */}
      {scheduling.length > 0 && (
        <section className={s.sectionGap}>
          <h2 className={s.h2}>Planification <span className={s.faint}>({scheduling.length})</span></h2>
          <div className={s.stack} style={{ marginTop: 12 }}>
            {scheduling.map((c) => (
              <article key={c.applicationId} className={s.card}>
                <div className={s.spread}>
                  <Person c={c} />
                  {c.step === "brand_to_choose"
                    ? <span className={`${s.badge} ${s.badgeAccent}`}>À vous de choisir</span>
                    : <span className={`${s.badge} ${s.badgeWait}`}>{c.step === "participant_to_choose" ? "Confirmation en attente" : "Disponibilités en attente"}</span>}
                </div>
                {c.step === "brand_to_choose" ? (
                  <>
                    <p className={s.muted} style={{ margin: "14px 0 10px" }}>
                      {c.name.split(" ")[0]} propose ces créneaux. Choisissez-en un : l&apos;entretien est confirmé immédiatement, pour vous deux.
                    </p>
                    <div className={s.slots}>
                      {c.proposals.map((iso, i) => (
                        <button key={iso} type="button" className={s.slot} disabled={busy === c.applicationId} onClick={() => choose(c, i)}>
                          <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(iso)}</span>
                          <small>{fmtTime(iso)} · choisir</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={s.muted} style={{ margin: "14px 0 0" }}>
                    {c.step === "participant_to_choose"
                      ? "Des créneaux lui ont été proposés. Vous serez prévenu dès qu'il en choisit un."
                      : "Nous lui avons demandé ses disponibilités. Vous recevrez un email dès qu'il en propose."}
                  </p>
                )}
                {error?.id === c.applicationId && <p className={s.error}>{error.msg}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Entretiens ── */}
      {interviews.length > 0 && (
        <section className={s.sectionGap}>
          <h2 className={s.h2}>Entretiens <span className={s.faint}>({interviews.length})</span></h2>
          <div className={s.card} style={{ marginTop: 12, padding: 0 }}>
            {interviews.map((c, i) => (
              <div key={c.applicationId} className={s.spread} style={{ padding: "16px 20px", borderTop: i ? "1px solid var(--line)" : 0 }}>
                <Person c={c} />
                <div className={s.row}>
                  {c.interview && <span className={s.small} style={{ textTransform: "capitalize" }}>{fmtDay(c.interview.scheduledAt)} · {fmtTime(c.interview.scheduledAt)}</span>}
                  {c.status === "NO_SHOW" && <span className={`${s.badge} ${s.badgeBad}`}>Absent</span>}
                  {c.status === "COMPLETED" && (
                    <span className={`${s.badge} ${c.interview?.transcriptReady ? s.badgeOk : s.badgeWait}`}>
                      {c.interview?.transcriptReady ? "Transcription prête" : "Transcription en cours"}
                    </span>
                  )}
                  {c.status === "CONFIRMED" && c.interview && (
                    <Link href={`/brand/interview/${c.interview.id}`} className={`${s.btn} ${s.btnSm}`}>Ouvrir la salle</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {declined.length > 0 && (
        <section className={s.sectionGap}>
          <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setShowDeclined((v) => !v)} aria-expanded={showDeclined}>
            {showDeclined ? "Masquer" : "Voir"} les profils déclinés ({declined.length})
          </button>
          {showDeclined && (
            <div className={s.grid2} style={{ marginTop: 12 }}>
              {declined.map((c) => <div key={c.applicationId} className={s.cardSoft}><Person c={c} /></div>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
