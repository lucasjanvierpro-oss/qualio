export type WherebyRoom = {
  roomUrl: string;
  hostRoomUrl: string;
  meetingId: string;
};

// Crée une room Whereby avec enregistrement cloud AUTOMATIQUE.
// L'enregistrement démarre dès qu'un participant rejoint, sans action de l'hôte.
// Quand il est prêt, Whereby envoie un webhook → /api/webhooks/whereby.
//
// Prérequis côté compte Whereby :
//  - Plan Embedded avec "cloud recording" activé
//  - Un webhook configuré vers https://TON-SITE/api/webhooks/whereby
export async function createWherebyRoom(endDate: Date): Promise<WherebyRoom> {
  const response = await fetch("https://api.whereby.dev/v1/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endDate: endDate.toISOString(),
      fields: ["hostRoomUrl"],
      recording: {
        type: "cloud",
        destination: { provider: "whereby" },
        startTrigger: "automatic",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Whereby API error: ${response.status} ${detail}`);
  }

  return response.json() as Promise<WherebyRoom>;
}
