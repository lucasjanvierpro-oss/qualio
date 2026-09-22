import Image from "next/image";
import Link from "next/link";
import { Familjen_Grotesk } from "next/font/google";
import styles from "./landing.module.css";
import SearchConsole from "./SearchConsole";
import { LANE_1, LANE_2, type LaneProfile } from "./content";

const familjen = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

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

export default function Landing() {
  return (
    <div className={`${styles.page} ${familjen.className}`}>
      <div className={styles.navWrap}>
        <div className={styles.shell}>
          <header className={styles.nav}>
            <Link className={styles.brand} href="/"><Logo />Rarelyst</Link>
            <nav className={styles.navLinks} aria-label="Sections">
              <a href="#vitesse">Vitesse</a>
              <a href="#precision">Précision</a>
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
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <h1 className={styles.h1}>Qui <span className={styles.nowrap}>voulez<span className={styles.hyphen}>-</span>vous</span> <em>entendre</em>&nbsp;?</h1>
            <div className={styles.heroSide}>
              <p className={styles.speedPill}><b>72 h</b>Vos premiers profils qualifiés</p>
              <p>Stylistes, acheteurs, collectionneurs, journalistes mode. Nous trouvons les personnes précises que votre étude demande, et nous organisons les entretiens.</p>
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

        <section className={styles.sec} id="vitesse">
          <div className={styles.speed}>
            <div className={styles.reveal}>
              <p className={styles.kicker}>Vitesse</p>
              <h2 className={styles.h2}>Votre étude démarre cette semaine.</h2>
              <p className={styles.lead}>Un recrutement qualitatif prend souvent deux à trois semaines. Nous nous engageons à vous présenter les premiers profils sous 72 heures.</p>
              <div className={styles.bars}>
                <div>
                  <div className={styles.barTop}><b>Recrutement habituel</b><span>2 à 3 semaines</span></div>
                  <div className={`${styles.track} ${styles.trackSlow}`}><i /></div>
                </div>
                <div>
                  <div className={styles.barTop}><b>Rarelyst</b><strong>72 h</strong></div>
                  <div className={`${styles.track} ${styles.trackFast}`}><i /></div>
                </div>
              </div>
            </div>
            <div className={`${styles.week} ${styles.reveal}`} aria-label="Exemple de semaine">
              <div className={styles.weekHead}><span>Une semaine type</span><span>brief envoyé le lundi</span></div>
              <div className={styles.day}><span className={styles.dayName}>Lundi<small>10 h</small></span><span className={styles.dayWhat}>Vous envoyez votre brief<small>Qui vous voulez entendre, en quelques phrases.</small></span></div>
              <div className={styles.day}><span className={styles.dayName}>Mardi<small>soir</small></span><span className={styles.dayWhat}>Premiers profils proposés<small>Chacun avec la raison de sa présence.</small></span></div>
              <div className={styles.day}><span className={styles.dayName}>Mercredi</span><span className={styles.dayWhat}>Vous gardez qui vous voulez<small>On planifie les créneaux et les visios.</small></span></div>
              <div className={styles.day}><span className={styles.dayName}>Jeudi<small>10 h</small></span><span className={styles.dayWhat}>Premier entretien<br /><span className={styles.stamp}>72 h après le brief</span></span></div>
            </div>
          </div>
        </section>

        <section className={styles.sec} id="precision">
          <div className={styles.reveal}>
            <p className={styles.kicker}>Précision</p>
            <h2 className={styles.h2}>Un panel vous donne une tranche d&apos;âge. Nous, une personne.</h2>
            <p className={styles.lead}>Chaque candidat répond à des questions ouvertes sur son rapport à la mode. On ne retient que ceux qui en parlent avec précision.</p>
          </div>
          <div className={styles.versus}>
            <div className={`${styles.vsCard} ${styles.vsGeneric} ${styles.reveal}`}>
              <span className={styles.vsLabel}>Ce qu&apos;on vous livre d&apos;habitude</span>
              <div className={styles.boxes}><span>Femme</span><span>25–35 ans</span><span>CSP+</span><span>Île-de-France</span><span>Intéressée par la mode</span></div>
              <p className={styles.verdict}>Cinq cases cochées. Aucune idée de ce que cette personne sait, achète ou pense.</p>
            </div>
            <div className={`${styles.vsCard} ${styles.vsReal} ${styles.reveal}`}>
              <span className={styles.vsLabel}>Ce qu&apos;on vous livre ici</span>
              <div className={styles.person}>
                <span className={styles.personAv}>A</span>
                <span>
                  <b>Amina D. <span className={`${styles.tag} ${styles.tagRare}`}>◆ Rare</span></b>
                  <span>Styliste indépendante · Paris · 30 ans</span>
                </span>
              </div>
              <ul className={styles.facts}>
                <li>Ancienne assistante styliste dans une maison parisienne, installée à son compte depuis 2022.</li>
                <li>Achète peu, et seulement après avoir essayé. Lemaire, Céline, Loewe.</li>
                <li>Sait décrire une coupe, une matière, une finition avec des mots justes.</li>
              </ul>
              <p className={styles.quote}>« Je préfère une pièce de coupe irréprochable tous les six mois qu&apos;un renouvellement permanent. »</p>
            </div>
          </div>
          <div className={styles.criteria}>
            <div className={`${styles.crit} ${styles.reveal}`}><h3>Ils en parlent juste</h3><p>Le vocabulaire d&apos;une coupe, d&apos;une matière, d&apos;un prix. Pas des adjectifs vagues.</p></div>
            <div className={`${styles.crit} ${styles.reveal}`}><h3>Ils achètent vraiment</h3><p>Des achats récents, datés, chiffrés. Pas une passion déclarée sans preuve.</p></div>
            <div className={`${styles.crit} ${styles.reveal}`}><h3>Ils voient avant</h3><p>Une tendance ou une marque repérée avant tout le monde, avec les circonstances.</p></div>
          </div>
        </section>

        <section className={styles.sec} id="pilote">
          <div className={styles.split}>
            <div className={`${styles.card} ${styles.cardBrand} ${styles.reveal}`}>
              <p className={styles.kicker}>Pour les marques</p>
              <h3>Commencez par une étude pilote.</h3>
              <p>Une question réelle, de 4 à 8 entretiens, recrutés à la main. Vous jugez la qualité des profils avant d&apos;aller plus loin.</p>
              <Link className={`${styles.btn} ${styles.btnLight}`} href="/signup/brand">Demander une étude pilote <span className={styles.arr}>→</span></Link>
              <div className={styles.figures}>
                <div><b>72 h</b><span>premiers profils</span></div>
                <div><b>4 à 8</b><span>entretiens</span></div>
                <div><b>Sur devis</b><span>tarif pilote</span></div>
              </div>
            </div>
            <div className={`${styles.card} ${styles.cardPeople} ${styles.reveal}`} id="participer">
              <p className={styles.kicker}>Pour les participants</p>
              <h3>Votre œil vaut quelque chose.</h3>
              <p>Styliste, acheteur, collectionneur, passionné averti : donnez votre avis aux marques avant leurs lancements, et soyez payé pour le faire. Plus votre profil est rare, plus il est demandé.</p>
              <Link className={styles.btn} href="/signup/participant">Rejoindre le panel <span className={styles.arr}>→</span></Link>
              <div className={styles.figures}>
                <div><b>50–150 €</b><span>par entretien</span></div>
                <div><b>45 min</b><span>en visio</span></div>
                <div><b>Vos univers</b><span>seulement</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sec} id="questions">
          <div className={styles.reveal}><p className={styles.kicker}>Questions</p><h2 className={styles.h2}>Ce qu&apos;on nous demande.</h2></div>
          <div className={`${styles.faq} ${styles.reveal}`}>
            <div><h4>Qui mène les entretiens ?</h4><p>Vous. Nous recrutons et organisons, vous posez vos questions comme vous l&apos;entendez.</p></div>
            <div><h4>Comment tenez-vous 72 heures ?</h4><p>Les candidats sont qualifiés avant votre brief, pas après. Quand vous arrivez, il ne reste qu&apos;à choisir parmi eux.</p></div>
            <div><h4>Que veut dire « rare » ?</h4><p>Un profil difficile à trouver ailleurs : un métier de l&apos;industrie, une expertise pointue, une pratique vérifiée. Ce sont les voix les plus demandées.</p></div>
            <div><h4>Quels secteurs ?</h4><p>Mode, luxe, beauté, sneakers, seconde main, lifestyle.</p></div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footTop}>
            <h2 className={styles.h2}>Dites-nous qui vous voulez entendre.</h2>
            <Link className={`${styles.btn} ${styles.btnLight}`} href="/signup/brand">Demander une étude pilote <span className={styles.arr}>→</span></Link>
          </div>
          <div className={styles.footBottom}>
            <span className={styles.brand}><Logo size={24} />Rarelyst</span>
            <nav><Link href="/login">Connexion</Link><a href="mailto:contact@rarelyst.co">Contact</a></nav>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
