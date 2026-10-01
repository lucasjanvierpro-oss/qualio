import { NextRequest, NextResponse } from "next/server";
import { sweepNoShows } from "@/lib/interviews/reliability";
import { purgeOldRecordings, remindVideoExpiry } from "@/lib/interviews/retention";

// Tâche quotidienne (voir vercel.json) : absences non encore constatées, marques
// prévenues 7 jours avant l'effacement de leurs vidéos, et vidéos de plus de
// 90 jours effacées chez Whereby. Protégée par CRON_SECRET.
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [absences, reminders] = await Promise.all([sweepNoShows().catch((e) => ({ error: String(e) })), remindVideoExpiry().catch((e) => ({ error: String(e) }))]);
  const videos = await purgeOldRecordings().catch((e) => ({ error: String(e) }));
  return NextResponse.json({ absences, reminders, videos });
}
