import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { reportTechnical, requestReschedule, roleFor } from "@/lib/interviews/reliability";

// Depuis la salle : « Reporter l'entretien » ou « Problème technique ».
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const role = await roleFor(id, me);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { kind?: string; reason?: string; network?: string };
  const reason = String(body.reason ?? "").trim();
  if (body.kind === "reschedule") {
    if (reason.length < 3) return NextResponse.json({ error: "Indiquez en quelques mots pourquoi." }, { status: 400 });
    const r = await requestReschedule(id, role, reason);
    return "error" in r ? NextResponse.json(r, { status: 409 }) : NextResponse.json(r);
  }
  if (body.kind === "technical") {
    if (reason.length < 2) return NextResponse.json({ error: "Décrivez le problème en quelques mots." }, { status: 400 });
    const r = await reportTechnical(id, role, reason, { network: body.network?.slice(0, 40), userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? undefined });
    return "error" in r ? NextResponse.json(r, { status: 404 }) : NextResponse.json(r);
  }
  return NextResponse.json({ error: "Demande inconnue." }, { status: 400 });
}
