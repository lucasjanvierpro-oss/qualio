import Image from "next/image";
import Link from "next/link";
import { Familjen_Grotesk } from "next/font/google";
import type { Lang } from "@/lib/i18n/detect";
import LangSwitch from "@/components/i18n/LangSwitch";
import styles from "./landing.module.css";
import SearchConsole from "./SearchConsole";
import HowItWorks from "./HowItWorks";
import { BriefBox, CountUp, HouseSeal, InView, MemberCard, ProofMedals, SampleProfile } from "./Islands";
import { Announce, DemoForm, Loupe, ScrollReveal } from "./Extras";
import { Flag, LANG_FLAGS } from "./Flags";
import { CONTENT, TRUSTED, type LaneProfile } from "./content";
import { LANDING_COPY } from "./copy";

const familjen = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export type LandingTier = { id: string; label: string; who: string; credits: number; euros: number; pay: number };

function Logo({ size = 30 }: { size?: number }) {
  return <Image className={styles.brandLogo} src="/brand/logo.png" alt="" width={size} height={size} priority />;
}

function Lane({ items, reverse }: { items: LaneProfile[]; reverse?: boolean }) {
  // Liste doublée : l'animation glisse de la moitié, la boucle est invisible.
  const loop = [...items, ...items];
  return (
    <div className={`${styles.lane} ${reverse ? styles.laneRev : ""}`}>
      {loop.map((p, i) => (
        <span
          key={`${p.label}-${i}`}
          aria-hidden={i >= items.length}
          className={`${styles.laneItem} ${p.rarity === "rare" ? styles.laneRare : ""} ${p.rarity === "introuvable" ? styles.laneIntrouvable : ""}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

/** Titre en deux temps : la partie avant « | » en dégradé, la suite en encre. */
function Title({ text, className }: { text: string; className: string }) {
  const [a, b] = text.split("|");
  return (
    <h2 className={className}>
      {b === undefined ? a : <><span className={styles.h2a}>{a}</span> <span className={styles.h2b}>{b}</span></>}
    </h2>
  );
}

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

const I = {
  video: "M3 6.5h12.5v11H3z M15.5 10.5l5-3v9l-5-3",
  text: "M6 3h9l3 3v15H6z M15 3v3h3 M9 11h6 M9 14h6 M9 17h4",
  doc: "M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5",
  quote: "M7 7h4v4c0 3-1.5 5-4 6 M14 7h4v4c0 3-1.5 5-4 6",
  pdf: "M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4",
  lock: "M6 11h12v10H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  eye: "M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z",
  clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M12 7v5.2l3.4 2",
  card: "M3 6h18v12H3z M3 10h18 M7 15h4",
  back: "M9 14l-4-4 4-4 M5 10h9a5 5 0 0 1 0 10h-3",
  check: "M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z M8.6 12.2l2.4 2.4 4.6-4.9",
};

const INCLUDED_ICONS = [I.video, I.text, I.doc, I.quote, I.pdf];
const GUARANTEE_ICONS = [I.card, I.back, I.check];
const PRIVACY_ICONS = [I.eye, I.lock, I.clock];

export default function Landing({ tiers, lang = "fr" }: { tiers: LandingTier[]; lang?: Lang }) {
  const c = LANDING_COPY[lang];
  const content = CONTENT[lang];
  const cheapest = tiers[0];
  const priciest = tiers[tiers.length - 1];
  const tierName = (t: LandingTier) => c.pricing.tierText?.[t.id] ?? { label: t.label, who: t.who };
  const home = lang === "en" ? "/en" : "/";
  return (
    <div className={`${styles.page} ${familjen.className}`} lang={lang}>
      <Announce lang={lang} />
      <div className={styles.navWrap}>
        <div className={styles.shell}>
          <header className={styles.nav}>
            <Link className={styles.brand} href={home}><Logo />Rarelyst</Link>
            <nav className={styles.navLinks} aria-label="Sections">
              <a href="#comment">{c.nav.how}</a>
              <a href="#profils">{c.nav.profiles}</a>
              <a href="#tarifs">{c.nav.pricing}</a>
              <a href="#participer">{c.nav.join}</a>
              <a href="#questions">{c.nav.faq}</a>
            </nav>
            <div className={styles.navRight}>
              <LangSwitch lang={lang} hrefs={{ fr: "/", en: "/en" }} />
              <Link className={styles.login} href="/login">{c.nav.login}</Link>
              <a className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm} ${styles.navDemo}`} href="#demo">{c.demoNav}</a>
              <Link className={`${styles.btn} ${styles.btnSm} ${styles.navCta}`} href="/signup/brand">
                <span className={styles.ctaLong}>{c.nav.cta}</span><span className={styles.ctaShort}>{c.nav.ctaShort}</span> <span className={styles.arr}>→</span>
              </Link>
            </div>
          </header>
        </div>
      </div>

      <main className={styles.shell}>
        {/* ── Ouverture : la recherche qui tape toute seule ── */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {lang === "fr" ? (
              // Le nom de la marque dans le titre principal, lu par Google et les lecteurs d'écran, sans changer l'affichage.
              <h1 className={styles.h1}><span className="rl-sr-only">Rarelyst : </span>Qui <span className={styles.nowrap}>voulez<span className={styles.hyphen}>-</span>vous</span> <em>entendre</em>&nbsp;?</h1>
            ) : (
              <h1 className={styles.h1}><span className="rl-sr-only">Rarelyst: </span>Who do you want to <em>hear from</em>?</h1>
            )}
            <div className={styles.heroSide}>
              <p className={styles.speedPill}><b>{c.hero.pillValue}</b>{c.hero.pill}</p>
              <p>{c.hero.text}</p>
              <div className={styles.actions}>
                <Link className={styles.btn} href="/signup/brand">{c.hero.cta} <span className={styles.arr}>→</span></Link>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/signup/participant">{c.hero.join}</Link>
              </div>
            </div>
          </div>
          <SearchConsole lang={lang} />
        </section>

        <div className={styles.lanes} aria-label={c.lanes.aria}>
          <Lane items={content.lane1} />
          <Lane items={content.lane2} reverse />
        </div>
        <p className={styles.lanesFoot}>
          <span>{c.lanes.foot}</span>
          <span className={styles.legend}><i>◆</i>{c.lanes.rare}</span>
          <span className={styles.legend}><i>✦</i>{c.lanes.unfindable}</span>
        </p>

        {TRUSTED.length > 0 && (
          <section className={styles.trust} aria-label={c.trust}>
            <p>{c.trust}</p>
            <div className={styles.trustRow}>
              {TRUSTED.map((b) => <Image key={b.name} src={b.logo} alt={b.name} width={b.width} height={b.height} />)}
            </div>
          </section>
        )}

        {/* ── Comment ça marche : le film, joué au défilement ── */}
        <section className={styles.sec} id="comment">
          <div className={styles.secHead}>
            <p className={styles.kicker}>{c.how.kicker}</p>
            <Title className={`${styles.h2} ${styles.reveal}`} text={c.how.h2} />
            <p className={`${styles.lead} ${styles.reveal}`}>{c.how.lead}</p>
          </div>
          <HowItWorks lang={lang} />
        </section>

        {/* ── Les profils : des preuves, pas des cases ── */}
        <section className={styles.sec} id="profils">
          <div className={styles.secHead}>
            <p className={styles.kicker}>{c.profiles.kicker}</p>
            <Title className={`${styles.h2} ${styles.reveal}`} text={c.profiles.h2} />
            <p className={`${styles.lead} ${styles.reveal}`}>{c.profiles.lead}</p>
          </div>
          <div className={styles.versus}>
            <div className={`${styles.vsCard} ${styles.vsGeneric} ${styles.reveal}`}>
              <span className={styles.vsLabel}>{c.profiles.usual}</span>
              <div className={styles.boxes}>{c.profiles.boxes.map((b) => <span key={b}>{b}</span>)}</div>
              <div className={styles.ghost} aria-hidden="true">
                <span className={styles.ghostAv}>?</span>
                <span className={styles.ghostLines}><i /><i /><i /></span>
              </div>
              <p className={styles.verdict}>{c.profiles.verdict}</p>
            </div>
            <div className={`${styles.vsCard} ${styles.vsReal} ${styles.reveal}`}>
              <span className={styles.vsLabel}>{c.profiles.here}</span>
              <SampleProfile lang={lang} />
            </div>
          </div>
          <div className={styles.proofHead}>
            <h3 className={styles.h3}>{c.profiles.proofsTitle}</h3>
            <p>{c.profiles.proofsLead}</p>
          </div>
          <ProofMedals lang={lang} />
        </section>

        {/* ── Le livrable : des réponses, pas un compte rendu ── */}
        <section className={styles.sec} id="livrable">
          <div className={styles.deliver}>
            <div>
              <p className={styles.kicker}>{c.deliver.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.deliver.h2} />
              <p className={`${styles.lead} ${styles.reveal}`}>{c.deliver.lead}</p>
              <ul className={styles.included}>
                {c.deliver.included.map(([t, sub], i) => (
                  <li key={t} className={styles.reveal}><span className={styles.incIcon}><Icon d={INCLUDED_ICONS[i]} /></span><span><b>{t}</b>{sub}</span></li>
                ))}
              </ul>
            </div>
            <InView className={styles.answers}>
              <span className={styles.answersKicker}>{c.deliver.kickerDoc}</span>
              {c.deliver.answers.map((x, i) => (
                <article key={x.q} className={styles.answer} style={{ ["--i" as string]: i }}>
                  <b className={styles.answerQ}>{x.q}</b>
                  <p>{x.a}</p>
                  <div className={styles.support}>
                    <span className={styles.supportDots}>{Array.from({ length: 6 }, (_, k) => <i key={k} data-on={k < x.n} />)}</span>
                    <span>{c.deliver.support(x.n)}</span>
                  </div>
                  <blockquote>{c.deliver.quote(x.v)}<cite>{x.who}</cite></blockquote>
                </article>
              ))}
            </InView>
          </div>
        </section>

        {/* ── Avant, après ── */}
        <section className={styles.sec} id="avec">
          <div className={styles.secHead}>
            <p className={styles.kicker}>{c.compare.kicker}</p>
            <Title className={`${styles.h2} ${styles.reveal}`} text={c.compare.h2} />
            <p className={`${styles.lead} ${styles.reveal}`}>{c.compare.lead}</p>
          </div>
          <div className={styles.compare}>
            <div className={styles.cmpHead} aria-hidden="true">
              <span />
              <span>{c.compare.without}</span>
              <span className={styles.cmpWithHead}><Logo size={20} />{c.compare.with}</span>
            </div>
            {c.compare.rows.map(([k, no, yes]) => (
              <div key={k} className={`${styles.cmpRow} ${styles.reveal}`}>
                <span className={styles.cmpKey}>{k}</span>
                <span className={styles.cmpNo}><i aria-hidden="true">✕</i><span><small>{c.compare.without} · </small>{no}</span></span>
                <span className={styles.cmpYes}><i aria-hidden="true">✓</i><span><small>{c.compare.with} · </small>{yes}</span></span>
              </div>
            ))}
          </div>
          <div className={styles.tierCta}>
            <Link className={styles.btn} href="/signup/brand">{c.compare.cta} <span className={styles.arr}>→</span></Link>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section className={styles.sec} id="tarifs">
          <div className={styles.secHead}>
            <p className={styles.kicker}>{c.pricing.kicker}</p>
            <Title className={`${styles.h2} ${styles.reveal}`} text={c.pricing.h2} />
            <p className={`${styles.lead} ${styles.reveal}`}>{c.pricing.lead}</p>
          </div>
          <InView className={styles.tiers}>
            {tiers.map((t, i) => (
              <article key={t.id} className={styles.tier} data-tier={t.id} style={{ ["--i" as string]: i }}>
                <span className={styles.tierLabel}>{t.id === "rare" ? "◆ " : ""}{tierName(t).label}</span>
                <p className={styles.tierWho}>{tierName(t).who}</p>
                <div className={styles.tierPrice}><b><CountUp to={t.credits} locale={c.locale} /></b><span>{c.pricing.credits}</span></div>
                <p className={styles.tierEuros}>{c.pricing.euros(t.euros.toLocaleString(c.locale))}</p>
                <ul>{c.pricing.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </article>
            ))}
          </InView>
          <ul className={styles.guarantees}>
            {c.pricing.guarantees.map((g, i) => <li key={g} className={styles.reveal}><Icon d={GUARANTEE_ICONS[i]} />{g}</li>)}
          </ul>
          <div className={styles.tierCta}>
            <Link className={styles.btn} href="/signup/brand">{c.pricing.cta} <span className={styles.arr}>→</span></Link>
            <Link className={styles.textLink} href="/pricing">{c.pricing.all}</Link>
          </div>
        </section>

        {/* ── Confidentialité ── */}
        <section className={styles.sec} id="confidentialite">
          <div className={styles.privacy}>
            <HouseSeal lang={lang} />
            <div>
              <p className={styles.kicker}>{c.privacy.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.privacy.h2} />
              <ul className={styles.privList}>
                {c.privacy.items.map(([b, t], i) => <li key={b} className={styles.reveal}><Icon d={PRIVACY_ICONS[i]} /><span><b>{b}</b> {t}</span></li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Langues ── */}
        <section className={styles.sec} id="langues">
          <div className={styles.langs}>
            <div>
              <p className={styles.kicker}>{c.langs.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.langs.h2} />
              <p className={`${styles.lead} ${styles.reveal}`}>{c.langs.lead}</p>
              <p className={`${styles.langAsk} ${styles.reveal}`}>{c.langs.ask} <a href="mailto:contact@rarelyst.co">contact@rarelyst.co</a></p>
            </div>
            <ul className={styles.flags}>
              {LANG_FLAGS.map(({ code, live }) => (
                <li key={code} className={styles.reveal} data-live={live}>
                  <Flag code={code} size={46} />
                  <b>{c.langs.names[code]}</b>
                  <span>{live ? c.langs.live : c.langs.soon}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Participants ── */}
        <section className={styles.sec} id="participer">
          <div className={styles.people}>
            <div>
              <p className={styles.kicker}>{c.people.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.people.h2} />
              <p className={`${styles.lead} ${styles.reveal}`}>{c.people.lead}</p>
              <div className={styles.peopleFigures}>
                <div><b>{c.people.pay(Math.round(cheapest.pay / 100), Math.round(priciest.pay / 100))}</b><span>{c.people.payLabel}</span></div>
                <div><b>{c.people.paid}</b><span>{c.people.paidLabel}</span></div>
                <div><b>{c.people.ref}</b><span>{c.people.refLabel}</span></div>
              </div>
              <Link className={styles.btn} href="/signup/participant">{c.people.cta} <span className={styles.arr}>→</span></Link>
            </div>
            <MemberCard lang={lang} />
          </div>
        </section>

        {/* ── Démo ── */}
        <section className={styles.sec} id="demo">
          <div className={styles.demo}>
            <div>
              <p className={styles.kicker}>{c.demo.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.demo.h2} />
              <p className={`${styles.lead} ${styles.reveal}`}>{c.demo.lead}</p>
              <ul className={styles.demoPoints}>
                {c.demo.points.map((p) => <li key={p} className={styles.reveal}><Icon d={I.check} />{p}</li>)}
              </ul>
            </div>
            <DemoForm lang={lang} />
          </div>
        </section>

        {/* ── Questions ── */}
        <section className={styles.sec} id="questions">
          <div className={styles.faqWrap}>
            <aside className={styles.faqAside}>
              <p className={styles.kicker}>{c.faqTitle.kicker}</p>
              <Title className={`${styles.h2} ${styles.reveal}`} text={c.faqTitle.h2} />
              <div className={`${styles.faqCard} ${styles.reveal}`}>
                <b>{c.faqAside.title}</b>
                <p>{c.faqAside.text}</p>
                <a className={styles.textLink} href="mailto:contact@rarelyst.co">contact@rarelyst.co</a>
                <a className={`${styles.btn} ${styles.btnSm}`} href="#demo">{c.faqAside.demo} <span className={styles.arr}>→</span></a>
              </div>
            </aside>
            <div className={styles.faq}>
              {c.faq(tiers).map((f, i) => (
                <details key={f.q} className={styles.reveal}>
                  <summary><span className={styles.faqNum}>{String(i + 1).padStart(2, "0")}</span><span>{f.q}</span></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer} id="fin">
        <div className={styles.shell}>
          <div className={styles.footTop}>
            <div>
              <h2 className={styles.h2}>{c.footer.h2}</h2>
              <p className={styles.footLead}>{c.footer.lead}</p>
            </div>
            <BriefBox lang={lang} />
          </div>
          <div className={styles.footBottom}>
            <span className={styles.brand}><Logo size={24} />Rarelyst</span>
            <nav>
              <Link href="/pricing">{c.footer.links.pricing}</Link>
              <Link href={lang === "en" ? "/en/guides" : "/guides"}>Guides</Link>
              <Link href="/login">{c.footer.links.login}</Link>
              <a href="mailto:contact@rarelyst.co">{c.footer.links.contact}</a>
              <Link href={lang === "en" ? "/en/about" : "/a-propos"}>{c.footer.links.about}</Link>
              <Link href={lang === "en" ? "/en/consumer-insights" : "/consumer-insights"}>Consumer insights</Link>
              <Link href="/garanties">{c.footer.links.guarantees}</Link>
              <Link href="/confidentialite">{c.footer.links.privacy}</Link>
              <Link href="/conditions">{c.footer.links.terms}</Link>
              <Link href="/mentions-legales">{c.footer.links.legal}</Link>
              <a href="https://www.linkedin.com/company/rarelyst" rel="me noopener" target="_blank">LinkedIn</a>
            </nav>
            <LangSwitch lang={lang} hrefs={{ fr: "/", en: "/en" }} tone="dark" />
          </div>
        </div>
      </footer>
      <Loupe lang={lang} />
      <ScrollReveal selector={`.${styles.reveal}`} />
    </div>
  );
}
