export type WherebyRoom = {
  roomUrl: string;
  hostRoomUrl: string;
  meetingId: string;
  roomName: string; // ex "/470c1e94-..." — utilisé pour matcher les webhooks
};

// Crée une room Whereby (visio encastrée dans qualio).
//
// L'enregistrement cloud + transcription est une fonction PAYANTE (plan Build).
// Il n'est activé que si WHEREBY_RECORDING_ENABLED=true — sinon la création de
// salle échouerait sur le plan gratuit (Explore).
//   - Explore (gratuit) : visio seule → laisse WHEREBY_RECORDING_ENABLED vide
//   - Build (payant)   : enregistrement + transcription → mets =true
// Quand actif, Whereby envoie un webhook → /api/webhooks/whereby.
export async function createWherebyRoom(endDate: Date): Promise<WherebyRoom> {
  const recordingEnabled = process.env.WHEREBY_RECORDING_ENABLED === "true";

  const body: Record<string, unknown> = {
    endDate: endDate.toISOString(),
    fields: ["hostRoomUrl"],
  };
  if (recordingEnabled) {
    body.recording = {
      type: "cloud",
      destination: { provider: "whereby" },
      startTrigger: "automatic",
    };
  }

  const response = await fetch("https://api.whereby.dev/v1/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Whereby API error: ${response.status} ${detail}`);
  }

  return response.json() as Promise<WherebyRoom>;
}

// ─── Récupération des transcripts & enregistrements ──────────────────────
const WHEREBY_BASE = "https://api.whereby.dev/v1";
function wherebyHeaders() {
  return { Authorization: `Bearer ${process.env.WHEREBY_API_KEY}` };
}

// Récupère le texte du transcript, seulement s'il est "ready".
// Flux : /transcriptions/{id} (état) → /access-link (lien signé) → contenu .md.
export async function fetchWherebyTranscript(transcriptionId: string): Promise<string | null> {
  try {
    const metaRes = await fetch(`${WHEREBY_BASE}/transcriptions/${transcriptionId}`, { headers: wherebyHeaders() });
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as { state?: string };
    if (meta.state !== "ready") return null; // pas encore prêt → on réessaiera plus tard

    const linkRes = await fetch(`${WHEREBY_BASE}/transcriptions/${transcriptionId}/access-link`, { headers: wherebyHeaders() });
    if (!linkRes.ok) return null;
    const { accessLink } = (await linkRes.json()) as { accessLink?: string };
    if (!accessLink) return null;

    const contentRes = await fetch(accessLink);
    if (!contentRes.ok) return null;
    const text = (await contentRes.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

// Lien signé de téléchargement de l'enregistrement mp4 (pour l'archive vidéo).
export async function fetchWherebyRecordingLink(recordingId: string): Promise<string | null> {
  try {
    const r = await fetch(`${WHEREBY_BASE}/recordings/${recordingId}/access-link`, { headers: wherebyHeaders() });
    if (!r.ok) return null;
    const { accessLink } = (await r.json()) as { accessLink?: string };
    return accessLink ?? null;
  } catch {
    return null;
  }
}
