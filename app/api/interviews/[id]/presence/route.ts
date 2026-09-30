import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { markJoined, roleFor } from "@/lib/interviews/reliability";

// La salle de visio signale qu'une personne y est entrée : c'est ce qui permet
// de constater une absence sans que personne n'ait à le faire.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const role = await roleFor(id, me);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await markJoined(id, role);
  return NextResponse.json({ ok: true, role });
}
