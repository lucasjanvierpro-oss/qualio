"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboardingProfile } from "@/app/actions/onboarding";

export type OnboardingData = {
  // Étape 1 — Identité
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  country: string;
  profession: string;
  yearsOfExperience: string;

  // Étape 2 — Parcours professionnel (open-text)
  careerPath: string;
  professionalBio: string;

  // Étape 3 — Rapport au style (open-text + logistique)
  styleRelationship: string;
  shoppingBudgetRange: string;
  shoppingChannels: string;

  // Étape 4 — Expertise (open-text)
  expertise: string;

  // Étape 5 — Vision du marché (open-text)
  marketVision: string;

  // Étape 6 — Dernier achat (open-text)
  lastPurchase: string;

  // Étape 7 — Présence sociale & disponibilités
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  followerRange: string;
  socialDescription: string;
  availability: Record<string, string[]>;
};

const EMPTY: OnboardingData = {
  firstName: "", lastName: "", dateOfBirth: "", city: "", country: "FR",
  profession: "", yearsOfExperience: "",
  careerPath: "", professionalBio: "",
  styleRelationship: "", shoppingBudgetRange: "", shoppingChannels: "",
  expertise: "",
  marketVision: "",
  lastPurchase: "",
  instagramUrl: "", tiktokUrl: "", linkedinUrl: "",
  followerRange: "", socialDescription: "",
  availability: {},
};

const STEPS = [
  "Identité",
  "Parcours",
  "Style & shopping",
  "Expertise",
  "Vision marché",
  "Dernier achat",
  "Présence sociale",
];

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1px solid var(--color-border)", borderRadius: "8px",
  fontSize: "14px", background: "var(--color-background)",
  color: "var(--color-text-primary)", outline: "none",
  boxSizing: "border-box",
};

const ta: React.CSSProperties = {
  ...inp, resize: "vertical", minHeight: "120px", lineHeight: 1.6, fontFamily: "inherit",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "var(--color-text-secondary)", textTransform: "uppercase",
  letterSpacing: "0.04em", marginBottom: "6px",
};

const hint: React.CSSProperties = {
  fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "6px", lineHeight: 1.5,
};

function Field({ labelText, children, hintText }: { labelText: string; children: React.ReactNode; hintText?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={label}>{labelText}</label>
      {children}
      {hintText && <p style={hint}>{hintText}</p>}
    </div>
  );
}

function ContinueBtn({ disabled, onClick, loading }: { disabled: boolean; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px",
        background: disabled ? "var(--color-border-strong)" : "var(--color-accent)",
        color: disabled ? "var(--color-text-tertiary)" : "#fff",
        border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600,
        cursor: disabled ? "default" : "pointer", transition: "background 0.15s",
      }}
    >
      {loading ? "Enregistrement…" : "Continuer →"}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", padding: "4px 0" }}>
      ← Retour
    </button>
  );
}

// ─── STEPS ────────────────────────────────────────────────

function Step1({ data, update, onNext }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void }) {
  const ok = data.firstName.trim() && data.lastName.trim() && data.dateOfBirth && data.city.trim() && data.profession.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Commençons par vous</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Ces informations resteront confidentielles et ne seront jamais partagées avec les marques.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <Field labelText="Prénom *">
          <input style={inp} value={data.firstName} onChange={(e) => update({ firstName: e.target.value })} placeholder="Camille" />
        </Field>
        <Field labelText="Nom *">
          <input style={inp} value={data.lastName} onChange={(e) => update({ lastName: e.target.value })} placeholder="Martin" />
        </Field>
      </div>
      <Field labelText="Date de naissance *">
        <input style={inp} type="date" value={data.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} max="2006-01-01" />
      </Field>
      <Field labelText="Ville *">
        <input style={inp} value={data.city} onChange={(e) => update({ city: e.target.value })} placeholder="Paris" />
      </Field>
      <Field labelText="Fonction / métier actuel *">
        <input style={inp} value={data.profession} onChange={(e) => update({ profession: e.target.value })} placeholder="Stylist, Buyer, Journaliste mode, DA, Étudiant…" />
      </Field>
      <Field labelText="Années d'expérience dans la mode / lifestyle" hintText="Approximatif — laissez vide si vous débutez">
        <input style={inp} type="number" min="0" max="40" value={data.yearsOfExperience} onChange={(e) => update({ yearsOfExperience: e.target.value })} placeholder="5" />
      </Field>
      <ContinueBtn disabled={!ok} onClick={onNext} />
    </div>
  );
}

