import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: true },
  });

  if (!dbUser?.participantProfile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const ext     = file.name.split(".").pop() ?? "jpg";
  const path    = `${dbUser.participantProfile.id}/id-document.${ext}`;
  const buffer  = Buffer.from(await file.arrayBuffer());

  // Use service-role Supabase client to upload to private bucket
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: uploadError } = await serviceSupabase.storage
    .from("id-documents")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Store path in DB + reset verification status to PENDING
  await prisma.participantProfile.update({
    where: { id: dbUser.participantProfile.id },
    data: {
      idDocumentUrl: path,
      idVerificationStatus: "PENDING",
    },
  });

  return NextResponse.json({ path, status: "PENDING" });
}
