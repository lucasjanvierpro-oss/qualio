import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Lien de confirmation d'adresse reçu par email.
 *
 * Le lien par défaut de Supabase revient sur /auth/callback avec un « code »
 * à échanger, et cet échange exige un cookie posé à l'inscription, dans le
 * même navigateur. Quelqu'un qui s'inscrit depuis Instagram puis ouvre l'email
 * dans l'appli Gmail tombe alors sur un échec, alors que son adresse vient
 * bel et bien d'être confirmée. Le modèle d'email « Confirm sign up » pointe
 * donc ici, avec un jeton vérifié directement : ça marche quel que soit
 * l'appareil, et la session s'ouvre là où l'on a cliqué.
 */

/** Où reprendre : là où l'inscription se serait poursuivie sans l'email. */
const NEXT_STEP: Record<string, string> = {
  BRAND: "/brand/onboarding",
  PARTICIPANT: "/participant/dashboard",
  ADMIN: "/admin",
};

const CONFIRMATION_TYPES: EmailOtpType[] = ["email", "signup"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !CONFIRMATION_TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/login?error=lien_invalide", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  // Lien déjà utilisé ou expiré : l'adresse est souvent confirmée malgré tout,
  // la page de connexion le dit et propose de se connecter.
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=lien_invalide", request.url));
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
    select: { role: true },
  });
  const role = existing?.role ?? String(data.user.user_metadata?.role ?? "").toUpperCase();

  return NextResponse.redirect(new URL(NEXT_STEP[role] ?? "/", request.url));
}
