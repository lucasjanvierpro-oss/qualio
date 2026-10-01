"use client";

import { useMemo, useState, useTransition } from "react";
import { addSourcingContact, deleteSourcingContact, updateSourcingContact } from "@/app/actions/sourcing";
import { PLATFORMS, PROFILE_TYPES, firstMessage } from "@/lib/sourcing/sourcing";
import a from "../admin.module.css";

type Contact = {
  id: string; name: string; url: string | null; platform: string; profileType: string; role: string | null; why: string | null;
  status: string; notes: string | null; lastContactAt: string | null;
};

const EMPTY = { name: "", url: "", platform: "linkedin", profileType: "initie", role: "", why: "" };
const fmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(new Date(iso)) : "");

export default function SourcingClient({ contacts, statuses }: { contacts: Contact[]; statuses: Record<string, string> }) {
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<string>("a_contacter");
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const shown = useMemo(() => (filter === "tous" ? contacts : contacts.filter((c) => c.status === filter)), [contacts, filter]);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  function add() {
    start(async () => {
      const r = await addSourcingContact(form);
      if ("error" in r) setMsg({ ok: false, text: r.error });
      else { setMsg({ ok: true, text: `${form.name} ajouté·e.` }); setForm({ ...EMPTY, platform: form.platform, profileType: form.profileType }); }
    });
  }

  async function copy(c: Contact) {
    const text = firstMessage(c);
    try { await navigator.clipboard.writeText(text); setCopied(c.id); setTimeout(() => setCopied(null), 1500); }
    catch { window.prompt("Copie le message :", text); }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className={a.card} style={{ padding: 16, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <div className={a.field}><label htmlFor="sc-name">Nom ou pseudo</label><input id="sc-name" className={a.input} value={form.name} onChange={set("name")} placeholder="Camille Durand" /></div>
          <div className={a.field}><label htmlFor="sc-url">Lien du profil</label><input id="sc-url" className={a.input} value={form.url} onChange={set("url")} placeholder="https://www.linkedin.com/in/…" /></div>
          <div className={a.field}><label htmlFor="sc-platform">Réseau</label>
            <select id="sc-platform" className={a.select} value={form.platform} onChange={set("platform")}>
              {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className={a.field}><label htmlFor="sc-type">Type de profil</label>
            <select id="sc-type" className={a.select} value={form.profileType} onChange={set("profileType")}>
              {Object.entries(PROFILE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className={a.field}><label htmlFor="sc-role">Ce qu&apos;elle fait</label><input id="sc-role" className={a.input} value={form.role} onChange={set("role")} placeholder="Conseillère de vente maroquinerie, 6 ans" /></div>
          <div className={a.field}><label htmlFor="sc-why">Pourquoi elle (une phrase, reprise dans le message)</label><input id="sc-why" className={a.input} value={form.why} onChange={set("why")} placeholder="Votre post sur les clientes qui reviennent m'a marqué" /></div>
        </div>
        <div className={a.bar2}>
          <button type="button" className={a.btn} onClick={add} disabled={pending || form.name.trim().length < 2}>Ajouter à la liste</button>
          {msg && <span className={`${a.msg} ${msg.ok ? a.good : a.warn}`}>{msg.text}</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[["tous", "Tous"], ...Object.entries(statuses)].map(([k, v]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`${a.btn} ${filter === k ? "" : a.btnGhost}`} style={{ fontSize: 12, padding: "5px 11px" }}>
            {v} <span style={{ opacity: 0.6 }}>{k === "tous" ? contacts.length : contacts.filter((c) => c.status === k).length}</span>
          </button>
        ))}
      </div>

      <div className={`${a.card} ${a.tableWrap}`}>
        {shown.length === 0 && <p className={a.muted} style={{ margin: 0, padding: 16, fontSize: 13 }}>Personne ici pour l&apos;instant.</p>}
        {shown.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr) 170px auto", gap: 12, alignItems: "center", padding: "12px 16px", borderTop: "1px solid #262420", fontSize: 13, minWidth: 720 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#f2f0ec" }}>
                {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{c.name}</a> : c.name}
                <span className={a.muted} style={{ fontWeight: 400 }}> · {PLATFORMS[c.platform as keyof typeof PLATFORMS] ?? c.platform}</span>
              </div>
              <div className={a.muted} style={{ fontSize: 12 }}>{[c.role, c.why].filter(Boolean).join(" · ")}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <span className={a.pill} data-t={c.profileType === "rare" ? "rare" : c.profileType === "initie" ? "initie" : undefined}>{PROFILE_TYPES[c.profileType as keyof typeof PROFILE_TYPES]?.label ?? c.profileType}</span>
              <input
                aria-label={`Notes sur ${c.name}`}
                className={a.input}
                defaultValue={c.notes ?? ""}
                placeholder="Notes"
                onBlur={(e) => { if (e.target.value !== (c.notes ?? "")) start(async () => { await updateSourcingContact(c.id, { notes: e.target.value }); }); }}
                style={{ marginTop: 6, fontSize: 12, padding: "5px 8px" }}
              />
            </div>
            <div>
              <select aria-label={`Statut de ${c.name}`} className={a.select} value={c.status} onChange={(e) => start(async () => { await updateSourcingContact(c.id, { status: e.target.value }); })} style={{ fontSize: 12, padding: "6px 8px" }}>
                {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {c.lastContactAt && <div className={a.muted} style={{ fontSize: 11, marginTop: 3 }}>Dernier contact : {fmt(c.lastContactAt)}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className={`${a.btn} ${a.btnGhost}`} style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => copy(c)}>{copied === c.id ? "Copié ✓" : "Copier le message"}</button>
              <button type="button" className={`${a.btn} ${a.btnGhost}`} style={{ fontSize: 12, padding: "5px 9px" }} aria-label={`Retirer ${c.name}`} onClick={() => start(async () => { await deleteSourcingContact(c.id); })}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
