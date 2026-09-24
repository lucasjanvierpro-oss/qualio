import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Lecture d'une page web donnée par un utilisateur.
//
// Une URL saisie dans un formulaire ne doit jamais faire parler notre serveur à
// son propre réseau (métadonnées du cloud, base, services internes) : on
// n'accepte que http(s) sur les ports standard, on résout le nom et on refuse
// toute adresse privée — à chaque redirection, pas seulement au départ.

const MAX_BYTES = 700_000;
const MAX_REDIRECTS = 3;
const UA = "Mozilla/5.0 (compatible; RarelystBot/1.0; +https://www.rarelyst.co)";

function privateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

function privateIp(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v = ip.toLowerCase();
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return privateV4(mapped[1]);
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("port");
  if (url.username || url.password) throw new Error("credentials");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("host");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("private");
}

export type FetchedPage = { status: number; finalUrl: string; html: string };

export async function safeFetch(raw: string): Promise<FetchedPage> {
  let url = new URL(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "fr,en;q=0.8" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { status: res.status, finalUrl: url.toString(), html: "" };
      url = new URL(loc, url);
      continue;
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return { status: res.status, finalUrl: url.toString(), html: "" };

    // Lecture bornée : une page de 50 Mo ne doit pas remplir la mémoire.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      size += value.length;
      if (size >= MAX_BYTES) { await reader.cancel(); break; }
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { status: res.status, finalUrl: url.toString(), html };
  }
  throw new Error("too_many_redirects");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (ENTITIES[e.toLowerCase()]) return ENTITIES[e.toLowerCase()];
    const code = e.startsWith("#x") ? parseInt(e.slice(2), 16) : e.startsWith("#") ? Number(e.slice(1)) : NaN;
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

function meta(html: string, key: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content).trim() : null;
}

export type PageDigest = { title: string | null; description: string | null; siteName: string | null; text: string };

/** Titre, description et texte visible d'une page, sans balises ni scripts. */
export function digest(html: string, maxText = 5000): PageDigest {
  const raw = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title = meta(html, "og:title") ?? (raw ? decode(raw).trim() : null);
  const description = meta(html, "og:description") ?? meta(html, "description");
  const siteName = meta(html, "og:site_name");
  const text = decode(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|p|div|li|h[1-6]|section|article|tr)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .slice(0, maxText);
  return { title, description, siteName, text };
}
