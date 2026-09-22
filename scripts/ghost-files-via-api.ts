/**
 * Génère les ghost files SANS connexion PostgreSQL directe.
 *
 * Même raison que `seed-via-api.mjs` : certains réseaux avalent le trafic
 * Postgres, Prisma ne passe pas. Ici tout transite en HTTPS via PostgREST.
 *
 * Le prompt et le parsing viennent de `lib/participants/ghostFilePrompt.ts`,
 * strictement les mêmes que le chemin Prisma — les tags produits doivent être
 * identiques, sinon le moteur de recherche marques ne les retrouve pas.
 *
 * Run : npx tsx --env-file=.env.local scripts/ghost-files-via-api.ts
 *       npx tsx --env-file=.env.local scripts/ghost-files-via-api.ts --all
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  GHOST_FILE_MODEL,
  buildGhostFilePrompt,
  parseGhostFile,
  type GhostFileInput,
} from "../lib/participants/ghostFilePrompt";
import { textFromMessage, MAX_TOKENS_JSON } from "../lib/anthropic/text";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALL = process.argv.includes("--all");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY est requise.");
  process.exit(1);
}

async function rest<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

const FIELDS = [
  "id", "firstName", "lastName", "city", "gender", "dateOfBirth",
  "employmentStatus", "educationLevel", "selfProfileType",
  "macroUniverses", "brandAffinities", "engagementTypes", "behavioralChecklist",
  "adaptiveAnswers", "expertAnswers", "screenerAnswers",
  "followerRange", "instagramUrl", "linkedinUrl", "cvAnalysis",
].join(",");

type Row = GhostFileInput & { id: string };

async function setStatus(profileId: string, status: string) {
  await rest("/participant_ghost_files?on_conflict=participantProfileId", {
    method: "POST",
    body: [{
      id: `gf_${profileId}`,
      participantProfileId: profileId,
      processingStatus: status,
      aiProfileSummary: "",
      generatedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    }],
    prefer: "return=minimal,resolution=merge-duplicates",
  });
}

async function main() {
  const profiles = await rest<Row[]>(
    `/participant_profiles?onboardingStatus=eq.complete&select=${FIELDS}&order=createdAt.asc`,
  );

  const done = await rest<{ participantProfileId: string }[]>(
    "/participant_ghost_files?processingStatus=eq.done&select=participantProfileId",
  );
  const doneSet = new Set(done.map((d) => d.participantProfileId));

  const todo = ALL ? profiles : profiles.filter((p) => !doneSet.has(p.id));

  if (!todo.length) {
    console.log("Aucun profil à traiter.");
    return;
  }
  console.log(`${todo.length} profil(s) à traiter.\n`);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let ok = 0;

  for (const p of todo) {
    const label = `${p.firstName} ${p.lastName}`.padEnd(22);
    process.stdout.write(`  ${label} `);
    try {
      await setStatus(p.id, "processing");

      const message = await anthropic.messages.create({
        model: GHOST_FILE_MODEL,
        max_tokens: MAX_TOKENS_JSON,
        messages: [{ role: "user", content: buildGhostFilePrompt(p) }],
      });
      const raw = textFromMessage(message);
      const { brandSummary, ...ghost } = parseGhostFile(raw);

      await rest("/participant_ghost_files?on_conflict=participantProfileId", {
        method: "POST",
        body: [{
          id: `gf_${p.id}`,
          participantProfileId: p.id,
          processingStatus: "done",
          aiModelUsed: GHOST_FILE_MODEL,
          generatedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          ...ghost,
        }],
        prefer: "return=minimal,resolution=merge-duplicates",
      });

      if (brandSummary) {
        await rest(`/participant_profiles?id=eq.${p.id}`, {
          method: "PATCH",
          body: { brandSummary, updatedAt: new Date().toISOString() },
          prefer: "return=minimal",
        });
      }

      console.log(`✓ ${ghost.overallQualityScore}/10 · ${ghost.primaryExpertise} · ${ghost.aiTags?.length ?? 0} tags`);
      ok++;
    } catch (e) {
      console.log(`✗ ${(e as Error).message.slice(0, 400)}`);
      await setStatus(p.id, "error").catch(() => {});
    }
  }

  console.log(`\n✓ ${ok}/${todo.length} ghost files générés.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
