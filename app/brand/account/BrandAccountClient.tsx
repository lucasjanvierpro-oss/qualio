"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { redeemInviteCode } from "@/app/actions/inviteCodes";
import { saveHouse } from "@/app/actions/house";
import { useLang, useTT } from "@/lib/i18n/client";

type Transaction = { id: string; type: string; amount: number; desc: string; date: string; balance: number };

type Pack = { id: string; label: string; credits: number; priceCents: number; note: string };
type TierInfo = { label: string; credits: number };

export default function BrandAccountClient({
  isActivated,
  credits,
  companyName,
  transactions,
  packs,
  tiers,
  creditValueCents,
  house,
}: {
  isActivated: boolean;
  credits: number;
  companyName: string;
  transactions: Transaction[];
  packs: Pack[];
  tiers: TierInfo[];
  creditValueCents: number;
  house: { industry: string; website: string; houseNotes: string };
}) {
  const tt = useTT();
  const en = useLang() === "en";
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
    const result = await redeemInviteCode(inviteCode);
    if (result.ok) {
      setCodeStatus("success");
      setTimeout(() => router.refresh(), 1000);
    } else {
      setCodeStatus("error");
      setCodeError(result.error ?? tt("Code invalide", "Invalid code"));
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px" }}>
      {checkoutSuccess && (
        <div style={{ padding: "14px 18px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "4px", marginBottom: "20px", fontSize: "14px", fontWeight: 600, color: "var(--color-success)" }}>
          ✓ {tt("Paiement confirmé — vos crédits ont été ajoutés à votre compte.", "Payment confirmed, your credits have been added to your account.")}
        </div>
      )}
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 32px" }}>
        {tt("Compte & abonnement", "Account & billing")}
      </h1>

      {/* Access code banner (only if not activated) */}
      {!isActivated && (
        <div style={{ background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-warning)", margin: "0 0 8px" }}>
            🔒 {tt("Compte en mode preview", "Account in preview mode")}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-warning)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {tt("Votre accès est limité. Entrez votre code d'accès pour débloquer la création d'études et le recrutement de participants.", "Your access is limited. Enter your access code to unlock study creation and participant recruitment.")}
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
                <div style={{ fontSize: "12px", color: "var(--color-success)", marginTop: "4px", fontWeight: 600 }}>✓ {tt("Code valide — compte activé !", "Valid code, account activated!")}</div>
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
              {codeStatus === "loading" ? "…" : tt("Activer", "Activate")}
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-warning)", margin: "12px 0 0" }}>
            {tt("Pas encore de code ?", "No code yet?")} <a href="mailto:lucas@rarelyst.co" style={{ color: "var(--color-warning)", fontWeight: 600 }}>{tt("Contactez-nous", "Contact us")} →</a>
          </p>
        </div>
      )}

      {isActivated && (
        <div style={{ background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "10px", padding: "12px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-success)" }}>{tt("Compte activé — accès complet à la plateforme", "Account activated, full access to the platform")}</span>
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
            {t === "credits" ? tt("Crédits", "Credits") : tt("Profil entreprise", "Company profile")}
          </button>
        ))}
      </div>

      {tab === "credits" && (
        <div>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "12px", padding: "24px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{tt("Solde actuel", "Current balance")}</div>
              <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "48px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>{credits}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "6px" }}>{tt("crédits disponibles", "credits available")}</div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "right" }}>
              <div>{tt("1 crédit", "1 credit")} = {creditValueCents / 100} € {tt("HT", "excl. VAT")}</div>
              <div style={{ marginTop: "4px" }}>{tt("Un profil coûte selon son palier · remboursé en cas d'absence", "A profile's cost depends on its tier · refunded if they don't show up")}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" }}>
            {tiers.map((t) => (
              <span key={t.label} style={{ fontSize: "13px", padding: "6px 12px", borderRadius: "999px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", color: "var(--color-text-secondary)" }}>
                <b style={{ color: "var(--color-text-primary)" }}>{t.label}</b> · {tt(`à partir de ${t.credits} crédits l'entretien de 45 min`, `from ${t.credits} credits per 45-min interview`)}
              </span>
            ))}
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 14px" }}>{tt("Acheter des crédits", "Buy credits")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            {packs.map((pack, i) => { const popular = i === 1; return (
              <div key={pack.id} style={{
                padding: "20px", border: `1px solid ${popular ? "var(--color-accent)" : "var(--color-border-base)"}`,
                borderRadius: "10px", background: popular ? "var(--color-accent-light)" : "var(--color-surface)",
                position: "relative",
              }}>
                {popular && (
                  <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--color-accent)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px" }}>
                    {tt("Populaire", "Popular")}
                  </div>
                )}
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{pack.label}</div>
                <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)" }}>{pack.credits}</div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>{tt("crédits", "credits")} · {pack.note}</div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe/create-credit-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ packId: pack.id }),
                    });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  }}
                  style={{
                    width: "100%", padding: "10px",
                    background: popular ? "var(--color-accent)" : "var(--color-surface-2)",
                    color: popular ? "#fff" : "var(--color-text-primary)",
                    border: `1px solid ${popular ? "transparent" : "var(--color-border-strong)"}`,
                    borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {(pack.priceCents / 100).toLocaleString(en ? "en-GB" : "fr-FR")} € {tt("HT", "excl. VAT")}
                </button>
              </div>
            ); })}
          </div>

          {transactions.length > 0 && (
            <>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 14px" }}>{tt("Historique", "History")}</h3>
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
                      {tt("Solde", "Balance")}: {tx.balance}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "profile" && <HouseForm companyName={companyName} house={house} />}
    </div>
  );
}

