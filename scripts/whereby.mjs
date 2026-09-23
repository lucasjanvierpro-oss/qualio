// Vérifie que l'intégration Whereby fonctionne, de bout en bout.
//
//   node scripts/whereby.mjs
//
// Crée une vraie salle avec les mêmes réglages que lib/whereby/rooms.ts, la
// relit, liste les enregistrements et les transcriptions, puis supprime la
// salle de test. Rien n'est laissé derrière.
import fs from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    if (!l.includes("=") || l.trim().startsWith("#")) continue;
    const k = l.slice(0, l.indexOf("=")).trim();
    const v = l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

const KEY = process.env.WHEREBY_API_KEY;
const BASE = "https://api.whereby.dev/v1";
const head = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

if (!KEY) {
  console.error("✗ WHEREBY_API_KEY absente de .env.local");
  process.exit(1);
}

let echecs = 0;
const ok = (label, detail = "") => console.log(`  ✓ ${label.padEnd(34)} ${detail}`);
const ko = (label, detail = "") => { echecs++; console.log(`  ✗ ${label.padEnd(34)} ${detail}`); };

const recording = process.env.WHEREBY_RECORDING_ENABLED === "true";
console.log(`Enregistrement demandé : ${recording ? "oui (nécessite le plan Build)" : "non (plan Explore)"}\n`);

// ── 1. Création de salle, réglages identiques à ceux de l'application ──
const body = {
  endDate: new Date(Date.now() + 3600e3).toISOString(),
  fields: ["hostRoomUrl"],
};
if (recording) {
  body.recording = { type: "cloud", destination: { provider: "whereby" }, startTrigger: "automatic" };
}

let room = null;
const res = await fetch(`${BASE}/meetings`, { method: "POST", headers: head, body: JSON.stringify(body) });
const txt = await res.text();
if (!res.ok) {
  ko("création de salle", `${res.status} ${txt.slice(0, 200)}`);
} else {
  room = JSON.parse(txt);
  ok("création de salle", room.roomUrl);
  room.hostRoomUrl ? ok("lien hôte", "présent") : ko("lien hôte", "absent — la marque ne pourra pas piloter la salle");
  room.roomName
    ? ok("roomName", `${room.roomName} — sert à relier les webhooks à l'entretien`)
    : ko("roomName", "absent — les webhooks ne pourront pas être rattachés");
}

// ── 2. Relecture : la salle existe bien côté Whereby ──
if (room) {
  const r = await fetch(`${BASE}/meetings/${room.meetingId}`, { headers: head });
  r.ok ? ok("relecture de la salle", `${r.status}`) : ko("relecture de la salle", `${r.status}`);
}

// ── 3. Les endpoints utilisés après l'entretien ──
for (const [label, path] of [["liste des enregistrements", "/recordings?limit=3"], ["liste des transcriptions", "/transcriptions?limit=3"]]) {
  const r = await fetch(`${BASE}${path}`, { headers: head });
  if (r.ok) {
    const d = await r.json().catch(() => ({}));
    ok(label, `${(d.results ?? d.data ?? []).length} récente(s)`);
  } else {
    ko(label, `${r.status} — la chaîne transcription → rapport ne pourra pas aboutir`);
  }
}

// ── 4. Nettoyage ──
if (room) {
  const d = await fetch(`${BASE}/meetings/${room.meetingId}`, { method: "DELETE", headers: head });
  d.ok || d.status === 204 ? ok("salle de test supprimée") : ko("suppression de la salle", `${d.status}`);
}

// ── 5. Ce qui dépend de toi ──
process.env.WHEREBY_WEBHOOK_SECRET
  ? ok("clé secrète du webhook", "présente")
  : ko("clé secrète du webhook", "absente — Configure → Webhooks dans le tableau de bord Whereby");

console.log(echecs === 0 ? "\nL'intégration Whereby répond sur tous les points." : `\n${echecs} point(s) en échec.`);
process.exit(echecs ? 1 : 0);
