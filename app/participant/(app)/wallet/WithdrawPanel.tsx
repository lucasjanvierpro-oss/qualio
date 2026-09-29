"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdraw } from "@/app/actions/payouts";
import s from "./wallet.module.css";

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
      setMsg({ tone: "warn", text: data.error && /\s/.test(data.error) ? data.error : "Stripe ne répond pas pour l'instant. Réessayez dans quelques minutes." });
    } catch {
      setMsg({ tone: "warn", text: "Connexion impossible. Vérifiez votre réseau et réessayez." });
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
        ? `C'est parti : ${eur(r.amountCents)} arrivent sur votre compte sous 1 à 3 jours ouvrés. Un e-mail vous le confirme.`
        : `Demande enregistrée : votre virement de ${eur(r.amountCents)} part sous 24 heures.`,
    });
    router.refresh();
  });

  return (
    <section className={s.panel} aria-label="Solde et retrait">
      <div className={s.top}>
        <div>
          <p className={s.label}>Solde disponible</p>
          <p className={s.amount}>{eur(available)}</p>
          <p className={s.hint}>Vos gains d&apos;entretiens et vos primes de parrainage, retirables dès {eur(minCents)}.</p>
        </div>
        {connected || !stripeReady ? (
          <button type="button" className={s.cta} onClick={onWithdraw} disabled={!canWithdraw || pending}>
            {pending ? "Envoi…" : available > 0 ? `Retirer ${eur(available)}` : "Retirer"}
          </button>
        ) : (
          <button type="button" className={s.cta} data-kind="accent" onClick={() => goStripe("/api/stripe/connect")} disabled={busy || syncing}>
            {busy ? "Ouverture…" : connectStatus === "restricted" ? "Compléter mon compte bancaire" : "Connecter mon compte bancaire"}
          </button>
        )}
      </div>

      {available < minCents && (
        <div className={s.meter}>
          <div className={s.track}><div className={s.fill} style={{ width: `${Math.min(100, (available / Math.max(1, minCents)) * 100)}%` }} /></div>
          <div className={s.meterText}>
            <span>{available === 0 ? "Votre premier entretien remplit votre solde." : `Encore ${eur(missing)} avant de pouvoir retirer.`}</span>
            <span>Minimum {eur(minCents)}</span>
          </div>
        </div>
      )}

      {(inFlightCents > 0 || paidCents > 0) && (
        <div className={s.figures}>
          {inFlightCents > 0 && <span><b>{eur(inFlightCents)}</b>en route vers votre banque</span>}
          <span><b>{eur(paidCents)}</b>déjà versés</span>
        </div>
      )}

      {!stripeReady ? (
        <div className={s.bank}><span>Les retraits ouvrent très bientôt. Vos gains restent en sécurité dans votre solde.</span></div>
      ) : syncing ? (
        <div className={s.bank}><span>Vérification de votre compte bancaire…</span></div>
      ) : connected ? (
        <div className={s.bank} data-ok="true">
          <span><strong>✓ Compte bancaire connecté</strong> · virement sous 1 à 3 jours ouvrés</span>
          <button type="button" className={s.link} onClick={() => goStripe("/api/stripe/connect-dashboard")} disabled={busy}>Changer d&apos;IBAN ou suivre mes virements</button>
        </div>
      ) : connectStatus === "restricted" ? (
        <div className={s.bank}><span><strong>Stripe attend une dernière information</strong> (souvent une pièce d&apos;identité) avant d&apos;activer vos virements.</span></div>
      ) : (
        <div className={s.bank}>
          <span><strong>Une seule fois, 3 minutes :</strong> votre identité et votre IBAN, sur le formulaire sécurisé de Stripe, notre prestataire de paiement. Comme sur Vinted.</span>
        </div>
      )}

      {msg && <p className={s.note} data-tone={msg.tone} role="status">{msg.text}</p>}
    </section>
  );
}

type PayoutRow = { id: string; amountCents: number; status: string; createdAt: string; paidAt: string | null };

const fmt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export function PayoutHistory({ payouts }: { payouts: PayoutRow[] }) {
  const shown = payouts.filter((p) => p.status !== "cancelled");
  if (shown.length === 0) return null;
  return (
    <div className={s.history}>
      <p className={s.label} style={{ margin: "4px 0 2px" }}>Mes retraits</p>
      {shown.map((p) => (
        <div key={p.id} className={s.hrow}>
          <span>
            Retrait vers votre compte bancaire
            <small>{p.status === "sent" && p.paidAt ? `Envoyé le ${fmt(p.paidAt)}` : `Demandé le ${fmt(p.createdAt)}`}</small>
          </span>
          <span>
            <span className={s.hamt}>{eur(p.amountCents)}</span>
            <span className={s.pill} data-s={p.status === "sent" ? "sent" : "progress"}>{p.status === "sent" ? "Envoyé" : "En cours"}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
