"use client";

import { useState, useEffect } from "react";

type Reward = {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  voucherBrand: string | null;
  voucherCode: string | null;
  voucherRevealedAt: string | null;
  paidAt: string | null;
  studyTitle: string;
  createdAt: string;
};

function euros(cents: number) { return (cents / 100).toFixed(0); }

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

// --- Confetti burst (pure CSS/JS, no library) ---
function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = Array.from({ length: 18 });
  const colors = ["#573E69", "#E6EDE9", "#9A6700", "#1D4ED8", "#B91C1C", "#FFF"];
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none", zIndex: 10 }}>
      {active && pieces.map((_, i) => {
        const angle = (i / pieces.length) * 360;
        const dist = 60 + Math.random() * 40;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `translate(-50%, -50%)`,
              animation: `confetti-fly-${i % 3} 0.7s ease-out forwards`,
              animationDelay: `${i * 0.02}s`,
              top: 0,
              left: 0,
              opacity: 1,
              // Use inline style for the trajectory
              translate: `${Math.cos((angle * Math.PI) / 180) * dist}px ${Math.sin((angle * Math.PI) / 180) * dist}px`,
              transition: `translate 0.6s ease-out, opacity 0.6s ease-out`,
            }}
          />
        );
      })}
    </div>
  );
}

