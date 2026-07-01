import Link from "next/link";
import Logo from "@/components/shared/Logo";

// ─── Avatar tiles (placeholders) ────────────────────────────
// Grille de visages du hero. Ce sont des tuiles dégradées avec initiales —
// à remplacer plus tard par de vraies photos de participants vérifiés.
const HERO_AVATARS_LEFT = [
  { i: "A", on: true }, { i: "M", on: false }, { i: "L", on: false },
  { i: "S", on: false }, { i: "C", on: true }, { i: "N", on: false },
  { i: "T", on: false }, { i: "É", on: false }, { i: "R", on: true },
];
const HERO_AVATARS_RIGHT = [
  { i: "J", on: false }, { i: "K", on: true }, { i: "P", on: false },
  { i: "D", on: false }, { i: "F", on: false }, { i: "B", on: true },
  { i: "O", on: false }, { i: "V", on: false }, { i: "G", on: false },
];

const GRADIENTS = [
  "linear-gradient(140deg, #C7B4EC, #8765D7)",
  "linear-gradient(140deg, #E9DEFA, #AA90E1)",
  "linear-gradient(140deg, #B9C0FF, #999BFF)",
  "linear-gradient(140deg, #EBCBF7, #C98BC5)",
];

function AvatarTile({ initial, active, idx }: { initial: string; active: boolean; idx: number }) {
  return (
    <div style={{
      width: "52px", height: "52px",
      borderRadius: "14px",
      background: active ? GRADIENTS[idx % GRADIENTS.length] : "#EDE6F5",
      border: "1px solid rgba(135,101,215,0.10)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px",
      color: active ? "#fff" : "#C4B4D6",
      opacity: active ? 1 : 0.55,
      boxShadow: active ? "0 6px 18px var(--color-glow)" : "none",
    }}>
      {initial}
    </div>
  );
}

function AvatarGrid({ data }: { data: { i: string; on: boolean }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 52px)", gap: "12px" }}>
      {data.map((a, i) => <AvatarTile key={i} initial={a.i} active={a.on} idx={i} />)}
    </div>
  );
}

