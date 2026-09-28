import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/lab/simulate";

// Une marque simulée par jour (voir vercel.json). Vercel envoie le secret
// CRON_SECRET dans l'en-tête Authorization : sans lui, rien ne tourne — sinon
// n'importe qui pourrait déclencher des appels à Claude.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await runSimulation();
  return NextResponse.json(r, { status: "error" in r ? 500 : 200 });
}
