import { NextRequest, NextResponse } from "next/server";
import { REFERRAL_COOKIE, normalizeCode, referrerByCode } from "@/lib/referral/referral";

// Lien de parrainage partagé : rarelyst.co/r/CAMILLE-7K2P. On retient le code
// trente jours dans un cookie, puis on envoie vers l'inscription ; le compte
// sera rattaché au parrain à la première étape du tunnel.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = await referrerByCode(code).catch(() => null);
  const url = new URL("/signup/participant", req.nextUrl.origin);
  if (!referrer) return NextResponse.redirect(url);
  const c = normalizeCode(code);
  url.searchParams.set("parrain", c);
  const res = NextResponse.redirect(url);
  res.cookies.set(REFERRAL_COOKIE, c, { maxAge: 30 * 24 * 3600, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return res;
}
