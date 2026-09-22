// Test de fumée : ouvre chaque page du site avec chaque compte de la base.
//
//   node scripts/smoke.mjs                      # http://localhost:3011
//   node scripts/smoke.mjs https://www.rarelyst.co
//
// À lancer après chaque déploiement. Un compte sans données ne prouve rien :
// l'erreur 500 du tableau de bord marque (22/09/2026) ne se déclenchait que
// pour une marque ayant au moins une étude. D'où le passage sur TOUS les
// comptes, et sur les pages de détail.
//
// Les comptes de démo utilisent SEED_PASSWORD (.env.local) ; les comptes réels
// sont annoncés « pas de mot de passe de test » et ignorés.
import fs from "node:fs";
const env = {};
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    if (!l.includes("=") || l.trim().startsWith("#")) continue;
    const k = l.slice(0, l.indexOf("=")).trim(); const v = l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in env)) env[k] = v;
  }
}
const SB = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SR = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = new URL(SB).hostname.split(".")[0];
const HOST = (process.argv[2] ?? "http://localhost:3011").replace(/\/$/, "");
const rest = (path) => fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: SR, Authorization: `Bearer ${SR}` } }).then(r => r.json());

async function cookieFor(email) {
  // Le compte admin de démonstration a son propre mot de passe.
  const password = email === "admin@rarelyst-demo.com" ? env.ADMIN_DEMO_PASSWORD : env.SEED_PASSWORD;
  if (!password) return null;
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const s = await r.json();
  if (!s.access_token) return null;
  return `sb-${ref}-auth-token=base64-` + Buffer.from(JSON.stringify({ ...s, expires_at: Math.floor(Date.now()/1000) + 3600 })).toString("base64url");
}

const users = await rest("users?select=email,role,brand_profiles(id),participant_profiles(id)&order=role");
const studies = await rest("studies?select=id,title,brandProfileId");
const apps = await rest("applications?select=id,studyId,participantProfileId");
const participants = await rest("participant_profiles?select=id&limit=4");

const results = [];
async function hit(label, path, cookie) {
  let status = "ERR";
  try {
    const res = await fetch(HOST + path, { headers: cookie ? { Cookie: cookie } : {}, redirect: "manual" });
    status = res.status;
  } catch (e) { status = e.message; }
  const ok = status === 200 || status === 307 || status === 308;
  results.push({ ok, status, label, path });
  console.log(`${ok ? "OK " : "KO "} ${String(status).padEnd(4)} ${label.padEnd(30)} ${path}`);
}

for (const p of ["/", "/login", "/signup/brand", "/signup/participant"]) await hit("public", p, null);

for (const u of users) {
  const c = await cookieFor(u.email);
  if (!c) { console.log(`--  ---  ${u.email} (pas de mot de passe de test)`); continue; }
  if (u.role === "BRAND") {
    const mine = studies.filter(s => u.brand_profiles?.some(b => b.id === s.brandProfileId));
    for (const p of ["/brand/dashboard", "/brand/studies", "/brand/studies/new", "/brand/profiles", "/brand/messages", "/brand/account"]) await hit(u.email, p, c);
    for (const s of mine) { await hit(u.email, `/brand/studies/${s.id}`, c); await hit(u.email, `/brand/studies/${s.id}/report`, c); }
  } else if (u.role === "ADMIN") {
    for (const p of ["/admin", "/admin/access", "/admin/matching", "/admin/participants", "/admin/payments", "/admin/studies", "/admin/verifications"]) await hit(u.email, p, c);
    for (const s of studies) { await hit(u.email, `/admin/studies/${s.id}`, c); await hit(u.email, `/admin/studies/${s.id}/report`, c); }
    for (const pp of participants) await hit(u.email, `/admin/participants/${pp.id}`, c);
  } else if (u.role === "PARTICIPANT") {
    const pid = u.participant_profiles?.[0]?.id;
    const mine = apps.filter(a => a.participantProfileId === pid);
    for (const p of ["/participant/dashboard", "/participant/studies", "/participant/profile", "/participant/verification", "/participant/wallet", "/participant/settings"]) await hit(u.email, p, c);
    for (const a of mine) await hit(u.email, `/participant/studies/${a.id}`, c);
  }
}
const ko = results.filter(r => !r.ok);
console.log(ko.length === 0 ? `\n${results.length} requêtes, aucune erreur, sur ${HOST}.` : `\n${ko.length} ÉCHEC(S) sur ${results.length} requêtes :\n` + ko.map(r => `  ${r.status} ${r.label} ${r.path}`).join("\n"));
process.exit(ko.length ? 1 : 0);
