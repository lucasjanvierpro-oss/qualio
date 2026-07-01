"use client";

import { useState, useEffect, useCallback } from "react";

export const dynamic = "force-dynamic";

type Reward = {
  id: string;
  type: "CASH" | "VOUCHER";
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "REVEALED";
  amountCents: number;
  voucherBrand: string | null;
  voucherCode: string | null;
  paidAt: string | null;
  participantProfile: {
    firstName: string;
    lastName: string;
    stripeConnectId: string | null;
  };
  application: {
    study: { title: string };
  };
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "En attente",  color: "#D97706" },
  PROCESSING: { label: "En cours",   color: "#3B82F6" },
  PAID:       { label: "Payé",       color: "#22C55E" },
  REVEALED:   { label: "Révélé",     color: "#22C55E" },
  FAILED:     { label: "Erreur",     color: "#EF4444" },
};

export default function AdminPaymentsPage() {
  const [rewards, setRewards]         = useState<Reward[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<string>("PENDING");
  const [processing, setProcessing]   = useState<string | null>(null);
  const [voucherInputs, setVoucherInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback]       = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards");
      if (res.ok) setRewards(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rewards.filter((r) =>
    filter === "ALL" || r.status === filter
  );

  const pendingCash    = rewards.filter((r) => r.status === "PENDING" && r.type === "CASH");
  const pendingVoucher = rewards.filter((r) => r.status === "PENDING" && r.type === "VOUCHER");
  const totalPending   = pendingCash.reduce((s, r) => s + r.amountCents, 0);

  async function processTransfer(reward: Reward) {
    setProcessing(reward.id);
    try {
      const res = await fetch(`/api/rewards/${reward.id}/process-transfer`, { method: "POST" });
      const data = await res.json() as { note?: string };
      if (res.ok) {
        setFeedback((prev) => ({
          ...prev,
          [reward.id]: data.note === "no_connect_account"
            ? "⚠ Pas de compte Stripe Connect — statut mis à PROCESSING"
            : "✓ Virement Stripe déclenché",
        }));
        await load();
      } else {
        setFeedback((prev) => ({ ...prev, [reward.id]: `Erreur Stripe` }));
      }
    } finally {
      setProcessing(null);
    }
  }

  async function assignVoucher(reward: Reward) {
    const code = voucherInputs[reward.id]?.trim();
    if (!code) return;
    setProcessing(reward.id);
    try {
      const res = await fetch(`/api/rewards/${reward.id}/assign-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setFeedback((prev) => ({ ...prev, [reward.id]: `✓ Code "${code}" assigné` }));
        setVoucherInputs((prev) => { const n = { ...prev }; delete n[reward.id]; return n; });
        await load();
      }
    } finally {
      setProcessing(null);
    }
  }

  const card = { background: "#1A1917", border: "1px solid #252320", borderRadius: "3px" };

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "44px 40px", color: "#F2F0EC" }}>

      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#4A4845", marginBottom: "10px" }}>
          Paiements
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "30px",
          fontWeight: 400,
          fontStyle: "normal",
          letterSpacing: "-0.02em",
          color: "#F8F7F4",
          margin: 0,
        }}>
          Récompenses participants
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "Virements en attente", value: pendingCash.length, sub: pendingCash.length > 0 ? `${(totalPending / 100).toFixed(0)}€ à déclencher` : "Aucun" },
          { label: "Vouchers à assigner", value: pendingVoucher.length, sub: "Codes à saisir" },
          { label: "Payés au total", value: rewards.filter((r) => ["PAID","REVEALED"].includes(r.status)).length, sub: `${(rewards.filter((r) => ["PAID","REVEALED"].includes(r.status)).reduce((s, r) => s + r.amountCents, 0) / 100).toFixed(0)}€` },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "28px", fontWeight: 700, color: "#F8F7F4", lineHeight: 1, marginBottom: "6px" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A4845", marginBottom: "3px" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "11px", color: "#5A5754" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {[
          { key: "PENDING",    label: "En attente" },
          { key: "PROCESSING", label: "En cours" },
          { key: "PAID",       label: "Payés" },
          { key: "ALL",        label: "Tous" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1px solid",
              borderColor: filter === f.key ? "#6B4FA8" : "#252320",
              background: filter === f.key ? "#573E69" : "transparent",
              color: filter === f.key ? "#fff" : "#7A7875",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ ...card, padding: "48px", textAlign: "center", color: "#4A4845" }}>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: "48px", textAlign: "center", color: "#4A4845", fontSize: "14px" }}>
          Aucune récompense dans cette catégorie
        </div>
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.8fr 70px 80px 90px 1fr",
            gap: "16px",
            padding: "10px 20px",
            borderBottom: "1px solid #252320",
          }}>
            {["Participant", "Étude", "Type", "Montant", "Statut", "Action"].map((h) => (
              <span key={h} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A4845" }}>
                {h}
              </span>
            ))}
          </div>

          {filtered.map((r, i) => {
            const meta     = STATUS_META[r.status] ?? STATUS_META.PENDING;
            const name     = `${r.participantProfile.firstName} ${r.participantProfile.lastName}`;
            const hasConnect = !!r.participantProfile.stripeConnectId;

            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.8fr 70px 80px 90px 1fr",
                  gap: "16px",
                  padding: "15px 20px",
                  borderTop: i > 0 ? "1px solid #252320" : "none",
                  alignItems: "center",
                }}
              >
                {/* Participant */}
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#F0EDE8" }}>{name}</div>

                {/* Study */}
                <div style={{ fontSize: "12px", color: "#5A5754", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.application.study.title}
                </div>

                {/* Type */}
                <div style={{ fontSize: "11px", color: "#7A7875" }}>
                  {r.type === "CASH" ? "Espèces" : `Bon${r.voucherBrand ? ` ${r.voucherBrand}` : ""}`}
                </div>

                {/* Amount */}
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", fontWeight: 700, color: "#F0EDE8" }}>
                  {(r.amountCents / 100).toFixed(0)}€
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    border: `1px solid ${meta.color}30`,
                    color: meta.color,
                    borderRadius: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}>
                    {meta.label}
                  </span>
                </div>

                {/* Action */}
                <div>
                  {feedback[r.id] ? (
                    <span style={{ fontSize: "12px", color: feedback[r.id].startsWith("✓") ? "#8765D7" : "#D97706" }}>
                      {feedback[r.id]}
                    </span>
                  ) : r.status === "PENDING" && r.type === "CASH" ? (
                    <div>
                      <button
                        onClick={() => processTransfer(r)}
                        disabled={processing === r.id}
                        style={{
                          padding: "6px 12px",
                          background: "#573E69",
                          color: "#fff",
                          border: "1px solid #6B4FA8",
                          borderRadius: "2px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: processing === r.id ? "not-allowed" : "pointer",
                          opacity: processing === r.id ? 0.6 : 1,
                        }}
                      >
                        {processing === r.id ? "…" : hasConnect ? "Virement Stripe →" : "Marquer envoyé →"}
                      </button>
                      {!hasConnect && (
                        <div style={{ fontSize: "10px", color: "#D97706", marginTop: "4px" }}>
                          Pas de compte Connect
                        </div>
                      )}
                    </div>
                  ) : r.status === "PENDING" && r.type === "VOUCHER" ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input
                        value={voucherInputs[r.id] ?? ""}
                        onChange={(e) => setVoucherInputs((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder={r.voucherBrand ? `Code ${r.voucherBrand}…` : "Code…"}
                        style={{
                          padding: "5px 9px",
                          border: "1px solid #252320",
                          borderRadius: "2px",
                          fontSize: "12px",
                          background: "#141210",
                          color: "#F0EDE8",
                          fontFamily: "var(--font-mono-base)",
                          width: "130px",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => assignVoucher(r)}
                        disabled={!voucherInputs[r.id]?.trim() || processing === r.id}
                        style={{
                          padding: "5px 10px",
                          background: voucherInputs[r.id]?.trim() ? "#573E69" : "#252320",
                          color: voucherInputs[r.id]?.trim() ? "#fff" : "#4A4845",
                          border: "none",
                          borderRadius: "2px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: voucherInputs[r.id]?.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        {processing === r.id ? "…" : "Assigner"}
                      </button>
                    </div>
                  ) : r.status === "PAID" && r.type === "VOUCHER" ? (
                    <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "12px", color: "#8765D7" }}>
                      {r.voucherCode}
                    </span>
                  ) : r.status === "PAID" ? (
                    <span style={{ fontSize: "12px", color: "#8765D7" }}>
                      {r.paidAt ? new Date(r.paidAt).toLocaleDateString("fr-FR") : "Effectué ✓"}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
