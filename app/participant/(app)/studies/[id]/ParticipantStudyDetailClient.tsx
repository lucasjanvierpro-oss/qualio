"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Tour from "@/components/tour/Tour";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import type { Slot } from "@/lib/interviews/schedule";
import Hallmark from "@/components/brand/Hallmark";
import { certTitles, type CertLevel } from "@/lib/brands/certification";
import { useLang, useTT } from "@/lib/i18n/client";

type Step = "participant_to_propose" | "brand_to_choose" | "participant_to_choose" | null;

type Props = {
  applicationId: string;
  status: string;
  step: Step;
  study: {
    title: string;
    objective: string;
    isFocusGroup: boolean;
    interviewDuration: number;
    rewardAmount: number;
    rewardType: string;
    deadlineAt: string | null;
    brandCert: CertLevel;
  };
  slots: Slot[];
  availability: Record<string, string[]> | null;
  interview: { id: string; scheduledAt: string; durationMinutes: number; status: string; mode?: string; questions?: number } | null;
  reward: { amountCents: number; type: string; status: string } | null;
};

// ── Dates ─────────────────────────────────────────────────────────────
const TZ = "Europe/Paris";
// Dates dans la langue de la page.
const makeFmt = (en: boolean) => {
  const loc = en ? "en-GB" : "fr-FR";
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(loc, { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  const fmtTime = (iso: string) => new Intl.DateTimeFormat(loc, { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return { loc, fmtDay, fmtTime, fmtFull: (iso: string) => `${fmtDay(iso)} ${en ? "at" : "à"} ${fmtTime(iso)}` };
};

// Heures de début proposées pour chaque moment de la journée déclaré à l'inscription.
const MOMENTS: Record<string, [number, number]> = { morning: [10, 0], afternoon: [14, 30], evening: [18, 30] };

// Créneaux suggérés d'après les disponibilités de l'inscription (lundi = "0"),
// sur les deux semaines à venir, sans dépasser la date limite de l'étude.
function suggestSlots(availability: Record<string, string[]> | null, deadlineAt: string | null): string[] {
  const out: string[] = [];
  const start = Date.now() + 24 * 3600_000;
  const limit = deadlineAt ? new Date(deadlineAt).setHours(23, 59) : start + 14 * 24 * 3600_000;
  for (let d = 0; d < 21 && out.length < 12; d++) {
    const day = new Date(start + d * 24 * 3600_000);
    const mondayIdx = (day.getDay() + 6) % 7; // 0 = lundi
    const moments = availability
      ? availability[String(mondayIdx)] ?? []
      : mondayIdx < 5 ? ["morning", "afternoon", "evening"] : [];
    for (const m of moments) {
      const [h, min] = MOMENTS[m] ?? [];
      if (h === undefined) continue;
      const at = new Date(day);
      at.setHours(h, min, 0, 0);
      if (at.getTime() > start && at.getTime() <= limit) out.push(at.toISOString());
    }
  }
  return out;
}

// Vrai seulement dans le navigateur : les suggestions dépendent de l'heure
// courante, les calculer au rendu serveur provoquerait un décalage.
const subscribeNoop = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

// ── Frise ─────────────────────────────────────────────────────────────
function Progress({ current }: { current: number }) {
  const tt = useTT();
  const labels = [tt("Profil retenu", "Selected"), tt("Créneau", "Time slot"), tt("Entretien", "Interview"), tt("Récompense", "Reward")];
  return (
    <ol className={s.steps} aria-label={tt("Avancement", "Progress")}>
      {labels.map((l, i) => (
        <li key={l} className={`${s.step} ${i < current ? s.stepDone : ""} ${i === current ? s.stepNow : ""}`} aria-current={i === current ? "step" : undefined}>{l}</li>
      ))}
    </ol>
  );
}

export default function ParticipantStudyDetailClient(p: Props) {
  const router = useRouter();
  const tt = useTT();
  const en = useLang() === "en";
  const { loc, fmtDay, fmtTime, fmtFull } = makeFmt(en);
  const isClient = useIsClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [consent, setConsent] = useState(false);
  const [nda, setNda] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const suggestions = useMemo(
    () => (isClient ? suggestSlots(p.availability, p.study.deadlineAt) : []),
    [isClient, p.availability, p.study.deadlineAt],
  );
  const choices = useMemo(() => [...new Set([...suggestions, ...selected])].sort(), [suggestions, selected]);

  const reward = en ? `€${(p.study.rewardAmount / 100).toLocaleString(loc)}` : `${(p.study.rewardAmount / 100).toLocaleString(loc)} €`;
  const current =
    p.status === "COMPLETED" ? 3 :
    p.status === "CONFIRMED" ? 2 :
    p.status === "INVITED" ? 1 : 0;

  function toggle(iso: string) {
    setError("");
    setSelected((cur) => cur.includes(iso) ? cur.filter((x) => x !== iso) : cur.length >= 5 ? cur : [...cur, iso]);
  }
  function addCustom() {
    if (!custom) return;
    const d = new Date(custom);
    if (Number.isNaN(d.getTime())) return;
    if (d.getTime() < Date.now() + 12 * 3600_000) { setError(tt("Choisissez un créneau au moins 12 heures à l'avance.", "Pick a time slot at least 12 hours ahead.")); return; }
    toggle(d.toISOString());
    setCustom("");
  }

  async function post(url: string, body: unknown) {
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? tt("Une erreur est survenue. Réessayez.", "Something went wrong. Please try again.")); return false; }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function sendAvailability() {
    if (await post(`/api/applications/${p.applicationId}/availability`, { slots: selected, consent, nda })) {
      setEditing(false); setSelected([]);
    }
  }

  const consentBox = (
    <label className={s.check} data-tour="inv-consent">
      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
      <span>{tt("J'accepte que l'entretien soit enregistré et transcrit pour produire la synthèse de l'étude. Ma pièce d'identité et mes coordonnées ne sont jamais transmises à la marque.", "I agree that the interview is recorded and transcribed to produce the study's synthesis. My ID and contact details are never shared with the brand.")}</span>
    </label>
  );
  const ndaBox = (
    <label className={s.check}>
      <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} />
      <span>{tt("J'accepte l'", "I accept the ")}<a href="/accord-confidentialite" target="_blank" rel="noopener">{tt("accord de confidentialité", "confidentiality agreement")}</a>{tt(" : je garde pour moi tout ce que la marque me montrera ou me dira, sans capture ni enregistrement.", ": I keep to myself everything the brand shows or tells me, with no screenshots or recordings.")}</span>
    </label>
  );

  return (
    <div className={s.page}>
      <nav className={s.crumbs}><Link href="/participant/studies">{tt("Mes études", "My studies")}</Link><span>›</span><span>{p.study.title}</span></nav>

      <header>
        <p className={s.eyebrow}>{p.study.isFocusGroup ? "Focus group" : tt("Entretien individuel", "One-on-one interview")}</p>
        <h1 className={s.h1}>{p.study.title}</h1>
        <div className={s.meta}>
          <span>{p.study.interviewDuration} {tt("min en visio", "min video call")}</span>
          <span data-tour="inv-reward">{reward} {tt("de récompense", "reward")}</span>
          {p.study.deadlineAt && <span>{tt("Jusqu'au", "Until")} {fmtDay(p.study.deadlineAt)}</span>}
        </div>
        {p.study.brandCert > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <Hallmark level={p.study.brandCert} size={64} />
            <span className={s.small} style={{ color: "var(--ink-2)", lineHeight: 1.45 }}>
              <strong style={{ color: "var(--ink)" }}>{tt("Marque poinçonnée", "Hallmarked brand")} · {certTitles(tt("fr", "en") as "fr" | "en")[p.study.brandCert].name}</strong><br />
              {certTitles(tt("fr", "en") as "fr" | "en")[p.study.brandCert].meaning}
            </span>
          </div>
        )}
      </header>

      <div className={s.sectionGap}><Progress current={current} /></div>

      <div className={`${s.stack} ${s.sectionGap}`}>
        {/* ── En attente de la marque ── */}
        {(p.status === "SHORTLISTED" || p.status === "PENDING") && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>{tt("Votre profil a été présenté à la marque.", "Your profile has been presented to the brand.")}</h2>
            <p className={s.muted}>{tt("Elle choisit les personnes qu'elle veut entendre. Vous recevrez un email dès qu'elle vous retient.", "It picks the people it wants to hear from. You will get an email as soon as it selects you.")}</p>
          </section>
        )}

        {/* ── Proposer ses créneaux ── */}
        {p.status === "INVITED" && (p.step === "participant_to_propose" || editing) && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeAccent}`}>{tt("À vous de jouer", "Your turn")}</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>{tt("La marque veut vous entendre. Quand êtes-vous disponible ?", "The brand wants to hear from you. When are you available?")}</h2>
            <p className={s.muted}>{tt("Choisissez jusqu'à 5 créneaux, la marque retiendra celui qui lui convient. Nos suggestions viennent des disponibilités que vous avez indiquées.", "Pick up to 5 time slots; the brand will choose the one that suits it. Our suggestions come from the availability you gave us.")}</p>

            <div className={s.sectionGap}>
              {!isClient ? <p className={s.faint}>{tt("Chargement des créneaux…", "Loading time slots…")}</p> : choices.length === 0 ? (
                <p className={s.faint}>{tt("Aucune suggestion pour le moment : ajoutez un créneau ci-dessous.", "No suggestions yet: add a time slot below.")}</p>
              ) : (
                <div className={s.slots} role="group" aria-label="Créneaux proposés" data-tour="inv-slots">
                  {choices.map((iso) => {
                    const on = selected.includes(iso);
                    return (
                      <button key={iso} type="button" className={`${s.slot} ${on ? s.slotOn : ""}`} aria-pressed={on} onClick={() => toggle(iso)}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(iso)}</span>
                        <small>{fmtTime(iso)}{on ? ` · ${tt("choisi", "selected")}` : ""}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${s.row} ${s.sectionGap}`}>
              <div style={{ flex: "1 1 240px" }} data-tour="inv-custom">
                <label className={s.label} htmlFor="custom-slot">{tt("Un autre moment ?", "Another time?")}</label>
                <input id="custom-slot" className={s.input} type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} />
              </div>
              <button type="button" className={`${s.btn} ${s.btnGhost}`} style={{ alignSelf: "flex-end" }} onClick={addCustom} disabled={!custom}>Ajouter</button>
            </div>

            <hr className={s.divider} />
            {consentBox}
            {ndaBox}
            {error && <p className={s.error}>{error}</p>}
            <div className={`${s.row} ${s.sectionGap}`}>
              <button type="button" className={s.btn} onClick={sendAvailability} disabled={busy || selected.length === 0 || !consent || !nda} data-tour="inv-send">
                {busy ? tt("Envoi…", "Sending…") : selected.length ? tt(`Envoyer ${selected.length} créneau${selected.length > 1 ? "x" : ""}`, `Send ${selected.length} time slot${selected.length > 1 ? "s" : ""}`) : tt("Choisissez au moins un créneau", "Pick at least one time slot")}
              </button>
              {editing && <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => { setEditing(false); setSelected([]); }}>Annuler</button>}
            </div>
          </section>
        )}

        {/* ── Créneaux envoyés, la marque choisit ── */}
        {p.status === "INVITED" && p.step === "brand_to_choose" && !editing && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeWait}`}>{tt("En attente de la marque", "Waiting for the brand")}</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>{tt("Vos créneaux sont envoyés.", "Your time slots have been sent.")}</h2>
            <p className={s.muted}>{tt("La marque en choisit un. Vous recevrez la confirmation et l'invitation d'agenda par email.", "The brand picks one. You will receive the confirmation and a calendar invite by email.")}</p>
            <ul className={s.stack} style={{ listStyle: "none", padding: 0, margin: "16px 0 0", gap: 8 }}>
              {p.slots.map((sl) => <li key={sl.startTime} className={s.cardSoft} style={{ padding: "12px 16px", textTransform: "capitalize" }}>{fmtFull(sl.startTime)}</li>)}
            </ul>
            <button type="button" className={`${s.btn} ${s.btnGhost} ${s.sectionGap}`} onClick={() => { setEditing(true); setSelected(p.slots.map((x) => x.startTime)); }}>Modifier mes créneaux</button>
          </section>
        )}

        {/* ── Créneaux proposés par l'équipe : le participant choisit ── */}
        {p.status === "INVITED" && p.step === "participant_to_choose" && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeAccent}`}>{tt("À vous de jouer", "Your turn")}</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>{tt("Choisissez votre créneau.", "Pick your time slot.")}</h2>
            <div className={`${s.slots} ${s.sectionGap}`} role="radiogroup" aria-label={tt("Créneaux disponibles", "Available time slots")}>
              {p.slots.map((sl, i) => (
                <button key={sl.startTime} type="button" role="radio" aria-checked={pick === i} className={`${s.slot} ${pick === i ? s.slotOn : ""}`} onClick={() => setPick(i)}>
                  <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(sl.startTime)}</span>
                  <small>{fmtTime(sl.startTime)}{sl.note ? ` · ${sl.note}` : ""}</small>
                </button>
              ))}
            </div>
            <hr className={s.divider} />
            {consentBox}
            {ndaBox}
            {error && <p className={s.error}>{error}</p>}
            <button type="button" className={`${s.btn} ${s.sectionGap}`} disabled={busy || pick === null || !consent || !nda}
              onClick={() => post(`/api/applications/${p.applicationId}/confirm-slot`, { slotIndex: pick, consent, nda })}>
              {busy ? tt("Confirmation…", "Confirming…") : tt("Confirmer ce créneau", "Confirm this time slot")}
            </button>
          </section>
        )}

        {/* ── Entretien en autonomie (bêta) : à faire quand il veut ── */}
        {p.status === "CONFIRMED" && p.interview?.mode === "async" && (
          <section className={s.cardDark}>
            <p className={s.eyebrow} style={{ color: "rgba(255,255,255,.7)" }}>{tt("Entretien en autonomie", "Self-guided interview")}</p>
            <h2 className={s.h1} style={{ fontSize: 30 }}>
              {p.interview.status === "submitted" ? tt("Réponses envoyées", "Answers sent") : tt(`${p.interview.questions ?? ""} questions, face caméra`, `${p.interview.questions ?? ""} questions, on camera`)}
            </h2>
            <p className={s.muted} style={{ fontSize: 18, margin: "6px 0 0" }}>
              {p.interview.status === "submitted"
                ? tt("Merci ! La marque reçoit la vidéo et la transcription.", "Thank you! The brand receives the video and the transcript.")
                : `${tt("Environ", "About")} ${p.interview.durationMinutes} min, ${tt("quand vous voulez", "whenever you like")}${p.study.deadlineAt ? ` ${tt("avant le", "before")} ${new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" }).format(new Date(p.study.deadlineAt))}` : ""}.`}
            </p>
            {p.interview.status !== "submitted" && (
              <div className={`${s.row} ${s.sectionGap}`}>
                <Link href={`/participant/interview/${p.interview.id}`} className={`${s.btn} ${s.btnLight}`}>
                  {p.interview.status === "in_progress" ? tt("Reprendre →", "Resume →") : tt("Commencer →", "Start →")}
                </Link>
              </div>
            )}
            <p className={`${s.small} ${s.muted}`} style={{ marginTop: 14 }}>{tt("Pas de rendez-vous : les questions s'affichent une par une et vous répondez à voix haute. Tout est enregistré pour la marque.", "No appointment: questions appear one by one and you answer out loud. Everything is recorded for the brand.")}</p>
          </section>
        )}

        {/* ── Entretien confirmé ── */}
        {p.status === "CONFIRMED" && p.interview && p.interview.mode !== "async" && (
          <section className={s.cardDark}>
            <p className={s.eyebrow} style={{ color: "rgba(255,255,255,.7)" }}>{tt("Entretien confirmé", "Interview confirmed")}</p>
            <h2 className={s.h1} style={{ fontSize: 30, textTransform: "capitalize" }}>{fmtDay(p.interview.scheduledAt)}</h2>
            <p className={s.muted} style={{ fontSize: 18, margin: "6px 0 0" }}>à {fmtTime(p.interview.scheduledAt)} · {p.interview.durationMinutes} min</p>
            <div className={`${s.row} ${s.sectionGap}`}>
              <Link href={`/participant/interview/${p.interview.id}`} className={`${s.btn} ${s.btnLight}`}>{tt("Ouvrir la salle d'entretien →", "Open the interview room →")}</Link>
            </div>
            <p className={`${s.small} ${s.muted}`} style={{ marginTop: 14 }}>{tt("La salle s'ouvre 10 minutes avant. Un test de caméra et de micro vous y attend.", "The room opens 10 minutes before. A camera and microphone check awaits you there.")}</p>
          </section>
        )}

        {/* ── Terminé ── */}
        {p.status === "COMPLETED" && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeOk}`}>{tt("Entretien terminé", "Interview completed")}</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>{tt("Merci pour votre regard.", "Thank you for your perspective.")}</h2>
            <p className={s.muted}>
              {p.reward
                ? `${tt("Votre récompense de", "Your reward of")} ${en ? "€" : ""}${(p.reward.amountCents / 100).toLocaleString(loc)}${en ? "" : " €"} ${p.reward.type === "CASH"
                  ? p.reward.status === "PAID" ? tt("vous a été versée.", "has been paid.") : p.reward.status === "PROCESSING" ? tt("est en route vers votre banque.", "is on its way to your bank.") : tt("est dans votre solde, prête à être retirée.", "is in your balance, ready to withdraw.")
                  : p.reward.status === "PAID" || p.reward.status === "REVEALED" ? tt("est disponible.", "is available.") : tt("est en préparation.", "is being prepared.")}`
                : tt("Votre récompense sera créditée après validation de l'entretien.", "Your reward will be credited once the interview is validated.")}
            </p>
            <Link href="/participant/wallet" className={`${s.btn} ${s.btnGhost} ${s.sectionGap}`}>{tt("Voir mes gains", "See my earnings")}</Link>
          </section>
        )}

        {p.status === "REJECTED" && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>{tt("La marque a retenu d'autres profils pour cette étude.", "The brand chose other profiles for this study.")}</h2>
            <p className={s.muted}>{tt("Ça arrive souvent, et ça ne dit rien de la valeur de votre profil. D'autres études vous seront proposées.", "It happens often, and says nothing about the value of your profile. Other studies will be offered to you.")}</p>
          </section>
        )}

        {p.status === "NO_SHOW" && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>{tt("Cet entretien n'a pas eu lieu.", "This interview did not take place.")}</h2>
            <p className={s.muted}>{tt("Si c'est une erreur, écrivez-nous : nous regarderons avec vous.", "If this is a mistake, write to us and we will look into it with you.")}</p>
          </section>
        )}

        <section className={s.cardSoft}>
          <h3 className={s.h3}>{tt("Le sujet", "The topic")}</h3>
          <p className={s.muted} style={{ margin: 0, whiteSpace: "pre-line" }}>{p.study.objective}</p>
        </section>
      </div>
      <Tour id="invitation" steps={[
        { target: "inv-reward", title: tt("Ce que vous touchez", "What you earn"), text: tt("Pour cet entretien, versé sur votre solde après l'appel. Vous pouvez le retirer dès 50 €.", "For this interview, credited to your balance after the call. You can withdraw from €50.") },
        { target: "inv-slots", title: tt("Proposez vos créneaux", "Suggest your time slots"), text: tt("Cochez jusqu'à cinq moments où vous êtes libre. La marque en retiendra un, vous serez prévenu par email.", "Tick up to five times when you are free. The brand will pick one and you will be notified by email.") },
        { target: "inv-custom", title: tt("Un autre moment ?", "Another time?"), text: tt("Ajoutez le vôtre s'il n'est pas dans la liste, au moins douze heures à l'avance.", "Add your own if it is not in the list, at least twelve hours ahead.") },
        { target: "inv-consent", title: tt("L'enregistrement", "Recording"), text: tt("L'entretien est enregistré pour écrire la synthèse. Vos coordonnées et votre pièce d'identité ne sont jamais transmises à la marque.", "The interview is recorded to write the synthesis. Your contact details and ID are never shared with the brand.") },
        { target: "inv-send", title: tt("Envoyez", "Send"), text: tt("C'est tout. Le jour J, un lien ouvre la salle de visio dix minutes avant l'heure.", "That's it. On the day, a link opens the video room ten minutes before the time.") },
      ]} />
    </div>
  );
}
