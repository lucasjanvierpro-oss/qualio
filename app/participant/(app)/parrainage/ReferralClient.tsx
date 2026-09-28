"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import s from "@/components/rl/rl.module.css";
import type { ReferralSummary } from "@/lib/referral/referral";
import r from "./parrainage.module.css";

// Page de parrainage. Le principe doit se lire en trois secondes : combien,
// quand, et pourquoi on ne paie pas l'inscription. Le reste donne envie :
// le billet d'invitation, la frise des dix entretiens, le simulateur.

type Rules = { firstCents: number; perInterviewCents: number; maxInterviews: number; welcomeCents: number };

const eur = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;
const fmtDate = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(iso));

/** Ce que rapporte un ami qui mène `n` entretiens. */
function perFriend(rules: Rules, n: number) {
  const k = Math.min(n, rules.maxInterviews);
  if (k <= 0) return 0;
  return rules.firstCents + (k - 1) * rules.perInterviewCents;
}

export default function ReferralClient(p: {
  link: string; code: string; friends: ReferralSummary["friends"]; earnedCents: number; pendingCents: number;
  wanted: string[]; rules: Rules; payoutMinCents: number; payRange: [number, number];
}) {
  const max = perFriend(p.rules, p.rules.maxInterviews);
  const message = `Des marques de mode et de luxe paient pour interviewer des profils comme le tien : ${eur(p.payRange[0])} à ${eur(p.payRange[1])} l'entretien de 45 minutes, en visio. Inscris-toi avec mon lien${p.rules.welcomeCents ? `, ton premier entretien est majoré de ${eur(p.rules.welcomeCents)}` : ""} : ${p.link}`;

  return (
    <div className={`${s.page} ${s.pageWide}`}>
      <section className={r.hero}>
        <div className={r.heroText}>
          <p className={s.eyebrow}>Parrainage</p>
          <h1 className={r.h1}>Invitez les profils rares que vous connaissez.</h1>
          <p className={r.lead}>
            <b>{eur(p.rules.firstCents)}</b> quand votre ami termine son premier entretien, puis <b>{eur(p.rules.perInterviewCents)}</b> à chacun des suivants.
            Jusqu&apos;à <b>{eur(max)}</b> par ami{p.rules.welcomeCents ? <>, et <b>{eur(p.rules.welcomeCents)}</b> offerts à votre ami sur son premier entretien</> : null}.
          </p>
          <Share link={p.link} message={message} />
        </div>
        <Ticket code={p.code} max={max} rules={p.rules} />
      </section>

      <Track rules={p.rules} />

      <div className={r.twoCols}>
        <Simulator rules={p.rules} />
        <section className={s.card}>
          <h2 className={s.h3}>Ce que les marques cherchent en ce moment</h2>
          <p className={`${s.small} ${s.muted}`} style={{ margin: "0 0 14px" }}>Pensez d&apos;abord à ces personnes : ce sont celles qui seront appelées vite.</p>
          {p.wanted.length ? (
            <div className={r.wanted}>{p.wanted.map((w, i) => <span key={w} style={{ animationDelay: `${i * 70}ms` }}>{w}</span>)}</div>
          ) : (
            <div className={r.wanted}>
              {["Vendeuses en boutique de luxe", "Acheteurs et acheteuses", "Stylistes", "Collectionneurs", "Revendeurs seconde main"].map((w, i) => <span key={w} style={{ animationDelay: `${i * 70}ms` }}>{w}</span>)}
            </div>
          )}
        </section>
      </div>

      <section className={s.sectionGap}>
        <div className={s.spread}>
          <h2 className={s.h2}>Vos filleuls <span className={s.faint}>({p.friends.length})</span></h2>
          <div className={r.totals}>
            <span><small>Gagné</small><b>{eur(p.earnedCents)}</b></span>
            <span><small>En attente</small><b>{eur(p.pendingCents)}</b></span>
          </div>
        </div>
        {p.friends.length === 0 ? (
          <div className={`${s.cardSoft} ${r.empty}`}>
            <span className={r.emptyCoin}>{Math.round(p.rules.firstCents / 100)}</span>
            <span><b>Personne encore.</b> Votre premier ami qui mène un entretien vous rapporte {eur(p.rules.firstCents)}.</span>
          </div>
        ) : (
          <ul className={r.friends}>
            {p.friends.map((f, i) => (
              <li key={i}>
                <span className={r.friendAv}>{f.initial}</span>
                <span className={r.friendName}><b>{f.name}</b><small>Inscrit le {fmtDate(f.joinedAt)}{f.active ? "" : " · profil à terminer"}</small></span>
                <span className={r.dots} aria-label={`${f.interviews} entretien${f.interviews > 1 ? "s" : ""} sur ${p.rules.maxInterviews}`}>
                  {Array.from({ length: p.rules.maxInterviews }, (_, k) => <i key={k} data-on={k < f.interviews} data-first={k === 0} />)}
                </span>
                <span className={r.friendEarned}>{eur(f.earnedCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${s.cardSoft} ${s.sectionGap}`}>
        <h2 className={s.h3}>Les règles, en clair</h2>
        <ul className={r.rules}>
          <li><b>On ne paie pas les inscriptions.</b> Une prime naît quand votre ami a réellement mené un entretien avec une marque : c&apos;est ce qui nous permet de payer autant.</li>
          <li><b>{eur(p.rules.firstCents)} au premier entretien, {eur(p.rules.perInterviewCents)} aux suivants</b>, jusqu&apos;à {p.rules.maxInterviews} entretiens par ami. Pas de limite au nombre d&apos;amis.</li>
          <li><b>Versé sur votre solde</b> une fois l&apos;entretien confirmé, retirable dès {eur(p.payoutMinCents)}. <Link href="/participant/wallet">Voir mes gains</Link></li>
          <li><b>Un vrai ami, un vrai profil.</b> S&apos;inviter soi-même ou créer un double compte annule les primes.</li>
        </ul>
      </section>
    </div>
  );
}

// ── Partage ───────────────────────────────────────────────────
function Share({ link, message }: { link: string; message: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    // navigator n'existe qu'une fois la page dans le navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(link); } catch { /* le champ reste sélectionnable à la main */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const enc = encodeURIComponent;
  return (
    <div className={r.share}>
      <div className={r.linkRow}>
        <input className={r.linkInput} readOnly value={link} aria-label="Votre lien de parrainage" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className={r.copy} data-done={copied} onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
      </div>
      <div className={r.shareBtns}>
        {canShare && <button type="button" onClick={() => navigator.share({ text: message }).catch(() => {})}>Partager…</button>}
        <a href={`https://wa.me/?text=${enc(message)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={`mailto:?subject=${enc("Rejoins-moi sur Rarelyst")}&body=${enc(message)}`}>Email</a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href={`sms:?&body=${enc(message)}`}>SMS</a>
      </div>
    </div>
  );
}

// ── Le billet d'invitation, avec les primes qui s'en échappent ──
function Ticket({ code, max, rules }: { code: string; max: number; rules: Rules }) {
  const coins = [
    { v: rules.firstCents, x: 8, d: 0 },
    { v: rules.perInterviewCents, x: 30, d: 1.1 },
    { v: rules.perInterviewCents, x: 74, d: 2.2 },
    { v: rules.perInterviewCents, x: 52, d: 3.3 },
    { v: rules.perInterviewCents, x: 88, d: 4.4 },
  ];
  return (
    <div className={r.stage} aria-hidden="true">
      <div className={r.coins}>
        {coins.map((c, i) => (
          <span key={i} className={r.coin} data-big={i === 0} style={{ left: `${c.x}%`, animationDelay: `${c.d}s` }}>+{Math.round(c.v / 100)} €</span>
        ))}
      </div>
      <div className={r.ticket}>
        <div className={r.ticketTop}><span>Invitation</span><span>Rarelyst</span></div>
        <div className={r.ticketCode}>{code}</div>
        <div className={r.ticketRow}>
          <span><small>Pour vous</small><b>jusqu&apos;à {eur(max)}</b></span>
          {rules.welcomeCents > 0 && <span><small>Pour votre ami</small><b>+{eur(rules.welcomeCents)}</b></span>}
        </div>
        <span className={r.sheen} />
      </div>
      <div className={r.ticketShadow} />
    </div>
  );
}

// ── Frise : un ami, ses entretiens, vos primes ─────────────────
function Track({ rules }: { rules: Rules }) {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || timer) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(rules.maxInterviews - 1); return; }
      let k = -1;
      timer = setInterval(() => {
        k += 1;
        setStep(k);
        if (k >= rules.maxInterviews - 1 && timer) clearInterval(timer);
      }, 380);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
  }, [rules.maxInterviews]);

  const total = perFriend(rules, step + 1);
  return (
    <section ref={ref} className={`${s.card} ${s.sectionGap} ${r.track}`}>
      <div className={s.spread}>
        <div>
          <h2 className={s.h3}>Un ami, {rules.maxInterviews} entretiens</h2>
          <p className={`${s.small} ${s.muted}`} style={{ margin: 0 }}>Chaque entretien qu&apos;il mène vous rapporte, sans rien retirer à ce qu&apos;il touche.</p>
        </div>
        <span className={r.trackTotal}><small>Pour vous</small><b>{eur(total)}</b></span>
      </div>
      <ol className={r.nodes} style={{ ["--n" as string]: rules.maxInterviews }}>
        <span className={r.rail}><i style={{ width: `${step < 0 ? 0 : (step / (rules.maxInterviews - 1)) * 100}%` }} /></span>
        {Array.from({ length: rules.maxInterviews }, (_, k) => (
          <li key={k} data-on={k <= step} data-first={k === 0}>
            <span className={r.node}>{k === 0 ? Math.round(rules.firstCents / 100) : Math.round(rules.perInterviewCents / 100)}</span>
            <small>{k === 0 ? "1er" : `${k + 1}e`}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Simulateur ─────────────────────────────────────────────────
function Simulator({ rules }: { rules: Rules }) {
  const [friends, setFriends] = useState(3);
  const [each, setEach] = useState(4);
  const total = friends * perFriend(rules, each);
  return (
    <section className={`${s.card} ${r.sim}`}>
      <h2 className={s.h3}>Faites le calcul</h2>
      <label className={r.simRow}>
        <span>Amis inscrits qui passent des entretiens <b>{friends}</b></span>
        <input type="range" min={1} max={10} value={friends} onChange={(e) => setFriends(Number(e.target.value))} />
      </label>
      <label className={r.simRow}>
        <span>Entretiens chacun sur l&apos;année <b>{each}</b></span>
        <input type="range" min={1} max={rules.maxInterviews} value={each} onChange={(e) => setEach(Number(e.target.value))} />
      </label>
      <div className={r.simTotal}>
        <small>Vous touchez</small>
        <b key={total}>{eur(total)}</b>
        <small>en plus de vos propres entretiens</small>
      </div>
    </section>
  );
}
