"use client";

import { useRef, useState } from "react";

// Carte badge upload (CV / portfolio) : envoie le fichier à Supabase Storage,
// analyse optionnelle par l'IA, puis marque le badge "Ajouté".
export default function BadgeUpload({
  label, kind, value, onChange, lang, accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
}: {
  label: string;
  kind: "cv" | "portfolio";
  value: string;
  onChange: (url: string) => void;
  lang: "fr" | "en";
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    try {
      const res = await fetch("/api/onboarding/upload-doc", { method: "POST", body: fd });
      const d = await res.json() as { url?: string; error?: string };
      if (d.url) {
        onChange(d.url);
        // Analyse IA en arrière-plan (nourrit le résumé marque)
        fetch("/api/onboarding/analyze-document", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: d.url }),
        }).catch(() => {});
      }
      else setError(d.error === "too_large" ? (lang === "fr" ? "Trop volumineux (max 10 Mo)" : "Too large (max 10MB)") : (lang === "fr" ? "Erreur" : "Error"));
    } catch {
      setError(lang === "fr" ? "Erreur réseau" : "Network error");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const done = !!value;
  return (
    <div className="q-card" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-plum)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: done ? "var(--color-success)" : "var(--color-text-tertiary)", marginTop: "3px" }}>
          {done ? (lang === "fr" ? "Ajouté ✓" : "Added ✓") : (lang === "fr" ? "Non ajouté" : "Not added")}
          {error && <span style={{ color: "var(--color-error)" }}> · {error}</span>}
        </div>
      </div>
      <input ref={ref} type="file" accept={accept} onChange={handle} style={{ display: "none" }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="q-btn" style={{ background: done ? "var(--color-accent-light)" : "var(--color-surface)", border: "1px solid var(--color-border-strong)", color: "var(--color-accent)", fontSize: "13px", whiteSpace: "nowrap" }}>
        {uploading ? (lang === "fr" ? "Envoi…" : "Uploading…") : done ? (lang === "fr" ? "Remplacer" : "Replace") : (lang === "fr" ? "Choisir" : "Choose")}
      </button>
    </div>
  );
}
