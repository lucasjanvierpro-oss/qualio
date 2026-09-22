/**
 * Sème le panel de démonstration SANS connexion PostgreSQL directe.
 *
 * Pourquoi : certains réseaux (wifi d'école, d'entreprise) laissent passer le
 * TCP sur 5432/6543 mais avalent le trafic Postgres ensuite — Prisma ne peut
 * alors pas se connecter. Ce script contourne le problème en n'utilisant que
 * du HTTPS : API admin Supabase pour les comptes auth, PostgREST pour les lignes.
 *
 * Quand le réseau le permet, `scripts/seed-panel.ts` fait la même chose en une
 * seule passe via Prisma. Les deux lisent `scripts/panel-data.json`.
 *
 * Run : node --env-file=.env.local scripts/seed-via-api.mjs   (nécessite SEED_PASSWORD)
 */

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const data = JSON.parse(readFileSync(new URL("./panel-data.json", import.meta.url), "utf8"));

// Mot de passe des comptes de démo : jamais dans le dépôt (ces comptes existent en production).
const PASSWORD = process.env.SEED_PASSWORD;
if (!PASSWORD || PASSWORD.length < 10) {
  console.error("Définir SEED_PASSWORD (10 caractères minimum) dans .env.local.");
  process.exit(1);
}

// ── Identifiants façon cuid : Prisma n'impose rien côté base (colonnes text),
// mais garder la même forme évite de distinguer les lignes semées des autres.
function cuid() {
  return "c" + Date.now().toString(36) + randomBytes(8).toString("hex").slice(0, 16);
}

// ── PostgREST (clé service_role → contourne le RLS) ───────────────────
async function rest(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer ?? "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${String(text).slice(0, 300)}`);
  return parsed;
}

// ── API admin Supabase ────────────────────────────────────────────────
async function admin(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const existingByEmail = new Map();

async function loadExistingUsers() {
  let page = 1;
  for (;;) {
    const { status, body } = await admin(`/admin/users?per_page=200&page=${page}`);
    if (status !== 200) throw new Error(`listUsers ${status}: ${JSON.stringify(body).slice(0, 200)}`);
    const users = body.users ?? [];
    users.forEach((u) => u.email && existingByEmail.set(u.email.toLowerCase(), u.id));
    if (users.length < 200) break;
    page++;
  }
}

async function ensureAuthUser(email, role) {
  const found = existingByEmail.get(email.toLowerCase());
  if (found) return { id: found, created: false };

  const { status, body } = await admin("/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { role } }),
  });
  if (status >= 200 && status < 300 && body.id) return { id: body.id, created: true };
  throw new Error(`createUser ${email} → ${status}: ${JSON.stringify(body).slice(0, 200)}`);
}

// ── Insertion des lignes applicatives ─────────────────────────────────
const nowIso = () => new Date().toISOString();

async function upsertUser(email, role, supabaseId) {
  const rows = await rest("/users?on_conflict=email", {
    method: "POST",
    body: [{ id: cuid(), email, role, supabaseId, createdAt: nowIso(), updatedAt: nowIso() }],
    prefer: "return=representation,resolution=merge-duplicates",
  });
  return rows[0].id;
}

async function upsertBrand(brand, userId) {
  const rows = await rest("/brand_profiles?on_conflict=userId", {
    method: "POST",
    body: [{
      id: cuid(), userId,
      companyName: brand.companyName, industry: brand.industry,
      credits: brand.credits, isVerified: true, isActivated: true,
      createdAt: nowIso(), updatedAt: nowIso(),
    }],
    prefer: "return=representation,resolution=merge-duplicates",
  });
  return rows[0].id;
}

