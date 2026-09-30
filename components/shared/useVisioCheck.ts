"use client";

import { useCallback, useEffect, useState } from "react";

// Certains réseaux (entreprise, école, Wi-Fi public) filtrent Whereby par son
// nom : la salle reste noire sans explication. Constaté le 30/09/2026 : la
// connexion à whereby.com et api.appearin.net est coupée net, alors que
// rarelyst.whereby.com passe. On teste donc ces deux adresses avant la visio.
const HOSTS = ["https://whereby.com/favicon.ico", "https://api.appearin.net/"];
const TIMEOUT_MS = 7000;

export type VisioNetwork = "checking" | "ok" | "blocked";

async function reachable(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // no-cors : la réponse est illisible, mais elle arrive seulement si le réseau laisse passer.
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useVisioCheck() {
  const [state, setState] = useState<VisioNetwork>("checking");
  const check = useCallback(async () => {
    const results = await Promise.all(HOSTS.map(reachable));
    setState(results.every(Boolean) ? "ok" : "blocked");
  }, []);
  useEffect(() => {
    let alive = true;
    Promise.all(HOSTS.map(reachable)).then((r) => { if (alive) setState(r.every(Boolean) ? "ok" : "blocked"); });
    return () => { alive = false; };
  }, []);
  const retry = useCallback(async () => { setState("checking"); await check(); }, [check]);
  return { state, retry };
}

export const VISIO_BLOCKED_HELP = {
  title: "Votre réseau bloque la visio.",
  text: "C'est fréquent sur un réseau d'entreprise, d'école ou un Wi-Fi public. Passez sur le partage de connexion de votre téléphone (4G/5G), ou demandez à votre service informatique d'autoriser whereby.com et appearin.net.",
};
