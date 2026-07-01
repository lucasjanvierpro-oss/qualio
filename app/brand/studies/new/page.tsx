"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStudy } from "@/app/actions/studies";

type StudyData = {
  // Step 1 — Basics
  title: string;
  objective: string;
  studyType: "ONE_ON_ONE" | "FOCUS_GROUP";
  targetCount: number;
  language: string;
  // Step 2 — Participant Profile
  ageMin: number;
  ageMax: number;
  cities: string[];
  interests: string[];
  brandAffinities: string[];
  profession: string;
  customCriteria: string;
  exclusionCriteria: string;
  // Step 3 — Scheduling
  deadlineAt: string;
  interviewDuration: number;
  timeSlots: string[];
  // Step 4 — Rewards
  rewardType: "CASH" | "VOUCHER";
  rewardAmount: number;
  voucherBrand: string;
};

const EMPTY: StudyData = {
  title: "",
  objective: "",
  studyType: "ONE_ON_ONE",
  targetCount: 6,
  language: "fr",
  ageMin: 18,
  ageMax: 45,
  cities: [],
  interests: [],
  brandAffinities: [],
  profession: "",
  customCriteria: "",
  exclusionCriteria: "",
  deadlineAt: "",
  interviewDuration: 30,
  timeSlots: [],
  rewardType: "CASH",
  rewardAmount: 5000,
  voucherBrand: "",
};

const STEPS = ["Informations", "Profil cible", "Planification", "Récompense", "Récapitulatif"];

const CITIES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse", "Nantes", "Remote / Partout"];
const INTERESTS_LIST = ["Mode", "Streetwear", "Luxe", "Beauté", "Tech", "Musique", "Food", "Voyage", "Sport", "Gaming", "Design", "Développement durable"];
const REWARD_PRESETS = [2000, 3000, 5000, 7500, 10000]; // in cents

