"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import Reveal from "@/components/shared/Reveal";

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(140deg, #C7B4EC, #8765D7)",
  "linear-gradient(140deg, #E9DEFA, #AA90E1)",
  "linear-gradient(140deg, #B9C0FF, #999BFF)",
  "linear-gradient(140deg, #EBCBF7, #C98BC5)",
];

const FACES_LEFT = ["A","M","L","S","C","N","T","É","R"];
const FACES_RIGHT = ["J","K","P","D","F","B","O","V","G"];

const USE_CASES: Record<string, { desc: string; tiles: { label: string; sub: string }[] }> = {
  "Tendances & style": {
    desc: "Testez vos intuitions sur les esthétiques émergentes avant qu'elles explosent.",
    tiles: [
      { label: "Quiet luxury", sub: "Perception & désir" },
      { label: "Streetwear", sub: "Codes & hype" },
      { label: "Seconde main", sub: "Rapport à la valeur" },
      { label: "Gen Z", sub: "Vocabulaire & signaux" },
      { label: "Archives & vintage", sub: "Nostalgie" },
      { label: "Sneakers & drops", sub: "Culture" },
    ],
  },
  "Produit & concept": {
    desc: "Confrontez vos concepts, packagings et claims à de vrais experts avant le lancement.",
    tiles: [
      { label: "Packaging", sub: "Premières impressions" },
      { label: "Nouveau produit", sub: "Désirabilité" },
      { label: "Nom & claim", sub: "Compréhension" },
      { label: "Matières", sub: "Perception qualité" },
      { label: "Collection capsule", sub: "Cohérence" },
      { label: "Prix", sub: "Acceptabilité" },
    ],
  },
  "Retail & parcours": {
    desc: "Comprenez comment vos clients vivent l'expérience, en boutique comme en ligne.",
    tiles: [
      { label: "Boutique", sub: "Parcours en magasin" },
      { label: "E-shop", sub: "Friction & fluidité" },
      { label: "Personnalisation", sub: "Attentes" },
      { label: "Service client", sub: "Points de contact" },
      { label: "Fidélité", sub: "Motivations" },
      { label: "Click & collect", sub: "Usage réel" },
    ],
  },
  "Marque & image": {
    desc: "Mesurez la perception de votre marque, vos campagnes et vos collaborations.",
    tiles: [
      { label: "Campagne", sub: "Réception créative" },
      { label: "Collaboration", sub: "Légitimité perçue" },
      { label: "Storytelling", sub: "Résonance" },
      { label: "Positionnement", sub: "Territoire de marque" },
      { label: "Égérie", sub: "Adéquation" },
      { label: "Réseaux sociaux", sub: "Contenu & ton" },
    ],
  },
};

const FAQ = [
  { q: "C'est quoi un crédit ?", a: "1 crédit = 1 participant confirmé pour votre étude. Si un participant ne se présente pas, le crédit vous est automatiquement restitué." },
  { q: "Combien de temps pour recevoir des participants ?", a: "48 à 72h après votre brief pour les premiers profils confirmés. C'est la promesse centrale de Qualio." },
  { q: "Vos profils sont-ils vraiment vérifiés ?", a: "Oui — chaque participant passe un screener qualitatif anti-gaming, une vérification d'identité, et un scoring de qualité sur 7 dimensions avant d'entrer dans la base." },
  { q: "Qui conduit les entretiens ?", a: "Vous. Qualio recrute, planifie et génère les liens visio. Vous menez l'entretien comme vous le souhaitez, puis recevez un rapport de synthèse IA." },
  { q: "Les crédits expirent-ils ?", a: "Non. Tous les crédits achetés sont sans date d'expiration." },
  { q: "Sur quels secteurs êtes-vous spécialisés ?", a: "Mode, luxe, beauté, lifestyle, sport et streetwear. Nos profils sont des insiders de ces univers, pas un panel généraliste." },
];

// ─────────────────────────────────────────────────────────────
// Mockups (construits en CSS, aucune image requise)
// ─────────────────────────────────────────────────────────────

