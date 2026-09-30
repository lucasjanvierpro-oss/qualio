"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdraw } from "@/app/actions/payouts";
import s from "./wallet.module.css";
import { useTT } from "@/lib/i18n/client";

export type WalletBalance = { availableCents: number; inFlightCents: number; paidCents: number; minCents: number };

const eur = (c: number) => `${(c / 100).toLocaleString("fr-FR", { maximumFractionDigits: c % 100 ? 2 : 0 })} €`;

/**
 * Le solde et le bouton « Retirer », comme sur Vinted : les gains s'accumulent,
 * et dès le minimum atteint le participant vide son solde vers sa banque.
 */
export default function WithdrawPanel({ balance, connectStatus, syncing, stripeReady }: {
  balance: WalletBalance;
  connectStatus: string | null;
  syncing: boolean;
  stripeReady: boolean;
}) {
  const router = useRouter();
  const tt = useTT();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  const { availableCents: available, inFlightCents, paidCents, minCents } = balance;
  const connected = connectStatus === "active";
  const canWithdraw = stripeReady && connected && available > 0 && available >= minCents;
  const missing = Math.max(0, minCents - available);

  async function goStripe(path: "/api/stripe/connect" | "/api/stripe/connect-dashboard") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { window.location.href = data.url; return; }
      setMsg({ tone: "warn", text: data.error && /\s/.test(data.error) ? data.error : tt("Stripe ne répond pas pour l'instant. Réessayez dans quelques minutes.", "Stripe is not responding right now. Please try again in a few minutes.") });
    } catch {
      setMsg({ tone: "warn", text: tt("Connexion impossible. Vérifiez votre réseau et réessayez.", "Connection failed. Check your network and try again.") });
    }
    setBusy(false);
  }

  const onWithdraw = () => start(async () => {
    setMsg(null);
    const r = await withdraw();
    if ("error" in r) { setMsg({ tone: "warn", text: r.error }); return; }
    setMsg({
      tone: "ok",
      text: r.sent
        ? tt(`C'est parti : ${eur(r.amountCents)} arrivent sur votre compte sous 1 à 3 jours ouvrés. Un e-mail vous le confirme.`, `On its way: ${eur(r.amountCents)} will reach your account within 1 to 3 business days. You will get a confirmation email.`)
        : tt(`Demande enregistrée : votre virement de ${eur(r.amountCents)} part sous 24 heures.`, `Request received: your ${eur(r.amountCents)} transfer goes out within 24 hours.`),
    });
    router.refresh();
  });

  return (
    <section className={s.panel} aria-label={tt("Solde et retrait", "Balance and withdrawal")}>
      <div className={s.top}>
        <div>
          <p className={s.label}>{tt("Solde disponible", "Available balance")}</p>
          <p className={s.amount}>{eur(available)}</p>
          <p className={s.hint}>{tt("Vos gains d'entretiens et vos primes de parrainage, retirables dès", "Your interview earnings and referral bonuses, withdrawable from")} {eur(minCents)}.</p>
        </div>
        {connected || !stripeReady ? (
          <button type="button" className={s.cta} onClick={onWithdraw} disabled={!canWithdraw || pending}>
            {pending ? tt("Envoi…", "Sending…") : available > 0 ? `${tt("Retirer", "Withdraw")} ${eur(available)}` : tt("Retirer", "Withdraw")}
          </button>
        ) : (
          <button type="button" className={s.cta} data-kind="accent" onClick={() => goStripe("/api/stripe/connect")} disabled={busy || syncing}>
            {busy ? tt("Ouverture…", "Opening…") : connectStatus === "restricted" ? tt("Compléter mon compte bancaire", "Complete my bank account") : tt("Connecter mon compte bancaire", "Connect my bank account")}
          </button>
        )}
      </div>

      {available < minCents && (
        <div className={s.meter}>
          <div className={s.track}><div className={s.fill} style={{ width: `${Math.min(100, (available / Math.max(1, minCents)) * 100)}%` }} /></div>
          <div className={s.meterText}>
            <span>{available === 0 ? tt("Votre premier entretien remplit votre solde.", "Your first interview fills your balance.") : tt(`Encore ${eur(missing)} avant de pouvoir retirer.`, `${eur(missing)} more before you can withdraw.`)}</span>
            <span>{tt("Minimum", "Minimum")} {eur(minCents)}</span>
          </div>
        </div>
      )}

      {(inFlightCents > 0 || paidCents > 0) && (
        <div className={s.figures}>
          {inFlightCents > 0 && <span><b>{eur(inFlightCents)}</b>{tt("en route vers votre banque", "on its way to your bank")}</span>}
          <span><b>{eur(paidCents)}</b>{tt("déjà versés", "already paid")}</span>
        </div>
      )}

      {!stripeReady ? (
        <div className={s.bank}><span>{tt("Les retraits ouvrent très bientôt. Vos gains restent en sécurité dans votre solde.", "Withdrawals open very soon. Your earnings stay safe in your balance.")}</span></div>
      ) : syncing ? (
        <div className={s.bank}><span>{tt("Vérification de votre compte bancaire…", "Checking your bank account…")}</span></div>
      ) : connected ? (
        <div className={s.bank} data-ok="true">
          <span><strong>✓ {tt("Compte bancaire connecté", "Bank account connected")}</strong> · {tt("virement sous 1 à 3 jours ouvrés", "transfer within 1 to 3 business days")}</span>
          <button type="button" className={s.link} onClick={() => goStripe("/api/stripe/connect-dashboard")} disabled={busy}>{tt("Changer d'IBAN ou suivre mes virements", "Change IBAN or track my transfers")}</button>
        </div>
      ) : connectStatus === "restricted" ? (
        <div className={s.bank}><span><strong>{tt("Stripe attend une dernière information", "Stripe needs one last detail")}</strong> {tt("(souvent une pièce d'identité) avant d'activer vos virements.", "(often an ID document) before enabling your transfers.")}</span></div>
      ) : (
        <div className={s.bank}>
          <span><strong>{tt("Une seule fois, 3 minutes :", "Just once, 3 minutes:")}</strong> {tt("votre identité et votre IBAN, sur le formulaire sécurisé de Stripe, notre prestataire de paiement. Comme sur Vinted.", "your identity and bank details, on the secure form of Stripe, our payment provider.")}</span>
        </div>
      )}

      {msg && <p className={s.note} data-tone={msg.tone} role="status">{msg.text}</p>}
    </section>
  );
}

type PayoutRow = { id: string; amountCents: number; status: string; createdAt: string; paidAt: string | null };

const fmt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export function PayoutHistory({ payouts }: { payouts: PayoutRow[] }) {
  const tt = useTT();
  const shown = payouts.filter((p) => p.status !== "cancelled");
  if (shown.length === 0) return null;
  return (
    <div className={s.history}>
      <p className={s.label} style={{ margin: "4px 0 2px" }}>{tt("Mes retraits", "My withdrawals")}</p>
      {shown.map((p) => (
        <div key={p.id} className={s.hrow}>
          <span>
            {tt("Retrait vers votre compte bancaire", "Withdrawal to your bank account")}
            <small>{p.status === "sent" && p.paidAt ? `${tt("Envoyé le", "Sent on")} ${fmt(p.paidAt)}` : `${tt("Demandé le", "Requested on")} ${fmt(p.createdAt)}`}</small>
          </span>
          <span>
            <span className={s.hamt}>{eur(p.amountCents)}</span>
            <span className={s.pill} data-s={p.status === "sent" ? "sent" : "progress"}>{p.status === "sent" ? tt("Envoyé", "Sent") : tt("En cours", "In progress")}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
