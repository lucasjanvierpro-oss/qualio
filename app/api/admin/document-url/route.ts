import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// Lien temporaire (5 minutes) vers un document privé, pour l'admin seulement :
// pièce d'identité (bucket « id-documents ») ou CV et book (« participant-docs »).
// Avec ?open=1, on redirige directement vers le document.
const BUCKETS = { id: "id-documents", docs: "participant-docs" } as const;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (dbUser?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path || path.includes("..")) return NextResponse.json({ error: "path_required" }, { status: 400 });
  const bucket = BUCKETS[req.nextUrl.searchParams.get("bucket") === "docs" ? "docs" : "id"];

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceSupabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  }
  if (req.nextUrl.searchParams.get("open") === "1") return NextResponse.redirect(data.signedUrl);
  return NextResponse.json({ url: data.signedUrl });
}
