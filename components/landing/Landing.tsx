import Image from "next/image";
import Link from "next/link";
import { Familjen_Grotesk } from "next/font/google";
import styles from "./landing.module.css";
import SearchConsole from "./SearchConsole";
import HowItWorks from "./HowItWorks";
import { BriefBox, CountUp, HouseSeal, InView, MemberCard, ProofMedals, SampleProfile } from "./Islands";
import { LANE_1, LANE_2, type LaneProfile } from "./content";

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

const faq = (tiers: LandingTier[]) => [
  { q: "Qui mène les entretiens ?", a: "Vous, avec votre guide d'entretien affiché à côté de la visio. Nous recrutons, organisons, enregistrons, transcrivons et rédigeons la synthèse." },
  { q: "Comment savez-vous qu'un profil est réel ?", a: "Chaque profil porte ses preuves : identité, LinkedIn, emploi confirmé par un code sur l'adresse professionnelle, CV, book. L'équipe relit chaque profil avant de vous le proposer." },
  { q: "Combien coûte une étude ?", a: `Le prix de chaque profil retenu, de ${tiers[0].credits} à ${tiers[tiers.length - 1].credits} crédits pour 45 minutes (1 crédit = 10 € HT). Six entretiens avec des clients avertis reviennent à environ ${(Math.round((6 * tiers[0].euros) / 100) * 100).toLocaleString("fr-FR")} € HT, synthèse comprise.` },
  { q: "Et si un participant ne vient pas ?", a: "Vos crédits reviennent automatiquement sur votre compte, et nous vous proposons un autre profil." },
  { q: "Mes projets restent-ils confidentiels ?", a: "Les participants voient votre poinçon de maison vérifiée, pas votre nom, avant l'entretien. Votre brief ne sert jamais à entraîner une IA, et les vidéos ne sont plus accessibles après 90 jours." },
  { q: "En combien de temps ?", a: "Vos premiers profils sous 72 heures. Les participants proposent leurs créneaux, vous en choisissez un : l'entretien peut avoir lieu dans la semaine." },
  { q: "Quels secteurs ?", a: "Mode, luxe, beauté, sneakers, seconde main, lifestyle. En français ou en anglais." },
  { q: "Faut-il s'engager ?", a: "Non. Pas d'abonnement : vous achetez des crédits et ne les dépensez que sur les profils que vous gardez." },
];

