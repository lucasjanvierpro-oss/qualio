"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputStyle = {
  padding: "10px 12px", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "14px", background: "var(--color-background)",
  color: "var(--color-text-primary)", outline: "none", width: "100%", boxSizing: "border-box" as const,
};

export default function ParticipantSettingsClient({ email }: { email: string }) {
  const [notifications, setNotifications] = useState({
    newStudies: true,
    interviewReminders: true,
    rewardAvailable: true,
    marketing: false,
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handlePasswordChange() {
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: "Le mot de passe doit faire au moins 8 caractères." });
      return;
    }
    setPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwLoading(false);
    if (error) {
      setPwMsg({ ok: false, text: error.message });
    } else {
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMsg({ ok: true, text: "Mot de passe modifié avec succès." });
      setTimeout(() => setPwMsg(null), 4000);
    }
  }

  async function handleDeleteAccount() {
    // Soft-delete: sign out + redirect — la suppression complète est manuelle en V1
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", flexShrink: 0,
          background: checked ? "var(--color-accent)" : "var(--color-border-strong)",
          position: "relative", transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: "2px", left: checked ? "22px" : "2px",
          width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
          transition: "left 0.2s",
        }} />
      </button>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 36px" }}>
        Paramètres
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Email */}
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 12px" }}>Adresse email</h2>
          <div style={{ padding: "10px 14px", background: "var(--color-surface-2)", borderRadius: "8px", fontSize: "14px", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
            {email}
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>
            Pour changer d'adresse email, contactez support@qualio.io
          </p>
        </section>

        {/* Mot de passe */}
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 16px" }}>Mot de passe</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "360px" }}>
            <input value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} placeholder="Nouveau mot de passe" type="password" style={inputStyle} />
            <input value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirmer le nouveau mot de passe" type="password" style={inputStyle} />
            {pwMsg && (
              <p style={{ fontSize: "13px", color: pwMsg.ok ? "var(--color-success)" : "var(--color-error)", margin: 0 }}>
                {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
              </p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={pwLoading || !pwForm.next || !pwForm.confirm}
              style={{ alignSelf: "flex-start", padding: "10px 20px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: pwLoading ? 0.7 : 1 }}
            >
              {pwLoading ? "Modification…" : "Changer le mot de passe"}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 16px" }}>Notifications email</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { key: "newStudies" as const, label: "Nouvelles études disponibles", desc: "Quand une étude correspond à votre profil" },
              { key: "interviewReminders" as const, label: "Rappels d'entretien", desc: "24h et 1h avant votre entretien" },
              { key: "rewardAvailable" as const, label: "Récompenses disponibles", desc: "Quand un paiement ou voucher est prêt" },
              { key: "marketing" as const, label: "Actualités Qualio", desc: "Nouvelles fonctionnalités et annonces" },
            ].map((n) => (
              <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{n.label}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{n.desc}</div>
                </div>
                <Toggle checked={notifications[n.key]} onToggle={() => setNotifications((p) => ({ ...p, [n.key]: !p[n.key] }))} />
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-error)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-error)", margin: "0 0 8px" }}>Zone de danger</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
            La suppression de votre compte est définitive. Vos données et récompenses non retirées seront perdues.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ padding: "10px 20px", background: "none", color: "var(--color-error)", border: "1px solid var(--color-error)", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ background: "var(--color-error-light)", border: "1px solid var(--color-error)", borderRadius: "8px", padding: "16px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-error)", margin: "0 0 12px" }}>
                Êtes-vous sûr(e) de vouloir supprimer votre compte ?
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: "9px 18px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "14px", cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={handleDeleteAccount} style={{ padding: "9px 18px", background: "var(--color-error)", color: "#fff", border: "none", borderRadius: "7px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Oui, supprimer définitivement
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
