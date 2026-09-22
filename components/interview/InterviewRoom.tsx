"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import s from "@/components/rl/rl.module.css";
import WherebyRoom from "@/components/shared/WherebyRoom";

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
  person?: { name: string; facts: string; summary: string | null; why: string | null };
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

  function saveNotes(v: string) {
    setNotes(v);
    try { localStorage.setItem(notesKey, v); } catch { /* stockage indisponible : les notes restent dans la page */ }
  }

  const fiche = p.role === "brand" && p.person && (
    <aside className={s.card} style={{ display: "grid", gap: 14, alignContent: "start" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span className={s.avatar} style={{ width: 42, height: 42, fontSize: 17 }}>{p.person.name[0]}</span>
        <span><strong style={{ fontSize: 17 }}>{p.person.name}</strong><span className={`${s.small} ${s.muted}`} style={{ display: "block" }}>{p.person.facts}</span></span>
      </div>
      {p.person.why && <div className={s.cardSoft} style={{ padding: "12px 14px" }}><p className={s.eyebrow} style={{ fontSize: 13, margin: "0 0 4px" }}>Pourquoi ce profil</p><p style={{ margin: 0, fontSize: 14.5 }}>{p.person.why}</p></div>}
      {p.person.summary && <p className={s.muted} style={{ margin: 0, fontSize: 14.5 }}>{p.person.summary}</p>}
      {/* Les notes viennent du stockage du navigateur : affichées seulement une
          fois la page hydratée, pour que le rendu serveur et client coïncident. */}
      {t !== null && <div>
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
            <section className={s.cardDark}>
              <p className={s.muted} style={{ margin: 0 }}>La salle ouvre 10 minutes avant le début.</p>
              <p className={s.h1} style={{ fontSize: 44, margin: "10px 0 0" }}>{t === null ? "Bientôt" : `Dans ${countdown(start - OPEN_BEFORE_MS - t)}`}</p>
              <ul className={s.muted} style={{ margin: "22px 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
                <li>Installez-vous au calme, avec une bonne connexion.</li>
                <li>Utilisez Chrome, Safari ou Edge ; autorisez caméra et micro.</li>
                {p.role === "participant"
                  ? <li>Parlez librement : il n&apos;y a pas de bonne ou de mauvaise réponse.</li>
                  : <li>L&apos;entretien est enregistré et transcrit automatiquement pour la synthèse.</li>}
              </ul>
            </section>
            {fiche}
          </div>
        )}

        {phase === "open" && p.roomUrl && (
          entered ? (
            <div className={p.role === "brand" ? s.grid2 : undefined} style={p.role === "brand" ? { gridTemplateColumns: "minmax(0, 2.2fr) minmax(260px, 1fr)", alignItems: "start" } : undefined}>
              <WherebyRoom roomUrl={p.roomUrl} displayName={p.displayName} />
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
              <button type="button" className={`${s.btn} ${s.btnLight}`} onClick={() => setEntered(true)}>Entrer dans la salle →</button>
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
    </div>
  );
}
