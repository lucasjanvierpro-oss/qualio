"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/Logo";
import { detectLanguage, setLanguage, type Lang } from "@/lib/i18n/detect";
import { EMPTY_ONBOARDING, type OnboardingState } from "@/lib/onboarding/types";
import { computeScore, levelFromScore, LEVEL_META } from "@/lib/onboarding/scoring";
import { createFunnelAccount, saveFunnelStep } from "@/app/actions/funnel";

const DRAFT = "rarelyst_funnel_draft";

// ── Dictionnaire FR/EN (Bloc 1) ──────────────────────────────
const T = {
  fr: {
    createProfile: "Créez votre profil", firstName: "Prénom", lastName: "Nom", email: "Email",
    password: "Mot de passe", dob: "Date de naissance", gender: "Genre", city: "Ville", country: "Pays",
    continue: "Continuer", back: "Retour", min8: "8 caractères minimum",
    genders: ["Homme", "Femme", "Non-binaire", "Homme transgenre", "Femme transgenre", "Je préfère ne pas préciser"],
    gainTitle: "Ce que vous gagnez",
    gain1: "Entre 50 € et 150 € par entretien, viré directement sur votre compte bancaire",
    gain2: "Accès à des événements privés — avant-premières, soirées de lancement, fashion weeks",
    gain3: "Testez des pièces et collections avant leur sortie officielle",
    demoTitle: "Un peu plus sur vous", demoSub: "Ces informations aident les marques à trouver les bons profils.",
    employment: "Statut d'emploi", education: "Niveau d'éducation", income: "Revenu annuel du foyer",
    ethnicity: "Origine ethnique (optionnel)", select: "Sélectionner…",
    employmentOpts: ["Étudiant(e)", "CDI temps plein", "CDI temps partiel", "CDD", "Freelance / Indépendant(e)", "Cadre / Manager", "Directeur(rice) / C-level", "Auto-entrepreneur(e)", "Sans emploi — en recherche", "Sans emploi — pas en recherche", "Retraité(e)", "Autre"],
    educationOpts: ["Bac ou moins", "Bac +2 (BTS, DUT)", "Licence / Bachelor", "Master / Grande École", "Doctorat", "Formation pro / autodidacte"],
    incomeOpts: ["Moins de 20 000 €", "20 000 € – 35 000 €", "35 000 € – 55 000 €", "55 000 € – 80 000 €", "80 000 € – 120 000 €", "Plus de 120 000 €", "Je préfère ne pas répondre"],
    ethnicityOpts: ["Européen(ne) / Blanc(he)", "Afro-descendant(e)", "Maghrébin(e) / Moyen-Oriental(e)", "Asiatique", "Latino(a) / Hispanique", "Métis(se) / Mixte", "Autre", "Je préfère ne pas répondre"],
    univTitle: "Quels univers vous correspondent le mieux ?",
    macroOpts: ["Luxe & Haute couture", "Streetwear & Sneakers premium", "Mode contemporaine française", "Mode contemporaine internationale", "Prêt-à-porter sport premium", "Vintage & Seconde main"],
    brandsTitle: "Quelles marques suivez-vous ou connaissez-vous bien ?", addBrand: "Ajouter une marque…",
    engageTitle: "Comment vous engagez-vous avec ces marques ?",
    engageOpts: ["Je suis leurs collections et défilés", "J'assiste à leurs événements", "J'achète régulièrement leurs produits", "Je fais de la veille (newsletters, Instagram…)", "Je travaille ou ai travaillé avec elles", "Je revends / collecte leurs pièces", "Je les recommande à mon entourage"],
    profileLevel: "Niveau de profil", emailBanner: "Vérifiez votre email pour activer votre compte — vous pouvez continuer.",
    min1: "Sélectionnez au moins un univers.",
  },
  en: {
    createProfile: "Create your profile", firstName: "First name", lastName: "Last name", email: "Email",
    password: "Password", dob: "Date of birth", gender: "Gender", city: "City", country: "Country",
    continue: "Continue", back: "Back", min8: "8 characters minimum",
    genders: ["Man", "Woman", "Non-binary", "Transgender man", "Transgender woman", "Prefer not to say"],
    gainTitle: "What you gain",
    gain1: "Earn between €50 and €150 per interview, wired directly to your bank account",
    gain2: "Access to private events — previews, launch parties, fashion weeks",
    gain3: "Test pieces and collections before their official release",
    demoTitle: "A bit more about you", demoSub: "This helps brands find the right profiles.",
    employment: "Employment status", education: "Education level", income: "Annual household income",
    ethnicity: "Ethnicity (optional)", select: "Select…",
    employmentOpts: ["Student", "Full-time employee", "Part-time employee", "Fixed-term contract", "Freelancer / Self-employed", "Manager", "Director / C-level", "Sole trader", "Unemployed, looking", "Unemployed, not looking", "Retired", "Other"],
    educationOpts: ["High school or below", "Associate degree", "Bachelor's degree", "Master's degree", "PhD", "Vocational / Self-taught"],
    incomeOpts: ["Under €20,000", "€20,000 – €35,000", "€35,000 – €55,000", "€55,000 – €80,000", "€80,000 – €120,000", "Over €120,000", "Prefer not to say"],
    ethnicityOpts: ["European / White", "Black / African descent", "North African / Middle Eastern", "Asian", "Latino / Hispanic", "Mixed / Multiracial", "Other", "Prefer not to say"],
    univTitle: "Which universes best describe you?",
    macroOpts: ["Luxury & Haute couture", "Streetwear & Premium sneakers", "French contemporary fashion", "International contemporary fashion", "Premium sportswear", "Vintage & Resale"],
    brandsTitle: "Which brands do you follow or know well?", addBrand: "Add a brand…",
    engageTitle: "How do you engage with these brands?",
    engageOpts: ["I follow their collections and shows", "I attend their events", "I buy their products regularly", "I do active trend-watching", "I work or have worked with them", "I resell / collect their pieces", "I recommend them to my network"],
    profileLevel: "Profile level", emailBanner: "Verify your email to activate your account — you can continue.",
    min1: "Select at least one universe.",
  },
} as const;

