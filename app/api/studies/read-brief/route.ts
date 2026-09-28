import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { officeText } from "@/lib/files/extractText";
import { readBrief, type BriefSource } from "@/lib/studies/brief";

// Un appel à Claude, parfois sur un PDF de plusieurs pages.
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 20_000;

// Lit le brief d'une marque (texte et/ou document) et renvoie la fiche
// proposée. Rien n'est enregistré : la marque relit, corrige, puis valide.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me?.brandProfileId) return NextResponse.json({ error: "Session expirée, reconnectez-vous." }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "La lecture automatique est indisponible : remplissez la fiche à la main." }, { status: 503 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Envoi illisible." }, { status: 400 });

  const text = String(form.get("text") ?? "").trim().slice(0, MAX_TEXT);
  const file = form.get("file");
  const sources: BriefSource[] = [];
  let fileName: string | null = null;
  // Ce qu'on garde du brief avec l'étude : le texte écrit, et celui du
  // document quand on sait le lire nous-mêmes (Word, PowerPoint, texte).
  const kept: string[] = [];

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Document trop lourd : 10 Mo au maximum." }, { status: 413 });
    fileName = file.name.slice(0, 160);
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      if (ext === "pdf") {
        sources.push({ kind: "pdf", base64: buf.toString("base64"), note: `Document joint par la marque : ${fileName}` });
      } else if (ext === "docx" || ext === "pptx") {
        const body = officeText(buf, ext);
        if (body.length < 20) return NextResponse.json({ error: "Ce document ne contient presque pas de texte. Collez l'essentiel dans le champ." }, { status: 422 });
        sources.push({ kind: "text", text: `Document « ${fileName} » :\n${body}` });
        kept.push(`Document « ${fileName} » :\n${body}`);
      } else if (ext === "txt" || ext === "md") {
        const body = buf.toString("utf8").slice(0, 60_000);
        sources.push({ kind: "text", text: `Document « ${fileName} » :\n${body}` });
        kept.push(`Document « ${fileName} » :\n${body}`);
      } else {
        return NextResponse.json({ error: "Format non pris en charge : PDF, Word (.docx), PowerPoint (.pptx) ou texte." }, { status: 415 });
      }
    } catch {
      return NextResponse.json({ error: "Document illisible. Essayez de l'exporter en PDF." }, { status: 422 });
    }
  }
  if (text) {
    sources.push({ kind: "text", text: `Ce que la marque a écrit :\n${text}` });
    kept.unshift(text);
  }
  if (sources.length === 0) return NextResponse.json({ error: "Écrivez quelques phrases ou déposez un document." }, { status: 400 });

  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Europe/Paris" }).format(new Date());
  try {
    const draft = await readBrief(sources, today);
    return NextResponse.json({ draft, fileName, source: kept.join("\n\n").slice(0, 80_000) });
  } catch (e) {
    console.error("[read-brief]", e);
    return NextResponse.json({ error: "La lecture a échoué. Réessayez, ou remplissez la fiche à la main." }, { status: 502 });
  }
}
