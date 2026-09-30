"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import s from "@/components/rl/rl.module.css";
import WherebyRoom from "@/components/shared/WherebyRoom";
import { useVisioCheck, VISIO_BLOCKED_HELP } from "@/components/shared/useVisioCheck";
import Tour from "@/components/tour/Tour";

type Props = {
  role: "brand" | "participant";
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  roomUrl: string | null;
  displayName: string;
  interviewId: string;
  backHref: string;
  status: string;
  // Côté marque : la fiche du participant, visible pendant l'entretien.
  person?: { name: string; facts: string; summary: string | null; why: string | null; nda?: string | null };
  /** Côté marque : le guide d'entretien de l'étude, à cocher au fil de l'appel. */
  guide?: string[];
};

const TZ = "Europe/Paris";
const OPEN_BEFORE_MS = 10 * 60_000;
const OPEN_AFTER_MS = 60 * 60_000;

// Horloge partagée, rafraîchie toutes les 15 secondes. Côté serveur : null,
// la page affiche alors l'état « avant » sans compte à rebours.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => { now = Date.now(); listeners.forEach((l) => l()); }, 15_000);
  return () => { listeners.delete(cb); if (!listeners.size && timer) { clearInterval(timer); timer = null; } };
}
const useNow = () => useSyncExternalStore(subscribe, () => now, () => null);

