"use client";

import { useEffect } from "react";

// Composant vidéo encastré Whereby.
// La visio se déroule DANS qualio (aucune redirection vers whereby.com).
// Il suffit de charger le web component officiel puis d'afficher <whereby-embed>.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "whereby-embed": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          room?: string;
          displayName?: string;
          background?: string;
          chat?: string;
          people?: string;
          screenshare?: string;
        },
        HTMLElement
      >;
    }
  }
}

const EMBED_SCRIPT = "https://cdn.srv.whereby.com/embed/v2/index.js";

export default function WherebyRoom({
  roomUrl,
  displayName,
  height = "620px",
}: {
  roomUrl: string;
  displayName?: string;
  height?: string;
}) {
  useEffect(() => {
    if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = EMBED_SCRIPT;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{ width: "100%", height, borderRadius: "18px", overflow: "hidden", border: "1px solid var(--color-border-base)", boxShadow: "0 12px 40px var(--color-glow-soft)" }}>
      {/* @ts-expect-error — web component custom Whereby */}
      <whereby-embed
        room={roomUrl}
        displayName={displayName}
        chat="on"
        people="on"
        screenshare="on"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
