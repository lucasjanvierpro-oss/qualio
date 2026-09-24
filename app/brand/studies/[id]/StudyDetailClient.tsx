"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import p from "./profile.module.css";
import { acceptApplication, rejectApplication } from "@/app/actions/studies";
import { requestProfile } from "@/app/actions/profileRequests";
import { reviewInterview } from "@/app/actions/reviews";
import { REVIEW_TAGS, type Trust } from "@/lib/participants/trust";
import type { EarnedBadge } from "@/lib/participants/badges";
import { BadgeChips } from "@/components/badges/BadgeShelf";
import TrustBlock from "@/components/badges/TrustBlock";

export type Candidate = {
  applicationId: string;
  status: string;
  name: string;
  age: number | null;
  city: string | null;
  profession: string | null;
  participantProfileId: string;
  portrait: string | null;
  why: string | null;
  tier: "STANDARD" | "ON_REQUEST";
  accessNote: string | null;
  idVerified: boolean;
  linkedinVerified: boolean;
  interviewsDone: number;
  attendance: number | null;
  trust: Trust;
  badges: EarnedBadge[];
  /** Traits confirmés par l'IA (Initiée, Défricheuse…). */
  traits: string[];
  /** Niveau de certification, 0 à 100. */
  certScore: number;
  price: { credits: number; euros: number; tierLabel: string; why: string[] } | null;
  kind: string | null;
  expertise: string | null;
  alsoKnows: string[];
  strengths: string[];
  references: string[];
  generation: string | null;
  scores: { expertise: number | null; vocabulaire: number | null; authenticite: number | null };
  step: "participant_to_propose" | "brand_to_choose" | "participant_to_choose" | null;
  proposals: string[];
  interview: {
    id: string; scheduledAt: string; status: string; transcriptReady: boolean;
    review: { rating: number; tags: string[]; comment: string | null } | null;
  } | null;
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



const TICK = (
  <svg className={p.sealDot} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18" />
    <path d="M4.6 8.3l2.2 2.1L11.4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Les vérifications, et elles seules : l'historique (entretiens, présence,
 * avis) a son propre bloc plus bas, les médailles leur propre rangée.
 */
function Seals({ c }: { c: Candidate }) {
  const items: { key: string; label: string }[] = [];
  if (c.idVerified) items.push({ key: "id", label: "Identité vérifiée" });
  if (c.linkedinVerified) items.push({ key: "li", label: "LinkedIn vérifié" });
  if (!items.length) return null;
  return (
    <div className={p.seals}>
      {items.map((i) => (
        <span key={i.key} className={`${p.seal} ${p.sealOk}`}>{TICK}{i.label}</span>
      ))}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  insider: "Insider industrie",
  expert: "Expert du sujet",
  enthusiast: "Passionné",
  consumer: "Consommateur averti",
};

/** Une jauge de 0 à 10, lisible d'un coup d'œil. */
function Score({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <div className={p.score}>
      <div className={p.scoreTop}><span>{label}</span><b>{value}</b></div>
      <div className={p.gauge}><i style={{ width: `${value * 10}%` }} /></div>
    </div>
  );
}

/**
 * La fiche que la marque lit pour décider si elle veut entendre quelqu'un.
 * L'ordre suit la décision : qui c'est, pourquoi on le propose, ce qu'il
 * apporte, ses repères. Le portrait rédigé est replié — il documente une fois
 * la décision prise, il ne sert pas à la prendre.
 */
function ProfileCard({
  c, credits, busy, error, onAccept, onReject, onRequest, requested,
}: {
  c: Candidate;
  credits: number;
  busy: boolean;
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  onRequest: () => void;
  requested: boolean;
}) {
  const [openPortrait, setOpenPortrait] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const cost = c.price?.credits ?? 0;
  const [allRefs, setAllRefs] = useState(false);
  const onRequestOnly = c.tier === "ON_REQUEST";

  const facts = [c.profession, c.age ? `${c.age} ans` : null, c.city, c.generation]
    .filter(Boolean).join(" · ");
  const refs = allRefs ? c.references : c.references.slice(0, 7);
  const hidden = c.references.length - refs.length;
  const kind = c.kind ? (KIND_LABEL[c.kind] ?? c.kind) : null;
  const hasScores = c.scores.expertise !== null || c.scores.vocabulaire !== null || c.scores.authenticite !== null;

  return (
    <article className={p.card} data-busy={busy} data-tier={c.tier}>
      <div className={p.head}>
        <span className={p.portraitInitial} aria-hidden="true">{c.name[0]}</span>
        <div className={p.identity}>
          <div className={p.name}>{c.name}</div>
          {facts && <div className={p.facts}>{facts}</div>}
          <Seals c={c} />
        </div>
        {onRequestOnly
          ? <span className={p.tierMark}>Sur demande</span>
          : kind && <span className={p.kind}>{kind}</span>}
      </div>

      {(c.badges.length > 0 || c.traits.length > 0) && (
        <div className={p.medals}>
          <div className={p.certRow}>
            <span className={p.certLabel}>Profil certifié à <b>{c.certScore} %</b></span>
            <span className={p.certGauge} aria-hidden="true"><i style={{ width: `${c.certScore}%` }} /></span>
          </div>
          <BadgeChips badges={c.badges} max={4} />
          {c.traits.length > 0 && (
            <div className={p.traits}>{c.traits.map((t) => <span key={t} className={p.trait}>{t}<em>confirmé par l&apos;IA</em></span>)}</div>
          )}
        </div>
      )}

      {c.why && <p className={p.why}>{c.why}</p>}

      {c.expertise && (
        <div className={p.block}>
          <div className={p.blockTitle}>Expertise</div>
          <div className={p.expertise}>{c.expertise}</div>
          {c.alsoKnows.length > 0 && <div className={p.also}>Aussi : {c.alsoKnows.join(", ")}</div>}
        </div>
      )}

      {c.strengths.length > 0 && (
        <div className={p.block}>
          <div className={p.blockTitle}>Ce que {c.name.split(" ")[0]} apporte</div>
          <ul className={p.strengths}>
            {c.strengths.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      )}

      {c.references.length > 0 && (
        <div className={p.block}>
          <div className={p.blockTitle}>Ses repères</div>
          <div className={p.refs}>
            {refs.map((r) => <span key={r} className={p.ref}>{r.replace(/-/g, " ")}</span>)}
            {hidden > 0 && (
              <button type="button" className={p.refMore} onClick={() => setAllRefs(true)}>
                +{hidden}
              </button>
            )}
          </div>
        </div>
      )}

      <TrustBlock trust={c.trust} firstName={c.name.split(" ")[0]} dark={onRequestOnly} />

      {hasScores && (
        <div className={p.scores}>
          <Score label="Expertise" value={c.scores.expertise} />
          <Score label="Vocabulaire" value={c.scores.vocabulaire} />
          <Score label="Authenticité" value={c.scores.authenticite} />
        </div>
      )}

      {c.portrait && (
        <div className={p.more}>
          <button type="button" className={p.moreBtn} aria-expanded={openPortrait}
            onClick={() => setOpenPortrait((v) => !v)}>
            <span className={p.chev} aria-hidden="true">›</span>
            {openPortrait ? "Masquer le portrait" : "Lire le portrait complet"}
          </button>
          {openPortrait && <p className={p.portrait}>{c.portrait}</p>}
        </div>
      )}

      {error && <p className={s.error} style={{ margin: "0 20px 10px" }}>{error}</p>}

      <div className={p.actions}>
        {onRequestOnly ? (
          <>
            {requested ? (
              <span className={p.askDone}>Demande envoyée. Nous revenons vers vous sous 48 h.</span>
            ) : (
              <button type="button" className={p.askBtn} disabled={busy} onClick={onRequest}>
                Demander ce profil
              </button>
            )}
            <span className={p.onRequest}>{c.accessNote ?? (c.price ? `Prix indicatif : ${c.price.credits} crédits` : "Aucun crédit débité")}</span>
          </>
        ) : (
          <>
            <button type="button" className={s.btn} disabled={busy || !c.price || credits < cost} onClick={onAccept}>
              Je veux l&apos;entendre
            </button>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} disabled={busy} onClick={onReject}>
              Décliner
            </button>
            {c.price && (
              <button type="button" className={p.price} aria-expanded={openPrice} onClick={() => setOpenPrice((v) => !v)}>
                <b>{c.price.credits} crédits</b>
                <span>{(c.price.euros / 100).toLocaleString("fr-FR")} € HT · {c.price.tierLabel}</span>
              </button>
            )}
            {c.price && credits < cost && (
              <Link href="/brand/account" className={p.topup}>Il vous manque {cost - credits} crédits →</Link>
            )}
            {openPrice && c.price && (
              <ul className={p.priceWhy}>
                <li><b>Palier {c.price.tierLabel}</b></li>
                {c.price.why.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/** Note laissée après l'entretien : lue par les autres marques, jamais par le participant. */
function ReviewForm({ c, onDone, onClose }: { c: Candidate; onDone: () => void; onClose: () => void }) {
  const existing = c.interview?.review;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!c.interview) return null;
  return (
    <div className={p.reviewForm}>
      <div className={p.reviewStars} role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} data-on={i <= rating} onClick={() => setRating(i)}>★</button>
        ))}
      </div>
      <div className={p.reviewTags}>
        {REVIEW_TAGS.map((t) => (
          <button key={t} type="button" aria-pressed={tags.includes(t)}
            onClick={() => setTags((v) => (v.includes(t) ? v.filter((x) => x !== t) : v.length < 4 ? [...v, t] : v))}>{t}</button>
        ))}
      </div>
      <textarea className={p.reviewText} rows={2} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Ce qu'il faut savoir avant de l'interroger. Visible par les autres marques, pas par le participant." />
      {err && <p className={s.error}>{err}</p>}
      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={!rating || pending}
          onClick={() => startTransition(async () => {
            const r = await reviewInterview({ interviewId: c.interview!.id, rating, tags, comment });
            if ("error" in r) setErr(r.error === "session_expired" ? "Session expirée, reconnectez-vous." : "Avis impossible pour le moment.");
            else onDone();
          })}>
          {pending ? "…" : "Publier l'avis"}
        </button>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

export default function StudyDetailClient({ study, candidates, credits }: { study: Study; candidates: Candidate[]; credits: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  const [showDeclined, setShowDeclined] = useState(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  // Un profil sur demande ne quitte pas la liste : la marque doit continuer à
  // le voir pendant que Rarelyst traite la demande.
  const [requested, setRequested] = useState<string[]>([]);

  // La décision part au serveur, mais la fiche quitte la liste tout de suite.
  // Un aller-retour complet prenait plus d'une seconde : la marque cliquait
  // deux fois, faute de retour visible.
  const [decided, markDecided] = useOptimistic<string[], string>([], (seen, id) => [...seen, id]);

  const toReview = candidates.filter(
    (c) => (c.status === "SHORTLISTED" || c.status === "PENDING") && !decided.includes(c.applicationId)
  );
  const scheduling = candidates.filter((c) => c.status === "INVITED");
  const interviews = candidates.filter((c) => ["CONFIRMED", "COMPLETED", "NO_SHOW"].includes(c.status))
    .sort((a, b) => (a.interview?.scheduledAt ?? "").localeCompare(b.interview?.scheduledAt ?? ""));
  const declined = candidates.filter((c) => c.status === "REJECTED");
  const confirmed = candidates.filter((c) => c.status === "CONFIRMED" || c.status === "COMPLETED").length;
  const meta = STUDY_STATUS[study.status] ?? STUDY_STATUS.ACTIVE;

  function decide(id: string, fn: () => Promise<{ error?: string; ok?: boolean; needed?: number } | undefined>) {
    setError(null);
    startTransition(async () => {
      markDecided(id);
      const r = await fn();
      if (r?.error) {
        const msg = r.error === "not_enough_credits" ? `Crédits insuffisants : ce profil en demande ${r.needed ?? "plus"}.`
          : r.error === "price_changed" ? "Le prix de ce profil vient d'évoluer. Vérifiez-le et confirmez à nouveau."
          : r.error === "already_decided" ? "Ce profil a déjà été traité."
          : r.error === "session_expired" ? "Votre session a expiré. Reconnectez-vous, votre choix n'a pas été enregistré."
          : "Action impossible. Réessayez.";
        // La fiche revient d'elle-même : l'état optimiste retombe à la fin
        // de la transition.
        setError({ id, msg });
      }
      router.refresh();
    });
  }

  function ask(c: Candidate) {
    setError(null);
    startTransition(async () => {
      const r = await requestProfile(c.participantProfileId, study.id);
      if (r?.error) {
        const msg = r.error === "already_requested" ? "Vous avez déjà demandé ce profil."
          : r.error === "session_expired" ? "Votre session a expiré. Reconnectez-vous."
          : "Demande impossible pour le moment.";
        setError({ id: c.applicationId, msg });
      } else {
        setRequested((v) => [...v, c.applicationId]);
      }
      router.refresh();
    });
  }

  async function choose(c: Candidate, index: number) {
    setChoosing(c.applicationId); setError(null);
    try {
      const res = await fetch(`/api/applications/${c.applicationId}/choose-slot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotIndex: index }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError({ id: c.applicationId, msg: data.error ?? "Impossible de confirmer ce créneau." });
      router.refresh();
    } finally {
      setChoosing(null);
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
          <span className={`${s.small} ${s.muted}`}>Prix par profil selon son palier · <b>{credits} crédits</b> disponibles</span>
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
              <ProfileCard
                key={c.applicationId}
                c={c}
                credits={credits}
                busy={c.tier === "STANDARD" && decided.includes(c.applicationId)}
                error={error?.id === c.applicationId ? error.msg : null}
                onAccept={() => decide(c.applicationId, () => acceptApplication(c.applicationId, c.price?.credits))}
                onReject={() => decide(c.applicationId, () => rejectApplication(c.applicationId))}
                onRequest={() => ask(c)}
                requested={requested.includes(c.applicationId)}
              />
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
                        <button key={iso} type="button" className={s.slot} disabled={choosing === c.applicationId} onClick={() => choose(c, i)}>
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
              <div key={c.applicationId} style={{ padding: "16px 20px", borderTop: i ? "1px solid var(--line)" : 0 }}>
                <div className={s.spread}>
                  <Person c={c} />
                  <div className={s.row}>
                    {c.interview && <span className={s.small} style={{ textTransform: "capitalize" }}>{fmtDay(c.interview.scheduledAt)} · {fmtTime(c.interview.scheduledAt)}</span>}
                    {c.status === "NO_SHOW" && <span className={`${s.badge} ${s.badgeBad}`}>Absent</span>}
                    {c.status === "COMPLETED" && (
                      <span className={`${s.badge} ${c.interview?.transcriptReady ? s.badgeOk : s.badgeWait}`}>
                        {c.interview?.transcriptReady ? "Transcription prête" : "Transcription en cours"}
                      </span>
                    )}
                    {c.status === "COMPLETED" && reviewing !== c.applicationId && (
                      <button type="button" className={`${s.btn} ${c.interview?.review ? s.btnGhost : ""} ${s.btnSm}`} onClick={() => setReviewing(c.applicationId)}>
                        {c.interview?.review ? `★ ${c.interview.review.rating}/5 · modifier` : "Laisser un avis"}
                      </button>
                    )}
                    {c.status === "CONFIRMED" && c.interview && (
                      <Link href={`/brand/interview/${c.interview.id}`} className={`${s.btn} ${s.btnSm}`}>Ouvrir la salle</Link>
                    )}
                  </div>
                </div>
                {reviewing === c.applicationId && (
                  <ReviewForm c={c} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); router.refresh(); }} />
                )}
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
