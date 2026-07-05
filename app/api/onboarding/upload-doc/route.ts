import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// Upload CV / portfolio → bucket privé "participant-docs" (créer côté Supabase).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true } } },
  });
  if (!dbUser?.participantProfile) return NextResponse.json({ error: "no_profile" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kind = String(form.get("kind") ?? "doc");
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "too_large" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const path = `${dbUser.participantProfile.id}/${kind}.${ext}`;

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage
    .from("participant-docs")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: path });
}
