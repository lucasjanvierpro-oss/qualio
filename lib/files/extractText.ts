import { inflateRawSync } from "node:zlib";

// Texte d'un document Word ou PowerPoint, sans bibliothèque : ces fichiers
// sont des archives ZIP de XML. On lit le répertoire de l'archive, on
// décompresse les seules parties utiles, on retire les balises.
// Les PDF ne passent pas par ici : Claude les lit directement.

const MAX_PART = 8 * 1024 * 1024; // une archive piégée ne gonfle pas au-delà
const MAX_TEXT = 60_000;

type Entry = { name: string; method: number; size: number; offset: number };

function entries(buf: Buffer): Entry[] {
  // Fin du répertoire central : cherchée depuis la fin (commentaire éventuel).
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not_a_zip");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: Entry[] = [];
  for (let i = 0; i < count && p + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    out.push({ name: buf.toString("utf8", p + 46, p + 46 + nameLen), method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function read(buf: Buffer, e: Entry): string {
  const h = e.offset;
  if (buf.readUInt32LE(h) !== 0x04034b50) throw new Error("bad_entry");
  const start = h + 30 + buf.readUInt16LE(h + 26) + buf.readUInt16LE(h + 28);
  const data = buf.subarray(start, start + e.size);
  if (e.method === 0) return data.toString("utf8");
  if (e.method === 8) return inflateRawSync(data, { maxOutputLength: MAX_PART }).toString("utf8");
  throw new Error("unsupported_compression");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function xmlText(xml: string, paragraph: RegExp): string {
  return xml
    .replace(paragraph, "\n")
    .replace(/<w:tab\/>|<a:tab\/>/g, "\t")
    .replace(/<w:br\/>|<a:br\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[code] ?? m;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Texte brut d'un .docx ou d'un .pptx, tronqué à une longueur raisonnable. */
export function officeText(buf: Buffer, kind: "docx" | "pptx"): string {
  const all = entries(buf);
  let text = "";
  if (kind === "docx") {
    const doc = all.find((e) => e.name === "word/document.xml");
    if (!doc) throw new Error("not_a_docx");
    text = xmlText(read(buf, doc), /<\/w:p>/g);
  } else {
    const slides = all
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
      .sort((a, b) => Number(a.name.match(/\d+/)![0]) - Number(b.name.match(/\d+/)![0]));
    if (slides.length === 0) throw new Error("not_a_pptx");
    text = slides.map((s, i) => `— Diapositive ${i + 1} —\n${xmlText(read(buf, s), /<\/a:p>/g)}`).join("\n\n");
  }
  return text.slice(0, MAX_TEXT);
}