function countdown(ms: number): string {
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ${String(min % 60).padStart(2, "0")}`;
  const d = Math.floor(h / 24);
  return `${d} jour${d > 1 ? "s" : ""}`;
}

export default function InterviewRoom(p: Props) {
  const t = useNow();
  const [entered, setEntered] = useState(false);
  const notesKey = `rarelyst-notes-${p.interviewId}`;
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem(notesKey) ?? ""; } catch { return ""; }
  });

  const start = new Date(p.scheduledAt).getTime();
  const end = start + p.durationMinutes * 60_000;
  const phase =
    p.status === "completed" || p.status === "no_show" || p.status === "cancelled" ? "after" :
    t === null ? "before" :
    t < start - OPEN_BEFORE_MS ? "before" :
    t > end + OPEN_AFTER_MS ? "after" : "open";

  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(start));
  const hour = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(start));

  const guideKey = `rarelyst-guide-${p.interviewId}`;
  const [asked, setAsked] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(guideKey) ?? "[]") as number[]; } catch { return []; }
  });
  function toggleAsked(i: number) {
    const next = asked.includes(i) ? asked.filter((x) => x !== i) : [...asked, i];
    setAsked(next);
    try { localStorage.setItem(guideKey, JSON.stringify(next)); } catch { /* sans stockage, l'état reste dans la page */ }
  }

  // Présence dans la salle : sert à constater une absence automatiquement.
  const onJoin = useCallback(() => { void fetch(`/api/interviews/${p.interviewId}/presence`, { method: "POST" }).catch(() => null); }, [p.interviewId]);

  function saveNotes(v: string) {
    setNotes(v);
    try { localStorage.setItem(notesKey, v); } catch { /* stockage indisponible : les notes restent dans la page */ }
  }

  const fiche = p.role === "brand" && p.person && (
    <aside className={s.card} style={{ display: "grid", gap: 14, alignContent: "start" }} data-tour="room-person">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className={s.avatar} style={{ width: 42, height: 42, fontSize: 17 }}>{p.person.name[0]}</span>
        <span><strong style={{ fontSize: 17 }}>{p.person.name}</strong><span className={`${s.small} ${s.muted}`} style={{ display: "block" }}>{p.person.facts}</span></span>
      </div>
      {p.person.why && <div className={s.cardSoft} style={{ padding: "12px 14px" }}><p className={s.eyebrow} style={{ fontSize: 13, margin: "0 0 4px" }}>Pourquoi ce profil</p><p style={{ margin: 0, fontSize: 14.5 }}>{p.person.why}</p></div>}
      {p.person.summary && <p className={s.muted} style={{ margin: 0, fontSize: 14.5 }}>{p.person.summary}</p>}
      {p.person.nda && <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ok, #1f7a4d)" }}>✓ Accord de confidentialité signé le {new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "long" }).format(new Date(p.person.nda))}</p>}
      {(p.guide ?? []).length > 0 && t !== null && (
        <div data-tour="room-guide">
          <p className={s.label} style={{ margin: "0 0 8px" }}>Votre guide</p>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {p.guide!.map((q, i) => {
              const done = asked.includes(i);
              return (
                <li key={i}>
                  <button type="button" onClick={() => toggleAsked(i)} aria-pressed={done}
                    style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)", background: done ? "var(--soft)" : "var(--bg)", cursor: "pointer", color: done ? "var(--ink-3)" : "var(--ink)", fontSize: 14, lineHeight: 1.4 }}>
                    <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 700, background: done ? "var(--ok)" : "var(--accent-soft)", color: done ? "#fff" : "var(--g2)" }}>{done ? "✓" : i + 1}</span>
                    <span style={{ textDecoration: done ? "line-through" : "none" }}>{q}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {/* Les notes viennent du stockage du navigateur : affichées seulement une
          fois la page hydratée, pour que le rendu serveur et client coïncident. */}
      {t !== null && <div data-tour="room-notes">
        <label className={s.label} htmlFor="notes">Vos notes</label>
        <textarea id="notes" className={s.input} rows={7} value={notes} onChange={(e) => saveNotes(e.target.value)} placeholder="Ce qui vous marque, les relances à faire…" style={{ resize: "vertical" }} />
        <p className={`${s.small} ${s.faint}`} style={{ margin: "6px 0 0" }}>Enregistrées sur cet appareil uniquement.</p>
      </div>}
    </aside>
  );

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <nav className={s.crumbs}><Link href={p.backHref}>Mon étude</Link><span>›</span><span>Entretien</span></nav>
      <header className={s.spread} style={{ alignItems: "flex-end" }}>
        <div>
          <p className={s.eyebrow}>Entretien en visio</p>
          <h1 className={s.h1}>{p.title}</h1>
          <div className={s.meta}>
            <span style={{ textTransform: "capitalize" }}>{day} · {hour}</span>
            <span>{p.durationMinutes} min</span>
            {phase === "open" && <span className={`${s.badge} ${s.badgeOk}`}>Salle ouverte</span>}
          </div>
        </div>
      </header>

      <div className={s.sectionGap}>
        {phase === "before" && (
          <div className={p.role === "brand" ? s.grid2 : undefined} style={p.role === "brand" ? { gridTemplateColumns: "1.4fr 1fr" } : undefined}>
            <section className={s.cardDark} data-tour="room-wait">
              <p className={s.muted} style={{ margin: 0 }}>La salle ouvre 10 minutes avant le début.</p>
              <p className={s.h1} style={{ fontSize: 44, margin: "10px 0 0" }}>{t === null ? "Bientôt" : `Dans ${countdown(start - OPEN_BEFORE_MS - t)}`}</p>
              <ul className={s.muted} style={{ margin: "22px 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
                <li>Installez-vous au calme, avec une bonne connexion.</li>
                <li>Utilisez Chrome, Safari ou Edge ; autorisez caméra et micro.</li>
                {p.role === "participant"
                  ? <li>Parlez librement : il n&apos;y a pas de bonne ou de mauvaise réponse.</li>
                  : <li>L&apos;entretien est enregistré et transcrit automatiquement pour la synthèse.</li>}
              </ul>
              <NetworkLine />
            </section>
            {fiche}
          </div>
        )}

        {phase === "open" && p.roomUrl && (
          entered ? (
            <div className={p.role === "brand" ? s.grid2 : undefined} style={p.role === "brand" ? { gridTemplateColumns: "minmax(0, 2.2fr) minmax(260px, 1fr)", alignItems: "start" } : undefined}>
              <WherebyRoom roomUrl={p.roomUrl} displayName={p.displayName} onJoin={onJoin} />
              {fiche}
            </div>
          ) : (
            <section className={s.cardDark} style={{ display: "grid", gap: 16, justifyItems: "start" }}>
              <h2 className={s.h1} style={{ fontSize: 32 }}>La salle est ouverte.</h2>
              <p className={s.muted} style={{ margin: 0, maxWidth: "52ch" }}>
                {p.role === "participant"
                  ? "Vous allez pouvoir vérifier votre caméra et votre micro avant d'entrer. L'entretien est enregistré, comme vous l'avez accepté."
                  : "Vérifiez votre caméra et votre micro avant d'entrer. L'enregistrement démarre automatiquement dès que vous êtes deux."}
              </p>
              <button type="button" className={`${s.btn} ${s.btnLight}`} onClick={() => setEntered(true)} data-tour="room-enter">Entrer dans la salle →</button>
              <NetworkLine />
            </section>
          )
        )}

        {phase === "open" && !p.roomUrl && (
          <section className={s.cardSoft}><h2 className={s.h2}>La salle n&apos;est pas disponible.</h2><p className={s.muted}>Écrivez-nous : nous vous envoyons un nouveau lien immédiatement.</p></section>
        )}

        {phase === "after" && (
          <section className={s.card}>
            <span className={`${s.badge} ${p.status === "no_show" ? s.badgeBad : s.badgeOk}`}>{p.status === "no_show" ? "Entretien non tenu" : "Entretien terminé"}</span>
            <h2 className={s.h2} style={{ marginTop: 12 }}>{p.role === "participant" ? "Merci pour votre regard." : "Et maintenant ?"}</h2>
            <p className={s.muted}>
              {p.role === "participant"
                ? "Votre récompense sera créditée après validation de l'entretien. Vous serez prévenu par email."
                : "La transcription arrive dans l'heure. La synthèse est générée dès que tous les entretiens de l'étude sont transcrits."}
            </p>
            <Link href={p.backHref} className={`${s.btn} ${s.btnGhost} ${s.sectionGap}`}>{p.role === "participant" ? "Retour à mon étude" : "Retour à l'étude"}</Link>
          </section>
        )}
      </div>
      {phase !== "after" && <IncidentBar interviewId={p.interviewId} role={p.role} backHref={p.backHref} />}
      {phase !== "after" && (
        <Tour id={`room-${p.role}`} steps={p.role === "brand" ? [
          { target: "room-wait", title: "La salle ouvre dix minutes avant", text: "Revenez sur cette page à l'heure : le bouton pour entrer apparaîtra ici, comme pour le participant." },
          { target: "room-enter", title: "Entrez dans la salle", text: "Vous vérifiez caméra et micro, puis vous entrez. L'enregistrement démarre dès que vous êtes deux." },
          { target: "room-person", title: "La fiche du participant", text: "Pourquoi ce profil a été retenu, ce qu'il a prouvé : elle reste à côté de la visio pendant tout l'entretien." },
          { target: "room-guide", title: "Votre guide", text: "Cochez chaque question au fil de l'entretien pour savoir où vous en êtes." },
          { target: "room-notes", title: "Vos notes", text: "Ce qui vous marque, les relances à faire. La transcription complète arrive après l'appel." },
        ] : [
          { target: "room-wait", title: "La salle ouvre dix minutes avant", text: "Revenez sur cette page à l'heure prévue : un bouton vous fera entrer." },
          { target: "room-enter", title: "Entrez dans la salle", text: "Vous vérifiez caméra et micro avant d'entrer. Parlez librement : il n'y a pas de bonne ou de mauvaise réponse." },
        ]} />
      )}
    </div>
  );
}

/** Dit avant l'entretien si le réseau laisse passer la visio. */
function NetworkLine() {
  const { state, retry } = useVisioCheck();
  if (state === "checking") return <p className={s.muted} style={{ margin: "18px 0 0" }}>Vérification de votre connexion…</p>;
  if (state === "ok") return <p style={{ margin: "18px 0 0", color: "#8fd9b0", fontWeight: 600 }}>✓ Votre réseau laisse passer la visio.</p>;
  return (
    <div role="alert" style={{ marginTop: 18, padding: "14px 16px", borderRadius: 14, background: "rgba(255, 190, 120, .12)", border: "1px solid rgba(255, 190, 120, .35)" }}>
      <p style={{ margin: 0, fontWeight: 700 }}>{VISIO_BLOCKED_HELP.title}</p>
      <p className={s.muted} style={{ margin: "6px 0 10px" }}>{VISIO_BLOCKED_HELP.text}</p>
      <button type="button" className={`${s.btn} ${s.btnLight}`} onClick={() => void retry()}>Réessayer</button>
    </div>
  );
}

/** Reporter l'entretien ou signaler un problème technique, depuis la salle. */
function IncidentBar({ interviewId, role, backHref }: { interviewId: string; role: "brand" | "participant"; backHref: string }) {
  const [open, setOpen] = useState<null | "reschedule" | "technical">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { state: network } = useVisioCheck();

  async function submit() {
    if (!open) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch(`/api/interviews/${interviewId}/incident`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: open, reason, network }),
    }).then((x) => x.json()).catch(() => ({ error: "Connexion impossible. Réessayez." }));
    setBusy(false);
    if (r.error) { setMsg({ ok: false, text: r.error }); return; }
    if (open === "reschedule") {
      setMsg({ ok: true, text: role === "participant" ? "C'est noté. Proposez maintenant de nouveaux créneaux." : "C'est noté. Le participant va proposer de nouveaux créneaux ; vous recevrez un email." });
      setTimeout(() => { window.location.href = backHref; }, 2200);
    } else {
      setMsg({ ok: true, text: "Envoyé : l'équipe Rarelyst et votre interlocuteur sont prévenus. Restez sur cette page." });
      setReason("");
    }
  }

  const problems = role === "participant"
    ? ["La visio ne s'affiche pas", "Caméra ou micro ne marchent pas", "La marque n'est pas là", "Le son ou l'image coupent"]
    : ["La visio ne s'affiche pas", "Caméra ou micro ne marchent pas", "Le participant n'est pas là", "Le son ou l'image coupent"];

  return (
    <section className={`${s.card} ${s.sectionGap}`} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span className={s.muted} style={{ fontSize: 14, marginRight: "auto" }}>Un imprévu ?</span>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} aria-pressed={open === "technical"} onClick={() => { setOpen(open === "technical" ? null : "technical"); setMsg(null); }}>Problème technique</button>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} aria-pressed={open === "reschedule"} onClick={() => { setOpen(open === "reschedule" ? null : "reschedule"); setMsg(null); }}>Reporter l&apos;entretien</button>
      </div>
      {open === "technical" && (
        <div style={{ display: "grid", gap: 10 }}>
          <ul className={s.muted} style={{ margin: 0, paddingLeft: 18, fontSize: 14, display: "grid", gap: 4 }}>
            <li>Rechargez la page, puis autorisez caméra et micro quand le navigateur le demande.</li>
            <li>Utilisez Chrome, Safari ou Edge à jour ; fermez les autres applications de visio.</li>
            <li>Réseau d&apos;entreprise ou Wi-Fi public : passez sur le partage de connexion de votre téléphone.</li>
          </ul>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {problems.map((pb) => <button key={pb} type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} style={reason === pb ? { borderColor: "var(--accent, #6a43db)" } : undefined} onClick={() => setReason(pb)}>{pb}</button>)}
          </div>
          <textarea className={s.input} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ce qui se passe, en quelques mots" />
          <button type="button" className={`${s.btn} ${s.btnSm}`} style={{ justifySelf: "start" }} disabled={busy || reason.trim().length < 2} onClick={submit}>{busy ? "Envoi…" : "Prévenir l'équipe"}</button>
        </div>
      )}
      {open === "reschedule" && (
        <div style={{ display: "grid", gap: 10 }}>
          <p className={s.muted} style={{ margin: 0, fontSize: 14 }}>
            {role === "participant"
              ? "Le créneau sera libéré et vous proposerez de nouvelles disponibilités ; la marque en choisira une."
              : "Le créneau sera libéré ; le participant proposera de nouvelles disponibilités. Vos crédits restent réservés."}
          </p>
          <textarea className={s.input} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pourquoi, en quelques mots (visible par votre interlocuteur)" />
          <button type="button" className={`${s.btn} ${s.btnSm}`} style={{ justifySelf: "start" }} disabled={busy || reason.trim().length < 3} onClick={submit}>{busy ? "Envoi…" : "Reporter l'entretien"}</button>
        </div>
      )}
      {msg && <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: msg.ok ? "var(--ok, #1f7a4d)" : "#b42318" }}>{msg.text}</p>}
    </section>
  );
}
