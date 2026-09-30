"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import { LoupeScan } from "@/components/brand/LoupeMascot";
import p from "./profile.module.css";
import { acceptApplication, rejectApplication } from "@/app/actions/studies";
import { requestProfile } from "@/app/actions/profileRequests";
import { reviewInterview } from "@/app/actions/reviews";
import { REVIEW_TAGS, type Trust } from "@/lib/participants/trust";
import type { EarnedBadge } from "@/lib/participants/badges";
import { BadgeChips } from "@/components/badges/BadgeShelf";
import TrustBlock from "@/components/badges/TrustBlock";
import Tour from "@/components/tour/Tour";
import { useLang, useTT } from "@/lib/i18n/client";

type TT = (fr: string, en: string) => string;

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
    id: string; scheduledAt: string; status: string; transcriptReady: boolean; mode?: string;
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
  createdAt: string;
  brief: { objective: string; profiles: { label: string; count: number }[]; decisions: string[]; guide: string[]; fileName: string | null };
};

const TZ = "Europe/Paris";
const fmtDay = (iso: string, en = false) => new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
const fmtTime = (iso: string, en = false) => new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const STUDY_STATUS = (tt: TT): Record<string, { label: string; tone: string }> => ({
  DRAFT: { label: tt("Brouillon", "Draft"), tone: "" },
  ACTIVE: { label: tt("Recrutement en cours", "Recruiting"), tone: s.badgeAccent },
  MATCHING: { label: tt("Recrutement en cours", "Recruiting"), tone: s.badgeAccent },
  IN_PROGRESS: { label: tt("Entretiens en cours", "Interviews in progress"), tone: s.badgeWait },
  COMPLETED: { label: tt("Terminée", "Completed"), tone: s.badgeOk },
  CANCELLED: { label: tt("Annulée", "Cancelled"), tone: s.badgeBad },
});

function Person({ c }: { c: Candidate }) {
  const tt = useTT();
  const facts = [c.profession, c.age ? tt(`${c.age} ans`, `${c.age} y/o`) : null, c.city].filter(Boolean).join(" · ");
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
  const tt = useTT();
  const items: { key: string; label: string }[] = [];
  if (c.idVerified) items.push({ key: "id", label: tt("Identité vérifiée", "ID verified") });
  if (c.linkedinVerified) items.push({ key: "li", label: tt("LinkedIn vérifié", "LinkedIn verified") });
  if (!items.length) return null;
  return (
    <div className={p.seals}>
      {items.map((i) => (
        <span key={i.key} className={`${p.seal} ${p.sealOk}`}>{TICK}{i.label}</span>
      ))}
    </div>
  );
}

