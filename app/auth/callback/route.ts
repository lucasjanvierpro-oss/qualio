import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!existingUser) {
    // New LinkedIn user — create as participant
    const email = data.user.email!;
    const meta = data.user.user_metadata ?? {};

    // Set role in Supabase user_metadata so proxy can read it without a DB query
    const serviceClient = await createServiceClient();
    await serviceClient.auth.admin.updateUserById(data.user.id, {
      user_metadata: { ...meta, role: "PARTICIPANT" },
    });

    await prisma.user.create({
      data: {
        email,
        role: "PARTICIPANT",
        supabaseId: data.user.id,
        participantProfile: {
          create: {
            firstName: meta.given_name ?? meta.full_name?.split(" ")[0] ?? "",
            lastName: meta.family_name ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "",
            linkedinUrl: meta.iss ? undefined : meta.sub,
          },
        },
      },
    });

    return NextResponse.redirect(new URL("/participant/onboarding", request.url));
  }

  const destinations: Record<string, string> = {
    BRAND: "/brand/dashboard",
    PARTICIPANT: "/participant/dashboard",
    ADMIN: "/admin",
  };

  return NextResponse.redirect(
    new URL(destinations[existingUser.role] ?? next, request.url)
  );
}