// Fenêtre navigateur factice — vitrine de l'outil de matching
function DashboardMockup() {
  const rows = [
    { n: "Amina D.", r: "Styliste · Paris", tags: ["quiet-luxury", "styling"], s: 5, g: 0 },
    { n: "Sofia L.", r: "DA · Bordeaux", tags: ["haute-couture", "beauté"], s: 5, g: 3 },
    { n: "Thomas R.", r: "Buyer · Lyon", tags: ["sneakers", "drops"], s: 4, g: 2 },
    { n: "Inès B.", r: "Journaliste · Paris", tags: ["gen-z", "seconde-main"], s: 4, g: 1 },
  ];
  return (
    <div style={{
      background: "#fff", borderRadius: "18px",
      border: "1px solid var(--color-border-base)",
      boxShadow: "0 40px 90px -30px var(--color-glow), 0 12px 32px var(--color-glow-soft)",
      overflow: "hidden", width: "100%", maxWidth: "760px",
    }}>
      {/* Barre navigateur */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderBottom: "1px solid var(--color-border-base)", background: "var(--color-surface-2)" }}>
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E5B8C6" }} />
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#EBD9B0" }} />
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#C3E0C6" }} />
        <div style={{ marginLeft: "12px", padding: "4px 14px", borderRadius: "999px", background: "#fff", border: "1px solid var(--color-border-base)", fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono-base)" }}>
          qualio.app / matching
        </div>
      </div>
      {/* Contenu */}
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-plum)" }}>Perceptions quiet luxury · Gen Z</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Entretiens 1:1 · 6 participants recherchés</div>
          </div>
          <span className="q-tag" style={{ color: "var(--color-warning)", background: "var(--color-warning-light)", border: "none" }}>Matching en cours</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((p) => (
            <div key={p.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--color-border-base)", background: "var(--color-surface)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: GRADIENTS[p.g], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px" }}>{p.n[0]}</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-plum)" }}>{p.n}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{p.r}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {p.tags.map((t) => (
                    <span key={t} style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: "var(--color-accent-light)", color: "var(--color-accent)" }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map((n) => (
                    <span key={n} style={{ width: "5px", height: "5px", borderRadius: "50%", background: n <= p.s ? "var(--color-accent)" : "var(--color-border-strong)" }} />
                  ))}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "var(--color-accent)", padding: "5px 12px", borderRadius: "999px" }}>Shortlister</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Carte profil détaillée (façon fiche participant)
function ProfileCardMockup() {
  const attrs: [string, string][] = [
    ["Ville", "Paris 11e"], ["Âge", "29 ans"],
    ["Profession", "Styliste indép."], ["Budget mode", "300–600€/mois"],
    ["Expertise", "Quiet luxury"], ["Langues", "FR · EN · IT"],
  ];
  const scores = [
    ["Expertise", 9], ["Vocabulaire", 8], ["Cohérence", 9],
    ["Early adopter", 8], ["Influence", 7], ["Authenticité", 9], ["Global", 9],
  ] as [string, number][];
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
      <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid var(--color-border-base)", boxShadow: "0 30px 70px -30px var(--color-glow)", padding: "22px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: GRADIENTS[0], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "22px" }}>A</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-plum)" }}>Amina D.</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--color-accent)", fontWeight: 600, marginTop: "3px" }}>
              <span>✓</span> Profil vérifié · Participante #128
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: "18px" }}>
          {attrs.map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-tertiary)" }}>{k}</div>
              <div style={{ fontSize: "12px", color: "var(--color-plum)", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--color-border-base)", paddingTop: "14px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-tertiary)", marginBottom: "10px" }}>Score qualité IA · interne</div>
          {scores.map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", width: "78px" }}>{k}</span>
              <div style={{ flex: 1, height: "5px", background: "var(--color-border-base)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${v * 10}%`, height: "100%", background: "linear-gradient(90deg, #AA90E1, #8765D7)", borderRadius: "999px" }} />
              </div>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono-base)", fontWeight: 700, color: "var(--color-accent)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Badge flottant */}
      <div style={{ position: "absolute", top: "-14px", right: "-14px", zIndex: 3, background: "linear-gradient(140deg, #8765D7, #AA90E1)", color: "#fff", borderRadius: "14px", padding: "10px 14px", textAlign: "center", boxShadow: "0 10px 30px var(--color-glow)" }}>
        <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>7</div>
        <div style={{ fontSize: "8px", fontWeight: 600, opacity: 0.9 }}>scores</div>
      </div>
    </div>
  );
}

