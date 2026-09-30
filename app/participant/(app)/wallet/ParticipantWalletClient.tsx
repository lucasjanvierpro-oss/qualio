"use client";

import { useState, useEffect } from "react";
import WithdrawPanel, { PayoutHistory, type WalletBalance } from "./WithdrawPanel";
import LoupeMascot from "@/components/brand/LoupeMascot";
import { useLang, useTT } from "@/lib/i18n/client";

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

function fmtDate(iso: string, en = false) {
  return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
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
  const tt = useTT();
  const en = useLang() === "en";
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
            {reward.voucherBrand ?? tt("Bon d'achat", "Voucher")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            {reward.studyTitle} · {fmtDate(reward.createdAt, en)}
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
              {copied === reward.voucherCode ? tt("Copié ✓", "Copied ✓") : tt("Copier le code", "Copy code")}
            </button>
          </div>
          {revealed && (
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
              {tt("Utilisez ce code sur", "Use this code on")} {reward.voucherBrand ?? tt("le site partenaire", "the partner site")}
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
          {tt("Révéler mon code cadeau", "Reveal my gift code")}
        </button>
      ) : (
        <div style={{ padding: "12px 16px", background: "var(--color-surface-2)", borderRadius: "8px", fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
          {tt("Votre récompense sera disponible après traitement", "Your reward will be available once processed")}
        </div>
      )}
    </div>
  );
}

// Un gain d'entretien : dans le solde, en route vers la banque, ou versé.
function CashCard({ reward }: { reward: Reward }) {
  const tt = useTT();
  const en = useLang() === "en";
  const state = reward.status === "PAID"
    ? { text: reward.paidAt ? `${tt("Versé le", "Paid on")} ${fmtDate(reward.paidAt, en)}` : tt("Versé", "Paid"), bg: "var(--color-success-light)", color: "var(--color-success)" }
    : reward.status === "PROCESSING"
      ? { text: tt("Retrait en cours : arrivée sous 1 à 3 jours ouvrés", "Withdrawal in progress: arrives in 1 to 3 business days"), bg: "var(--color-warning-light)", color: "var(--color-warning)" }
      : { text: tt("Dans votre solde, prêt à être retiré", "In your balance, ready to withdraw"), bg: "var(--color-surface-2)", color: "var(--color-text-secondary)" };
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "2px" }}>
            {reward.studyTitle}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Entretien du {fmtDate(reward.createdAt, en)}</div>
        </div>
        <div style={{ fontSize: "24px", fontWeight: 700, color: reward.status === "PAID" ? "var(--color-success)" : "var(--color-text-primary)" }}>
          {euros(reward.amountCents)}€
        </div>
      </div>
      <div style={{ padding: "10px 14px", background: state.bg, borderRadius: "9px", fontSize: "13px", color: state.color }}>{state.text}</div>
    </div>
  );
}

type Bonus = { id: string; kind: string; amountCents: number; status: string; createdAt: string };

const BONUS_LABELS = (tt: (fr: string, en: string) => string): Record<string, string> => ({
  first: tt("Premier entretien d'un filleul", "A referral's first interview"),
  interview: tt("Entretien d'un filleul", "A referral's interview"),
  welcome: tt("Bienvenue : premier entretien", "Welcome: first interview"),
});

