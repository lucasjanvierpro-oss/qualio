// Enregistreur du studio (/studio) : filme chaque format image par image et en
// fait des MP4 (vidéos) et des PNG (visuels fixes), dans ~/Desktop/Rarelyst-visuels.
// Les carrousels (carrousel-xxx-1, -2…) sont rangés à part et assemblés en PDF,
// le format que LinkedIn attend pour un « document ».
//
// Prérequis (une fois, hors du projet pour ne pas alourdir le site) :
//   npm i --no-save playwright-core @ffmpeg-installer/ffmpeg
// Usage :
//   node scripts/studio-record.mjs                  tous les formats
//   node scripts/studio-record.mjs marques,avatar   certains formats
//   STUDIO_BASE=http://localhost:3000 node scripts/studio-record.mjs
// La connexion utilise le compte admin de démo (ADMIN_DEMO_PASSWORD dans .env.local).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const FFMPEG = require("@ffmpeg-installer/ffmpeg").path;

const env = {};
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    const i = l.indexOf("=");
    if (i < 0 || l.trim().startsWith("#")) continue;
    const k = l.slice(0, i).trim();
    if (!(k in env)) env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
const BASE = process.env.STUDIO_BASE ?? "https://www.rarelyst.co";
const DOMAIN = new URL(BASE).hostname;
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const OUT = path.join(os.homedir(), "Desktop", "Rarelyst-visuels");

// Même liste que components/studio/registry.ts
const SIZES = { story: [540, 960], post: [540, 675], square: [540, 540], banner: [792, 198], cover: [1128, 191], avatar: [200, 200] };
// Bannières et couvertures : aussi une version « grand » (×4), plus nette une fois recadrée par LinkedIn.
const BIG = new Set(["banner", "cover"]);
const src = fs.readFileSync("components/studio/registry.ts", "utf8");
const ALL = [...src.matchAll(/\{ id: "([^"]+)", title: "[^"]*", format: "(\w+)", duration: ([\d.]+),(?: still: ([\d.]+),)? langs: \[([^\]]*)\] \}/g)]
  .map((m) => [m[1], m[2], Number(m[3]), m[5].match(/"(\w+)"/g).map((x) => x.replace(/"/g, "")), m[4] ? Number(m[4]) : null]);
const only = process.argv[2] ? process.argv[2].split(",") : null;
const FPS = Number(process.argv[3] ?? 30);

async function adminCookies() {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@rarelyst-demo.com", password: env.ADMIN_DEMO_PASSWORD }),
  });
  const s = await r.json();
  if (!s.access_token) throw new Error("Connexion admin de démo impossible (vérifiez ADMIN_DEMO_PASSWORD).");
  const ref = new URL(SB).hostname.split(".")[0];
  const value = "base64-" + Buffer.from(JSON.stringify({ ...s, expires_at: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  const chunks = value.length <= 3180 ? [[name, value]] : value.match(/.{1,3180}/g).map((c, i) => [`${name}.${i}`, c]);
  return chunks.map(([n, v]) => ({ name: n, value: v, domain: DOMAIN, path: "/", sameSite: "Lax", secure: DOMAIN !== "localhost" }));
}

// Fixe le temps de l'animation, et celui de toutes les animations CSS en cours.
const setTime = (page, t) => page.evaluate(async (t) => {
  window.__studioT = t;
  window.dispatchEvent(new Event("studio-t"));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__seen = window.__seen || new WeakMap();
  for (const a of document.getAnimations()) {
    if (!window.__seen.has(a)) window.__seen.set(a, t);
    a.pause();
    a.currentTime = Math.max(0, (t - window.__seen.get(a)) * 1000);
  }
}, t);

fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });
fs.mkdirSync(path.join(OUT, "images"), { recursive: true });
const decks = new Map();
const cookies = await adminCookies();
const b = await chromium.launch({ channel: "chrome", headless: true });
for (const [id, format, duration, langs, still] of ALL) {
  if (only && !only.includes(id)) continue;
  const [w, h] = SIZES[format];
  for (const lang of langs) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await ctx.addCookies(cookies);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/studio/${id}?lang=${lang}&capture=1`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__studioReady === true && document.fonts.status === "loaded", null, { timeout: 30000 });
    await page.waitForTimeout(600);
    const clip = { x: 0, y: 0, width: w, height: h };
    const name = `${id}${langs.length > 1 ? `-${lang}` : ""}`;
    const deck = id.match(/^(carrousel-.+)-(\d+)$/);
    if (deck) {
      const dir = path.join(OUT, "carrousels", `${deck[1]}-${lang}`);
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${deck[2].padStart(2, "0")}.png`);
      await setTime(page, 99);
      await page.screenshot({ path: file, clip });
      decks.set(dir, [...(decks.get(dir) ?? []), { file, w, h }]);
      console.log("diapo :", `${deck[1]}-${lang}`, deck[2]);
    } else if (!duration) {
      await setTime(page, 99);
      await page.screenshot({ path: path.join(OUT, "images", `${name}.png`), clip });
      if (BIG.has(format)) {
        const big = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 4 });
        await big.addCookies(cookies);
        const bp = await big.newPage();
        await bp.goto(`${BASE}/studio/${id}?lang=${lang}&capture=1`, { waitUntil: "networkidle" });
        await bp.waitForFunction(() => window.__studioReady === true && document.fonts.status === "loaded", null, { timeout: 30000 });
        await bp.waitForTimeout(600);
        await setTime(bp, 99);
        await bp.screenshot({ path: path.join(OUT, "images", `${name}-grand.png`), clip });
        await big.close();
      }
      console.log("image :", name);
    } else {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `studio-${id}-`));
      const n = Math.round(duration * FPS);
      for (let f = 0; f < n; f++) {
        await setTime(page, f / FPS);
        await page.screenshot({ path: path.join(dir, `${String(f).padStart(5, "0")}.png`), clip });
      }
      const mp4 = path.join(OUT, "videos", `${name}.mp4`);
      execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", mp4]);
      // Couverture : l'instant « still » s'il est donné, sinon le milieu de la vidéo.
      const cover = still === null ? Math.floor(n * 0.45) : Math.min(n - 1, Math.round(still * FPS));
      fs.copyFileSync(path.join(dir, `${String(cover).padStart(5, "0")}.png`), path.join(OUT, "images", `${name}-couverture.png`));
      fs.rmSync(dir, { recursive: true, force: true });
      console.log("vidéo :", name, `${(fs.statSync(mp4).size / 1e6).toFixed(1)} Mo`);
    }
    await ctx.close();
  }
}

// Un PDF par carrousel, une diapositive par page.
for (const [dir, slides] of decks) {
  const page = await b.newPage();
  const { w, h } = slides[0];
  const imgs = slides.sort((a, z) => a.file.localeCompare(z.file))
    .map((x) => `<img src="data:image/png;base64,${fs.readFileSync(x.file).toString("base64")}">`).join("");
  await page.setContent(`<style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;break-after:page}</style>${imgs}`);
  await page.pdf({ path: `${dir}.pdf`, width: `${w}px`, height: `${h}px`, printBackground: true });
  await page.close();
  console.log("pdf :", path.basename(dir));
}
await b.close();
console.log("Dossier :", OUT);
