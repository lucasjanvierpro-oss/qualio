import { NextRequest, NextResponse } from "next/server";
import { sweepNoShows } from "@/lib/interviews/reliability";
import { purgeOldRecordings } from "@/lib/interviews/retention";

// Tâche quotidienne (voir vercel.json) : absences non encore constatées, et
// vidéos de plus de 90 jours effacées chez Whereby. Protégée par CRON_SECRET.
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [absences, videos] = await Promise.all([sweepNoShows().catch((e) => ({ error: String(e) })), purgeOldRecordings().catch((e) => ({ error: String(e) }))]);
  return NextResponse.json({ absences, videos });
}