export default function ParticipantWalletClient({
  rewards,
  bonuses = [],
  stripeConnectStatus,
  balance,
  payouts,
  stripeReady,
}: {
  rewards: Reward[];
  bonuses?: Bonus[];
  stripeConnectStatus: string | null;
  balance: WalletBalance;
  payouts: { id: string; amountCents: number; status: string; createdAt: string; paidAt: string | null }[];
  stripeReady: boolean;
}) {
  const tt = useTT();
  const en = useLang() === "en";
  const BONUS_LABEL = BONUS_LABELS(tt);
  const [tab, setTab] = useState<"rewards" | "cash" | "vouchers">("rewards");
  const [copied, setCopied] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>(
    rewards.filter((r) => r.voucherRevealedAt).map((r) => r.id)
  );
  const [connectStatus, setConnectStatus] = useState(stripeConnectStatus);
  const [connectSyncing, setConnectSyncing] = useState(false);

  const cashRewards = rewards.filter((r) => r.type === "CASH");
  const voucherRewards = rewards.filter((r) => r.type === "VOUCHER");

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
    { key: "rewards" as const, label: tt("Toutes les récompenses", "All rewards"), count: rewards.length },
    { key: "cash" as const, label: tt("Gains et retraits", "Earnings & withdrawals"), count: cashRewards.length },
    { key: "vouchers" as const, label: tt("Mes vouchers", "My vouchers"), count: voucherRewards.length },
  ];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 32px" }}>
      {/* Header */}
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
        {tt("Mes récompenses", "My rewards")}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px" }}>
        {tt("Vos gains des études Rarelyst", "Your earnings from Rarelyst studies")}
      </p>

      <WithdrawPanel balance={balance} connectStatus={connectStatus} syncing={connectSyncing} stripeReady={stripeReady} />

      {/* Parrainage : les primes, ou l'invitation à parrainer */}
      <a href="/participant/parrainage" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", marginBottom: 28, borderRadius: 14, background: "linear-gradient(135deg, #fff6e3, #ffffff)", border: "1px solid #f1e6cf", textDecoration: "none", color: "inherit" }}>
        <span>
          <strong style={{ display: "block", fontSize: 15 }}>{bonuses.length ? `${tt("Parrainage", "Referrals")} · ${bonuses.length} ${tt(`prime${bonuses.length > 1 ? "s" : ""}`, `bonus${bonuses.length > 1 ? "es" : ""}`)}` : tt("Parrainez un ami, gagnez 50 €", "Refer a friend, earn €50")}</strong>
          <span style={{ fontSize: 13.5, color: "var(--color-text-secondary)" }}>
            {bonuses.length
              ? bonuses.slice(0, 3).map((b) => `${BONUS_LABEL[b.kind] ?? tt("Prime", "Bonus")} : ${euros(b.amountCents)} €`).join(" · ")
              : tt("Dès que votre ami termine son premier entretien, puis 30 € aux suivants.", "When your friend completes their first interview, then €30 for each of the next ones.")}
          </span>
        </span>
        <span style={{ fontWeight: 700, color: "#8a5d12", whiteSpace: "nowrap" }}>{tt("Voir", "View")} →</span>
      </a>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: "14px", fontWeight: tab === key ? 600 : 400,
              color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: `2px solid ${tab === key ? "var(--color-accent)" : "transparent"}`,
              marginBottom: "-1px", display: "flex", gap: "6px", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0,
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
              <LoupeMascot size={64} className="rl-empty-mascot" />
              <div style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}>{tt("Aucune récompense pour le moment", "No rewards yet")}</div>
              <div style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>{tt("Participez à des études pour gagner des récompenses", "Take part in studies to earn rewards")}</div>
            </div>
          ) : rewards.map((r) => {
            const statusLabel = r.status === "PAID" ? tt("Versé", "Paid") : r.status === "REVEALED" ? tt("Révélé", "Revealed") : r.status === "PROCESSING" ? tt("Retrait en cours", "Withdrawal in progress") : r.type === "CASH" ? tt("Dans le solde", "In balance") : tt("En préparation", "Being prepared");
            const statusBg = r.status === "PAID" || r.status === "REVEALED" ? "var(--color-success-light)" : r.status === "PROCESSING" ? "var(--color-info-light)" : "var(--color-warning-light)";
            const statusColor = r.status === "PAID" || r.status === "REVEALED" ? "var(--color-success)" : r.status === "PROCESSING" ? "var(--color-info)" : "var(--color-warning)";
            return (
              <div key={r.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>{r.studyTitle}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                    {fmtDate(r.createdAt, en)} · {r.type === "CASH" ? tt("Virement", "Bank transfer") : `Voucher ${r.voucherBrand ?? ""}`}
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
          <PayoutHistory payouts={payouts} />

          {cashRewards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)", fontSize: "14px" }}>{tt("Aucun virement pour le moment", "No transfers yet")}</div>
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
              <div style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}>{tt("Aucun voucher pour le moment", "No vouchers yet")}</div>
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