function Step2({ data, update, onNext, onBack }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const ok = data.careerPath.trim().length >= 80;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Votre parcours</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Racontez-nous votre histoire dans l'univers de la mode, du luxe ou du style.</p>
      </div>
      <Field
        labelText="Décrivez votre parcours professionnel *"
        hintText={`Comment êtes-vous arrivé(e) là où vous en êtes ? Quelles expériences, rencontres ou obsessions ont façonné votre regard ? Minimum 80 caractères. (${data.careerPath.trim().length}/80)`}
      >
        <textarea
          style={ta}
          value={data.careerPath}
          onChange={(e) => update({ careerPath: e.target.value })}
          placeholder="J'ai commencé à travailler dans le retail à 19 ans, puis j'ai rejoint un showroom parisien où j'ai développé une vraie connaissance du prêt-à-porter contemporain..."
        />
      </Field>
      <Field
        labelText="Note biographique courte (visible sur votre profil)"
        hintText="2-3 phrases résumant qui vous êtes professionnellement. Optionnel."
      >
        <textarea
          style={{ ...ta, minHeight: "80px" }}
          value={data.professionalBio}
          onChange={(e) => update({ professionalBio: e.target.value })}
          placeholder="Stylist indépendante spécialisée streetwear et luxe accessible. 7 ans d'expérience entre Paris et Milan."
        />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ContinueBtn disabled={!ok} onClick={onNext} />
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

function Step3({ data, update, onNext, onBack }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const ok = data.styleRelationship.trim().length >= 80;
  const budgets = ["Moins de 100€/mois", "100–300€/mois", "300–600€/mois", "600€–1 500€/mois", "1 500€+/mois"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Votre rapport au style</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Comment la mode s'inscrit-elle dans votre quotidien ?</p>
      </div>
      <Field
        labelText="Décrivez votre relation à la mode et au style *"
        hintText={`Comment achetez-vous ? Quelles tendances vous intéressent ? Quelle est votre démarche quand vous découvrez une nouvelle marque ? Minimum 80 caractères. (${data.styleRelationship.trim().length}/80)`}
      >
        <textarea
          style={ta}
          value={data.styleRelationship}
          onChange={(e) => update({ styleRelationship: e.target.value })}
          placeholder="La mode pour moi c'est avant tout une forme d'expression quotidienne. Je ne suis pas les tendances aveuglement — je picore chez des marques indépendantes que j'ai découvertes avant qu'elles explosent..."
        />
      </Field>
      <Field labelText="Budget mode mensuel approximatif">
        <select
          style={{ ...inp, cursor: "pointer" }}
          value={data.shoppingBudgetRange}
          onChange={(e) => update({ shoppingBudgetRange: e.target.value })}
        >
          <option value="">Sélectionner…</option>
          {budgets.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>
      <Field
        labelText="Où achetez-vous principalement ?"
        hintText="Boutiques physiques, e-commerce, resale, dépôt-vente, marchés… Soyez précis."
      >
        <input
          style={inp}
          value={data.shoppingChannels}
          onChange={(e) => update({ shoppingChannels: e.target.value })}
          placeholder="Boutiques multimarques indépendantes, Vinted pour les archives, directement chez les créateurs…"
        />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ContinueBtn disabled={!ok} onClick={onNext} />
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

function Step4({ data, update, onNext, onBack }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const ok = data.expertise.trim().length >= 80;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Votre expertise</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Ce que vous maîtrisez vraiment — sans fausse modestie, sans exagération.</p>
      </div>
      <Field
        labelText="Sur quoi avez-vous une vraie expertise ? *"
        hintText={`Citez des marques spécifiques, des créateurs, des pièces, des catégories. On cherche quelqu'un capable d'analyser avec précision, pas de citer les grandes maisons. Minimum 80 caractères. (${data.expertise.trim().length}/80)`}
      >
        <textarea
          style={{ ...ta, minHeight: "140px" }}
          value={data.expertise}
          onChange={(e) => update({ expertise: e.target.value })}
          placeholder="Je suis expert(e) du streetwear premium et des collaborations limitées. Je connais bien l'écosystème Salehe Bembury, Wales Bonner, et les marques émergentes comme Aimé Leon Dore ou Corteiz avant qu'elles arrivent en Europe..."
        />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ContinueBtn disabled={!ok} onClick={onNext} />
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

function Step5({ data, update, onNext, onBack }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const ok = data.marketVision.trim().length >= 60;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Vision du marché</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Êtes-vous du genre à voir les choses avant les autres ?</p>
      </div>
      <Field
        labelText="Donnez un exemple de tendance, marque ou mouvement que vous avez identifié avant qu'il soit mainstream *"
        hintText={`Soyez concret : quelle tendance, à quelle époque, comment l'avez-vous repérée ? Minimum 60 caractères. (${data.marketVision.trim().length}/60)`}
      >
        <textarea
          style={{ ...ta, minHeight: "140px" }}
          value={data.marketVision}
          onChange={(e) => update({ marketVision: e.target.value })}
          placeholder="En 2022 j'ai commencé à parler de l'esthétique 'quiet luxury' bien avant que le terme n'existe dans les médias. Je voyais des clients de 30+ ans abandonner les logos visibles pour des pièces intemporelles..."
        />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ContinueBtn disabled={!ok} onClick={onNext} />
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

function Step6({ data, update, onNext, onBack }: { data: OnboardingData; update: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const ok = data.lastPurchase.trim().length >= 60;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Votre dernier achat</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Une question concrète pour mieux vous comprendre.</p>
      </div>
      <Field
        labelText="Décrivez votre dernier achat mode ou lifestyle *"
        hintText={`Quoi, où, combien, pourquoi ce choix plutôt qu'un autre ? Ce que ça dit de vous. Minimum 60 caractères. (${data.lastPurchase.trim().length}/60)`}
      >
        <textarea
          style={{ ...ta, minHeight: "140px" }}
          value={data.lastPurchase}
          onChange={(e) => update({ lastPurchase: e.target.value })}
          placeholder="J'ai acheté une veste vintage Helmut Lang des années 90 sur Vestiaire Collective pour 280€. Je la cherchais depuis 6 mois — cette coupe structurée et ce traitement du cuir sont impossibles à retrouver aujourd'hui..."
        />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ContinueBtn disabled={!ok} onClick={onNext} />
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const SLOTS = ["Matin (9h–12h)", "Après-midi (13h–17h)", "Soir (18h–20h)"];

function Step7({ data, update, onFinish, onBack, saving }: {
  data: OnboardingData;
  update: (p: Partial<OnboardingData>) => void;
  onFinish: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  function toggleAvail(day: string, slot: string) {
    const current = data.availability[day] ?? [];
    const next = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot];
    update({ availability: { ...data.availability, [day]: next } });
  }

  const followers = ["Compte privé / <1 000", "1 000–10 000", "10 000–50 000", "50 000–200 000", "200 000+"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px" }}>Présence sociale & disponibilités</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>Dernière étape. Ces infos nous aident à vous matcher avec les bonnes études.</p>
      </div>

      {/* Réseaux sociaux */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Vos réseaux sociaux</p>
        <Field labelText="Instagram" hintText="Les marques ne vous contacteront jamais directement.">
          <input style={inp} value={data.instagramUrl} onChange={(e) => update({ instagramUrl: e.target.value })} placeholder="@votrecompte ou https://instagram.com/…" />
        </Field>
        <Field labelText="TikTok">
          <input style={inp} value={data.tiktokUrl} onChange={(e) => update({ tiktokUrl: e.target.value })} placeholder="@votrecompte ou https://tiktok.com/@…" />
        </Field>
        <Field labelText="LinkedIn">
          <input style={inp} value={data.linkedinUrl} onChange={(e) => update({ linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/…" />
        </Field>
        <Field labelText="Nombre d'abonnés (réseau principal)">
          <select style={{ ...inp, cursor: "pointer" }} value={data.followerRange} onChange={(e) => update({ followerRange: e.target.value })}>
            <option value="">Sélectionner…</option>
            {followers.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field labelText="Décrivez votre audience ou niche si pertinent" hintText="Optionnel — ex: 'Compte dédié au streetwear vintage, audience 18-28 ans parisiens'">
          <textarea
            style={{ ...ta, minHeight: "70px" }}
            value={data.socialDescription}
            onChange={(e) => update({ socialDescription: e.target.value })}
            placeholder="Compte dédié au streetwear premium et aux sneakers, communauté de 8k passionnés…"
          />
        </Field>
      </div>

      {/* Disponibilités */}
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 12px" }}>Disponibilités pour les entretiens</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 600 }}></th>
                {DAYS.map((d) => (
                  <th key={d} style={{ padding: "8px 10px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "center" }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <td style={{ padding: "6px 12px 6px 0", fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{slot}</td>
                  {DAYS.map((day) => {
                    const active = (data.availability[day] ?? []).includes(slot);
                    return (
                      <td key={day} style={{ padding: "4px 8px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleAvail(day, slot)}
                          style={{
                            width: "28px", height: "28px", borderRadius: "6px", border: "1px solid",
                            borderColor: active ? "var(--color-accent)" : "var(--color-border)",
                            background: active ? "var(--color-accent)" : "transparent",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...hint, marginTop: "10px" }}>Cliquez les cases pour indiquer vos créneaux disponibles.</p>
      </div>

      <div style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-accent)", borderRadius: "10px", padding: "16px 20px" }}>
        <p style={{ fontSize: "13px", color: "var(--color-accent)", margin: 0, lineHeight: 1.6 }}>
          <strong>Presque terminé !</strong> Après validation, notre équipe analysera votre profil et vous contactera dès qu'une étude correspond à votre expertise. Vous pourrez compléter vos informations à tout moment.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={onFinish}
          disabled={saving}
          style={{
            width: "100%", padding: "14px",
            background: "var(--color-accent)", color: "#fff",
            border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600,
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Finalisation…" : "Finaliser mon profil"}
        </button>
        <BackBtn onClick={onBack} />
      </div>
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function finish() {
    setSaving(true);
    try {
      await saveOnboardingProfile(data);
      router.push("/participant/dashboard");
    } catch {
      setSaving(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Header */}
      <div style={{ width: "100%", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-text-primary)" }}>Qualio</span>
        <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
          Étape {step + 1} / {STEPS.length} — {STEPS[step]}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: "3px", background: "var(--color-border)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-accent)", transition: "width 0.3s ease" }} />
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: "8px", padding: "20px 0 4px", alignItems: "center" }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? "24px" : "8px", height: "8px", borderRadius: "999px",
            background: i <= step ? "var(--color-accent)" : "var(--color-border-strong)",
            transition: "all 0.3s ease", opacity: i > step ? 0.4 : 1,
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: "600px", padding: "32px 24px 80px" }}>
        {step === 0 && <Step1 data={data} update={update} onNext={next} />}
        {step === 1 && <Step2 data={data} update={update} onNext={next} onBack={back} />}
        {step === 2 && <Step3 data={data} update={update} onNext={next} onBack={back} />}
        {step === 3 && <Step4 data={data} update={update} onNext={next} onBack={back} />}
        {step === 4 && <Step5 data={data} update={update} onNext={next} onBack={back} />}
        {step === 5 && <Step6 data={data} update={update} onNext={next} onBack={back} />}
        {step === 6 && <Step7 data={data} update={update} onFinish={finish} onBack={back} saving={saving} />}
      </div>
    </div>
  );
}
