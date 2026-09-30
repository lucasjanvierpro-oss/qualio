"use client";

import { useEffect, useRef, useState } from "react";
import { useVisioCheck, VISIO_BLOCKED_HELP } from "@/components/shared/useVisioCheck";

// Visio Whereby encastrée : l'entretien se déroule DANS Rarelyst.
// Whereby affiche lui-même son écran d'entrée (test caméra et micro).

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "whereby-embed": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          room?: string;
          displayName?: string;
          lang?: string;
          background?: string;
          chat?: string;
          people?: string;
          screenshare?: string;
          leaveButton?: string;
        },
        HTMLElement
      >;
    }
  }
}

// v3 : la version actuelle. L'ancienne adresse (v2/index.js) répond 403 (constaté le 29/09/2026) :
// la visio ne s'affichait plus du tout.
const EMBED_SCRIPT = "https://cdn.srv.whereby.com/embed/v3-embed.js";

export default function WherebyRoom({ roomUrl, displayName, height = "min(72vh, 680px)", minimal = false, onJoin, onLeave }: {
  roomUrl: string;
  displayName?: string;
  height?: string;
  /** Salle à une personne (entretien en autonomie) : ni discussion, ni liste, ni partage d'écran. */
  minimal?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = EMBED_SCRIPT;
    document.head.appendChild(s);
  }, []);

  // Whereby prévient quand la personne entre dans la salle et quand elle en sort.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const join = () => onJoin?.();
    const leave = () => onLeave?.();
    el.addEventListener("join", join);
    el.addEventListener("leave", leave);
    return () => { el.removeEventListener("join", join); el.removeEventListener("leave", leave); };
  }, [onJoin, onLeave]);

  const { state: network, retry } = useVisioCheck();
  const [ignored, setIgnored] = useState(false);

  const off = minimal ? "off" : "on";
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: 18, overflow: "hidden", background: "#1b1128" }}>
      {network === "blocked" && !ignored && (
        <div role="alert" style={{ position: "absolute", inset: 0, zIndex: 2, display: "grid", alignContent: "center", justifyItems: "start", gap: 14, padding: "clamp(20px, 5vw, 48px)", background: "#1b1128", color: "#f1edf6" }}>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>{VISIO_BLOCKED_HELP.title}</p>
          <p style={{ margin: 0, maxWidth: "54ch", lineHeight: 1.5, color: "rgba(241,237,246,.75)" }}>{VISIO_BLOCKED_HELP.text}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" onClick={() => void retry()} style={{ padding: "12px 18px", borderRadius: 12, border: 0, background: "#fff", color: "#1b1128", font: "inherit", fontWeight: 700, cursor: "pointer" }}>J&apos;ai changé de réseau, réessayer</button>
            <button type="button" onClick={() => setIgnored(true)} style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#f1edf6", font: "inherit", fontWeight: 600, cursor: "pointer" }}>Essayer quand même</button>
          </div>
        </div>
      )}
      {/* @ts-expect-error — web component Whereby */}
      <whereby-embed
        ref={ref}
        room={roomUrl}
        displayName={displayName}
        lang="fr"
        chat={off}
        people={off}
        screenshare={off}
        leaveButton={off}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
