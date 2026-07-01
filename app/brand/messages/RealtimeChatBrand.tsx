"use client";

import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";

type Thread = {
  id: string;
  study: string;
  status: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:       { bg: "var(--color-surface-2)", text: "var(--color-text-tertiary)", label: "Brouillon" },
  ACTIVE:      { bg: "var(--color-success-light)", text: "var(--color-success)", label: "Actif" },
  MATCHING:    { bg: "var(--color-warning-light)", text: "var(--color-warning)", label: "Matching" },
  IN_PROGRESS: { bg: "var(--color-info-light)", text: "var(--color-info)", label: "En cours" },
  COMPLETED:   { bg: "var(--color-surface-2)", text: "var(--color-text-secondary)", label: "Terminé" },
  CANCELLED:   { bg: "var(--color-error-light)", text: "var(--color-error)", label: "Annulé" },
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ChatThread({ studyId }: { studyId: string }) {
  const { messages, sendMessage } = useMessages(studyId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text, "BRAND");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-tertiary)", fontSize: "14px" }}>
            Aucun message pour le moment. Posez une question à l'équipe Qualio.
          </div>
        )}
        {messages.map((m) => {
          const isBrand = m.sender_type === "BRAND";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isBrand ? "flex-end" : "flex-start" }}>
              {!isBrand && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#fff", fontWeight: 700, flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>Q</div>
              )}
              <div style={{
                maxWidth: "60%", padding: "10px 14px",
                borderRadius: isBrand ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: isBrand ? "var(--color-accent)" : "var(--color-surface)",
                border: isBrand ? "none" : "1px solid var(--color-border)",
                color: isBrand ? "#fff" : "var(--color-text-primary)",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", lineHeight: 1.5 }}>{m.content}</p>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.7, textAlign: "right" }}>
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", gap: "12px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Écrire à l'équipe Qualio…"
          style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", background: "var(--color-background)", color: "var(--color-text-primary)", outline: "none" }}
        />
        <button onClick={handleSend} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

export default function RealtimeChatBrand({ threads }: { threads: Thread[] }) {
  const [activeThreadId, setActiveThreadId] = useState(threads[0]?.id ?? null);
  const activeThread = threads.find((t) => t.id === activeThreadId);

  if (threads.length === 0) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>Messages</h1>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", color: "var(--color-text-secondary)" }}>
          <div style={{ fontSize: "40px" }}>💬</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>Aucune conversation</div>
          <p style={{ fontSize: "14px", textAlign: "center", maxWidth: "320px", margin: 0 }}>
            Vos conversations avec l'équipe Qualio apparaîtront ici, liées à chaque étude.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--color-border)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>Messages</h1>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Liste des fils */}
        <div style={{ width: "300px", flexShrink: 0, borderRight: "1px solid var(--color-border)", overflowY: "auto" }}>
          {threads.map((t) => {
            const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.ACTIVE;
            return (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "16px 20px",
                  background: activeThreadId === t.id ? "var(--color-accent-light)" : "transparent",
                  border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, marginRight: "8px", lineHeight: 1.3 }}>{t.study}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>{fmtTime(t.updatedAt)}</span>
                </div>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: sc.bg, color: sc.text, fontWeight: 500 }}>
                  {sc.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat actif */}
        {activeThread ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", flexShrink: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{activeThread.study}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>Conversation avec l'équipe Qualio</div>
            </div>
            <ChatThread key={activeThreadId!} studyId={activeThreadId!} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