export default function NewStudyPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StudyData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const router = useRouter();

  function update(patch: Partial<StudyData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function toggleArr<K extends keyof StudyData>(key: K, val: string) {
    const arr = (data[key] as string[]);
    const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
    update({ [key]: next } as Partial<StudyData>);
  }

  function addBrand(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && brandInput.trim()) {
      e.preventDefault();
      const b = brandInput.trim();
      if (!data.brandAffinities.includes(b)) {
        update({ brandAffinities: [...data.brandAffinities, b] });
      }
      setBrandInput("");
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const { studyId } = await createStudy(data);
      router.push(`/brand/studies/${studyId}`);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "preview_mode") {
        router.push("/brand/account");
      } else {
        console.error(e);
        setSubmitting(false);
      }
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ maxWidth: "660px", margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          Nouvelle étude
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", margin: 0 }}>
          Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {/* Progress */}
      <div style={{ height: "4px", background: "var(--color-border-base)", borderRadius: "999px", marginBottom: "8px" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-accent)", borderRadius: "999px", transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "36px" }}>
        {STEPS.map((s, i) => (
          <span key={i} style={{ fontSize: "11px", color: i === step ? "var(--color-accent)" : i < step ? "var(--color-text-secondary)" : "var(--color-text-tertiary)", fontWeight: i === step ? 600 : 400, flex: 1, textAlign: "center" }}>
            {s}
          </span>
        ))}
      </div>

      {/* STEP 1 — Basics */}
      {step === 0 && (
        <div>
          <Field label="Titre de l'étude *">
            <input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ex : Perception du polo L.12.12 chez les 25–35 ans" style={inputStyle} />
          </Field>

          <Field label="Objectif de l'étude *">
            <textarea
              value={data.objective}
              onChange={(e) => update({ objective: e.target.value })}
              placeholder="Décrivez ce que vous cherchez à comprendre. Ex : Nous souhaitons explorer les perceptions de notre heritage Polo…"
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            {data.objective.length > 0 && data.objective.length < 50 && (
              <span style={{ fontSize: "12px", color: "var(--color-error)" }}>Minimum 50 caractères ({data.objective.length}/50)</span>
            )}
          </Field>

          <Field label="Type d'étude *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { value: "ONE_ON_ONE", label: "Entretien 1:1", desc: "Un participant à la fois, 30–60 min" },
                { value: "FOCUS_GROUP", label: "Focus group", desc: "4–8 participants ensemble, 90 min" },
              ].map((t) => (
                <button key={t.value} onClick={() => update({ studyType: t.value as "ONE_ON_ONE" | "FOCUS_GROUP" })}
                  style={{ padding: "14px", border: "1px solid", borderRadius: "8px", textAlign: "left", cursor: "pointer", borderColor: data.studyType === t.value ? "var(--color-accent)" : "var(--color-border-base)", background: data.studyType === t.value ? "var(--color-accent-light)" : "var(--color-surface)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: data.studyType === t.value ? "var(--color-accent)" : "var(--color-text-primary)", marginBottom: "3px" }}>{t.label}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label={`Nombre de participants cible : ${data.targetCount}`}>
              <input type="range" min={1} max={20} value={data.targetCount} onChange={(e) => update({ targetCount: +e.target.value })} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                <span>1</span><span>20</span>
              </div>
            </Field>
            <Field label="Langue préférée">
              <select value={data.language} onChange={(e) => update({ language: e.target.value })} style={inputStyle}>
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="both">Les deux</option>
              </select>
            </Field>
          </div>

          <NavButtons
            onNext={() => setStep(1)}
            nextDisabled={!data.title.trim() || data.objective.length < 50}
            showBack={false}
          />
        </div>
      )}

      {/* STEP 2 — Participant Profile */}
      {step === 1 && (
        <div>
          <Field label={`Tranche d'âge : ${data.ageMin}–${data.ageMax} ans`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Âge min</label>
                <input type="range" min={18} max={data.ageMax - 1} value={data.ageMin} onChange={(e) => update({ ageMin: +e.target.value })} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Âge max</label>
                <input type="range" min={data.ageMin + 1} max={65} value={data.ageMax} onChange={(e) => update({ ageMax: +e.target.value })} style={{ width: "100%" }} />
              </div>
            </div>
          </Field>

          <Field label="Villes / Régions (optionnel)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CITIES.map((c) => (
                <Chip key={c} label={c} selected={data.cities.includes(c)} onToggle={() => toggleArr("cities", c)} />
              ))}
            </div>
          </Field>

          <Field label="Centres d'intérêt cibles">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {INTERESTS_LIST.map((i) => (
                <Chip key={i} label={i} selected={data.interests.includes(i)} onToggle={() => toggleArr("interests", i)} />
              ))}
            </div>
          </Field>

          <Field label="Affinités marques requises">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px", border: "1px solid var(--color-border-base)", borderRadius: "8px", background: "var(--color-surface)", minHeight: "44px", alignItems: "center" }}>
              {data.brandAffinities.map((b) => (
                <span key={b} style={{ padding: "4px 10px", borderRadius: "999px", background: "var(--color-accent-light)", color: "var(--color-accent)", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  {b}
                  <button onClick={() => update({ brandAffinities: data.brandAffinities.filter((x) => x !== b) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)", fontSize: "14px", padding: 0 }}>×</button>
                </span>
              ))}
              <input value={brandInput} onChange={(e) => setBrandInput(e.target.value)} onKeyDown={addBrand} placeholder={data.brandAffinities.length === 0 ? "Lacoste, Nike, Sézane… + Entrée" : ""} style={{ border: "none", outline: "none", fontSize: "14px", flex: 1, minWidth: "120px", background: "transparent", color: "var(--color-text-primary)" }} />
            </div>
          </Field>

          <Field label="Type de profession (optionnel)">
            <input value={data.profession} onChange={(e) => update({ profession: e.target.value })} placeholder="Ex : Cadre, étudiant, indépendant…" style={inputStyle} />
          </Field>

          <Field label="Critères spécifiques (optionnel)">
            <textarea value={data.customCriteria} onChange={(e) => update({ customCriteria: e.target.value })} placeholder="Ex : Acheteurs Lacoste des 6 derniers mois, intéressés par le lifestyle tennis…" rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </Field>

          <Field label="Critères d'exclusion (optionnel)">
            <textarea value={data.exclusionCriteria} onChange={(e) => update({ exclusionCriteria: e.target.value })} placeholder="Ex : Exclure les participants ayant déjà participé à une étude Lacoste" rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </Field>

          <NavButtons onNext={() => setStep(2)} onBack={() => setStep(0)} />
        </div>
      )}

      {/* STEP 3 — Scheduling */}
      {step === 2 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Date limite souhaitée *">
              <input type="date" value={data.deadlineAt} onChange={(e) => update({ deadlineAt: e.target.value })} style={inputStyle} min={new Date().toISOString().split("T")[0]} />
            </Field>
            <Field label="Durée des entretiens">
              <select value={data.interviewDuration} onChange={(e) => update({ interviewDuration: +e.target.value })} style={inputStyle}>
                {[15, 30, 45, 60].map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Créneaux proposés (optionnel)">
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
              Ajoutez des créneaux pour aider les participants à choisir leurs disponibilités. Notre équipe peut aussi vous aider à planifier.
            </p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                type="datetime-local"
                id="slotInput"
                style={{ ...inputStyle, flex: 1 }}
                min={new Date().toISOString().slice(0, 16)}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("slotInput") as HTMLInputElement;
                  if (input?.value && !data.timeSlots.includes(input.value)) {
                    update({ timeSlots: [...data.timeSlots, input.value] });
                    input.value = "";
                  }
                }}
                style={{ padding: "10px 16px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}
              >
                + Ajouter
              </button>
            </div>
            {data.timeSlots.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.timeSlots.map((slot) => (
                  <div key={slot} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: "6px", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {new Date(slot).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {new Date(slot).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button onClick={() => update({ timeSlots: data.timeSlots.filter((s) => s !== slot) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "16px" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <NavButtons onNext={() => setStep(3)} onBack={() => setStep(1)} nextDisabled={!data.deadlineAt} />
        </div>
      )}

      {/* STEP 4 — Rewards */}
      {step === 3 && (
        <div>
          <Field label="Type de récompense *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { value: "CASH", label: "💸 Espèces", desc: "Virement bancaire via Stripe" },
                { value: "VOUCHER", label: "🎁 Bon d'achat", desc: "Amazon, Fnac, Zalando…" },
              ].map((t) => (
                <button key={t.value} onClick={() => update({ rewardType: t.value as "CASH" | "VOUCHER" })}
                  style={{ padding: "14px", border: "1px solid", borderRadius: "8px", textAlign: "left", cursor: "pointer", borderColor: data.rewardType === t.value ? "var(--color-accent)" : "var(--color-border-base)", background: data.rewardType === t.value ? "var(--color-accent-light)" : "var(--color-surface)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: data.rewardType === t.value ? "var(--color-accent)" : "var(--color-text-primary)", marginBottom: "3px" }}>{t.label}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          {data.rewardType === "VOUCHER" && (
            <Field label="Marque du bon d'achat">
              <select value={data.voucherBrand} onChange={(e) => update({ voucherBrand: e.target.value })} style={inputStyle}>
                <option value="">Choisir…</option>
                {["Amazon", "Fnac", "Zalando", "Monoprix", "Decathlon", "Autre"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Montant par participant *">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {REWARD_PRESETS.map((p) => (
                <button key={p} onClick={() => update({ rewardAmount: p })}
                  style={{ padding: "8px 16px", border: "1px solid", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-mono-base)", fontWeight: 600, fontSize: "15px", borderColor: data.rewardAmount === p ? "var(--color-accent)" : "var(--color-border-base)", background: data.rewardAmount === p ? "var(--color-accent)" : "var(--color-surface)", color: data.rewardAmount === p ? "#fff" : "var(--color-text-primary)" }}>
                  {p / 100}€
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Montant personnalisé :</span>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border-base)", borderRadius: "8px", overflow: "hidden" }}>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={data.rewardAmount / 100}
                  onChange={(e) => update({ rewardAmount: Math.round(+e.target.value * 100) })}
                  style={{ ...inputStyle, border: "none", width: "80px", borderRadius: 0, fontFamily: "var(--font-mono-base)", fontWeight: 600 }}
                />
                <span style={{ padding: "0 12px", background: "var(--color-surface-2)", fontSize: "14px", color: "var(--color-text-secondary)", alignSelf: "stretch", display: "flex", alignItems: "center" }}>€</span>
              </div>
            </div>
          </Field>

          <div style={{ padding: "16px", background: "var(--color-surface-2)", borderRadius: "8px", marginBottom: "32px" }}>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>Estimation du coût total en récompenses :</div>
            <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {((data.rewardAmount * data.targetCount) / 100).toFixed(0)}€
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
              {data.rewardAmount / 100}€ × {data.targetCount} participants (hors crédits de recrutement)
            </div>
          </div>

          <NavButtons onNext={() => setStep(4)} onBack={() => setStep(2)} />
        </div>
      )}

      {/* STEP 5 — Review & Submit */}
      {step === 4 && (
        <div>
          <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", margin: "0 0 28px" }}>
            Vérifiez les informations avant d'envoyer votre brief à notre équipe.
          </p>

          {/* Summary cards */}
          {[
            {
              title: "Étude",
              items: [
                ["Titre", data.title],
                ["Type", data.studyType === "ONE_ON_ONE" ? "Entretiens 1:1" : "Focus groups"],
                ["Participants", `${data.targetCount}`],
                ["Langue", data.language === "fr" ? "Français" : data.language === "en" ? "Anglais" : "Français & Anglais"],
              ],
            },
            {
              title: "Profil cible",
              items: [
                ["Âge", `${data.ageMin}–${data.ageMax} ans`],
                ["Villes", data.cities.length > 0 ? data.cities.join(", ") : "Non spécifié"],
                ["Intérêts", data.interests.length > 0 ? data.interests.join(", ") : "Non spécifié"],
                ["Marques", data.brandAffinities.length > 0 ? data.brandAffinities.join(", ") : "Non spécifié"],
              ],
            },
            {
              title: "Planning",
              items: [
                ["Date limite", data.deadlineAt ? new Date(data.deadlineAt).toLocaleDateString("fr-FR") : "Non spécifiée"],
                ["Durée", `${data.interviewDuration} min`],
                ["Créneaux proposés", `${data.timeSlots.length} créneau(x)`],
              ],
            },
            {
              title: "Récompense",
              items: [
                ["Type", data.rewardType === "CASH" ? "Espèces" : `Bon ${data.voucherBrand || ""}`],
                ["Montant / participant", `${data.rewardAmount / 100}€`],
                ["Budget total estimé", `${(data.rewardAmount * data.targetCount) / 100}€`],
              ],
            },
          ].map((section) => (
            <div key={section.title} style={{ marginBottom: "16px", padding: "16px", background: "var(--color-surface)", border: "1px solid var(--color-border-base)", borderRadius: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>{section.title}</div>
              {section.items.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>{k}</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 500, maxWidth: "55%", textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ padding: "14px 16px", background: "var(--color-warning-light)", border: "1px solid #9A670030", borderRadius: "8px", marginBottom: "28px" }}>
            <p style={{ fontSize: "13px", color: "var(--color-warning)", margin: 0 }}>
              <strong>1 crédit = 1 participant confirmé.</strong> Les crédits sont débités uniquement lorsque vous acceptez un profil proposé par notre équipe.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setStep(3)} style={backBtnStyle}>← Modifier</button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{ flex: 1, padding: "14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Envoi en cours…" : "Envoyer le brief →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px" }}>{label}</label>
      {children}
    </div>
  );
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "6px 14px",
        borderRadius: "999px",
        border: "1px solid",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        borderColor: selected ? "var(--color-accent)" : "var(--color-border-base)",
        background: selected ? "var(--color-accent)" : "var(--color-surface)",
        color: selected ? "#fff" : "var(--color-text-secondary)",
      }}
    >
      {label}
    </button>
  );
}

function NavButtons({ onNext, onBack, nextDisabled = false, showBack = true }: { onNext: () => void; onBack?: () => void; nextDisabled?: boolean; showBack?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
      {showBack && onBack && (
        <button onClick={onBack} style={backBtnStyle}>← Retour</button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{ flex: 1, padding: "14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: nextDisabled ? "not-allowed" : "pointer", opacity: nextDisabled ? 0.4 : 1 }}>
        Continuer →
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--color-border-base)",
  borderRadius: "8px",
  fontSize: "14px",
  color: "var(--color-text-primary)",
  background: "var(--color-surface)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const backBtnStyle: React.CSSProperties = {
  padding: "14px 20px",
  background: "transparent",
  color: "var(--color-text-secondary)",
  border: "1px solid var(--color-border-base)",
  borderRadius: "8px",
  fontSize: "15px",
  cursor: "pointer",
};