// Votre maison : secteur, site, et ce que l'IA doit savoir pour vos synthèses.
function HouseForm({ companyName, house }: { companyName: string; house: { industry: string; website: string; houseNotes: string } }) {
  const tt = useTT();
  const [industry, setIndustry] = useState(house.industry);
  const [website, setWebsite] = useState(house.website);
  const [notes, setNotes] = useState(house.houseNotes);
  const [state, setState] = useState<"idle" | "saving" | "saved" | string>("idle");
  const field = { width: "100%", padding: "10px 14px", border: "1px solid var(--color-border-base)", borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const, font: "inherit" };
  const label = { display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
  async function save() {
    setState("saving");
    const r = await saveHouse({ industry, website, houseNotes: notes });
    setState("error" in r ? r.error : "saved");
  }
  return (
    <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div><span style={label}>{tt("Maison", "House")}</span><div style={{ fontSize: "16px", fontWeight: 600 }}>{companyName}</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div><label style={label} htmlFor="industry">{tt("Secteur", "Industry")}</label><input id="industry" style={field} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={tt("Maroquinerie de luxe", "Luxury leather goods")} /></div>
        <div><label style={label} htmlFor="website">{tt("Site", "Website")}</label><input id="website" style={field} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" /></div>
      </div>
      <div>
        <label style={label} htmlFor="house">{tt("Votre maison, pour nos synthèses", "Your house, for our reports")}</label>
        <p style={{ margin: "0 0 8px", fontSize: "13.5px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          {tt("Quelques lignes suffisent : votre positionnement, vos clientes et clients, vos concurrents, les mots que vous employez en interne, ce que vous avez déjà appris. L'IA qui écrit vos synthèses le lit avant chaque étude, et ne le partage avec personne.", "A few lines are enough: your positioning, your customers, your competitors, the words you use internally, what you've already learned. The AI that writes your reports reads it before each study, and shares it with no one.")}
        </p>
        <textarea id="house" rows={8} style={{ ...field, resize: "vertical", lineHeight: 1.55 }} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={tt("Ex. : Maison parisienne de maroquinerie fondée en 1998, positionnée luxe accessible (sacs de 450 à 900 €). Clientèle 30-45 ans, urbaine, fidèle. Nous parlons de « pièces » et jamais de « produits ». Concurrents suivis : Polène, Sézane. Étude 2025 : la couleur prime sur le logo.", "E.g.: Parisian leather goods house founded in 1998, accessible luxury (bags from €450 to €900). Customers aged 30–45, urban, loyal. We say “pieces”, never “products”. Competitors we follow: Polène, Sézane. 2025 study: colour matters more than the logo.")} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button type="button" onClick={save} disabled={state === "saving"} style={{ padding: "10px 24px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          {state === "saving" ? tt("Enregistrement…", "Saving…") : tt("Enregistrer", "Save")}
        </button>
        {state === "saved" && <span style={{ fontSize: "13px", color: "var(--color-success)" }}>{tt("Enregistré.", "Saved.")}</span>}
        {state !== "idle" && state !== "saving" && state !== "saved" && <span style={{ fontSize: "13px", color: "var(--color-error)" }}>{state}</span>}
      </div>
    </div>
  );
}
