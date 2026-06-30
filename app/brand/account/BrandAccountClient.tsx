"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { redeemInviteCode } from "@/app/actions/inviteCodes";

type Transaction = { id: string; type: string; amount: number; desc: string; date: string; balance: number };

const PACKS = [
  { credits: 5,  price: "375€",  unit: "75€/entretien", label: "Pack S" },
  { credits: 12, price: "780€",  unit: "65€/entretien", label: "Pack M", popular: true },
  { credits: 25, price: "1 375€", unit: "55€/entretien", label: "Pack L" },
];

export default function BrandAccountClient({
  isActivated,
  credits,
  companyName,
  brandProfileId,
  transactions,
}: {
  isActivated: boolean;
  credits: number;
  companyName: string;
  brandProfileId: string;
  transactions: Transaction[];
}) {
  const [tab, setTab] = useState<"credits" | "profile">("credits");
  const [inviteCode, setInviteCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [codeError, setCodeError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const router = useRouter();

  // Detect Stripe checkout return and refresh credits
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "credits_success") {
      setCheckoutSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
      // Refresh server data so credits balance is up to date
      router.refresh();
      setTimeout(() => setCheckoutSuccess(false), 6000);
    }
  }, [router]);

  async function handleRedeemCode() {
    if (!inviteCode.trim()) return;
    setCodeStatus("loading");
    const result = await redeemInviteCode(inviteCode, brandProfileId);
    if (result.ok) {
      setCodeStatus("success");
      setTimeout(() => router.refresh(), 1000);
    } else {
      setCodeStatus("error");
      setCodeError(result.error ?? "Code invalide");
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px" }}>
      {checkoutSuccess && (
        <div style={{ padding: "14px 18px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "4px", marginBottom: "20px", fontSize: "14px", fontWeight: 600, color: "var(--color-success)" }}>
          ✓ Paiement confirmé — vos crédits ont été ajoutés à votre compte.
        </div>
      )}
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 32px" }}>
        Compte & abonnement
      </h1>

      {/* Access code banner (only if not activated) */}
      {!isActivated && (
        <div style={{ background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-warning)", margin: "0 0 8px" }}>
            🔒 Compte en mode preview
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-warning)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Votre accès est limité. Entrez votre code d'accès pour débloquer la création d'études et le recrutement de participants.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setCodeStatus("idle"); }}
                onKeyDown={(e) => e.key === "Enter" && handleRedeemCode()}
                placeholder="Ex: LACOSTE-XK9R2"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: `1px solid ${codeStatus === "error" ? "var(--color-error)" : "var(--color-warning)"}`,
                  borderRadius: "8px", fontSize: "14px", fontFamily: "var(--font-mono-base)",
                  background: "#fff", color: "var(--color-text-primary)", outline: "none",
                  letterSpacing: "0.05em", boxSizing: "border-box",
                }}
              />
              {codeStatus === "error" && (
                <div style={{ fontSize: "12px", color: "var(--color-error)", marginTop: "4px" }}>{codeError}</div>
              )}
              {codeStatus === "success" && (
                <div style={{ fontSize: "12px", color: "var(--color-success)", marginTop: "4px", fontWeight: 600 }}>✓ Code valide — compte activé !</div>
              )}
            </div>
            <button
              onClick={handleRedeemCode}
              disabled={codeStatus === "loading" || codeStatus === "success"}
              style={{
                padding: "10px 20px", background: "var(--color-warning)", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", opacity: codeStatus === "loading" ? 0.7 : 1,
              }}
            >
              {codeStatus === "loading" ? "…" : "Activer"}
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-warning)", margin: "12px 0 0" }}>
            Pas encore de code ? <a href="mailto:lucas@qualio.io" style={{ color: "var(--color-warning)", fontWeight: 600 }}>Contactez-nous →</a>
          </p>
        </div>
      )}

      {isActivated && (
        <div style={{ background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "10px", padding: "12px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-success)" }}>Compte activé — accès complet à la plateforme</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "32px", borderBottom: "1px solid var(--color-border-base)" }}>
        {(["credits", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: "14px", fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "credits" ? "Crédits" : "Profil entreprise"}
          </button>
        ))}
      </div>

      {tab === "credits" && (
        <div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "12px", padding: "24px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Solde actuel</div>
              <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "48px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>{credits}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "6px" }}>crédits disponibles</div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "right" }}>
              <div>1 crédit = 1 participant confirmé</div>
              <div style={{ marginTop: "4px" }}>Remboursé si no-show</div>
            </div>
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 14px" }}>Acheter des crédits</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
            {PACKS.map((pack) => (
              <div key={pack.credits} style={{
                padding: "20px", border: `1px solid ${pack.popular ? "var(--color-accent)" : "var(--color-border-base)"}`,
                borderRadius: "10px", background: pack.popular ? "var(--color-accent-light)" : "var(--color-surface)",
                position: "relative",
              }}>
                {pack.popular && (
                  <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--color-accent)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px" }}>
                    Populaire
                  </div>
                )}
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{pack.label}</div>
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)" }}>{pack.credits}</div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>crédits · {pack.unit}</div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe/create-credit-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ credits: pack.credits }),
                    });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  }}
                  style={{
                    width: "100%", padding: "10px",
                    background: pack.popular ? "var(--color-accent)" : "var(--color-surface-2)",
                    color: pack.popular ? "#fff" : "var(--color-text-primary)",
                    border: `1px solid ${pack.popular ? "transparent" : "var(--color-border-strong)"}`,
                    borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {pack.price}
                </button>
              </div>
            ))}
          </div>

          {transactions.length > 0 && (
            <>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 14px" }}>Historique</h3>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "10px", overflow: "hidden" }}>
                {transactions.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto", gap: "16px",
                    padding: "14px 20px", alignItems: "center",
                    borderTop: i > 0 ? "1px solid var(--color-border-base)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{tx.desc || tx.type}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>{tx.date}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "14px", fontWeight: 700, color: tx.amount > 0 ? "var(--color-success)" : "var(--color-text-primary)" }}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      Solde: {tx.balance}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div style={{ maxWidth: "520px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {[
              { label: "Nom de l'entreprise", value: companyName },
              { label: "Email", value: "" },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {field.label}
                </label>
                <input
                  defaultValue={field.value}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border-base)", borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <button style={{ alignSelf: "flex-start", marginTop: "8px", padding: "10px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