// Marques par univers (index macro → liste)
const BRANDS: Record<number, string[]> = {
  0: ["Chanel", "Dior", "Hermès", "Louis Vuitton", "Bottega Veneta", "Céline", "Saint Laurent", "Loewe", "Balenciaga", "Jacquemus", "Rick Owens", "Maison Margiela"],
  1: ["Lacoste", "Nike", "Adidas Originals", "New Balance", "Casablanca", "Ami Paris", "Stone Island", "Represent", "Palace", "Supreme", "Kith", "AWAKE NY"],
  2: ["Jacquemus", "A.P.C.", "Sézane", "Isabel Marant", "Rouje", "Maison Kitsuné", "Officine Générale", "AMI Paris", "Lemaire"],
  3: ["Totême", "Acne Studios", "COS", "Nanushka", "Theory", "Aesop", "Margaret Howell"],
  4: ["Stone Island", "Moncler", "Arc'teryx", "Salomon", "On Running"],
  5: ["Vestiaire Collective", "Vinted", "Grailed", "Depop", "Archive fashion"],
};

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1px solid var(--color-border-base)",
  borderRadius: "12px", fontSize: "14px", background: "var(--color-surface)",
  color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "9px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
      border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-base)"}`,
      background: active ? "var(--color-accent)" : "var(--color-surface)",
      color: active ? "#fff" : "var(--color-text-secondary)", transition: "all 0.15s",
    }}>{children}</button>
  );
}

const SCREENS = ["account", "gain", "demographics", "universes"] as const;

