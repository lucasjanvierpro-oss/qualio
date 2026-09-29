"use client";

import { useEffect, useRef } from "react";

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

const EMBED_SCRIPT = "https://cdn.srv.whereby.com/embed/v2/index.js";

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

  const off = minimal ? "off" : "on";
  return (
    <div style={{ width: "100%", height, borderRadius: 18, overflow: "hidden", background: "#1b1128" }}>
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