const KIND_LABEL = (tt: TT): Record<string, string> => ({
  insider: tt("Insider industrie", "Industry insider"),
  expert: tt("Expert du sujet", "Subject expert"),
  enthusiast: tt("Passionné", "Enthusiast"),
  consumer: tt("Consommateur averti", "Savvy consumer"),
});

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
  const tt = useTT();
  const en = useLang() === "en";
  const [openPortrait, setOpenPortrait] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const cost = c.price?.credits ?? 0;
  const [allRefs, setAllRefs] = useState(false);
  const onRequestOnly = c.tier === "ON_REQUEST";

  const facts = [c.profession, c.age ? tt(`${c.age} ans`, `${c.age} y/o`) : null, c.city, c.generation]
    .filter(Boolean).join(" · ");
  const refs = allRefs ? c.references : c.references.slice(0, 7);
  const hidden = c.references.length - refs.length;
  const kind = c.kind ? (KIND_LABEL(tt)[c.kind] ?? c.kind) : null;
  const hasScores = c.scores.expertise !== null || c.scores.vocabulaire !== null || c.scores.authenticite !== null;

  return (
    <article className={p.card} data-busy={busy} data-tier={c.tier} data-tour="study-card">
      <div className={p.head}>
        <span className={p.portraitInitial} aria-hidden="true">{c.name[0]}</span>
        <div className={p.identity}>
          <div className={p.name}>{c.name}</div>
          {facts && <div className={p.facts}>{facts}</div>}
          <Seals c={c} />
        </div>
        {onRequestOnly
          ? <span className={p.tierMark}>{tt("Sur demande", "On request")}</span>
          : kind && <span className={p.kind}>{kind}</span>}
      </div>

      {(c.badges.length > 0 || c.traits.length > 0) && (
        <div className={p.medals} data-tour="study-medals">
          <div className={p.certRow}>
            <span className={p.certLabel}>{tt("Profil certifié à", "Profile certified at")} <b>{c.certScore} %</b></span>
            <span className={p.certGauge} aria-hidden="true"><i style={{ width: `${c.certScore}%` }} /></span>
          </div>
          <BadgeChips badges={c.badges} max={4} lang={en ? "en" : "fr"} />
          {c.traits.length > 0 && (
            <div className={p.traits}>{c.traits.map((t) => <span key={t} className={p.trait}>{t}<em>{tt("confirmé par l'IA", "confirmed by AI")}</em></span>)}</div>
          )}
        </div>
      )}

      {c.why && <p className={p.why}>{c.why}</p>}

      {c.expertise && (
        <div className={p.block}>
          <div className={p.blockTitle}>Expertise</div>
          <div className={p.expertise}>{c.expertise}</div>
          {c.alsoKnows.length > 0 && <div className={p.also}>{tt("Aussi :", "Also:")} {c.alsoKnows.join(", ")}</div>}
        </div>
      )}

      {c.strengths.length > 0 && (
        <div className={p.block}>
          <div className={p.blockTitle}>{en ? `What ${c.name.split(" ")[0]} brings` : `Ce que ${c.name.split(" ")[0]} apporte`}</div>
          <ul className={p.strengths}>
            {c.strengths.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      )}

      {c.references.length > 0 && (
        <div className={p.block}>
          <div className={p.blockTitle}>{tt("Ses repères", "Their references")}</div>
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

      <TrustBlock trust={c.trust} firstName={c.name.split(" ")[0]} dark={onRequestOnly} lang={en ? "en" : "fr"} />

      {hasScores && (
        <div className={p.scores}>
          <Score label="Expertise" value={c.scores.expertise} />
          <Score label={tt("Vocabulaire", "Vocabulary")} value={c.scores.vocabulaire} />
          <Score label={tt("Authenticité", "Authenticity")} value={c.scores.authenticite} />
        </div>
      )}

      {c.portrait && (
        <div className={p.more}>
          <button type="button" className={p.moreBtn} aria-expanded={openPortrait}
            onClick={() => setOpenPortrait((v) => !v)}>
            <span className={p.chev} aria-hidden="true">›</span>
            {openPortrait ? tt("Masquer le portrait", "Hide the portrait") : tt("Lire le portrait complet", "Read the full portrait")}
          </button>
          {openPortrait && <p className={p.portrait}>{c.portrait}</p>}
        </div>
      )}

      {error && <p className={s.error} style={{ margin: "0 20px 10px" }}>{error}</p>}

      <div className={p.actions}>
        {onRequestOnly ? (
          <>
            {requested ? (
              <span className={p.askDone}>{tt("Demande envoyée. Nous revenons vers vous sous 48 h.", "Request sent. We will get back to you within 48h.")}</span>
            ) : (
              <button type="button" className={p.askBtn} disabled={busy} onClick={onRequest}>
                {tt("Demander ce profil", "Request this profile")}
              </button>
            )}
            <span className={p.onRequest}>{c.accessNote ?? (c.price ? tt(`Prix indicatif : ${c.price.credits} crédits`, `Indicative price: ${c.price.credits} credits`) : tt("Aucun crédit débité", "No credits charged"))}</span>
          </>
        ) : (
          <>
            <button type="button" className={s.btn} disabled={busy || !c.price || credits < cost} onClick={onAccept} data-tour="study-accept">
              {tt("Je veux l'entendre", "I want to hear them")}
            </button>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} disabled={busy} onClick={onReject}>
              {tt("Décliner", "Decline")}
            </button>
            {c.price && (
              <button type="button" className={p.price} aria-expanded={openPrice} onClick={() => setOpenPrice((v) => !v)} data-tour="study-price">
                <b>{c.price.credits} {tt("crédits", "credits")}</b>
                <span>{(c.price.euros / 100).toLocaleString(en ? "en-GB" : "fr-FR")} € {tt("HT", "excl. VAT")} · {c.price.tierLabel}</span>
              </button>
            )}
            {c.price && credits < cost && (
              <Link href="/brand/account" className={p.topup}>{tt(`Il vous manque ${cost - credits} crédits`, `You need ${cost - credits} more credits`)} →</Link>
            )}
            {openPrice && c.price && (
              <ul className={p.priceWhy}>
                <li><b>{tt("Palier", "Tier")} {c.price.tierLabel}</b></li>
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
  const tt = useTT();
  const existing = c.interview?.review;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!c.interview) return null;
  return (
    <div className={p.reviewForm}>
      <div className={p.reviewStars} role="radiogroup" aria-label={tt("Note", "Rating")}>
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
        placeholder={tt("Ce qu'il faut savoir avant de l'interroger. Visible par les autres marques, pas par le participant.", "What to know before interviewing them. Visible to other brands, not to the participant.")} />
      {err && <p className={s.error}>{err}</p>}
      <div className={s.row}>
        <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={!rating || pending}
          onClick={() => startTransition(async () => {
            const r = await reviewInterview({ interviewId: c.interview!.id, rating, tags, comment });
            if ("error" in r) setErr(r.error === "session_expired" ? tt("Session expirée, reconnectez-vous.", "Session expired, please log in again.") : tt("Avis impossible pour le moment.", "Could not post the review right now."));
            else onDone();
          })}>
          {pending ? "…" : tt("Publier l'avis", "Post review")}
        </button>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={onClose}>{tt("Annuler", "Cancel")}</button>
      </div>
    </div>
  );
}

export default function StudyDetailClient({ study, candidates, credits, isNew }: { study: Study; candidates: Candidate[]; credits: number; isNew?: boolean }) {
  const router = useRouter();
  const tt = useTT();
  const en = useLang() === "en";
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
  const statuses = STUDY_STATUS(tt);
  const meta = statuses[study.status] ?? statuses.ACTIVE;

  function decide(id: string, fn: () => Promise<{ error?: string; ok?: boolean; needed?: number } | undefined>) {
    setError(null);
    startTransition(async () => {
      markDecided(id);
      const r = await fn();
      if (r?.error) {
        const msg = r.error === "not_enough_credits" ? tt(`Crédits insuffisants : ce profil en demande ${r.needed ?? "plus"}.`, `Not enough credits: this profile needs ${r.needed ?? "more"}.`)
          : r.error === "price_changed" ? tt("Le prix de ce profil vient d'évoluer. Vérifiez-le et confirmez à nouveau.", "This profile's price has just changed. Check it and confirm again.")
          : r.error === "already_decided" ? tt("Ce profil a déjà été traité.", "This profile has already been handled.")
          : r.error === "session_expired" ? tt("Votre session a expiré. Reconnectez-vous, votre choix n'a pas été enregistré.", "Your session expired. Log in again, your choice was not saved.")
          : tt("Action impossible. Réessayez.", "Action failed. Please try again.");
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
        const msg = r.error === "already_requested" ? tt("Vous avez déjà demandé ce profil.", "You have already requested this profile.")
          : r.error === "session_expired" ? tt("Votre session a expiré. Reconnectez-vous.", "Your session expired. Please log in again.")
          : tt("Demande impossible pour le moment.", "Request not possible right now.");
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
      if (!res.ok) setError({ id: c.applicationId, msg: data.error ?? tt("Impossible de confirmer ce créneau.", "Could not confirm this slot.") });
      router.refresh();
    } finally {
      setChoosing(null);
    }
  }

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <nav className={s.crumbs}><Link href="/brand/studies">{tt("Mes études", "My studies")}</Link><span>›</span><span>{study.title}</span></nav>

      <header className={s.spread} style={{ alignItems: "flex-end" }}>
        <div>
          <p className={s.eyebrow}>{study.isFocusGroup ? "Focus group" : tt("Entretiens individuels", "One-on-one interviews")} · {study.duration} min</p>
          <h1 className={s.h1}>{study.title}</h1>
          <div className={s.meta}>
            <span className={`${s.badge} ${meta.tone}`}>{meta.label}</span>
            <span>{confirmed} / {study.target} {tt("entretiens planifiés", "interviews scheduled")}</span>
            {study.deadlineAt && <span>{tt("Jusqu'au", "Until")} {fmtDay(study.deadlineAt, en)}</span>}
          </div>
        </div>
        {study.hasReport && <Link href={`/brand/studies/${study.id}/report`} className={s.btn}>{tt("Lire la synthèse", "Read the report")} →</Link>}
      </header>

      {/* ── Profils à valider ── */}
      <section className={s.sectionGap}>
        <div className={s.spread}>
          <h2 className={s.h2}>{tt("Profils proposés", "Suggested profiles")} <span className={s.faint}>({toReview.length})</span></h2>
          <span className={`${s.small} ${s.muted}`} data-tour="study-credits">{tt("Prix par profil selon son palier", "Price per profile depends on its tier")} · <b>{credits} {tt("crédits", "credits")}</b> {tt("disponibles", "available")}</span>
        </div>
        {toReview.length === 0 && candidates.length === 0 ? (
          <Waiting isNew={!!isNew} createdAt={study.createdAt} />
        ) : toReview.length === 0 ? (
          <p className={`${s.cardSoft} ${s.muted}`} style={{ marginTop: 12 }}>{tt("Aucun profil en attente de votre avis.", "No profiles waiting for your review.")}</p>
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
          <h2 className={s.h2}>{tt("Planification", "Scheduling")} <span className={s.faint}>({scheduling.length})</span></h2>
          <div className={s.stack} style={{ marginTop: 12 }}>
            {scheduling.map((c) => (
              <article key={c.applicationId} className={s.card}>
                <div className={s.spread}>
                  <Person c={c} />
                  {c.step === "brand_to_choose"
                    ? <span className={`${s.badge} ${s.badgeAccent}`}>{tt("À vous de choisir", "Your turn to choose")}</span>
                    : <span className={`${s.badge} ${s.badgeWait}`}>{c.step === "participant_to_choose" ? tt("Confirmation en attente", "Awaiting confirmation") : tt("Disponibilités en attente", "Awaiting availability")}</span>}
                </div>
                {c.step === "brand_to_choose" ? (
                  <>
                    <p className={s.muted} style={{ margin: "14px 0 10px" }}>
                      {en ? `${c.name.split(" ")[0]} suggests these slots. Pick one: the interview is confirmed right away, for both of you.` : `${c.name.split(" ")[0]} propose ces créneaux. Choisissez-en un : l'entretien est confirmé immédiatement, pour vous deux.`}
                    </p>
                    <div className={s.slots}>
                      {c.proposals.map((iso, i) => (
                        <button key={iso} type="button" className={s.slot} disabled={choosing === c.applicationId} onClick={() => choose(c, i)}>
                          <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(iso, en)}</span>
                          <small>{fmtTime(iso, en)} · {tt("choisir", "choose")}</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={s.muted} style={{ margin: "14px 0 0" }}>
                    {c.step === "participant_to_choose"
                      ? tt("Des créneaux lui ont été proposés. Vous serez prévenu dès qu'il en choisit un.", "Slots have been offered. You will be notified as soon as one is chosen.")
                      : tt("Nous lui avons demandé ses disponibilités. Vous recevrez un email dès qu'il en propose.", "We have asked for their availability. You will get an email as soon as they suggest slots.")}
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
          <h2 className={s.h2}>{tt("Entretiens", "Interviews")} <span className={s.faint}>({interviews.length})</span></h2>
          <div className={s.card} style={{ marginTop: 12, padding: 0 }}>
            {interviews.map((c, i) => (
              <div key={c.applicationId} style={{ padding: "16px 20px", borderTop: i ? "1px solid var(--line)" : 0 }}>
                <div className={s.spread}>
                  <Person c={c} />
                  <div className={s.row}>
                    {c.interview && c.interview.mode !== "async" && <span className={s.small} style={{ textTransform: "capitalize" }}>{fmtDay(c.interview.scheduledAt, en)} · {fmtTime(c.interview.scheduledAt, en)}</span>}
                    {c.interview?.mode === "async" && c.status === "CONFIRMED" && (
                      <span className={`${s.badge} ${c.interview.status === "submitted" ? s.badgeOk : s.badgeWait}`}>
                        {c.interview.status === "submitted" ? tt("Réponse envoyée", "Answer sent") : c.interview.status === "in_progress" ? tt("En train de répondre", "Answering") : tt("Pas encore commencé", "Not started yet")}
                      </span>
                    )}
                    {c.status === "NO_SHOW" && <span className={`${s.badge} ${s.badgeBad}`}>{tt("Absent", "No-show")}</span>}
                    {c.status === "COMPLETED" && (
                      <span className={`${s.badge} ${c.interview?.transcriptReady ? s.badgeOk : s.badgeWait}`}>
                        {c.interview?.transcriptReady ? tt("Transcription prête", "Transcript ready") : tt("Transcription en cours", "Transcript in progress")}
                      </span>
                    )}
                    {c.status === "COMPLETED" && reviewing !== c.applicationId && (
                      <button type="button" className={`${s.btn} ${c.interview?.review ? s.btnGhost : ""} ${s.btnSm}`} onClick={() => setReviewing(c.applicationId)}>
                        {c.interview?.review ? `★ ${c.interview.review.rating}/5 · ${tt("modifier", "edit")}` : tt("Laisser un avis", "Leave a review")}
                      </button>
                    )}
                    {c.status === "CONFIRMED" && c.interview && c.interview.mode !== "async" && (
                      <Link href={`/brand/interview/${c.interview.id}`} className={`${s.btn} ${s.btnSm}`}>{tt("Ouvrir la salle", "Open the room")}</Link>
                    )}
                    {c.interview?.mode === "async" && (c.status === "COMPLETED" || c.interview.status === "submitted") && (
                      <Link href={`/brand/interview/${c.interview.id}`} className={`${s.btn} ${s.btnSm}`}>{tt("Voir la réponse", "See the answer")}</Link>
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

      <BriefRecap brief={study.brief} />

      <Tour id="study" steps={[
        { target: "study-waiting", title: tt("Votre sélection est en route", "Your selection is on its way"), text: tt("L'équipe relit chaque profil avant de vous le proposer. Vous recevez un email dès qu'ils sont là, sous 24 h.", "The team reviews every profile before suggesting it. You get an email as soon as they are ready, within 24h.") },
        { target: "study-card", title: tt("Un profil proposé", "A suggested profile"), text: tt("Qui est cette personne, pourquoi elle correspond à votre brief, et ce qui a été vérifié chez elle.", "Who this person is, why they match your brief, and what has been verified.") },
        { target: "study-medals", title: tt("Les médailles", "Medals"), text: tt("Chacune est une preuve : identité, LinkedIn, emploi, CV… Plus un profil en a, plus vous pouvez lui faire confiance.", "Each one is a proof: ID, LinkedIn, job, CV… The more a profile has, the more you can trust it.") },
        { target: "study-price", title: tt("Son prix", "Their price"), text: tt("En crédits, avec le détail du calcul. Il est figé : il ne bougera plus.", "In credits, with the calculation. It is locked: it won't change.") },
        { target: "study-accept", title: tt("Gardez qui vous voulez", "Keep who you want"), text: tt("Les crédits ne sont débités qu'ici. Le participant propose alors ses créneaux, et vous choisissez.", "Credits are only charged here. The participant then suggests slots, and you choose.") },
        { target: "study-credits", title: tt("Vos crédits", "Your credits"), text: tt("Votre solde. Si une personne ne vient pas, ses crédits vous sont rendus automatiquement.", "Your balance. If someone doesn't show up, their credits are refunded automatically.") },
        { target: "study-brief", title: tt("Votre brief", "Your brief"), text: tt("Ce que vous avez demandé, ce que la synthèse devra trancher et votre guide d'entretien, toujours à portée de main.", "What you asked for, what the report must decide and your interview guide, always at hand.") },
      ]} />

      {declined.length > 0 && (
        <section className={s.sectionGap}>
          <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => setShowDeclined((v) => !v)} aria-expanded={showDeclined}>
            {showDeclined ? tt("Masquer les profils déclinés", "Hide declined profiles") : tt("Voir les profils déclinés", "See declined profiles")} ({declined.length})
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

// Tant qu'aucun profil n'est proposé : ce qui se passe, et quand.
function Waiting({ isNew, createdAt }: { isNew: boolean; createdAt: string }) {
  const tt = useTT();
  const en = useLang() === "en";
  const due = new Date(new Date(createdAt).getTime() + 24 * 3600_000);
  const dueText = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: TZ, weekday: "long", hour: "2-digit", minute: "2-digit" }).format(due);
  const steps = [
    { title: tt("Brief reçu", "Brief received"), text: tt("La fiche de votre étude est entre nos mains.", "Your study sheet is in our hands."), done: true },
    { title: tt("Recherche dans le panel", "Searching the panel"), text: tt("Le moteur classe les profils qui correspondent à chaque groupe.", "The engine ranks the profiles that match each group."), done: true },
    { title: tt("Vérification à la main", "Manual check"), text: tt("L'équipe relit chaque profil avant de vous le proposer.", "The team reviews every profile before suggesting it."), done: false },
    { title: tt("Vos profils, avec leur prix", "Your profiles, with their price"), text: tt(`Au plus tard ${dueText}. Vous recevez un email.`, `By ${dueText} at the latest. You get an email.`), done: false },
  ];
  return (
    <div className={s.card} style={{ marginTop: 12, position: "relative" }} data-tour="study-waiting">
      <div style={{ position: "absolute", right: 18, top: 14 }} className="rl-hide-sm"><LoupeScan variant="profiles" size={0.9} /></div>
      <p className={s.eyebrow} style={{ margin: 0 }}>{isNew ? tt("Brief bien reçu", "Brief received") : tt("Sélection en cours", "Selection in progress")}</p>
      <h3 className={s.h3} style={{ marginTop: 4 }}>{tt("Vos premiers profils arrivent sous 24 h", "Your first profiles arrive within 24h")}</h3>
      <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 12 }}>
        {steps.map((st, i) => (
          <li key={st.title} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12, alignItems: "start" }}>
            <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", fontSize: 12, fontWeight: 700, background: st.done ? "var(--ok)" : i === 2 ? "var(--accent)" : "var(--soft)", color: st.done || i === 2 ? "#fff" : "var(--ink-3)" }}>{st.done ? "✓" : i + 1}</span>
            <span><b style={{ fontSize: 15 }}>{st.title}</b><span className={`${s.small} ${s.muted}`} style={{ display: "block" }}>{st.text}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Le brief de l'étude, replié : ce que la marque a demandé, pour s'y référer.
function BriefRecap({ brief }: { brief: Study["brief"] }) {
  const tt = useTT();
  const has = brief.decisions.length > 0 || brief.guide.length > 0 || brief.profiles.length > 0;
  if (!has) return null;
  return (
    <details className={`${s.card} ${s.sectionGap}`} data-tour="study-brief">
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 17 }}>{tt("Votre brief", "Your brief")}{brief.fileName ? ` · ${brief.fileName}` : ""}</summary>
      <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
        <p className={s.muted} style={{ margin: 0 }}>{brief.objective}</p>
        {brief.profiles.length > 0 && (
          <div className={s.row}>
            {brief.profiles.map((x) => <span key={x.label} className={`${s.badge} ${s.badgeAccent}`}>{x.count} · {x.label}</span>)}
          </div>
        )}
        {brief.decisions.length > 0 && (
          <div>
            <h3 className={s.h3}>{tt("Ce que la synthèse devra trancher", "What the report must decide")}</h3>
            <ul className={s.muted} style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>{brief.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        )}
        {brief.guide.length > 0 && (
          <div>
            <h3 className={s.h3}>{tt("Guide d'entretien", "Interview guide")}</h3>
            <ol className={s.muted} style={{ margin: "6px 0 0", paddingLeft: 20, display: "grid", gap: 4 }}>{brief.guide.map((q) => <li key={q}>{q}</li>)}</ol>
            <p className={`${s.small} ${s.faint}`} style={{ margin: "8px 0 0" }}>{tt("Il s'affiche à côté de la visio pendant chaque entretien.", "It shows next to the video during each interview.")}</p>
          </div>
        )}
      </div>
    </details>
  );
}
