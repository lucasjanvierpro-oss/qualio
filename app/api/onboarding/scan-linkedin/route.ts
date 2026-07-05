import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Scan LinkedIn via Proxycurl (nubela.co). Prêt-à-brancher :
// dès que PROXYCURL_API_KEY est défini, on vérifie et enrichit le profil.
// Sans clé : on stocke juste l'URL et on renvoie "pending".
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { url } = await req.json() as { url?: string };
  if (!url || !url.includes("linkedin.com")) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { participantProfile: { select: { id: true } } },
  });
  if (!dbUser?.participantProfile) return NextResponse.json({ error: "no_profile" }, { status: 404 });

  // Sans clé Proxycurl → on stocke l'URL, vérification manuelle admin.
  if (!process.env.PROXYCURL_API_KEY) {
    await prisma.participantProfile.update({
      where: { id: dbUser.participantProfile.id },
      data: { linkedinUrl: url, linkedinVerified: false },
    });
    return NextResponse.json({ status: "pending", verified: false });
  }

  try {
    const res = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(url)}`,
      { headers: { Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}` } }
    );
    if (!res.ok) throw new Error(`Proxycurl ${res.status}`);
    const profile = await res.json() as { full_name?: string; occupation?: string; headline?: string };

    await prisma.participantProfile.update({
      where: { id: dbUser.participantProfile.id },
      data: {
        linkedinUrl: url,
        linkedinVerified: true,
        profession: profile.occupation ?? undefined,
      },
    });
    return NextResponse.json({
      status: "verified", verified: true,
      preview: { name: profile.full_name, occupation: profile.occupation, headline: profile.headline },
    });
  } catch {
    await prisma.participantProfile.update({
      where: { id: dbUser.participantProfile.id },
      data: { linkedinUrl: url, linkedinVerified: false },
    });
    return NextResponse.json({ status: "pending", verified: false });
  }
}
