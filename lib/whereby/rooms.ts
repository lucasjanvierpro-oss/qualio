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