export default function ParticipantFunnel() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [screen, setScreen] = useState(0);
  const [data, setData] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [account, setAccount] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  const t = T[lang];

  const demoFields: { label: string; opts: readonly string[]; key: keyof OnboardingState }[] = [
    { label: t.employment, opts: t.employmentOpts, key: "employmentStatus" },
    { label: t.education, opts: t.educationOpts, key: "educationLevel" },
    { label: t.income, opts: t.incomeOpts, key: "householdIncome" },
    { label: t.ethnicity, opts: t.ethnicityOpts, key: "ethnicity" },
  ];

  useEffect(() => {
    setLang(detectLanguage());
    try {
      const raw = localStorage.getItem(DRAFT);
      if (raw) {
        const p = JSON.parse(raw) as { data: OnboardingState; screen: number; accountCreated: boolean };
        if (p.data) { setData({ ...EMPTY_ONBOARDING, ...p.data }); setScreen(p.screen ?? 0); setAccountCreated(!!p.accountCreated); }
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DRAFT, JSON.stringify({ data, screen, accountCreated })); } catch { /* noop */ }
  }, [data, screen, accountCreated]);

  const score = computeScore(data);
  const level = levelFromScore(score);
  const progress = Math.round(((screen + 1) / 9) * 100); // 9 étapes au total à terme

  function up(patch: Partial<OnboardingState>) { setData((d) => ({ ...d, ...patch })); }
  function toggle<K extends keyof OnboardingState>(key: K, val: string) {
    setData((d) => {
      const arr = (d[key] as unknown as string[]) ?? [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...d, [key]: next };
    });
  }

  async function next() {
    setError("");
    // Étape 0 : créer le compte
    if (SCREENS[screen] === "account" && !accountCreated) {
      setLoading(true);
      const res = await createFunnelAccount({
        firstName: data.firstName, lastName: data.lastName, email: account.email, password: account.password,
        dateOfBirth: data.dateOfBirth, gender: data.gender, city: data.city, country: data.country,
      });
      setLoading(false);
      if ("error" in res) { setError(res.error); return; }
      setAccountCreated(true);
      setScreen((s) => s + 1);
      return;
    }
    // Univers : min 1
    if (SCREENS[screen] === "universes" && data.macroUniverses.length === 0) { setError(t.min1); return; }

    // Sauvegarde progressive (si connecté)
    if (accountCreated) { saveFunnelStep(screen, data).catch(() => {}); }

    if (screen < SCREENS.length - 1) setScreen((s) => s + 1);
    else router.push("/participant/dashboard"); // fin du Bloc 1 pour l'instant
  }

  const cur = SCREENS[screen];
  const accountOk = data.firstName.trim() && data.lastName.trim() && account.email.includes("@") && account.password.length >= 8 && data.dateOfBirth && data.gender && data.city.trim();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Header */}
      <div style={{ width: "100%", background: "rgba(247,240,250,0.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--color-border-base)", padding: "0 28px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
        <Logo variant="light" size="sm" href="/" />
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {(["fr", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => { setLang(l); setLanguage(l); }} style={{ fontSize: "12px", fontWeight: lang === l ? 700 : 400, color: lang === l ? "var(--color-accent)" : "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Progress + niveau */}
      <div style={{ width: "100%", maxWidth: "640px", padding: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-plum)" }}>{lang === "fr" ? "Profil complété à" : "Profile"} {progress}%</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: LEVEL_META[level].color }}>{LEVEL_META[level].icon} {t.profileLevel}: {LEVEL_META[level].label}</span>
        </div>
        <div style={{ height: "6px", background: "var(--color-border-base)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, #8765D7, ${LEVEL_META[level].color})`, borderRadius: "999px", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {accountCreated && (
        <div style={{ maxWidth: "640px", margin: "12px 24px 0", padding: "8px 14px", borderRadius: "999px", background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", fontSize: "12px", color: "var(--color-warning)" }}>
          {t.emailBanner}
        </div>
      )}

      <div key={cur} className="anim-up" style={{ width: "100%", maxWidth: "640px", padding: "28px 24px 80px" }}>

        {/* ── Étape 0 : compte ── */}
        {cur === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-plum-deep)", margin: 0 }}>{t.createProfile}</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>{t.firstName}</label><input style={inp} value={data.firstName} onChange={(e) => up({ firstName: e.target.value })} /></div>
              <div><label style={lbl}>{t.lastName}</label><input style={inp} value={data.lastName} onChange={(e) => up({ lastName: e.target.value })} /></div>
            </div>
            <div><label style={lbl}>{t.email}</label><input type="email" style={inp} value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} /></div>
            <div><label style={lbl}>{t.password}</label><input type="password" style={inp} value={account.password} onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))} placeholder={t.min8} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>{t.dob}</label><input type="date" style={inp} value={data.dateOfBirth} onChange={(e) => up({ dateOfBirth: e.target.value })} /></div>
              <div><label style={lbl}>{t.gender}</label>
                <select style={{ ...inp, cursor: "pointer" }} value={data.gender} onChange={(e) => up({ gender: e.target.value })}>
                  <option value="">{t.select}</option>{t.genders.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={lbl}>{t.city}</label><input style={inp} value={data.city} onChange={(e) => up({ city: e.target.value })} /></div>
              <div><label style={lbl}>{t.country}</label><input style={inp} value={data.country} onChange={(e) => up({ country: e.target.value })} /></div>
            </div>
          </div>
        )}

        {/* ── Écran A : gains ── */}
        {cur === "gain" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-plum-deep)", margin: "0 0 8px" }}>{t.gainTitle}</h1>
            {[["💶", t.gain1], ["🎫", t.gain2], ["📦", t.gain3]].map(([icon, txt], i) => (
              <div key={i} className="q-card hover-glow" style={{ display: "flex", gap: "16px", alignItems: "center", padding: "20px 22px" }}>
                <span style={{ fontSize: "28px" }}>{icon}</span>
                <span style={{ fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.5, fontWeight: 500 }}>{txt}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Étape 1 : démographie ── */}
        {cur === "demographics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div><h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-plum-deep)", margin: "0 0 4px" }}>{t.demoTitle}</h1>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>{t.demoSub}</p></div>
            {demoFields.map((f) => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <select style={{ ...inp, cursor: "pointer" }} value={data[f.key] as string} onChange={(e) => up({ [f.key]: e.target.value } as Partial<OnboardingState>)}>
                  <option value="">{t.select}</option>{f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* ── Étape 2 : univers ── */}
        {cur === "universes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-plum-deep)", margin: "0 0 12px" }}>{t.univTitle}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {t.macroOpts.map((u, i) => <Chip key={u} active={data.macroUniverses.includes(String(i))} onClick={() => toggle("macroUniverses", String(i))}>{u}</Chip>)}
              </div>
            </div>
            {data.macroUniverses.length > 0 && (
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-plum)", margin: "0 0 10px" }}>{t.brandsTitle}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[...new Set(data.macroUniverses.flatMap((i) => BRANDS[Number(i)] ?? []))].map((b) => (
                    <Chip key={b} active={data.brandAffinities.includes(b)} onClick={() => toggle("brandAffinities", b)}>{b}</Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-plum)", margin: "0 0 10px" }}>{t.engageTitle}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {t.engageOpts.map((e) => <Chip key={e} active={data.engagementTypes.includes(e)} onClick={() => toggle("engagementTypes", e)}>{e}</Chip>)}
              </div>
            </div>
          </div>
        )}

        {error && <p style={{ color: "var(--color-error)", fontSize: "13px", marginTop: "14px" }}>{error}</p>}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "10px", marginTop: "26px" }}>
          {screen > 0 && <button onClick={() => setScreen((s) => s - 1)} className="q-btn" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", color: "var(--color-plum)" }}>{t.back}</button>}
          <button onClick={next} disabled={loading || (cur === "account" && !accountOk)} className="q-btn q-btn-primary" style={{ flex: 1, opacity: loading || (cur === "account" && !accountOk) ? 0.6 : 1 }}>
            {loading ? "…" : t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
