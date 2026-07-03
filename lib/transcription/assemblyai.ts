// Intégration AssemblyAI — transcription audio → texte, avec séparation des
// interlocuteurs (diarisation) et support du français.
//
// Flux :
//  1. startTranscription(audioUrl, webhookUrl) → soumet le job, retourne { id }
//  2. AssemblyAI traite en tâche de fond, puis POST son webhook → /api/webhooks/assemblyai
//  3. fetchTranscript(id) → récupère le texte final + les tours de parole

const BASE = "https://api.assemblyai.com/v2";

type Utterance = { speaker: string; text: string };
type TranscriptResponse = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string | null;
  utterances?: Utterance[] | null;
  error?: string | null;
};

function authHeaders() {
  return {
    Authorization: process.env.ASSEMBLYAI_API_KEY ?? "",
    "Content-Type": "application/json",
  };
}

// Lance une transcription. audioUrl doit être accessible publiquement (URL signée
// de l'enregistrement). webhookUrl est appelé par AssemblyAI une fois terminé.
export async function startTranscription(audioUrl: string, webhookUrl: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/transcript`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: "fr",
      speaker_labels: true, // sépare intervieweur / participant
      webhook_url: webhookUrl,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AssemblyAI submit error: ${res.status} ${detail}`);
  }
  const data = (await res.json()) as TranscriptResponse;
  return { id: data.id };
}

export async function fetchTranscript(id: string): Promise<TranscriptResponse> {
  const res = await fetch(`${BASE}/transcript/${id}`, { headers: authHeaders() });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AssemblyAI fetch error: ${res.status} ${detail}`);
  }
  return (await res.json()) as TranscriptResponse;
}

// Transforme les tours de parole en transcript lisible avec labels de locuteur.
// Renomme "A" → Intervieweur, "B" → Participant (les 2 voix d'un entretien 1:1).
export function formatTranscript(t: TranscriptResponse): string {
  if (t.utterances && t.utterances.length) {
    const labelMap: Record<string, string> = { A: "Intervieweur", B: "Participant" };
    return t.utterances
      .map((u) => `${labelMap[u.speaker] ?? `Locuteur ${u.speaker}`} : ${u.text}`)
      .join("\n\n");
  }
  return t.text ?? "";
}
