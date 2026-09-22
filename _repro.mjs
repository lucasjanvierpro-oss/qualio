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
const base = env.NEXT_PUBLIC_SUPABASE_URL, anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ref = new URL(base).hostname.split(".")[0];
const HOST = process.argv[2];
for (const email of ["research@sport-demo.com", "insights@maison-demo.com"]) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: env.SEED_PASSWORD }) });
  const s = await r.json();
  const enc = "base64-" + Buffer.from(JSON.stringify({ ...s, expires_at: Math.floor(Date.now()/1000) + 3600 })).toString("base64url");
  const res = await fetch(`${HOST}/brand/dashboard`, { headers: { Cookie: `sb-${ref}-auth-token=${enc}` }, redirect: "manual" });
  console.log(`${String(res.status).padEnd(4)} ${email.padEnd(28)}`);
}