// Icône ligne dans une tuile arrondie
function IconTile({ children }: { children: React.ReactNode }) {
  return <div className="icon-tile" style={{ marginBottom: "20px" }}>{children}</div>;
}

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* ── Barre d'annonce ── */}
      <div style={{
        background: "linear-gradient(90deg, #EFE6F9, #F3E9FA)",
        borderBottom: "1px solid var(--color-border-base)",
        padding: "9px 40px",
        textAlign: "center",
        fontSize: "13px",
      }}>
        <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>Nouveau</span>
        <span style={{ color: "var(--color-text-secondary)", marginLeft: "8px" }}>
          Recrutez vos premiers participants qualifiés en 72h — 5 crédits offerts
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(247,240,250,0.82)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--color-border-base)",
        padding: "0 40px",
        height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo variant="light" size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <Link href="#how" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Comment ça marche</Link>
          <Link href="#quality" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Nos profils</Link>
          <Link href="/pricing" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Tarifs</Link>
          <Link href="/login" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Connexion</Link>
          <Link href="/signup/brand" className="q-btn q-btn-primary" style={{ fontSize: "13px" }}>
            Démarrer →
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 40px 64px" }}>
        {/* Halo mauve diffus */}
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "1100px", height: "700px",
          background: "radial-gradient(ellipse at center, rgba(170,144,225,0.20) 0%, rgba(153,155,255,0.10) 38%, transparent 68%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "24px" }}>

          {/* Visages gauche */}
          <div className="hero-faces anim-up anim-d1"><AvatarGrid data={HERO_AVATARS_LEFT} /></div>

          {/* Bloc central */}
          <div style={{ textAlign: "center", flex: 1, maxWidth: "620px" }}>
            <div className="anim-pop anim-d1" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 14px", borderRadius: "999px",
              background: "#fff", border: "1px solid var(--color-border-base)",
              marginBottom: "28px", boxShadow: "0 2px 10px var(--color-glow-soft)",
            }}>
              <span style={{ fontSize: "11px" }}>✦</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.04em" }}>
                Panel d'experts mode, luxe & lifestyle
              </span>
            </div>

            <h1 style={{ margin: "0 0 24px", lineHeight: 1.02 }}>
              <span className="anim-up anim-d2 text-gradient-plum" style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(42px, 6vw, 74px)",
                fontStyle: "italic", fontWeight: 400,
                letterSpacing: "-0.035em",
              }}>
                Recrutez les bons profils.
              </span>
              <span className="anim-up anim-d3" style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(42px, 6vw, 74px)",
                fontStyle: "italic", fontWeight: 400,
                letterSpacing: "-0.035em",
                color: "var(--color-plum-deep)",
              }}>
                En 72 heures.
              </span>
            </h1>

            <p className="anim-up anim-d4" style={{
              fontSize: "17px", color: "var(--color-text-secondary)",
              lineHeight: 1.6, maxWidth: "440px", margin: "0 auto 36px",
            }}>
              Des entretiens qualitatifs avec des participants vraiment ciblés — sélectionnés à la main, vérifiés, et prêts à parler de votre marque.
            </p>

            <div className="anim-up anim-d5" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup/brand" className="q-btn q-btn-primary anim-glow" style={{ fontSize: "14px", padding: "13px 28px" }}>
                Créer un compte marque
              </Link>
              <Link href="/signup/participant" className="q-btn" style={{
                fontSize: "14px", padding: "13px 28px",
                background: "#fff", color: "var(--color-plum)",
                border: "1px solid var(--color-border-strong)",
              }}>
                Je suis un participant
              </Link>
            </div>

            <div className="anim-up anim-d6" style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
              {["Profils vérifiés", "Sélection humaine", "Rapport IA inclus"].map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  <span style={{ color: "var(--color-accent)" }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Visages droite */}
          <div className="hero-faces anim-up anim-d1"><AvatarGrid data={HERO_AVATARS_RIGHT} /></div>
        </div>

        {/* Stats */}
        <div className="anim-up anim-d7" style={{ display: "flex", gap: "56px", justifyContent: "center", flexWrap: "wrap", marginTop: "64px" }}>
          {[
            { n: "72h", l: "Délai de recrutement" },
            { n: "100%", l: "Profils vérifiés à la main" },
            { n: "5–8", l: "Participants par étude" },
          ].map((s) => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "30px", fontWeight: 700, color: "var(--color-plum)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>{s.n}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strip secteurs (neutre, pas de faux clients) ── */}
      <section style={{ padding: "12px 40px 56px" }}>
        <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--color-text-tertiary)", marginBottom: "24px" }}>
          Conçu pour les équipes insights des maisons de mode, luxe & lifestyle
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {["Mode", "Luxe", "Beauté", "Lifestyle", "Sport", "Streetwear", "Retail"].map((c) => (
            <span key={c} style={{
              padding: "8px 18px", borderRadius: "999px",
              background: "#fff", border: "1px solid var(--color-border-base)",
              fontSize: "13px", fontWeight: 600, color: "var(--color-plum)",
              boxShadow: "0 2px 8px var(--color-glow-soft)",
            }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BÉNÉFICES
      ════════════════════════════════════════════ */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "48px 40px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ margin: 0, lineHeight: 1.1 }}>
            <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em" }}>Zéro logistique, </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)" }}>zéro friction</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { icon: "⏱", title: "Vos profils en 72h", desc: "N'attendez plus 3 semaines pour valider une intuition avec votre cible." },
            { icon: "✓✓", title: "Vérifiés à la main", desc: "Chaque profil passe un screener qualitatif et une vérification d'identité." },
            { icon: "€", title: "Tout est géré", desc: "Planification, visio, récompenses : Qualio orchestre toute la logistique." },
            { icon: "✦", title: "Rapport IA inclus", desc: "Une synthèse analytique de vos entretiens, générée après chaque étude." },
          ].map((b) => (
            <div key={b.title} className="q-card hover-glow" style={{ padding: "26px 24px" }}>
              <IconTile><span style={{ fontSize: "16px" }}>{b.icon}</span></IconTile>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-plum)", margin: "0 0 8px" }}>{b.title}</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          COMMENT ÇA MARCHE
      ════════════════════════════════════════════ */}
      <section id="how" style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "80px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p className="q-label" style={{ marginBottom: "14px" }}>Comment ça marche</p>
            <h2 style={{ margin: 0, lineHeight: 1.08 }}>
              <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.8vw, 46px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em" }}>3 étapes simples, </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.8vw, 46px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)" }}>des profils immédiats</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { n: "1", title: "Déposez votre brief", desc: "Décrivez votre étude, vos critères de ciblage, le format et la récompense. En moins de 10 minutes." },
              { n: "2", title: "Recevez des profils matchés", desc: "Notre moteur croise vos critères avec des centaines de signaux par profil, puis l'équipe valide chaque match." },
              { n: "3", title: "Conduisez vos entretiens", desc: "Confirmez les profils : la planification, la visio et les récompenses sont automatiques. Rapport IA à la fin." },
            ].map((s) => (
              <div key={s.n} className="q-card hover-glow">
                <div style={{
                  width: "40px", height: "40px", borderRadius: "12px",
                  background: "linear-gradient(140deg, #E9DEFA, #C7B4EC)",
                  border: "1px solid rgba(135,101,215,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono-base)", fontSize: "15px", fontWeight: 700,
                  color: "var(--color-accent)", marginBottom: "20px",
                }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontStyle: "italic", fontWeight: 400, color: "var(--color-plum)", margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          QUALITÉ DES PROFILS
      ════════════════════════════════════════════ */}
      <section id="quality" style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "center" }}>
          <div>
            <p className="q-label" style={{ color: "var(--color-accent)", marginBottom: "16px" }}>✦ Panel vérifié</p>
            <h2 style={{ margin: "0 0 20px", lineHeight: 1.12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)" }}>
                Pas un panel générique.<br /></span>
              <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>
                De vrais insiders.</span>
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 32px" }}>
              Stylistes, buyers, créatifs, early adopters documentés. Chaque profil passe un screener qualitatif, une vérification d'identité, et notre moteur d'analyse lui attribue des centaines de signaux invisibles utilisés pour le matching.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {["Identité vérifiée par l'équipe Qualio", "Screener qualitatif anti-gaming obligatoire", "Scoring IA sur 7 dimensions par profil"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-accent-light)", border: "1px solid var(--color-lavender)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Cartes profils */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { name: "Amina D.", role: "Styliste · Paris", tags: ["quiet-luxury", "styling"], score: 5, g: 0 },
              { name: "Sofia L.", role: "DA · Bordeaux", tags: ["haute-couture", "beauté"], score: 5, g: 3 },
              { name: "Thomas R.", role: "Buyer · Lyon", tags: ["sneakers", "drops"], score: 4, g: 2 },
            ].map((p) => (
              <div key={p.name} className="q-card hover-glow" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: GRADIENTS[p.g], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", color: "#fff" }}>{p.name[0]}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-plum)", marginBottom: "3px" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{p.role}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {p.tags.map((t) => (
                      <span key={t} style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", background: "var(--color-accent-light)", color: "var(--color-accent)" }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{ width: "5px", height: "5px", borderRadius: "50%", background: n <= p.score ? "var(--color-accent)" : "var(--color-border-strong)" }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "center", padding: "10px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
              +47 profils vérifiés — <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>et ça grandit chaque semaine</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          COMPARAISON
      ════════════════════════════════════════════ */}
      <section style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p className="q-label" style={{ marginBottom: "14px" }}>Pourquoi Qualio</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)", margin: 0, lineHeight: 1.1 }}>
              Ce qu'une agence ou un panel<br />classique ne vous donnera pas
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="q-card" style={{ opacity: 0.6, boxShadow: "none" }}>
              <p className="q-label" style={{ marginBottom: "18px", color: "var(--color-error)" }}>Sans Qualio</p>
              {["2–3 semaines pour recevoir des profils", "Profils auto-déclarés, non vérifiés", "Panel générique, pas de niche mode/lifestyle", "Aucun rapport de synthèse", "Logistique de planification manuelle"].map((t) => (
                <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-error)", flexShrink: 0 }}>✗</span>{t}
                </div>
              ))}
            </div>
            <div className="q-card" style={{ border: "1px solid var(--color-lavender)", boxShadow: "0 8px 32px var(--color-glow)" }}>
              <p className="q-label" style={{ marginBottom: "18px", color: "var(--color-accent)" }}>Avec Qualio</p>
              {["Profils confirmés en 72h", "Identité vérifiée + screener qualitatif", "Spécialiste mode, luxe, lifestyle, Gen Z", "Rapport de synthèse IA après chaque étude", "Planification, visio et récompenses automatisées"].map((t) => (
                <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                  <span style={{ color: "var(--color-accent)", flexShrink: 0, fontWeight: 700 }}>✓</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════ */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "88px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p className="q-label" style={{ marginBottom: "14px" }}>Tarifs</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)", margin: "0 0 8px" }}>
            Simple et transparent
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>1 crédit = 1 participant confirmé · Crédits sans expiration</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { name: "Essai gratuit", price: "0€", credits: "5 crédits offerts", feature: "1 étude, sans carte bancaire", highlight: false },
            { name: "Pack M", price: "780€", credits: "12 crédits", feature: "Sans expiration · 65€/participant", highlight: true },
            { name: "Pack L", price: "1 375€", credits: "25 crédits", feature: "Sans expiration · 55€/participant", highlight: false },
          ].map((plan) => (
            <div key={plan.name} className={plan.highlight ? "q-card anim-glow" : "q-card hover-glow"} style={{
              padding: "32px 28px", position: "relative",
              border: plan.highlight ? "1px solid var(--color-lavender)" : undefined,
              background: plan.highlight ? "linear-gradient(160deg, #ffffff, #F6EFFC)" : undefined,
            }}>
              {plan.highlight && (
                <span style={{ position: "absolute", top: "-11px", left: "24px", padding: "3px 12px", background: "var(--color-accent)", color: "#fff", borderRadius: "999px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Populaire</span>
              )}
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: plan.highlight ? "var(--color-accent)" : "var(--color-text-tertiary)", margin: "0 0 16px" }}>{plan.name}</p>
              <div style={{ marginBottom: "24px" }}>
                <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "36px", fontWeight: 700, color: "var(--color-plum)", letterSpacing: "-0.03em" }}>{plan.price}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border-base)", paddingTop: "20px", marginBottom: "24px" }}>
                <div style={{ fontSize: "13px", color: "var(--color-plum)", fontWeight: 600, marginBottom: "6px" }}>{plan.credits}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{plan.feature}</div>
              </div>
              <Link href="/signup/brand" className="q-btn q-btn-primary" style={{ width: "100%", fontSize: "13px" }}>
                Commencer
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 40px", textAlign: "center" }}>
        <div style={{ position: "absolute", bottom: "-40%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "600px", background: "radial-gradient(ellipse at center, rgba(170,144,225,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4.4vw, 56px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--color-plum-deep)", margin: "0 0 20px", lineHeight: 1.0 }}>
            Prêt à recruter autrement ?
          </h2>
          <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: "0 auto 36px", maxWidth: "420px", lineHeight: 1.6 }}>
            Déposez votre premier brief aujourd'hui. Premiers profils sous 48h.
          </p>
          <Link href="/signup/brand" className="q-btn q-btn-primary anim-glow" style={{ fontSize: "14px", padding: "15px 36px" }}>
            Commencer gratuitement →
          </Link>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "14px" }}>5 crédits offerts · Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-border-base)", padding: "28px 40px", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo variant="light" size="sm" />
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/pricing" className="link-sweep" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Tarifs</Link>
            <Link href="/login" className="link-sweep" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Connexion</Link>
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>© 2026 Qualio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