export default function Landing({ tiers }: { tiers: LandingTier[] }) {
  const cheapest = tiers[0];
  return (
    <div className={`${styles.page} ${familjen.className}`}>
      <div className={styles.navWrap}>
        <div className={styles.shell}>
          <header className={styles.nav}>
            <Link className={styles.brand} href="/"><Logo />Rarelyst</Link>
            <nav className={styles.navLinks} aria-label="Sections">
              <a href="#comment">Comment ça marche</a>
              <a href="#profils">Profils</a>
              <a href="#tarifs">Tarifs</a>
              <a href="#participer">Participer</a>
              <a href="#questions">Questions</a>
            </nav>
            <div className={styles.navRight}>
              <Link className={styles.login} href="/login">Connexion</Link>
              <Link className={`${styles.btn} ${styles.btnSm}`} href="/signup/brand">
                Demander une étude <span className={styles.arr}>→</span>
              </Link>
            </div>
          </header>
        </div>
      </div>

      <main className={styles.shell}>
        {/* ── Ouverture : la recherche qui tape toute seule ── */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <h1 className={styles.h1}>Qui <span className={styles.nowrap}>voulez<span className={styles.hyphen}>-</span>vous</span> <em>entendre</em>&nbsp;?</h1>
            <div className={styles.heroSide}>
              <p className={styles.speedPill}><b>72 h</b>Vos premiers profils qualifiés</p>
              <p>Stylistes, acheteurs, collectionneurs, vendeuses en boutique. Nous trouvons les personnes précises que votre étude demande, et nous organisons les entretiens.</p>
              <div className={styles.actions}>
                <Link className={styles.btn} href="/signup/brand">Demander une étude pilote <span className={styles.arr}>→</span></Link>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/signup/participant">Rejoindre le panel</Link>
              </div>
            </div>
          </div>
          <SearchConsole />
        </section>

        <div className={styles.lanes} aria-label="Le genre de profils que nous recrutons">
          <Lane items={LANE_1} />
          <Lane items={LANE_2} reverse />
        </div>
        <p className={styles.lanesFoot}>
          <span>Le genre de profils que nous recrutons.</span>
          <span className={styles.legend}><i>◆</i>Rare</span>
          <span className={styles.legend}><i>✦</i>Introuvable</span>
        </p>

        {/* ── Comment ça marche : le film, joué au défilement ── */}
        <section className={styles.sec} id="comment">
          <div className={styles.secHead}>
            <p className={styles.kicker}>Comment ça marche</p>
            <h2 className={`${styles.h2} ${styles.reveal}`}>Du brief à la décision, sans rien organiser.</h2>
            <p className={`${styles.lead} ${styles.reveal}`}>Vous dites qui vous voulez entendre. Nous trouvons les personnes, organisons les visios et vous rendons une synthèse qui répond à vos questions.</p>
          </div>
          <HowItWorks />
        </section>

        {/* ── Les profils : des preuves, pas des cases ── */}
        <section className={styles.sec} id="profils">
          <div className={styles.secHead}>
            <p className={styles.kicker}>Les profils</p>
            <h2 className={`${styles.h2} ${styles.reveal}`}>Un panel vous donne une tranche d&apos;âge. Nous, une personne.</h2>
            <p className={`${styles.lead} ${styles.reveal}`}>Chaque profil arrive avec ses preuves : ce qui a été vérifié, et pourquoi il répond à votre brief.</p>
          </div>
          <div className={styles.versus}>
            <div className={`${styles.vsCard} ${styles.vsGeneric} ${styles.reveal}`}>
              <span className={styles.vsLabel}>Ce qu&apos;on vous livre d&apos;habitude</span>
              <div className={styles.boxes}><span>Femme</span><span>25–35 ans</span><span>CSP+</span><span>Île-de-France</span><span>Intéressée par la mode</span></div>
              <div className={styles.ghost} aria-hidden="true">
                <span className={styles.ghostAv}>?</span>
                <span className={styles.ghostLines}><i /><i /><i /></span>
              </div>
              <p className={styles.verdict}>Cinq cases cochées. Aucune idée de ce que cette personne sait, achète ou pense.</p>
            </div>
            <div className={`${styles.vsCard} ${styles.vsReal} ${styles.reveal}`}>
              <span className={styles.vsLabel}>Ce qu&apos;on vous livre ici</span>
              <SampleProfile />
            </div>
          </div>
          <div className={styles.proofHead}>
            <h3 className={styles.h3}>Ce que prouvent les médailles</h3>
            <p>Un profil ne se déclare pas certifié : il le devient, preuve après preuve. Plus il est prouvé, plus il est demandé.</p>
          </div>
          <ProofMedals />
        </section>

        {/* ── Le livrable : des réponses, pas un compte rendu ── */}
        <section className={styles.sec} id="livrable">
          <div className={styles.deliver}>
            <div>
              <p className={styles.kicker}>Le livrable</p>
              <h2 className={`${styles.h2} ${styles.reveal}`}>Une synthèse qui répond à vos questions.</h2>
              <p className={`${styles.lead} ${styles.reveal}`}>Dans le brief, vous dites ce que l&apos;étude doit trancher. La synthèse y répond, avec le nombre de personnes qui vont dans ce sens et leurs mots exacts.</p>
              <ul className={styles.included}>
                {[
                  [I.video, "La vidéo de chaque entretien", "Disponible à la fin de l'appel."],
                  [I.text, "La transcription horodatée", "Pour retrouver une phrase en un instant."],
                  [I.doc, "La synthèse de l'étude", "Réponses, enseignements, profils types."],
                  [I.quote, "Les verbatims classés", "Par thème et par tonalité."],
                  [I.pdf, "L'export PDF", "Prêt pour votre comité."],
                ].map(([d, t, s]) => (
                  <li key={t} className={styles.reveal}><span className={styles.incIcon}><Icon d={d} /></span><span><b>{t}</b>{s}</span></li>
                ))}
              </ul>
            </div>
            <InView className={styles.answers}>
              <span className={styles.answersKicker}>Synthèse · Maroquinerie en cuir recyclé</span>
              {[
                { q: "Faut-il lancer en trois ou cinq coloris ?", a: "Trois. Le noir porte les ventes ; les coloris en plus finiraient soldés.", n: 5, v: "Trois coloris, pas cinq : le noir partira.", who: "Acheteuse luxe, 34 ans" },
                { q: "Faut-il écrire « recyclé » sur l'étiquette ?", a: "Pas en premier. Le mot rassure l'acheteuse de seconde main, pas la cliente du neuf.", n: 4, v: "Si c'est écrit recyclé, je pense seconde main.", who: "Vendeuse en boutique, 8 ans" },
              ].map((x, i) => (
                <article key={x.q} className={styles.answer} style={{ ["--i" as string]: i }}>
                  <b className={styles.answerQ}>{x.q}</b>
                  <p>{x.a}</p>
                  <div className={styles.support}>
                    <span className={styles.supportDots}>{Array.from({ length: 6 }, (_, k) => <i key={k} data-on={k < x.n} />)}</span>
                    <span>{x.n} entretiens sur 6</span>
                  </div>
                  <blockquote>« {x.v} »<cite>{x.who}</cite></blockquote>
                </article>
              ))}
            </InView>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section className={styles.sec} id="tarifs">
          <div className={styles.secHead}>
            <p className={styles.kicker}>Tarifs</p>
            <h2 className={`${styles.h2} ${styles.reveal}`}>Vous payez un profil. Pas un abonnement.</h2>
            <p className={`${styles.lead} ${styles.reveal}`}>Un client averti ne coûte pas ce que coûte une ancienne acheteuse de grand magasin. Le prix de chaque profil s&apos;affiche avant que vous le gardiez.</p>
          </div>
          <InView className={styles.tiers}>
            {tiers.map((t, i) => (
              <article key={t.id} className={styles.tier} data-tier={t.id} style={{ ["--i" as string]: i }}>
                <span className={styles.tierLabel}>{t.id === "rare" ? "◆ " : ""}{t.label}</span>
                <p className={styles.tierWho}>{t.who}</p>
                <div className={styles.tierPrice}><b><CountUp to={t.credits} /></b><span>crédits</span></div>
                <p className={styles.tierEuros}>soit {t.euros.toLocaleString("fr-FR")} € HT l&apos;entretien de 45 min</p>
                <ul>
                  <li>Profil vérifié et relu par l&apos;équipe</li>
                  <li>Visio enregistrée et transcrite</li>
                  <li>Synthèse de l&apos;étude comprise</li>
                </ul>
              </article>
            ))}
          </InView>
          <ul className={styles.guarantees}>
            {[
              [I.card, "Rien n'est débité avant que vous gardiez un profil."],
              [I.back, "Participant absent : vos crédits reviennent tout seuls."],
              [I.check, "Un profil qui ne vous convient pas ? Vous le déclinez, sans frais."],
            ].map(([d, t]) => <li key={t} className={styles.reveal}><Icon d={d} />{t}</li>)}
          </ul>
          <div className={styles.tierCta}>
            <Link className={styles.btn} href="/signup/brand">Demander une étude pilote <span className={styles.arr}>→</span></Link>
            <Link className={styles.textLink} href="/pricing">Tous les tarifs et les packs de crédits</Link>
          </div>
        </section>

        {/* ── Confidentialité ── */}
        <section className={styles.sec} id="confidentialite">
          <div className={styles.privacy}>
            <HouseSeal />
            <div>
              <p className={styles.kicker}>Confidentialité</p>
              <h2 className={`${styles.h2} ${styles.reveal}`}>Vos projets restent entre vous et nous.</h2>
              <ul className={styles.privList}>
                <li className={styles.reveal}><Icon d={I.eye} /><span><b>Anonyme jusqu&apos;à l&apos;entretien.</b> Les participants voient le poinçon d&apos;une maison vérifiée, pas votre nom.</span></li>
                <li className={styles.reveal}><Icon d={I.lock} /><span><b>Votre brief n&apos;entraîne aucune IA.</b> Le service que nous utilisons l&apos;exclut par contrat.</span></li>
                <li className={styles.reveal}><Icon d={I.clock} /><span><b>90 jours, puis plus rien.</b> Les vidéos ne sont plus accessibles après ce délai.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Participants ── */}
        <section className={styles.sec} id="participer">
          <div className={styles.people}>
            <div>
              <p className={styles.kicker}>Pour les participants</p>
              <h2 className={`${styles.h2} ${styles.reveal}`}>Votre œil vaut quelque chose.</h2>
              <p className={`${styles.lead} ${styles.reveal}`}>Styliste, acheteuse, vendeuse en boutique, collectionneur : les marques vous paient pour votre regard, avant leurs lancements. Plus votre profil est prouvé et bien noté, mieux vous êtes payé.</p>
              <div className={styles.peopleFigures}>
                <div><b>{Math.round(cheapest.pay / 100)} à {Math.round(tiers[tiers.length - 1].pay / 100)} €</b><span>par entretien de 45 min</span></div>
                <div><b>48 h</b><span>pour être payé</span></div>
                <div><b>50 €</b><span>par ami qui fait son premier entretien</span></div>
              </div>
              <Link className={styles.btn} href="/signup/participant">Rejoindre le panel <span className={styles.arr}>→</span></Link>
            </div>
            <MemberCard />
          </div>
        </section>

        {/* ── Questions ── */}
        <section className={styles.sec} id="questions">
          <div className={styles.secHead}>
            <p className={styles.kicker}>Questions</p>
            <h2 className={`${styles.h2} ${styles.reveal}`}>Ce qu&apos;on nous demande.</h2>
          </div>
          <div className={styles.faq}>
            {faq(tiers).map((f) => (
              <details key={f.q} className={styles.reveal}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footTop}>
            <div>
              <h2 className={styles.h2}>Dites-nous qui vous voulez entendre.</h2>
              <p className={styles.footLead}>Quelques phrases suffisent. Vous créez votre compte, votre brief vous attend, et vos premiers profils arrivent sous 72 heures.</p>
            </div>
            <BriefBox />
          </div>
          <div className={styles.footBottom}>
            <span className={styles.brand}><Logo size={24} />Rarelyst</span>
            <nav><Link href="/pricing">Tarifs</Link><Link href="/login">Connexion</Link><a href="mailto:contact@rarelyst.co">Contact</a><Link href="/confidentialite">Confidentialité</Link><Link href="/conditions">Conditions</Link><Link href="/mentions-legales">Mentions légales</Link></nav>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
