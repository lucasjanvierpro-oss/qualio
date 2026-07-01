"use client";

import { useState } from "react";
import { createInviteCode, activateBrandManually } from "@/app/actions/inviteCodes";
import { useRouter } from "next/navigation";

type Code = { id: string; code: string; label: string; usedAt: string | null; expiresAt: string | null; createdAt: string };
type Brand = { id: string; companyName: string; email: string; createdAt: string };

export default function AdminAccessClient({
  codes,
  pendingBrands,
  activatedBrands,
}: {
  codes: Code[];
  pendingBrands: Brand[];
  activatedBrands: Brand[];
}) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localCodes, setLocalCodes] = useState(codes);
  const [activating, setActivating] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedCode(null);
    const invite = await createInviteCode(newLabel || undefined);
    setGeneratedCode(invite.code);
    setLocalCodes((prev) => [{
      id: invite.id,
      code: invite.code,
      label: invite.label ?? "",
      usedAt: null,
      expiresAt: null,
      createdAt: new Date(invite.createdAt).toLocaleDateString("fr-FR"),
    }, ...prev]);
    setNewLabel("");
    setGenerating(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleActivate(brandId: string) {
    setActivating(brandId);
    await activateBrandManually(brandId);
    setActivating(null);
    router.refresh();
  }

return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 800, color: "#F9F8F6", margin: "0 0 8px" }}>
        Gestion des accès
      </h1>
      <p style={{ fontSize: "13px", color: "#6B6760", margin: "0 0 36px" }}>
        Générez des codes d'invitation pour vos clients et gérez les accès preview.
      </p>

      {/* Generate new code */}
      <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#F9F8F6", margin: "0 0 18px" }}>Générer un nouveau code</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Nom du client (optionnel)
            </label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="ex: Lacoste, Jacquemus..."
              style={{ width: "100%", padding: "10px 12px", background: "#111110", border: "1px solid #2A2926", borderRadius: "8px", fontSize: "14px", color: "#F9F8F6", outline: "none", boxSizing: "border-box" }}
            />
          </div>
<button
            onClick={handleGenerate}
            disabled={generating}
            style={{ padding: "10px 24px", background: "#573E69", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: generating ? 0.7 : 1, whiteSpace: "nowrap" }}
          >
            {generating ? "Génération…" : "Générer le code"}
          </button>
        </div>

        {/* Generated code display */}
        {generatedCode && (
          <div style={{ marginTop: "20px", padding: "16px 20px", background: "#111110", border: "1px solid #573E69", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6B6760", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Code généré ✓</div>
              <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "22px", fontWeight: 700, color: "#E6EDE9", letterSpacing: "0.08em" }}>{generatedCode}</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => copyCode(generatedCode)}
                style={{ padding: "9px 18px", background: copied ? "#1A7A4A" : "#573E69", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
              <button
                onClick={() => {
                  const msg = `Bonjour,\n\nVoici votre code d'accès Qualio : ${generatedCode}\n\nPour activer votre compte :\n1. Rendez-vous sur qualio.io/signup/brand\n2. Créez votre compte\n3. Entrez le code lors de l'onboarding\n\nBonne utilisation,\nLucas — Qualio`;
                  navigator.clipboard.writeText(msg);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ padding: "9px 18px", background: "#111110", color: "#9E9B95", border: "1px solid #2A2926", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
              >
                Copier email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending brands (preview mode) */}
      {pendingBrands.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#F9F8F6", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            Comptes en preview
            <span style={{ background: "#9A6700", color: "#FDF3DC", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>{pendingBrands.length}</span>
          </h2>
          <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", overflow: "hidden" }}>
            {pendingBrands.map((b, i) => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 20px",
                borderTop: i > 0 ? "1px solid #2A2926" : "none",
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#F9F8F6" }}>{b.companyName}</div>
                  <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "2px" }}>{b.email} · Inscrit le {b.createdAt}</div>
                </div>
                <button
                  onClick={() => handleActivate(b.id)}
                  disabled={activating === b.id}
                  style={{ padding: "7px 16px", background: "#573E69", color: "#fff", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: activating === b.id ? 0.7 : 1 }}
                >
                  {activating === b.id ? "…" : "Activer manuellement"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activated brands */}
      {activatedBrands.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#F9F8F6", margin: "0 0 14px" }}>
            Comptes actifs ({activatedBrands.length})
          </h2>
          <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", overflow: "hidden" }}>
            {activatedBrands.map((b, i) => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 20px",
                borderTop: i > 0 ? "1px solid #2A2926" : "none",
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#F9F8F6" }}>{b.companyName}</div>
                  <div style={{ fontSize: "12px", color: "#6B6760" }}>{b.email}</div>
                </div>
                <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#1A7A4A20", color: "#1A7A4A", fontWeight: 600 }}>Actif</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Codes history */}
      {localCodes.length > 0 && (
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#F9F8F6", margin: "0 0 14px" }}>
            Codes générés ({localCodes.length})
          </h2>
          <div style={{ background: "#1A1917", border: "1px solid #2A2926", borderRadius: "10px", overflow: "hidden" }}>
            {localCodes.map((c, i) => {
              return (
                <div key={c.id} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  gap: "16px", padding: "12px 20px", alignItems: "center",
                  borderTop: i > 0 ? "1px solid #2A2926" : "none",
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono-base)", fontSize: "14px", fontWeight: 700, color: c.usedAt ? "#6B6760" : "#E6EDE9", letterSpacing: "0.05em" }}>{c.code}</div>
                    {c.label && <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "2px" }}>{c.label}</div>}
                  </div>
                  <span style={{ fontSize: "12px", color: c.usedAt ? "#1A7A4A" : "#9E9B95", fontWeight: c.usedAt ? 600 : 400 }}>
                    {c.usedAt ? `✓ Utilisé le ${c.usedAt}` : "Disponible"}
                  </span>
                  <button
                    onClick={() => copyCode(c.code)}
                    style={{ padding: "5px 12px", background: "transparent", border: "1px solid #2A2926", borderRadius: "6px", fontSize: "12px", color: "#9E9B95", cursor: "pointer" }}
                  >
                    Copier
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
