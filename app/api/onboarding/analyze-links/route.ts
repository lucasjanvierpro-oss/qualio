import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { analyzeLinks, type LinkInput } from "@/lib/participants/links";
import { TRAITS, TRAIT_CLAIMED, toUrl, type LinkKind } from "@/lib/onboarding/questions";

// Lecture de 6 pages au plus, puis un appel Haiku : quelques secondes en
// général, mais un site lent peut tenir jusqu'au délai de 8 s par page.
export const maxDuration = 60;

const KINDS: LinkKind[] = ["linkedin", "instagram", "tiktok", "website", "other"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { links?: { kind?: string; url?: string }[] };
  const links: LinkInput[] = (body.links ?? [])
    .filter((l) => KINDS.includes(l.kind as LinkKind) && typeof l.url === "string" && l.url.trim())
    .map((l) => ({ kind: l.kind as LinkKind, url: toUrl(l.kind as LinkKind, l.url!) }))
    .filter((l) => { try { new URL(l.url); return true; } catch { return false; } })
    .slice(0, 6);
  if (!links.length) return NextResponse.json({ error: "no_links" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      participantProfile: {
        select: { id: true, firstName: true, lastName: true, segment: true, proRole: true, selfTraits: true },
      },
    },
  });
  const p = dbUser?.participantProfile;
  if (!p) return NextResponse.json({ error: "no_profile" }, { status: 404 });

  const traits = (p.selfTraits ?? {}) as Record<string, number>;
  const analysis = await analyzeLinks(links, {
    name: `${p.firstName} ${p.lastName}`.trim(),
    segment: p.segment,
    proRole: p.proRole,
    claims: TRAITS.filter((t) => (traits[t.key] ?? 0) >= TRAIT_CLAIMED).map((t) => t.key),
  });

  const url = (k: LinkKind) => links.find((l) => l.kind === k)?.url ?? null;
  await prisma.participantProfile.update({
    where: { id: p.id },
    data: {
      linksAnalysis: analysis,
      linkedinUrl: url("linkedin"),
      instagramUrl: url("instagram"),
      tiktokUrl: url("tiktok"),
      websiteUrl: url("website"),
      otherLinks: links.filter((l) => l.kind === "other").map((l) => l.url),
    },
  });

  return NextResponse.json(analysis);
}