async function upsertParticipant(p, userId) {
  const rows = await rest("/participant_profiles?on_conflict=userId", {
    method: "POST",
    body: [{
      id: cuid(), userId,
      firstName: p.firstName, lastName: p.lastName,
      dateOfBirth: `${p.birthYear}-06-15T00:00:00.000Z`,
      gender: p.gender, city: p.city, country: "FR", profession: p.profession,
      employmentStatus: p.employmentStatus, educationLevel: p.educationLevel,
      householdIncome: p.householdIncome,
      macroUniverses: p.macroUniverses, brandAffinities: p.brandAffinities,
      engagementTypes: p.engagementTypes, selfProfileType: p.selfProfileType,
      behavioralChecklist: p.behavioralChecklist,
      adaptiveAnswers: p.adaptiveAnswers, expertAnswers: p.expertAnswers,
      linkedinUrl: p.linkedinUrl ?? null, instagramUrl: p.instagramUrl ?? null,
      followerRange: p.followerRange ?? null,
      interviewLanguages: ["Français"], preferredFormat: "both", rewardPreference: "cash",
      agreedToCodeOfConduct: true,
      onboardingStep: 11, onboardingStatus: "complete",
      idVerificationStatus: "VERIFIED", idVerifiedAt: nowIso(),
      languages: ["fr"], interests: [], shoppingChannels: [],
      createdAt: nowIso(), updatedAt: nowIso(),
    }],
    prefer: "return=representation,resolution=merge-duplicates",
  });
  return rows[0].id;
}

async function ensureStudy(study) {
  const existing = await rest(`/studies?title=eq.${encodeURIComponent(study.title)}&select=id`);
  if (existing.length) return { id: existing[0].id, created: false };

  const brands = await rest(`/brand_profiles?companyName=eq.${encodeURIComponent(study.brand)}&select=id`);
  if (!brands.length) throw new Error(`marque « ${study.brand} » introuvable`);

  const deadline = new Date(Date.now() + study.deadlineInDays * 86400000).toISOString();
  const rows = await rest("/studies", {
    method: "POST",
    body: [{
      id: cuid(), brandProfileId: brands[0].id,
      title: study.title, objective: study.objective,
      studyType: study.studyType, status: study.status,
      targetParticipantCount: study.targetParticipantCount,
      interviewDuration: study.interviewDuration,
      rewardAmount: study.rewardAmount, rewardType: study.rewardType,
      deadlineAt: deadline, targetCriteria: study.targetCriteria,
      preferredLanguage: "fr", createdAt: nowIso(), updatedAt: nowIso(),
    }],
  });
  return { id: rows[0].id, created: true };
}

async function main() {
  console.log("Comptes auth existants…");
  await loadExistingUsers();
  console.log(`  ${existingByEmail.size} trouvé(s)\n`);

  let authCreated = 0;

  for (const b of data.brands) {
    const { id: sid, created } = await ensureAuthUser(b.email, "BRAND");
    if (created) authCreated++;
    const userId = await upsertUser(b.email, "BRAND", sid);
    await upsertBrand(b, userId);
    console.log(`  marque       ${b.email.padEnd(32)} ${b.credits} crédits`);
  }

  for (const p of data.participants) {
    const { id: sid, created } = await ensureAuthUser(p.email, "PARTICIPANT");
    if (created) authCreated++;
    const userId = await upsertUser(p.email, "PARTICIPANT", sid);
    await upsertParticipant(p, userId);
    console.log(`  participant  ${p.email.padEnd(32)} ${p.profession}`);
  }

  const study = await ensureStudy(data.study);
  console.log(`\n  étude        « ${data.study.title} » ${study.created ? "créée" : "déjà présente"}`);

  const [users, brands, parts, studies] = await Promise.all([
    rest("/users?select=id"), rest("/brand_profiles?select=id"),
    rest("/participant_profiles?select=id"), rest("/studies?select=id"),
  ]);
  console.log(`\n✓ ${authCreated} compte(s) auth créé(s) · mot de passe : celui de SEED_PASSWORD`);
  console.log(`✓ en base : ${users.length} users, ${brands.length} marques, ${parts.length} participants, ${studies.length} études`);
}

main().catch((e) => { console.error("\n✗", e.message); process.exit(1); });
