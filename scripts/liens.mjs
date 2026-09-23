// Vérificateur de liens : ouvre chaque page avec chaque compte, relève tous les
// liens internes qu'elle contient, et les suit.
//
//   node scripts/liens.mjs                       # http://localhost:3011
//   node scripts/liens.mjs https://www.rarelyst.co
//
// Complément de scripts/smoke.mjs, qui ne teste qu'une liste de pages écrite à
// la main : ici on part de ce que l'interface propose réellement de cliquer.
// Une page qui renvoie 200 mais qui pointe vers une page cassée est un clic
// perdu pour la marque ou le participant.
import fs from "node:fs";

const env = {};
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    if (!l.includes("=") || l.trim().startsWith("#")) continue;
    const k = l.slice(0, l.indexOf("=")).trim();
    const v = l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in env)) env[k] = v;
  }
}
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SR = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = new URL(SB).hostname.split(".")[0];
const HOST = (process.argv[2] ?? "http://localhost:3011").replace(/\/$/, "");

const rest = (path) =>
  fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: SR, Authorization: `Bearer ${SR}` } }).then((r) => r.json());

async function cookieFor(email) {
  const password = email === "admin@rarelyst-demo.com" ? env.ADMIN_DEMO_PASSWORD : env.SEED_PASSWORD;
  if (!password) return null;
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const s = await r.json();
  if (!s.access_token) return null;
  const payload = { ...s, expires_at: Math.floor(Date.now() / 1000) + 3600 };
  return `sb-${ref}-auth-token=base64-` + Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Points de départ d'un rôle : là où l'utilisateur arrive en se connectant. */
const DEPARTS = {
  BRAND: ["/brand/dashboard", "/brand/studies", "/brand/profiles", "/brand/account", "/brand/messages"],
  PARTICIPANT: ["/participant/dashboard", "/participant/studies", "/participant/profile", "/participant/wallet"],
  ADMIN: ["/admin", "/admin/studies", "/admin/participants", "/admin/matching", "/admin/verifications", "/admin/access"],
};

/** Liens internes d'une page, hors ancres, fichiers et domaines externes. */
function liens(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const href = m[1];
    if (/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?|map|txt|xml)$/i.test(href)) continue;
    if (href.startsWith("/_next") || href.startsWith("/api/")) continue;
    out.add(href.replace(/\/$/, "") || "/");
  }
  return [...out];
}

const users = await rest("users?select=email,role&order=role");
let casses = 0;
let verifies = 0;

for (const u of users) {
  const cookie = await cookieFor(u.email);
  if (!cookie) continue;
  const departs = DEPARTS[u.role] ?? [];
  if (!departs.length) continue;

  const vus = new Set();
  const aVoir = [...departs.map((p) => ({ page: p, depuis: "(départ)" }))];
  const echecs = [];

  while (aVoir.length) {
    const { page, depuis } = aVoir.shift();
    if (vus.has(page)) continue;
    vus.add(page);

    let res;
    try {
      res = await fetch(HOST + page, { headers: { Cookie: cookie }, redirect: "manual" });
    } catch (e) {
      echecs.push({ page, depuis, statut: e.message });
      continue;
    }
    verifies++;

    // Une redirection vers /login depuis une page censée être accessible
    // signale un lien qui mène hors du domaine du rôle.
    if (res.status >= 300 && res.status < 400) {
      const dest = res.headers.get("location") ?? "";
      if (dest.includes("/login")) echecs.push({ page, depuis, statut: `${res.status} → login` });
      continue;
    }
    if (res.status !== 200) {
      echecs.push({ page, depuis, statut: res.status });
      continue;
    }

    const html = await res.text();
    for (const href of liens(html)) {
      // On ne suit que les liens du rôle courant : la barre latérale d'un
      // participant ne doit pas mener dans l'espace marque, et inversement.
      if (!vus.has(href) && departs.some((d) => href.startsWith("/" + d.split("/")[1]))) {
        aVoir.push({ page: href, depuis: page });
      }
    }
  }

  const etat = echecs.length ? `${echecs.length} lien(s) cassé(s)` : "tous les liens répondent";
  console.log(`\n${u.role.padEnd(12)} ${u.email.padEnd(30)} ${vus.size} pages · ${etat}`);
  for (const e of echecs) {
    console.log(`   ✗ ${String(e.statut).padEnd(12)} ${e.page}`);
    console.log(`     cliqué depuis ${e.depuis}`);
  }
  casses += echecs.length;
}

console.log(
  casses === 0
    ? `\n${verifies} pages suivies sur ${HOST}, aucun lien cassé.`
    : `\n${casses} lien(s) cassé(s) sur ${verifies} pages suivies sur ${HOST}.`
);
process.exit(casses ? 1 : 0);