// Diagramme de nœuds — le flux de matching
function FlowNode({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "120px" }}>
      <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "#fff", border: "1px solid var(--color-border-base)", boxShadow: "0 8px 20px var(--color-glow-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{icon}</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-plum)" }}>{title}</div>
        <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{sub}</div>
      </div>
    </div>
  );
}
function FlowConnector() {
  return (
    <div style={{ flex: 1, minWidth: "24px", height: "2px", background: "linear-gradient(90deg, var(--color-lavender), var(--color-border-strong))", position: "relative", marginTop: "-32px" }}>
      <span style={{ position: "absolute", right: 0, top: "-3px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-lavender)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [banner, setBanner] = useState(true);
  const [tab, setTab] = useState<keyof typeof USE_CASES>("Tendances & style");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>

      {/* ── Bandeau d'annonce ── */}
      {banner && (
        <div style={{ position: "relative", background: "linear-gradient(90deg, #EFE6F9, #F5EAF6)", borderBottom: "1px solid var(--color-border-base)", padding: "9px 48px", textAlign: "center", fontSize: "13px" }}>
          <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>Nouveau</span>
          <span style={{ color: "var(--color-text-secondary)", marginLeft: "8px" }}>
            Recrutez vos premiers participants qualifiés en 72h — 5 crédits offerts
          </span>
          <button onClick={() => setBanner(false)} aria-label="Fermer" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "16px", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,240,250,0.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--color-border-base)", padding: "0 40px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo variant="light" size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          <Link href="#solution" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Solution</Link>
          <Link href="#how" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Comment ça marche</Link>
          <Link href="#quality" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Nos profils</Link>
          <Link href="#faq" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>FAQ</Link>
          <Link href="/login" className="link-sweep" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Connexion</Link>
          <Link href="/signup/brand" className="q-btn q-btn-primary" style={{ fontSize: "13px" }}>Démarrer →</Link>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "76px 40px 40px" }}>
        <div style={{ position: "absolute", top: "-12%", left: "50%", transform: "translateX(-50%)", width: "1100px", height: "700px", background: "radial-gradient(ellipse at center, rgba(170,144,225,0.20) 0%, rgba(153,155,255,0.10) 38%, transparent 68%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          {/* Visages gauche */}
          <div className="hero-faces anim-up anim-d1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 50px)", gap: "10px" }}>
            {FACES_LEFT.map((f, i) => (
              <div key={i} style={{ width: "50px", height: "50px", borderRadius: "14px", background: [0,4,8].includes(i) ? GRADIENTS[i % 4] : "#EDE6F5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", color: [0,4,8].includes(i) ? "#fff" : "#C4B4D6", opacity: [0,4,8].includes(i) ? 1 : 0.5 }}>{f}</div>
            ))}
          </div>

          {/* Centre */}
          <div style={{ textAlign: "center", flex: 1, maxWidth: "640px" }}>
            <div className="anim-pop anim-d1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "999px", background: "#fff", border: "1px solid var(--color-border-base)", marginBottom: "26px", boxShadow: "0 2px 10px var(--color-glow-soft)" }}>
              <span style={{ fontSize: "11px" }}>✦</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.04em" }}>Panel d'experts mode, luxe & lifestyle</span>
            </div>

            <h1 style={{ margin: "0 0 22px", lineHeight: 1.02 }}>
              <span className="anim-up anim-d2" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5.6vw, 70px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.035em", color: "var(--color-plum-deep)" }}>
                Recrutez les
                <span style={{ display: "inline-flex", width: "58px", height: "58px", borderRadius: "18px", background: "linear-gradient(140deg, #8765D7, #C98BC5)", verticalAlign: "middle", boxShadow: "0 8px 24px var(--color-glow)" }} />
                bons profils.
              </span>
              <span className="anim-up anim-d3 text-gradient-plum" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5.6vw, 70px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.035em" }}>
                En 72 heures.
              </span>
            </h1>

            <p className="anim-up anim-d4" style={{ fontSize: "17px", color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: "460px", margin: "0 auto 32px" }}>
              Des entretiens qualitatifs avec des participants vraiment ciblés — sélectionnés à la main, vérifiés, et prêts à parler de votre marque.
            </p>

            <div className="anim-up anim-d5" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup/brand" className="q-btn q-btn-primary anim-glow" style={{ fontSize: "14px", padding: "13px 28px" }}>Créer un compte marque</Link>
              <Link href="/signup/participant" className="q-btn" style={{ fontSize: "14px", padding: "13px 28px", background: "#fff", color: "var(--color-plum)", border: "1px solid var(--color-border-strong)" }}>Je suis un participant</Link>
            </div>

            <div className="anim-up anim-d6" style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "22px", flexWrap: "wrap" }}>
              {["Profils vérifiés", "Sélection humaine", "Rapport IA inclus"].map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  <span style={{ color: "var(--color-accent)" }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Visages droite */}
          <div className="hero-faces anim-up anim-d1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 50px)", gap: "10px" }}>
            {FACES_RIGHT.map((f, i) => (
              <div key={i} style={{ width: "50px", height: "50px", borderRadius: "14px", background: [1,5].includes(i) ? GRADIENTS[i % 4] : "#EDE6F5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", color: [1,5].includes(i) ? "#fff" : "#C4B4D6", opacity: [1,5].includes(i) ? 1 : 0.5 }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Mockup produit flottant */}
        <Reveal delay={0.1} className="anim-glow" style={{ maxWidth: "760px", margin: "56px auto 0", borderRadius: "18px" }}>
          <DashboardMockup />
        </Reveal>
      </section>

      {/* ── Strip secteurs ── */}
      <section style={{ padding: "48px 40px", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)", background: "var(--color-surface)" }}>
        <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--color-text-tertiary)", marginBottom: "22px" }}>
          Conçu pour les équipes insights des maisons de mode, luxe & lifestyle
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {["Mode","Luxe","Beauté","Lifestyle","Sport","Streetwear","Retail"].map((c) => (
            <span key={c} style={{ padding: "8px 18px", borderRadius: "999px", background: "var(--color-surface-2)", border: "1px solid var(--color-border-base)", fontSize: "13px", fontWeight: 600, color: "var(--color-plum)" }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ════════════ BÉNÉFICES ════════════ */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 40px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{ margin: 0, lineHeight: 1.1 }}>
              <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em" }}>Zéro délai, </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)" }}>zéro friction</span>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { icon: "⏱", title: "Vos profils en 72h", desc: "N'attendez plus 3 semaines pour valider une intuition avec votre cible." },
            { icon: "✓", title: "Vérifiés à la main", desc: "Screener qualitatif et vérification d'identité pour chaque participant." },
            { icon: "€", title: "Tout est géré", desc: "Planification, visio et récompenses : Qualio orchestre la logistique." },
            { icon: "✦", title: "Rapport IA inclus", desc: "Une synthèse analytique de vos entretiens après chaque étude." },
          ].map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08}>
              <div className="q-card hover-glow" style={{ padding: "26px 24px", height: "100%" }}>
                <div className="icon-tile" style={{ marginBottom: "18px" }}><span style={{ fontSize: "18px" }}>{b.icon}</span></div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-plum)", margin: "0 0 8px" }}>{b.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════ SOLUTION — onglets + grille ════════════ */}
      <section id="solution" style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "80px 40px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <p className="q-label" style={{ marginBottom: "14px" }}>Ce que vous pouvez explorer</p>
              <h2 style={{ margin: 0, lineHeight: 1.1 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 42px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)" }}>Des insights actionnables, </span>
                <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 42px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>pour chaque métier</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", alignItems: "start" }}>
            {/* Onglets */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {(Object.keys(USE_CASES) as (keyof typeof USE_CASES)[]).map((k) => {
                const active = k === tab;
                return (
                  <button key={k} onClick={() => setTab(k)} style={{ textAlign: "left", padding: "16px 18px", borderRadius: "14px", border: "none", cursor: "pointer", borderLeft: `3px solid ${active ? "var(--color-accent)" : "transparent"}`, background: active ? "var(--color-accent-light)" : "transparent", transition: "background 0.2s" }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: active ? "var(--color-accent)" : "var(--color-plum)", marginBottom: "3px" }}>{k}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{USE_CASES[k].desc}</div>
                  </button>
                );
              })}
            </div>
            {/* Grille */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {USE_CASES[tab].tiles.map((t) => (
                <div key={t.label} className="hover-glow" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-base)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ height: "64px", borderRadius: "10px", background: "linear-gradient(140deg, #EBE0F7, #D8C7F2)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", bottom: "8px", left: "8px", right: "8px", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.6)" }} />
                    <div style={{ position: "absolute", bottom: "18px", left: "8px", width: "60%", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.45)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-plum)" }}>{t.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ QUALITÉ — faces + fiche profil ════════════ */}
      <section id="quality" style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <Reveal>
            <div>
              <p className="q-label" style={{ color: "var(--color-accent)", marginBottom: "16px" }}>✦ Panel vérifié</p>
              <h2 style={{ margin: "0 0 20px", lineHeight: 1.12 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)" }}>Pas un panel générique.<br /></span>
                <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>De vrais insiders.</span>
              </h2>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 30px" }}>
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
          </Reveal>
          <Reveal delay={0.12} style={{ display: "flex", justifyContent: "center" }}>
            <ProfileCardMockup />
          </Reveal>
        </div>
      </section>

      {/* ════════════ WORKFLOW — diagramme de nœuds ════════════ */}
      <section id="how" style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 40px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p className="q-label" style={{ marginBottom: "14px" }}>Workflow orchestré</p>
              <h2 style={{ margin: "0 0 12px", lineHeight: 1.1 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 42px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)" }}>Du brief au rapport, </span>
                <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 42px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>sans logistique</span>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "0", flexWrap: "wrap", padding: "24px 0" }}>
              <FlowNode icon="📝" title="Brief" sub="Vos critères" />
              <FlowConnector />
              <FlowNode icon="✦" title="Matching IA" sub="Tags invisibles" />
              <FlowConnector />
              <FlowNode icon="👤" title="Sélection" sub="Validée à la main" />
              <FlowConnector />
              <FlowNode icon="🎥" title="Entretien" sub="Visio générée" />
              <FlowConnector />
              <FlowNode icon="📊" title="Rapport IA" sub="Synthèse" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════ 3 ÉTAPES — cartes reliées ════════════ */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "88px 40px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{ margin: 0, lineHeight: 1.1 }}>
              <span className="text-gradient-plum" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em" }}>3 étapes simples, </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 44px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)" }}>des profils immédiats</span>
            </h2>
          </div>
        </Reveal>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {/* Ligne de liaison */}
          <div style={{ position: "absolute", top: "42px", left: "16%", right: "16%", height: "2px", background: "var(--color-border-strong)", zIndex: 0 }} />
          {[
            { n: "1", title: "Déposez votre brief", desc: "Vos critères de ciblage, le format, la récompense. En moins de 10 minutes." },
            { n: "2", title: "Recevez vos profils", desc: "Le moteur croise des centaines de signaux, l'équipe valide chaque match." },
            { n: "3", title: "Conduisez vos entretiens", desc: "Planification, visio et récompenses automatiques. Rapport IA à la fin." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} style={{ position: "relative", zIndex: 1 }}>
              <div className="q-card hover-glow" style={{ height: "100%" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(140deg, #E9DEFA, #C7B4EC)", border: "1px solid rgba(135,101,215,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono-base)", fontSize: "17px", fontWeight: 700, color: "var(--color-accent)", marginBottom: "20px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontStyle: "italic", fontWeight: 400, color: "var(--color-plum)", margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════ COMPARAISON ════════════ */}
      <section style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border-base)", borderBottom: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 40px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <p className="q-label" style={{ marginBottom: "14px" }}>Pourquoi Qualio</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--color-plum-deep)", margin: 0, lineHeight: 1.1 }}>
                Ce qu'une agence ou un panel<br />classique ne vous donnera pas
              </h2>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Reveal>
              <div className="q-card" style={{ opacity: 0.6, boxShadow: "none", height: "100%" }}>
                <p className="q-label" style={{ marginBottom: "18px", color: "var(--color-error)" }}>Sans Qualio</p>
                {["2–3 semaines pour recevoir des profils","Profils auto-déclarés, non vérifiés","Panel générique, pas de niche mode/lifestyle","Aucun rapport de synthèse","Logistique de planification manuelle"].map((t) => (
                  <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-error)", flexShrink: 0 }}>✗</span>{t}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="q-card" style={{ border: "1px solid var(--color-lavender)", boxShadow: "0 8px 32px var(--color-glow)", height: "100%" }}>
                <p className="q-label" style={{ marginBottom: "18px", color: "var(--color-accent)" }}>Avec Qualio</p>
                {["Profils confirmés en 72h","Identité vérifiée + screener qualitatif","Spécialiste mode, luxe, lifestyle, Gen Z","Rapport de synthèse IA après chaque étude","Planification, visio et récompenses automatisées"].map((t) => (
                  <div key={t} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    <span style={{ color: "var(--color-accent)", flexShrink: 0, fontWeight: 700 }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "88px 40px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p className="q-label" style={{ marginBottom: "14px" }}>Tarifs</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.4vw, 40px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--color-plum-deep)", margin: "0 0 8px" }}>Simple et transparent</h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>1 crédit = 1 participant confirmé · Crédits sans expiration</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { name: "Essai gratuit", price: "0€", credits: "5 crédits offerts", feature: "1 étude, sans carte bancaire", highlight: false },
            { name: "Pack M", price: "780€", credits: "12 crédits", feature: "Sans expiration · 65€/participant", highlight: true },
            { name: "Pack L", price: "1 375€", credits: "25 crédits", feature: "Sans expiration · 55€/participant", highlight: false },
          ].map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div className={plan.highlight ? "q-card anim-glow" : "q-card hover-glow"} style={{ padding: "32px 28px", position: "relative", height: "100%", border: plan.highlight ? "1px solid var(--color-lavender)" : undefined, background: plan.highlight ? "linear-gradient(160deg, #ffffff, #F6EFFC)" : undefined }}>
                {plan.highlight && <span style={{ position: "absolute", top: "-11px", left: "24px", padding: "3px 12px", background: "var(--color-accent)", color: "#fff", borderRadius: "999px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Populaire</span>}
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: plan.highlight ? "var(--color-accent)" : "var(--color-text-tertiary)", margin: "0 0 16px" }}>{plan.name}</p>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{ fontFamily: "var(--font-mono-base)", fontSize: "36px", fontWeight: 700, color: "var(--color-plum)", letterSpacing: "-0.03em" }}>{plan.price}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--color-border-base)", paddingTop: "20px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "13px", color: "var(--color-plum)", fontWeight: 600, marginBottom: "6px" }}>{plan.credits}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{plan.feature}</div>
                </div>
                <Link href="/signup/brand" className="q-btn q-btn-primary" style={{ width: "100%", fontSize: "13px" }}>Commencer</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section id="faq" style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border-base)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 40px" }}>
          <Reveal>
            <p className="q-label" style={{ textAlign: "center", marginBottom: "36px" }}>Questions fréquentes</p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={i} delay={i * 0.04}>
                  <div className="q-card" style={{ padding: 0, overflow: "hidden", boxShadow: open ? "0 8px 24px var(--color-glow-soft)" : "none" }}>
                    <button onClick={() => setOpenFaq(open ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-plum)" }}>{item.q}</span>
                      <span style={{ fontSize: "18px", color: "var(--color-accent)", transform: open ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.25s", flexShrink: 0 }}>+</span>
                    </button>
                    <div style={{ maxHeight: open ? "200px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                      <p style={{ padding: "0 22px 20px", margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65 }}>{item.a}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ CTA FINAL ════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 40px", textAlign: "center", background: "var(--color-surface)" }}>
        <div style={{ position: "absolute", bottom: "-40%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "600px", background: "radial-gradient(ellipse at center, rgba(170,144,225,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Reveal style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4.4vw, 56px)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--color-plum-deep)", margin: "0 0 20px", lineHeight: 1.0 }}>Prêt à recruter autrement ?</h2>
          <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: "0 auto 36px", maxWidth: "420px", lineHeight: 1.6 }}>Déposez votre premier brief aujourd'hui. Premiers profils sous 48h.</p>
          <Link href="/signup/brand" className="q-btn q-btn-primary anim-glow" style={{ fontSize: "14px", padding: "15px 36px" }}>Commencer gratuitement →</Link>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "14px" }}>5 crédits offerts · Aucune carte bancaire requise</p>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-border-base)", padding: "28px 40px", background: "var(--color-bg)" }}>
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
