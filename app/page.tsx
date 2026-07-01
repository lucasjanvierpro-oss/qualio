import Link from "next/link";
import Logo from "@/components/shared/Logo";

// Tags du marquee — vitrine du système de matching
const MARQUEE_TAGS = [
  "styliste", "gen-z", "quiet-luxury", "sneakers", "early-adopter", "buyer",
  "vintage", "seconde-main", "streetwear", "haute-couture", "menswear",
  "createur-contenu", "paris", "beaute", "drops", "collectionneur",
  "journaliste-mode", "resale", "tennis-core", "avant-garde", "micro-influence",
];

// Carte participant flottante (hero)
function PastilleCard({
  name, role, city, tags, score, style,
}: {
  name: string; role: string; city: string; tags: string[]; score: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.055)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "14px",
      padding: "16px 18px",
      width: "205px",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: "linear-gradient(135deg, #1B3D2A 0%, #C8F169 160%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: "16px", color: "#fff", flexShrink: 0,
        }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#F0EDE8" }}>{name}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{role}</div>
        </div>
      </div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>{city}</div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
        {tags.map((t) => (
          <span key={t} style={{
            fontSize: "9px", fontWeight: 700,
            padding: "2px 7px",
            border: "1px solid rgba(200,241,105,0.35)",
            borderRadius: "999px",
            color: "var(--color-lime)",
            letterSpacing: "0.03em",
          }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {[1,2,3,4,5].map((n) => (
          <div key={n} style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: n <= score ? "var(--color-lime)" : "rgba(255,255,255,0.12)",
            boxShadow: n <= score ? "0 0 5px var(--color-lime-glow)" : "none",
          }} />
        ))}
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", marginLeft: "6px", fontFamily: "var(--font-mono-base)" }}>
          {score}.0 — vérifié
        </span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* ════════════════════════════════════════════
          HERO — dark, lime glow, centered
      ════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        background: "#0E0E0A",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          pointerEvents: "none",
        }} />
        {/* Lime radial glow */}
        <div style={{
          position: "absolute",
          top: "-15%", left: "50%", transform: "translateX(-50%)",
          width: "1000px", height: "650px",
          background: "radial-gradient(ellipse at center, rgba(200,241,105,0.13) 0%, rgba(27,61,42,0.25) 40%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Nav */}
        <nav style={{
          position: "relative", zIndex: 10,
          padding: "0 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "68px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <Logo variant="dark" size="md" />

          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <Link href="#how" className="link-sweep" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              Comment ça marche
            </Link>
            <Link href="/signup/participant" className="link-sweep" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              Rejoindre la communauté
            </Link>
            <Link href="/login" className="link-sweep" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              Connexion
            </Link>
            <Link href="/signup/brand" style={{
              fontSize: "13px", fontWeight: 700,
              padding: "8px 18px",
              background: "var(--color-lime)",
              color: "var(--color-lime-ink)",
              borderRadius: "999px",
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.2s",
              boxShadow: "0 0 20px var(--color-lime-glow)",
            }}>
              Démarrer →
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "48px 40px 24px",
          position: "relative",
          zIndex: 2,
        }}>

          {/* Badge */}
          <div className="anim-pop anim-d1" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px",
            border: "1px solid rgba(200,241,105,0.3)",
            borderRadius: "999px",
            background: "rgba(200,241,105,0.07)",
            marginBottom: "36px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "var(--color-lime)",
              boxShadow: "0 0 8px var(--color-lime-glow)",
              animation: "pulse-dot 2s ease-in-out infinite",
              display: "inline-block",
            }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-lime)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Déjà utilisé par Lacoste
            </span>
          </div>

          {/* H1 */}
          <h1 className="anim-up anim-d2" style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 7vw, 82px)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.035em",
            color: "#F8F7F4",
            margin: "0 0 8px",
            lineHeight: 1.0,
            maxWidth: "780px",
          }}>
            Recrutez les bons profils.
          </h1>
          <h1 className="anim-up anim-d3 text-gradient-lime" style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 7vw, 82px)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.035em",
            margin: "0 0 30px",
            lineHeight: 1.05,
          }}>
            En 72h.
          </h1>

          <p className="anim-up anim-d4" style={{
            fontSize: "17px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.65,
            maxWidth: "480px",
            margin: "0 0 44px",
          }}>
            Des entretiens qualitatifs avec des participants vraiment ciblés, sélectionnés à la main et vérifiés. Pour les équipes insights qui veulent aller vite.
          </p>

          {/* CTAs */}
          <div className="anim-up anim-d5" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/signup/brand" className="anim-glow" style={{
              padding: "14px 30px",
              background: "var(--color-lime)",
              color: "var(--color-lime-ink)",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}>
              Créer un compte marque
            </Link>
            <Link href="/signup/participant" style={{
              padding: "14px 30px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.75)",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.14)",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              backdropFilter: "blur(8px)",
            }}>
              Je suis un participant
            </Link>
          </div>

          {/* Stats */}
          <div className="anim-up anim-d6" style={{
            marginTop: "64px",
            display: "flex",
            gap: "52px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {[
              { n: "72h",  l: "Délai de recrutement" },
              { n: "100%", l: "Profils vérifiés à la main" },
              { n: "5–8",  l: "Participants par étude" },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono-base)",
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#F8F7F4",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating pastille cards */}
        <div className="anim-float" style={{
          position: "absolute", left: "calc(50% - 540px)", top: "48%",
          transform: "translateY(-50%)",
          "--float-rotate": "-3deg",
        } as React.CSSProperties}>
          <PastilleCard
            name="Amina D." role="Styliste" city="Paris · 28 ans"
            tags={["quiet-luxury", "styling", "gen-z"]} score={5}
          />
        </div>
        <div className="anim-float-slow" style={{
          position: "absolute", right: "calc(50% - 540px)", top: "52%",
          transform: "translateY(-50%)",
          "--float-rotate": "2.5deg",
        } as React.CSSProperties}>
          <PastilleCard
            name="Thomas R." role="Buyer" city="Lyon · 32 ans"
            tags={["sneakers", "drops", "resale"]} score={4}
          />
        </div>

        {/* ── Marquee tag strip — vitrine du matching ── */}
        <div style={{
          position: "relative", zIndex: 3,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "18px 0",
          overflow: "hidden",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}>
          <div className="anim-marquee">
            {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, i) => (
              <span key={i} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginRight: "28px",
                whiteSpace: "nowrap",
              }}>
                <span style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono-base)",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.02em",
                }}>
                  {tag}
                </span>
                <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(200,241,105,0.5)", display: "inline-block" }} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section id="how" style={{ maxWidth: "1080px", margin: "0 auto", padding: "96px 40px" }}>
        <div style={{ marginBottom: "56px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className="q-label" style={{ marginBottom: "12px" }}>Comment ça marche</p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 400, fontStyle: "italic",
              letterSpacing: "-0.025em",
              color: "var(--color-text-primary)",
              margin: 0, lineHeight: 1.05,
            }}>
              Du brief à l'entretien<br />en moins de 72h
            </h2>
          </div>
          <Link href="/signup/brand" className="link-sweep" style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)" }}>
            Déposer un brief →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            {
              n: "01", title: "Déposez votre brief",
              desc: "Décrivez votre étude, vos critères de ciblage, le format et la récompense. En moins de 10 minutes.",
              detail: "Entretiens 1:1 ou focus groups",
            },
            {
              n: "02", title: "Recevez des profils matchés",
              desc: "Notre moteur croise vos critères avec des centaines de signaux par profil. Puis l'équipe valide chaque match à la main.",
              detail: "IA + sélection humaine",
            },
            {
              n: "03", title: "Conduisez vos entretiens",
              desc: "Confirmez les profils, la planification et la visio sont automatiques. Rapport de synthèse IA à la fin.",
              detail: "Zéro logistique à gérer",
            },
          ].map((s) => (
            <div key={s.n} className="hover-glow" style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-base)",
              borderRadius: "14px",
              padding: "34px 30px",
              cursor: "default",
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px", height: "34px",
                borderRadius: "999px",
                background: "var(--color-lime-soft)",
                border: "1px solid var(--color-lime)",
                fontFamily: "var(--font-mono-base)",
                fontSize: "11px", fontWeight: 700,
                color: "var(--color-lime-ink)",
                marginBottom: "22px",
              }}>
                {s.n}
              </div>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "21px", fontWeight: 400, fontStyle: "italic",
                color: "var(--color-text-primary)",
                margin: "0 0 12px", letterSpacing: "-0.01em",
              }}>
                {s.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65, margin: "0 0 20px" }}>
                {s.desc}
              </p>
              <div style={{
                fontSize: "11px", fontWeight: 700,
                color: "var(--color-lime-ink)",
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "4px 10px",
                background: "var(--color-lime-soft)",
                borderRadius: "999px",
              }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          INSIGHTS — dark band
      ════════════════════════════════════════════ */}
      <section style={{ background: "#0E0E0A", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          bottom: "-30%", right: "-10%",
          width: "600px", height: "500px",
          background: "radial-gradient(ellipse at center, rgba(200,241,105,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "88px 40px", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>

            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--color-lime)", marginBottom: "16px" }}>
                Qualité des profils
              </p>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3vw, 40px)",
                fontWeight: 400, fontStyle: "italic",
                color: "#fff",
                margin: "0 0 20px", lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}>
                Pas un panel générique.<br />Des vrais insiders.
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "0 0 36px" }}>
                Stylistes, buyers, créatifs, early adopters documentés. Chaque profil passe un screener qualitatif, une vérification d'identité, et notre moteur d'analyse lui attribue des centaines de signaux invisibles utilisés pour le matching.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  "Identité vérifiée par l'équipe Qualio",
                  "Screener qualitatif anti-gaming obligatoire",
                  "Scoring IA sur 7 dimensions par profil",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "rgba(200,241,105,0.12)",
                      border: "1px solid rgba(200,241,105,0.4)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", color: "var(--color-lime)", fontWeight: 700,
                      flexShrink: 0,
                    }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "Amina D.", role: "Styliste · Paris", tags: ["quiet-luxury", "styling"], score: 5 },
                { name: "Sofia L.", role: "DA · Bordeaux", tags: ["haute-couture", "beaute"], score: 5 },
                { name: "Thomas R.", role: "Buyer · Lyon", tags: ["sneakers", "drops"], score: 4 },
              ].map((p) => (
                <div key={p.name} className="hover-lift-dark" style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #1B3D2A 0%, #C8F169 180%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontStyle: "italic",
                      fontSize: "16px", color: "#fff",
                    }}>
                      {p.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#F0EDE8", marginBottom: "3px" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{p.role}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {p.tags.map((t) => (
                        <span key={t} style={{
                          fontSize: "9px", fontWeight: 700,
                          padding: "3px 8px",
                          border: "1px solid rgba(200,241,105,0.3)",
                          borderRadius: "999px",
                          color: "var(--color-lime)",
                        }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1,2,3,4,5].map((n) => (
                        <div key={n} style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          background: n <= p.score ? "var(--color-lime)" : "rgba(255,255,255,0.12)",
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center", padding: "12px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                +47 profils vérifiés dans la base — <span style={{ color: "var(--color-lime)" }}>et ça grandit chaque semaine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          COMPARISON
      ════════════════════════════════════════════ */}
      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "88px 40px" }}>
        <div style={{ marginBottom: "48px" }}>
          <p className="q-label" style={{ marginBottom: "12px" }}>Pourquoi Qualio</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.5vw, 40px)",
            fontWeight: 400, fontStyle: "italic",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0, lineHeight: 1.05,
          }}>
            Ce que vous ne trouverez pas<br />dans une agence ou un panel classique
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="q-card" style={{ opacity: 0.55, borderRadius: "14px" }}>
            <p className="q-label" style={{ marginBottom: "16px", color: "var(--color-error)" }}>Sans Qualio</p>
            {[
              "2–3 semaines pour recevoir des profils",
              "Profils auto-déclarés, non vérifiés",
              "Panel générique, pas de niche mode/lifestyle",
              "Aucun rapport de synthèse",
              "Logistique de planification entièrement manuelle",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-error)", flexShrink: 0, marginTop: "1px" }}>✗</span>
                {item}
              </div>
            ))}
          </div>

          <div className="hover-glow" style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-lime)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 0 32px rgba(200,241,105,0.12)",
          }}>
            <p className="q-label" style={{ marginBottom: "16px", color: "var(--color-lime-ink)" }}>Avec Qualio</p>
            {[
              "Profils confirmés en 72h",
              "Identité vérifiée + screener qualitatif",
              "Spécialiste mode, luxe, lifestyle, Gen Z",
              "Rapport de synthèse IA après chaque étude",
              "Planification, visio et récompenses automatisées",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                <span style={{ color: "var(--color-lime-ink)", flexShrink: 0, marginTop: "1px", fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════ */}
      <section style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border-base)",
        borderBottom: "1px solid var(--color-border-base)",
      }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "88px 40px" }}>
          <div style={{ marginBottom: "48px" }}>
            <p className="q-label" style={{ marginBottom: "12px" }}>Tarifs</p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 400, fontStyle: "italic",
              letterSpacing: "-0.025em",
              color: "var(--color-text-primary)",
              margin: "0 0 8px",
            }}>
              Simple et transparent
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
              1 crédit = 1 participant confirmé · Crédits sans expiration
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { name: "Essai gratuit", price: "0€", credits: "5 crédits offerts", feature: "1 étude, sans carte bancaire", cta: "Commencer", highlight: false },
              { name: "Pack M", price: "780€", credits: "12 crédits", feature: "Sans expiration · 65€/participant", cta: "Choisir Pack M", highlight: true },
              { name: "Pack L", price: "1 375€", credits: "25 crédits", feature: "Sans expiration · 55€/participant", cta: "Choisir Pack L", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={plan.highlight ? "anim-glow" : "hover-glow"} style={{
                background: plan.highlight ? "#0E0E0A" : "var(--color-bg)",
                border: `1px solid ${plan.highlight ? "var(--color-lime)" : "var(--color-border-base)"}`,
                borderRadius: "16px",
                padding: "32px 28px",
                position: "relative",
              }}>
                {plan.highlight && (
                  <span style={{
                    position: "absolute", top: "-11px", left: "24px",
                    padding: "3px 12px",
                    background: "var(--color-lime)",
                    color: "var(--color-lime-ink)",
                    borderRadius: "999px",
                    fontSize: "10px", fontWeight: 800,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    Populaire
                  </span>
                )}
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: plan.highlight ? "var(--color-lime)" : "var(--color-text-tertiary)", margin: "0 0 16px" }}>
                  {plan.name}
                </p>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono-base)",
                    fontSize: "36px", fontWeight: 700,
                    color: plan.highlight ? "#fff" : "var(--color-text-primary)",
                    letterSpacing: "-0.03em", lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                </div>
                <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : "var(--color-border-base)"}`, paddingTop: "20px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.85)" : "var(--color-text-primary)", fontWeight: 600, marginBottom: "6px" }}>
                    {plan.credits}
                  </div>
                  <div style={{ fontSize: "12px", color: plan.highlight ? "rgba(255,255,255,0.45)" : "var(--color-text-tertiary)" }}>
                    {plan.feature}
                  </div>
                </div>
                <Link href="/signup/brand" style={{
                  display: "block", textAlign: "center",
                  padding: "11px 18px", borderRadius: "999px",
                  fontSize: "13px", fontWeight: 700,
                  textDecoration: "none",
                  background: plan.highlight ? "var(--color-lime)" : "var(--color-accent)",
                  color: plan.highlight ? "var(--color-lime-ink)" : "#fff",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════ */}
      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "104px 40px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4.5vw, 58px)",
          fontWeight: 400, fontStyle: "italic",
          letterSpacing: "-0.03em",
          color: "var(--color-text-primary)",
          margin: "0 0 20px", lineHeight: 1.0,
        }}>
          Prêt à recruter autrement ?
        </h2>
        <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: "0 auto 40px", maxWidth: "420px", lineHeight: 1.65 }}>
          Déposez votre premier brief aujourd'hui. Premiers profils sous 48h.
        </p>
        <Link href="/signup/brand" className="anim-glow" style={{
          display: "inline-block",
          padding: "15px 36px",
          background: "var(--color-lime)",
          color: "var(--color-lime-ink)",
          borderRadius: "999px",
          fontSize: "14px",
          fontWeight: 700,
          textDecoration: "none",
        }}>
          Commencer gratuitement →
        </Link>
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "14px" }}>
          5 crédits offerts · Aucune carte bancaire requise
        </p>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--color-border-base)", padding: "28px 40px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
