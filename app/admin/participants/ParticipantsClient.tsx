"use client";

import { useState } from "react";
import Link from "next/link";

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  age: number | null;
  profession: string | null;
  interests: string[];
  status: "PENDING" | "VERIFIED" | "REJECTED";
  participationCount: number;
  isBlacklisted: boolean;
  email: string;
};

const STATUS = {
  PENDING:  { color: "#9A6700", bg: "#3D2E0A", label: "En attente" },
  VERIFIED: { color: "#4ADE80", bg: "#1A3D2A", label: "Vérifié" },
  REJECTED: { color: "#F87171", bg: "#3D1A1A", label: "Refusé" },
};

export default function ParticipantsClient({ participants }: { participants: Participant[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCity, setFilterCity] = useState("ALL");

  const cities = Array.from(new Set(participants.map((p) => p.city).filter(Boolean))) as string[];

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchSearch = !q || name.includes(q) || (p.city ?? "").toLowerCase().includes(q) || (p.profession ?? "").toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchCity = filterCity === "ALL" || p.city === filterCity;
    return matchSearch && matchStatus && matchCity;
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, color: "#F9F8F6", margin: "0 0 4px" }}>Base participants</h1>
        <p style={{ fontSize: "13px", color: "#6B6760", margin: 0 }}>{filtered.length} / {participants.length} participants</p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, ville, métier…"
          style={{ flex: 1, minWidth: "200px", padding: "9px 12px", border: "1px solid #2A2926", borderRadius: "8px", fontSize: "14px", background: "#1A1917", color: "#F9F8F6", outline: "none" }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "9px 12px", border: "1px solid #2A2926", borderRadius: "8px", fontSize: "13px", background: "#1A1917", color: "#9E9B95", outline: "none" }}>
          <option value="ALL">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="VERIFIED">Vérifiés</option>
          <option value="REJECTED">Refusés</option>
        </select>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={{ padding: "9px 12px", border: "1px solid #2A2926", borderRadius: "8px", fontSize: "13px", background: "#1A1917", color: "#9E9B95", outline: "none" }}>
          <option value="ALL">Toutes les villes</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 2fr 80px 70px 90px", padding: "10px 20px", borderBottom: "1px solid #2A2926" }}>
          {["Participant", "Ville / Âge", "Métier", "Intérêts", "Statut", "Études", "Action"].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#6B6760" }}>Aucun participant correspondant à vos filtres.</div>
        ) : (
          filtered.map((p, i) => {
            const st = STATUS[p.status] ?? STATUS.PENDING;
            return (
              <Link
                key={p.id}
                href={`/admin/participants/${p.id}`}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 2fr 80px 70px 90px", padding: "13px 20px", borderTop: i > 0 ? "1px solid #2A2926" : "none", textDecoration: "none", alignItems: "center", opacity: p.isBlacklisted ? 0.5 : 1 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#2A2926", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "#9E9B95", flexShrink: 0 }}>
                    {p.firstName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#F9F8F6" }}>{p.firstName} {p.lastName}</div>
                    {p.isBlacklisted && <div style={{ fontSize: "11px", color: "#F87171" }}>blacklisté</div>}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#9E9B95" }}>{p.city ?? "—"}{p.age ? `, ${p.age} ans` : ""}</div>
                <div style={{ fontSize: "13px", color: "#9E9B95", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.profession ?? "—"}</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {p.interests.slice(0, 3).map((interest) => (
                    <span key={interest} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "999px", background: "#2A2926", color: "#9E9B95" }}>{interest}</span>
                  ))}
                </div>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", color: "#9E9B95", textAlign: "center" }}>{p.participationCount}</div>
                <div>
                  <span style={{ fontSize: "12px", color: "#E6EDE9", background: "#1B3D2A", padding: "4px 10px", borderRadius: "6px", fontWeight: 600 }}>Voir →</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
