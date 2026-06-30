import Link from "next/link";

// Floating participant "pastille" card shown in the hero
function PastilleCard({
  name, role, city, tags, score, style,
}: {
  name: string; role: string; city: string; tags: string[]; score: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "12px",
      padding: "16px 18px",
      width: "200px",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "linear-gradient(135deg, #1B3D2A, #2D6B48)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: "15px", color: "#fff", flexShrink: 0,
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
            padding: "2px 6px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "2px",
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "3px" }}>
        {[1,2,3,4,5].map((n) => (
          <div key={n} style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: n <= score ? "#3B9A5A" : "rgba(255,255,255,0.12)",
          }} />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* ════════════════════════════════════════════
          HERO — dark, centered, animated
      ════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        background: "#0F0E0C",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dot grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }} />
        {/* Green radial glow */}
        <div style={{
          position: "absolute",
          top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "900px", height: "600px",
          background: "radial-gradient(ellipse at center, rgba(27,61,42,0.45) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Nav */}
        <nav style={{
          position: "relative", zIndex: 10,
          padding: "0 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "64px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Logo pastille */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.04)",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#3B9A5A",
              animation: "pulse-dot 2s ease-in-out infinite",
              display: "inline-block",
            }} />
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "17px",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#F8F7F4",
              letterSpacing: "-0.01em",
            }}>
              Qualio
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <Link href="#how" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
              Comment ça marche
            </Link>
            <Link href="/signup/participant" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
              Rejoindre la communauté
            </Link>
            <Link href="/login" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
              Connexion
            </Link>
            <Link href="/signup/brand" style={{
              fontSize: "13px", fontWeight: 600,
              padding: "7px 16px",
              background: "#1B3D2A",
              color: "#fff",
              borderRadius: "4px",
              border: "1px solid #2D6B48",
              textDecoration: "none",
              transition: "background 0.15s",
            }}>
              Démarrer →
            </Link>
          </div>
        </nav>

        {/* Hero content — centered */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 40px",
          position: "relative",
          zIndex: 2,
        }}>

          {/* Badge */}
          <div className="anim-up anim-d1" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px",
            border: "1px solid rgba(59,154,90,0.3)",
            borderRadius: "999px",
            background: "rgba(27,61,42,0.3)",
            marginBottom: "36px",
          }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#5BBF78", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ Déjà utilisé par Lacoste
            </span>
          </div>

          {/* H1 */}
          <h1 className="anim-up anim-d2" style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 7vw, 80px)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.035em",
            color: "#F8F7F4",
            margin: "0 0 12px",
            lineHeight: 1.0,
            maxWidth: "760px",
          }}>
            Recrutez les bons profils.
          </h1>
          <h1 className="anim-up anim-d3" style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 7vw, 80px)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.035em",
            color: "#3B9A5A",
            margin: "0 0 32px",
            lineHeight: 1.0,
            maxWidth: "760px",
          }}>
            En 72h.
          </h1>

          <p className="anim-up anim-d4" style={{
            fontSize: "17px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.65,
            maxWidth: "480px",
            margin: "0 0 48px",
          }}>
            Des entretiens qualitatifs avec des participants vraiment ciblés. Pour les équipes insights qui veulent aller vite.
          </p>

          {/* CTAs */}
          <div className="anim-up anim-d5" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/signup/brand" style={{
              padding: "13px 28px",
              background: "#1B3D2A",
              color: "#fff",
              borderRadius: "4px",
              border: "1px solid #2D6B48",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s, transform 0.15s",
            }}>
              Créer un compte marque
            </Link>
            <Link href="/signup/participant" style={{
              padding: "13px 28px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
            }}>
              Je suis un participant
            </Link>
          </div>

          {/* Stats row */}
          <div className="anim-up anim-d6" style={{
            marginTop: "72px",
            display: "flex",
            gap: "48px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {[
              { n: "72h",  l: "Délai de recrutement" },
              { n: "100%", l: "Profils sélectionnés à la main" },
              { n: "5–8",  l: "Participants par étude" },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono-base)",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#F8F7F4",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: "5px",
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating participant pastilles */}
        <div className="anim-float" style={{
          position: "absolute", left: "calc(50% - 520px)", top: "50%",
          transform: "translateY(-50%)",
          "--float-rotate": "-3deg",
        } as React.CSSProperties}>
          <PastilleCard
            name="Amina D." role="Styliste" city="Paris · 28 ans"
            tags={["Luxe", "Mode", "Streetwear"]} score={5}
          />
        </div>
        <div className="anim-float-slow" style={{
          position: "absolute", right: "calc(50% - 520px)", top: "50%",
          transform: "translateY(-50%)",
          "--float-rotate": "2deg",
        } as React.CSSProperties}>
          <PastilleCard
            name="Thomas R." role="Chef de projet" city="Lyon · 32 ans"
            tags={["Sport", "Tech", "Mode"]} score={4}
          />
        </div>

        {/* Bottom fade to white */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100px",
          background: "linear-gradient(to bottom, transparent, var(--color-bg))",
          pointerEvents: "none",
        }} />
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════ */}
      <section id="how" style={{ maxWidth: "1080px", margin: "0 auto", padding: "96px 40px" }}>
        <div style={{ marginBottom: "56px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--color-border-base)" }}>
          {[
            {
              n: "01", title: "Déposez votre brief",
              desc: "Décrivez votre étude, vos critères de ciblage, le format et la récompense. En moins de 10 minutes.",
              detail: "Entretiens 1:1 ou focus groups",
            },
            {
              n: "02", title: "Recevez des profils matchés",
              desc: "Notre équipe sélectionne manuellement les participants qui correspondent exactement à vos critères.",
              detail: "Sélection humaine, pas algorithmique",
            },
            {
              n: "03", title: "Conduisez vos entretiens",
              desc: "Confirmez les profils, planifiez les créneaux. Les liens vidéo sont générés automatiquement.",
              detail: "Rapport de synthèse IA après chaque étude",
            },
          ].map((s) => (
            <div key={s.n} className="hover-lift" style={{
              background: "var(--color-surface)",
              padding: "36px 32px",
              cursor: "default",
              position: "relative",
            }}>
              <div style={{
                fontFamily: "var(--font-mono-base)",
                fontSize: "10px", fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.10em",
                marginBottom: "24px",
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
                fontSize: "11px", fontWeight: 600,
                color: "var(--color-accent)",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          INSIGHTS SECTION — dark accent band
      ════════════════════════════════════════════ */}
      <section style={{
        background: "var(--color-accent)",
        borderTop: "1px solid var(--color-border-base)",
      }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "88px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>

            {/* Left: text */}
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
                Qualité des profils
              </p>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3vw, 38px)",
                fontWeight: 400, fontStyle: "italic",
                color: "#fff",
                margin: "0 0 20px", lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}>
                Pas un panel générique.<br />Des vrais insiders.
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 36px" }}>
                Chaque participant est sélectionné à la main — stylistes, buyers, early adopters documentés, profils Gen Z avec un vocabulaire mode avancé. Pas de panel auto-déclaré.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  "Identité vérifiée par l'équipe Qualio",
                  "Screener qualitatif anti-gaming obligatoire",
                  "Ghost file IA — 7 scores de qualité par profil",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#5BBF78", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: participant cards preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "Amina D.", role: "Styliste · Paris", tags: ["Luxe", "Mode", "Streetwear"], score: 5 },
                { name: "Sofia L.", role: "DA · Bordeaux", tags: ["Haute couture", "Beauté"], score: 5 },
                { name: "Thomas R.", role: "Buyer · Lyon", tags: ["Sport", "Lifestyle"], score: 4 },
              ].map((p) => (
                <div key={p.name} className="hover-lift-dark" style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "4px",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.12)",
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
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {p.tags.map((t) => (
                        <span key={t} style={{
                          fontSize: "9px", fontWeight: 700,
                          padding: "2px 6px",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "2px",
                          color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1,2,3,4,5].map((n) => (
                        <div key={n} style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          background: n <= p.score ? "#5BBF78" : "rgba(255,255,255,0.12)",
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center", padding: "12px", fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                +47 profils vérifiés dans la base
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          VS COMPARISON
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

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}>
          {/* Without */}
          <div className="q-card" style={{ opacity: 0.6 }}>
            <p className="q-label" style={{ marginBottom: "16px", color: "var(--color-error)" }}>Sans Qualio</p>
            {[
              "2–3 semaines pour recevoir des profils",
              "Profils auto-déclarés, non vérifiés",
              "Panel générique, pas de niche mode/lifestyle",
              "Aucun rapport de synthèse IA",
              "Logistique scheduling entièrement manuelle",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-error)", flexShrink: 0, marginTop: "1px" }}>✗</span>
                {item}
              </div>
            ))}
          </div>

          {/* With */}
          <div className="q-card" style={{ borderColor: "var(--color-accent-light)" }}>
            <p className="q-label" style={{ marginBottom: "16px", color: "var(--color-accent)" }}>Avec Qualio</p>
            {[
              "Profils confirmés en 72h",
              "Identité vérifiée + screener qualitatif",
              "Spécialiste mode, luxury, lifestyle, Gen Z",
              "Rapport de synthèse IA post-étude",
              "Scheduling + vidéo + récompenses automatisés",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                <span style={{ color: "var(--color-success)", flexShrink: 0, marginTop: "1px" }}>✓</span>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {[
              { name: "Essai gratuit", price: "0€", suffix: "", credits: "5 crédits offerts", feature: "1 étude", cta: "Commencer", highlight: false },
              { name: "Pack M", price: "780€", suffix: "", credits: "12 crédits", feature: "Sans expiration", cta: "Choisir Pack M", highlight: true },
              { name: "Pack L", price: "1 375€", suffix: "", credits: "25 crédits", feature: "Sans expiration · −8%", cta: "Choisir Pack L", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={plan.highlight ? "" : "hover-lift"} style={{
                background: plan.highlight ? "var(--color-accent)" : "var(--color-bg)",
                border: `1px solid ${plan.highlight ? "var(--color-accent)" : "var(--color-border-base)"}`,
                borderRadius: "3px",
                padding: "32px 28px",
                transition: plan.highlight ? "none" : undefined,
              }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)", margin: "0 0 16px" }}>
                  {plan.name}
                </p>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono-base)",
                    fontSize: "34px", fontWeight: 700,
                    color: plan.highlight ? "#fff" : "var(--color-text-primary)",
                    letterSpacing: "-0.03em", lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                </div>
                <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.15)" : "var(--color-border-base)"}`, paddingTop: "20px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.8)" : "var(--color-text-primary)", fontWeight: 600, marginBottom: "6px" }}>
                    {plan.credits}
                  </div>
                  <div style={{ fontSize: "12px", color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--color-text-tertiary)" }}>
                    {plan.feature}
                  </div>
                </div>
                <Link href="/signup/brand" style={{
                  display: "block", textAlign: "center",
                  padding: "10px 18px", borderRadius: "2px",
                  fontSize: "13px", fontWeight: 600,
                  textDecoration: "none",
                  background: plan.highlight ? "#fff" : "var(--color-accent)",
                  color: plan.highlight ? "var(--color-accent)" : "#fff",
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
      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "96px 40px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4.5vw, 56px)",
          fontWeight: 400, fontStyle: "italic",
          letterSpacing: "-0.03em",
          color: "var(--color-text-primary)",
          margin: "0 0 20px", lineHeight: 1.0,
        }}>
          Prêt à recruter autrement ?
        </h2>
        <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: "0 0 40px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
          Déposez votre premier brief aujourd'hui. Premiers profils sous 48h.
        </p>
        <Link href="/signup/brand" style={{
          display: "inline-block",
          padding: "13px 32px",
          background: "var(--color-accent)",
          color: "#fff",
          borderRadius: "3px",
          fontSize: "14px",
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.01em",
          transition: "background 0.15s, transform 0.15s",
        }}>
          Commencer gratuitement →
        </Link>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--color-border-base)", padding: "28px 40px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", border: "1px solid var(--color-border-base)", borderRadius: "999px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--color-success)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontStyle: "italic", color: "var(--color-text-primary)" }}>
              Qualio
            </span>
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/pricing" style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>Tarifs</Link>
            <Link href="/login" style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>Connexion</Link>
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>© 2026 Qualio</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