// Reveal animation component
function VoucherCard({ reward, onReveal, onCopy, copied }: {
  reward: Reward;
  onReveal: (id: string) => void;
  onCopy: (code: string) => void;
  copied: string | null;
}) {
  const [revealed, setRevealed] = useState(!!reward.voucherRevealedAt);
  const [celebrating, setCelebrating] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  async function handleReveal() {
    setIsFlipping(true);
    setTimeout(() => {
      setRevealed(true);
      setCelebrating(true);
      onReveal(reward.id);
      setTimeout(() => setCelebrating(false), 1200);
    }, 350);
    setTimeout(() => setIsFlipping(false), 700);
  }

  const isReady = reward.status === "PAID" || reward.status === "REVEALED";

  return (
    <div style={{ position: "relative", background: "var(--color-surface)", border: `2px solid ${revealed ? "var(--color-accent)" : "var(--color-border)"}`, borderRadius: "14px", padding: "22px 24px", transition: "border-color 0.3s", overflow: "visible" }}>
      {celebrating && <ConfettiBurst active={celebrating} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "2px" }}>
            {reward.voucherBrand ?? "Bon d'achat"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            {reward.studyTitle} · {fmtDate(reward.createdAt)}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 700, color: "var(--color-accent)" }}>
          {euros(reward.amountCents)}€
        </div>
      </div>

      {/* Code area */}
      {revealed && reward.voucherCode ? (
        <div style={{ opacity: isFlipping ? 0 : 1, transform: isFlipping ? "scaleY(0.1)" : "scaleY(1)", transition: "all 0.35s ease" }}>
          <div style={{ marginBottom: "10px", padding: "14px 18px", background: "var(--color-accent-light)", border: "2px solid var(--color-accent)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.15em" }}>
              {reward.voucherCode}
            </span>
            <button
              onClick={() => onCopy(reward.voucherCode!)}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: "none",
                background: copied === reward.voucherCode ? "var(--color-accent)" : "var(--color-surface)",
                color: copied === reward.voucherCode ? "#fff" : "var(--color-text-primary)",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
            >
              {copied === reward.voucherCode ? "Copié ✓" : "Copier le code"}
            </button>
          </div>
          {revealed && (
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
              Utilisez ce code sur {reward.voucherBrand ?? "le site partenaire"}
            </div>
          )}
        </div>
      ) : isReady ? (
        <button
          onClick={handleReveal}
          style={{
            width: "100%", padding: "14px", background: "var(--color-accent)", color: "#fff",
            border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer",
            transform: isFlipping ? "scaleY(0.1)" : "scaleY(1)",
            transition: "transform 0.35s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🎁</span>
          Révéler mon code cadeau
        </button>
      ) : (
        <div style={{ padding: "12px 16px", background: "var(--color-surface-2)", borderRadius: "8px", fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
          Votre récompense sera disponible après traitement
        </div>
      )}
    </div>
  );
}

// Cash claim component
function CashCard({ reward }: { reward: Reward }) {
  const [claimed, setClaimed] = useState(reward.paidAt !== null);
  const [claiming, setClaiming] = useState(false);

  return (
    <div style={{ background: "var(--color-surface)", border: `2px solid ${claimed ? "var(--color-success)" : "var(--color-border)"}`, borderRadius: "14px", padding: "22px 24px", transition: "border-color 0.4s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "2px" }}>
            {reward.studyTitle}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{fmtDate(reward.createdAt)} · Virement bancaire</div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 700, color: claimed ? "var(--color-success)" : "var(--color-text-primary)" }}>
          {euros(reward.amountCents)}€
        </div>
      </div>

      {claimed ? (
        <div style={{ padding: "12px 16px", background: "var(--color-success-light)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>✓</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-success)" }}>Virement en cours</div>
            <div style={{ fontSize: "12px", color: "var(--color-success)", opacity: 0.8 }}>Arrivée sous 2-3 jours ouvrés</div>
          </div>
        </div>
      ) : reward.status === "PAID" ? (
        <div style={{ padding: "12px 16px", background: "var(--color-warning-light)", borderRadius: "10px", fontSize: "13px", color: "var(--color-warning)" }}>
          Votre récompense est prête — vous recevrez un virement automatiquement
        </div>
      ) : (
        <div style={{ padding: "10px 14px", background: "var(--color-surface-2)", borderRadius: "8px", fontSize: "13px", color: "var(--color-text-tertiary)" }}>
          {reward.status === "PROCESSING" ? "Virement en cours de traitement" : "En attente de traitement par Qualio"}
        </div>
      )}
    </div>
  );
}

export default function ParticipantWalletClient({
  rewards,
  stripeConnectStatus,
  participantId,
}: {
  rewards: Reward[];
  stripeConnectStatus: string | null;
  participantId: string;
}) {
  const [tab, setTab] = useState<"rewards" | "cash" | "vouchers">("rewards");
  const [copied, setCopied] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>(
    rewards.filter((r) => r.voucherRevealedAt).map((r) => r.id)
  );
  const [connectStatus, setConnectStatus] = useState(stripeConnectStatus);
  const [connectSyncing, setConnectSyncing] = useState(false);
  const [connectingToStripe, setConnectingToStripe] = useState(false);

  const cashRewards = rewards.filter((r) => r.type === "CASH");
  const voucherRewards = rewards.filter((r) => r.type === "VOUCHER");
  const availableCents = cashRewards.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amountCents, 0);
  const pendingCents = cashRewards.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amountCents, 0);
  const totalEarned = rewards.filter((r) => ["PAID", "REVEALED"].includes(r.status)).reduce((s, r) => s + r.amountCents, 0);

  const isStripeConnected = connectStatus === "active";

  // When participant returns from Stripe Connect onboarding, sync the real status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnParam = params.get("connect");
    if (returnParam === "success" || returnParam === "refresh") {
      setConnectSyncing(true);
      fetch("/api/stripe/connect-sync", { method: "POST" })
        .then((r) => r.json())
        .then((data: { status?: string }) => {
          if (data.status) setConnectStatus(data.status);
          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete("connect");
          window.history.replaceState({}, "", url.toString());
        })
        .finally(() => setConnectSyncing(false));
    }
  }, []);

  async function handleConnectStripe() {
    setConnectingToStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      setConnectingToStripe(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  async function revealVoucher(rewardId: string) {
    setRevealedIds((prev) => [...prev, rewardId]);
    await fetch(`/api/rewards/${rewardId}/reveal`, { method: "POST" });
  }

  // Auto-select tab if has vouchers
  useEffect(() => {
    if (voucherRewards.some((r) => r.status === "PAID" && !r.voucherRevealedAt)) {
      setTab("vouchers");
    }
  }, []);

  const tabs = [
    { key: "rewards" as const, label: "Toutes les récompenses", count: rewards.length },
    { key: "cash" as const, label: "Virements", count: cashRewards.length },
    { key: "vouchers" as const, label: "Mes vouchers", count: voucherRewards.length },
  ];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 32px" }}>
      {/* Header */}
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
        Mes récompenses
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px" }}>
        Vos gains des études Qualio
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "36px" }}>
        {[
          { label: "Disponible", value: `${euros(availableCents)}€`, color: "var(--color-text-primary)", sub: availableCents > 0 ? "Prêt à retirer" : "Aucun gain disponible" },
          { label: "En attente", value: `${euros(pendingCents)}€`, color: "var(--color-warning)", sub: "En cours de traitement" },
          { label: "Total gagné", value: `${euros(totalEarned)}€`, color: "var(--color-accent)", sub: `${rewards.length} étude${rewards.length > 1 ? "s" : ""}` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "20px 22px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>{label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, color, marginBottom: "4px" }}>{value}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)" }}>
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: "14px", fontWeight: tab === key ? 600 : 400,
              color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: `2px solid ${tab === key ? "var(--color-accent)" : "transparent"}`,
              marginBottom: "-1px", display: "flex", gap: "6px", alignItems: "center",
            }}
          >
            {label}
            {count > 0 && (
              <span style={{ padding: "1px 7px", borderRadius: "999px", fontSize: "11px", background: tab === key ? "var(--color-accent)" : "var(--color-surface-2)", color: tab === key ? "#fff" : "var(--color-text-tertiary)", fontWeight: 600 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All rewards */}
      {tab === "rewards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rewards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎁</div>
              <div style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}>Aucune récompense pour le moment</div>
              <div style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>Participez à des études pour gagner des récompenses</div>
            </div>
          ) : rewards.map((r) => {
            const statusLabel = r.status === "PAID" ? "Payé" : r.status === "REVEALED" ? "Révélé" : r.status === "PROCESSING" ? "En cours" : "En attente";
            const statusBg = r.status === "PAID" || r.status === "REVEALED" ? "var(--color-success-light)" : r.status === "PROCESSING" ? "var(--color-info-light)" : "var(--color-warning-light)";
            const statusColor = r.status === "PAID" || r.status === "REVEALED" ? "var(--color-success)" : r.status === "PROCESSING" ? "var(--color-info)" : "var(--color-warning)";
            return (
              <div key={r.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>{r.studyTitle}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                    {fmtDate(r.createdAt)} · {r.type === "CASH" ? "Virement" : `Voucher ${r.voucherBrand ?? ""}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{euros(r.amountCents)}€</span>
                  <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, background: statusBg, color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cash tab */}
      {tab === "cash" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Bank account */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "22px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "14px" }}>Compte bancaire</div>
            {connectSyncing ? (
              <div style={{ padding: "14px 16px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "9px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Synchronisation du compte en cours…
              </div>
            ) : isStripeConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "9px" }}>
                <span style={{ fontSize: "22px" }}>✓</span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-success)" }}>Compte bancaire connecté</div>
                  <div style={{ fontSize: "12px", color: "var(--color-success)", opacity: 0.8 }}>Stripe Connect actif — virements automatiques</div>
                </div>
              </div>
            ) : connectStatus === "restricted" ? (
              <div>
                <div style={{ padding: "12px 16px", background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "9px", fontSize: "13px", color: "var(--color-warning)", marginBottom: "12px" }}>
                  Votre compte Stripe nécessite des informations supplémentaires pour être activé.
                </div>
                <button onClick={handleConnectStripe} disabled={connectingToStripe} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  {connectingToStripe ? "Redirection…" : "Compléter mon profil Stripe →"}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Connectez votre compte bancaire pour recevoir vos virements directement sur votre IBAN.
                </p>
                <button onClick={handleConnectStripe} disabled={connectingToStripe} style={{ padding: "11px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: connectingToStripe ? "not-allowed" : "pointer", opacity: connectingToStripe ? 0.7 : 1 }}>
                  {connectingToStripe ? "Redirection vers Stripe…" : "Connecter mon compte bancaire →"}
                </button>
                <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "8px" }}>
                  Sécurisé par Stripe · Vos données bancaires ne transitent pas par Qualio
                </p>
              </div>
            )}
          </div>

          {cashRewards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)", fontSize: "14px" }}>Aucun virement pour le moment</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cashRewards.map((r) => <CashCard key={r.id} reward={r} />)}
            </div>
          )}
        </div>
      )}

      {/* Vouchers tab */}
      {tab === "vouchers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {voucherRewards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎟️</div>
              <div style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}>Aucun voucher pour le moment</div>
            </div>
          ) : voucherRewards.map((r) => (
            <VoucherCard
              key={r.id}
              reward={r}
              onReveal={revealVoucher}
              onCopy={copyCode}
              copied={copied}
            />
          ))}
        </div>
      )}
    </div>
  );
}
