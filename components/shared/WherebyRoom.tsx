"use client";

import { useEffect } from "react";

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

export default function WherebyRoom({ roomUrl, displayName, height = "min(72vh, 680px)" }: { roomUrl: string; displayName?: string; height?: string }) {
  useEffect(() => {
    if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = EMBED_SCRIPT;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{ width: "100%", height, borderRadius: 18, overflow: "hidden", background: "#1b1128" }}>
      {/* @ts-expect-error — web component Whereby */}
      <whereby-embed
        room={roomUrl}
        displayName={displayName}
        lang="fr"
        chat="on"
        people="on"
        screenshare="on"
        leaveButton="on"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
