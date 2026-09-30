"use client";

import { useState, useTransition, useRef } from "react";
import { updateParticipantProfile } from "@/app/actions/participant";
import { useTT } from "@/lib/i18n/client";

const INTERESTS_OPTIONS = ["Fashion", "Streetwear", "Luxury", "Beauty", "Tech", "Music", "Food", "Travel", "Sport", "Gaming", "Design", "Sustainability"];

type ProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  country: string;
  profession: string;
  bio: string;
  interests: string[];
  brandAffinities: string[];
  linkedinUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  idVerificationStatus: string;
  stripeConnectStatus: string | null;
};

const inputStyle = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)",
  color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const,
};

export default function ParticipantProfileClient({ profile }: { profile: ProfileData }) {
  const tt = useTT();
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth,
    city: profile.city,
    country: profile.country,
    profession: profile.profession,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    instagramUrl: profile.instagramUrl,
    tiktokUrl: profile.tiktokUrl,
  });
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [brandAffinities, setBrandAffinities] = useState<string[]>(profile.brandAffinities);
  const [newBrand, setNewBrand] = useState("");
  const [saved, setSaved]             = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [uploading, setUploading]     = useState(false);
  const [idStatus, setIdStatus]       = useState(profile.idVerificationStatus);
  const [uploadError, setUploadError] = useState("");
  const fileRef                       = useRef<HTMLInputElement>(null);

  const completionFields = [
    form.bio, form.city, form.profession, interests.length > 0,
    brandAffinities.length > 0, profile.idVerificationStatus === "VERIFIED",
    profile.stripeConnectStatus === "active",
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleInterest(i: string) {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
    setSaved(false);
  }

  function addBrand() {
    const b = newBrand.trim();
    if (b && !brandAffinities.includes(b)) setBrandAffinities((prev) => [...prev, b]);
    setNewBrand("");
    setSaved(false);
  }

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/participant/upload-id", { method: "POST", body: fd });
      if (res.ok) {
        setIdStatus("PENDING");
      } else {
        const data = await res.json() as { error: string };
        setUploadError(data.error === "too_large" ? tt("Fichier trop volumineux (max 10 Mo)", "File too large (10 MB max)") : data.error === "invalid_type" ? tt("Format non supporté (JPG, PNG, PDF)", "Unsupported format (JPG, PNG, PDF)") : tt("Erreur lors de l'envoi", "Upload error"));
      }
    } catch {
      setUploadError(tt("Erreur réseau", "Network error"));
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      await updateParticipantProfile({ ...form, interests, brandAffinities });
      setSaved(true);
    });
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
        {tt("Mon profil", "My profile")}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 28px" }}>
        {tt("Un profil complet augmente vos chances d'être sélectionné(e) pour des études.", "A complete profile increases your chances of being selected for studies.")}
      </p>

      {/* Barre de complétion */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "16px 20px", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{tt("Profil complété à", "Profile completed:")} {completionPct}%</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {profile.idVerificationStatus !== "VERIFIED" && tt("ID non vérifié · ", "ID not verified · ")}
            {profile.stripeConnectStatus !== "active" && tt("Compte bancaire non connecté", "Bank account not connected")}
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--color-surface-2)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${completionPct}%`, height: "100%", background: "var(--color-accent)", borderRadius: "999px", transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Infos personnelles */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid var(--color-border)" }}>
            {tt("Informations personnelles", "Personal information")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {([
              [tt("Prénom", "First name"), "firstName"],
              [tt("Nom", "Last name"), "lastName"],
              [tt("Date de naissance", "Date of birth"), "dateOfBirth", "date"],
              [tt("Profession", "Occupation"), "profession"],
              [tt("Ville", "City"), "city"],
              [tt("Pays", "Country"), "country"],
            ] as [string, keyof typeof form, string?][]).map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  type={type ?? "text"}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </section>

        {/* Centres d'intérêt */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid var(--color-border)" }}>
            {tt("Centres d'intérêt", "Interests")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
            {INTERESTS_OPTIONS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                style={{
                  padding: "7px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                  background: interests.includes(i) ? "var(--color-accent)" : "var(--color-surface)",
                  color: interests.includes(i) ? "#fff" : "var(--color-text-secondary)",
                  border: `1px solid ${interests.includes(i) ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {i}
              </button>
            ))}
          </div>

          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {tt("Affinités marques", "Favourite brands")}
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {brandAffinities.map((b) => (
              <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "999px", fontSize: "13px" }}>
                {b}
                <button onClick={() => { setBrandAffinities((p) => p.filter((x) => x !== b)); setSaved(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 0, fontSize: "14px", lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBrand()}
              placeholder={tt("Ajouter une marque…", "Add a brand…")}
              style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none" }}
            />
            <button onClick={addBrand} style={{ padding: "9px 16px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--color-text-primary)" }}>+</button>
          </div>
        </section>

        {/* Réseaux sociaux */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid var(--color-border)" }}>
            {tt("Réseaux sociaux", "Social media")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {([
              ["LinkedIn", "linkedinUrl", tt("linkedin.com/in/votre-profil", "linkedin.com/in/your-profile")],
              ["Instagram", "instagramUrl", tt("@votre_compte", "@your_account")],
              ["TikTok", "tiktokUrl", tt("@votre_compte", "@your_account")],
            ] as [string, keyof typeof form, string][]).map(([label, key, placeholder]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "80px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", flexShrink: 0 }}>{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none" }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Vérification d'identité */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-base)" }}>
            {tt("Vérification d'identité", "Identity verification")}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "16px", lineHeight: 1.6 }}>
            {tt("Votre document est chiffré et uniquement utilisé pour vérifier votre identité. Il ne sera jamais partagé avec les marques.", "Your document is encrypted and only used to verify your identity. It is never shared with brands.")}
          </p>

          {/* Status banner */}
          {idStatus === "VERIFIED" && (
            <div style={{ padding: "12px 16px", background: "var(--color-success-light)", border: "1px solid var(--color-success)", borderRadius: "3px", fontSize: "13px", color: "var(--color-success)", fontWeight: 600, marginBottom: "12px" }}>
              ✓ {tt("Identité vérifiée", "Identity verified")}
            </div>
          )}
          {idStatus === "PENDING" && (
            <div style={{ padding: "12px 16px", background: "var(--color-warning-light)", border: "1px solid var(--color-warning)", borderRadius: "3px", fontSize: "13px", color: "var(--color-warning)", fontWeight: 500, marginBottom: "12px" }}>
              {tt("Vérification en cours — généralement 24–48h", "Verification in progress, usually 24–48h")}
            </div>
          )}
          {idStatus === "REJECTED" && (
            <div style={{ padding: "12px 16px", background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "3px", fontSize: "13px", color: "var(--color-error)", fontWeight: 500, marginBottom: "12px" }}>
              {tt("Document refusé — veuillez renvoyer une pièce d'identité valide", "Document declined, please upload a valid ID")}
            </div>
          )}
          {uploadError && (
            <div style={{ padding: "10px 14px", background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "3px", fontSize: "12px", color: "var(--color-error)", marginBottom: "12px" }}>
              {uploadError}
            </div>
          )}

          {/* Upload zone */}
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleIdUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || idStatus === "VERIFIED"}
            className="q-btn q-btn-outline"
            style={{ fontSize: "13px", opacity: uploading || idStatus === "VERIFIED" ? 0.5 : 1 }}
          >
            {uploading
              ? tt("Envoi en cours…", "Uploading…")
              : idStatus === "VERIFIED"
              ? tt("Document vérifié ✓", "Document verified ✓")
              : idStatus === "PENDING"
              ? tt("Renvoyer le document", "Upload again")
              : tt("Envoyer ma pièce d'identité", "Upload my ID")}
          </button>
          <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "8px" }}>
            {tt("Formats acceptés : JPG, PNG, PDF · Max 10 Mo · Carte d'identité ou passeport", "Accepted formats: JPG, PNG, PDF · 10 MB max · ID card or passport")}
          </p>
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="q-btn q-btn-primary"
            style={{ fontSize: "14px" }}
          >
            {isPending ? tt("Enregistrement…", "Saving…") : tt("Enregistrer le profil", "Save profile")}
          </button>
          {saved && <span style={{ fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>✓ {tt("Profil mis à jour", "Profile updated")}</span>}
        </div>
      </div>
    </div>
  );
}
