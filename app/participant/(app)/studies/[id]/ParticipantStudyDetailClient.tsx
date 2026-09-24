"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/components/rl/rl.module.css";
import type { Slot } from "@/lib/interviews/schedule";
import Hallmark from "@/components/brand/Hallmark";
import { CERT_TITLES, type CertLevel } from "@/lib/brands/certification";

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
  interview: { id: string; scheduledAt: string; durationMinutes: number; status: string } | null;
  reward: { amountCents: number; type: string; status: string } | null;
};

// ── Dates ─────────────────────────────────────────────────────────────
const TZ = "Europe/Paris";
const fmtDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
const fmtTime = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const fmtFull = (iso: string) => `${fmtDay(iso)} à ${fmtTime(iso)}`;

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
  const labels = ["Profil retenu", "Créneau", "Entretien", "Récompense"];
  return (
    <ol className={s.steps} aria-label="Avancement">
      {labels.map((l, i) => (
        <li key={l} className={`${s.step} ${i < current ? s.stepDone : ""} ${i === current ? s.stepNow : ""}`} aria-current={i === current ? "step" : undefined}>{l}</li>
      ))}
    </ol>
  );
}

export default function ParticipantStudyDetailClient(p: Props) {
  const router = useRouter();
  const isClient = useIsClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [consent, setConsent] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const suggestions = useMemo(
    () => (isClient ? suggestSlots(p.availability, p.study.deadlineAt) : []),
    [isClient, p.availability, p.study.deadlineAt],
  );
  const choices = useMemo(() => [...new Set([...suggestions, ...selected])].sort(), [suggestions, selected]);

  const reward = `${(p.study.rewardAmount / 100).toLocaleString("fr-FR")} €`;
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
    if (d.getTime() < Date.now() + 12 * 3600_000) { setError("Choisissez un créneau au moins 12 heures à l'avance."); return; }
    toggle(d.toISOString());
    setCustom("");
  }

  async function post(url: string, body: unknown) {
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue. Réessayez."); return false; }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function sendAvailability() {
    if (await post(`/api/applications/${p.applicationId}/availability`, { slots: selected, consent })) {
      setEditing(false); setSelected([]);
    }
  }

  const consentBox = (
    <label className={s.check}>
      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
      <span>J&apos;accepte que l&apos;entretien soit enregistré et transcrit pour produire la synthèse de l&apos;étude. Ma pièce d&apos;identité et mes coordonnées ne sont jamais transmises à la marque.</span>
    </label>
  );

  return (
    <div className={s.page}>
      <nav className={s.crumbs}><Link href="/participant/studies">Mes études</Link><span>›</span><span>{p.study.title}</span></nav>

      <header>
        <p className={s.eyebrow}>{p.study.isFocusGroup ? "Focus group" : "Entretien individuel"}</p>
        <h1 className={s.h1}>{p.study.title}</h1>
        <div className={s.meta}>
          <span>{p.study.interviewDuration} min en visio</span>
          <span>{reward} de récompense</span>
          {p.study.deadlineAt && <span>Jusqu&apos;au {fmtDay(p.study.deadlineAt)}</span>}
        </div>
        {p.study.brandCert > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <Hallmark level={p.study.brandCert} size={64} />
            <span className={s.small} style={{ color: "var(--ink-2)", lineHeight: 1.45 }}>
              <strong style={{ color: "var(--ink)" }}>Marque poinçonnée · {CERT_TITLES[p.study.brandCert].name}</strong><br />
              {CERT_TITLES[p.study.brandCert].meaning}
            </span>
          </div>
        )}
      </header>

      <div className={s.sectionGap}><Progress current={current} /></div>

      <div className={`${s.stack} ${s.sectionGap}`}>
        {/* ── En attente de la marque ── */}
        {(p.status === "SHORTLISTED" || p.status === "PENDING") && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>Votre profil a été présenté à la marque.</h2>
            <p className={s.muted}>Elle choisit les personnes qu&apos;elle veut entendre. Vous recevrez un email dès qu&apos;elle vous retient.</p>
          </section>
        )}

        {/* ── Proposer ses créneaux ── */}
        {p.status === "INVITED" && (p.step === "participant_to_propose" || editing) && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeAccent}`}>À vous de jouer</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>La marque veut vous entendre. Quand êtes-vous disponible ?</h2>
            <p className={s.muted}>Choisissez jusqu&apos;à 5 créneaux, la marque retiendra celui qui lui convient. Nos suggestions viennent des disponibilités que vous avez indiquées.</p>

            <div className={s.sectionGap}>
              {!isClient ? <p className={s.faint}>Chargement des créneaux…</p> : choices.length === 0 ? (
                <p className={s.faint}>Aucune suggestion pour le moment : ajoutez un créneau ci-dessous.</p>
              ) : (
                <div className={s.slots} role="group" aria-label="Créneaux proposés">
                  {choices.map((iso) => {
                    const on = selected.includes(iso);
                    return (
                      <button key={iso} type="button" className={`${s.slot} ${on ? s.slotOn : ""}`} aria-pressed={on} onClick={() => toggle(iso)}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(iso)}</span>
                        <small>{fmtTime(iso)}{on ? " · choisi" : ""}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${s.row} ${s.sectionGap}`}>
              <div style={{ flex: "1 1 240px" }}>
                <label className={s.label} htmlFor="custom-slot">Un autre moment ?</label>
                <input id="custom-slot" className={s.input} type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} />
              </div>
              <button type="button" className={`${s.btn} ${s.btnGhost}`} style={{ alignSelf: "flex-end" }} onClick={addCustom} disabled={!custom}>Ajouter</button>
            </div>

            <hr className={s.divider} />
            {consentBox}
            {error && <p className={s.error}>{error}</p>}
            <div className={`${s.row} ${s.sectionGap}`}>
              <button type="button" className={s.btn} onClick={sendAvailability} disabled={busy || selected.length === 0 || !consent}>
                {busy ? "Envoi…" : selected.length ? `Envoyer ${selected.length} créneau${selected.length > 1 ? "x" : ""}` : "Choisissez au moins un créneau"}
              </button>
              {editing && <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => { setEditing(false); setSelected([]); }}>Annuler</button>}
            </div>
          </section>
        )}

        {/* ── Créneaux envoyés, la marque choisit ── */}
        {p.status === "INVITED" && p.step === "brand_to_choose" && !editing && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeWait}`}>En attente de la marque</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>Vos créneaux sont envoyés.</h2>
            <p className={s.muted}>La marque en choisit un. Vous recevrez la confirmation et l&apos;invitation d&apos;agenda par email.</p>
            <ul className={s.stack} style={{ listStyle: "none", padding: 0, margin: "16px 0 0", gap: 8 }}>
              {p.slots.map((sl) => <li key={sl.startTime} className={s.cardSoft} style={{ padding: "12px 16px", textTransform: "capitalize" }}>{fmtFull(sl.startTime)}</li>)}
            </ul>
            <button type="button" className={`${s.btn} ${s.btnGhost} ${s.sectionGap}`} onClick={() => { setEditing(true); setSelected(p.slots.map((x) => x.startTime)); }}>Modifier mes créneaux</button>
          </section>
        )}

        {/* ── Créneaux proposés par l'équipe : le participant choisit ── */}
        {p.status === "INVITED" && p.step === "participant_to_choose" && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeAccent}`}>À vous de jouer</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>Choisissez votre créneau.</h2>
            <div className={`${s.slots} ${s.sectionGap}`} role="radiogroup" aria-label="Créneaux disponibles">
              {p.slots.map((sl, i) => (
                <button key={sl.startTime} type="button" role="radio" aria-checked={pick === i} className={`${s.slot} ${pick === i ? s.slotOn : ""}`} onClick={() => setPick(i)}>
                  <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{fmtDay(sl.startTime)}</span>
                  <small>{fmtTime(sl.startTime)}{sl.note ? ` · ${sl.note}` : ""}</small>
                </button>
              ))}
            </div>
            <hr className={s.divider} />
            {consentBox}
            {error && <p className={s.error}>{error}</p>}
            <button type="button" className={`${s.btn} ${s.sectionGap}`} disabled={busy || pick === null || !consent}
              onClick={() => post(`/api/applications/${p.applicationId}/confirm-slot`, { slotIndex: pick, consent })}>
              {busy ? "Confirmation…" : "Confirmer ce créneau"}
            </button>
          </section>
        )}

        {/* ── Entretien confirmé ── */}
        {p.status === "CONFIRMED" && p.interview && (
          <section className={s.cardDark}>
            <p className={s.eyebrow} style={{ color: "rgba(255,255,255,.7)" }}>Entretien confirmé</p>
            <h2 className={s.h1} style={{ fontSize: 30, textTransform: "capitalize" }}>{fmtDay(p.interview.scheduledAt)}</h2>
            <p className={s.muted} style={{ fontSize: 18, margin: "6px 0 0" }}>à {fmtTime(p.interview.scheduledAt)} · {p.interview.durationMinutes} min</p>
            <div className={`${s.row} ${s.sectionGap}`}>
              <Link href={`/participant/interview/${p.interview.id}`} className={`${s.btn} ${s.btnLight}`}>Ouvrir la salle d&apos;entretien →</Link>
            </div>
            <p className={`${s.small} ${s.muted}`} style={{ marginTop: 14 }}>La salle s&apos;ouvre 10 minutes avant. Un test de caméra et de micro vous y attend.</p>
          </section>
        )}

        {/* ── Terminé ── */}
        {p.status === "COMPLETED" && (
          <section className={s.card}>
            <span className={`${s.badge} ${s.badgeOk}`}>Entretien terminé</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>Merci pour votre regard.</h2>
            <p className={s.muted}>
              {p.reward
                ? `Votre récompense de ${(p.reward.amountCents / 100).toLocaleString("fr-FR")} € ${p.reward.status === "PAID" || p.reward.status === "REVEALED" ? "est disponible." : "est en cours de traitement."}`
                : "Votre récompense sera créditée après validation de l'entretien."}
            </p>
            <Link href="/participant/wallet" className={`${s.btn} ${s.btnGhost} ${s.sectionGap}`}>Voir mes gains</Link>
          </section>
        )}

        {p.status === "REJECTED" && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>La marque a retenu d&apos;autres profils pour cette étude.</h2>
            <p className={s.muted}>Ça arrive souvent, et ça ne dit rien de la valeur de votre profil. D&apos;autres études vous seront proposées.</p>
          </section>
        )}

        {p.status === "NO_SHOW" && (
          <section className={s.cardSoft}>
            <h2 className={s.h2}>Cet entretien n&apos;a pas eu lieu.</h2>
            <p className={s.muted}>Si c&apos;est une erreur, écrivez-nous : nous regarderons avec vous.</p>
          </section>
        )}

        <section className={s.cardSoft}>
          <h3 className={s.h3}>Le sujet</h3>
          <p className={s.muted} style={{ margin: 0, whiteSpace: "pre-line" }}>{p.study.objective}</p>
        </section>
      </div>
    </div>
  );
}
