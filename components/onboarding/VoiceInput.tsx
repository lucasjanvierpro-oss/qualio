"use client";

import { useEffect, useRef, useState } from "react";

// Saisie texte + dictée vocale (Web Speech API, natif navigateur).
// Après dictée, un nettoyage IA optionnel supprime les hésitations.

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionType = any;

export default function VoiceInput({
  value, onChange, lang, placeholder, minChars = 40,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: "fr" | "en";
  placeholder?: string;
  minChars?: number;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const recRef = useRef<SpeechRecognitionType | null>(null);
  const baseRef = useRef("");

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  function toggle() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = lang === "fr" ? "fr-FR" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = value ? value + " " : "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      onChange((baseRef.current + interim).trimStart());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function clean() {
    if (!value.trim()) return;
    setCleaning(true);
    try {
      const res = await fetch("/api/onboarding/synthesize-voice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: value, language: lang }),
      });
      const d = await res.json() as { cleaned?: string };
      if (d.cleaned) onChange(d.cleaned);
    } catch { /* garde le texte brut */ }
    setCleaning(false);
  }

  const count = value.trim().length;
  const ok = count >= minChars;

  return (
    <div>
      <div style={{ position: "relative" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ width: "100%", padding: "12px 14px", paddingRight: "52px", border: "1px solid var(--color-border-base)", borderRadius: "12px", fontSize: "14px", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none", fontFamily: "var(--font-body)" }}
        />
        {supported && (
          <button type="button" onClick={toggle} title={listening ? "Arrêter" : "Dicter"} style={{
            position: "absolute", top: "10px", right: "10px", width: "34px", height: "34px", borderRadius: "50%",
            border: "none", cursor: "pointer", fontSize: "15px",
            background: listening ? "var(--color-error)" : "var(--color-accent-light)",
            color: listening ? "#fff" : "var(--color-accent)",
            animation: listening ? "pulse-dot 1.2s ease-in-out infinite" : "none",
          }}>🎤</button>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "11px", color: ok ? "var(--color-accent)" : "var(--color-text-tertiary)" }}>
          {listening ? (lang === "fr" ? "🔴 Enregistrement…" : "🔴 Recording…") : ok ? "✓" : `${count}/${minChars}`}
        </span>
        {supported && value.trim().length > 20 && (
          <button type="button" onClick={clean} disabled={cleaning} style={{ fontSize: "11px", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            {cleaning ? "…" : (lang === "fr" ? "✦ Nettoyer avec l'IA" : "✦ Clean up with AI")}
          </button>
        )}
      </div>
    </div>
  );
}
