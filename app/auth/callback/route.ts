import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Retour de Google, de LinkedIn et des liens envoyés par email.
 *
 * Un fournisseur d'identité transmet qui est la personne, jamais ce qu'elle
 * vient faire : c'est le paramètre `role`, posé au départ par
 * signInWithProvider, qui dit s'il s'agit d'une marque ou d'un participant.
 * Sans lui, on crée un participant — le cas de loin le plus courant.
 */

const DESTINATIONS: Record<string, string> = {
  BRAND: "/brand/dashboard",
  PARTICIPANT: "/participant/dashboard",
  ADMIN: "/admin",
};

/** Première étape à remplir pour un compte tout juste créé. */
const ONBOARDING: Record<string, string> = {
  BRAND: "/brand/onboarding",
  PARTICIPANT: "/signup/participant",
};

function splitName(meta: Record<string, unknown>) {
  const full = String(meta.full_name ?? meta.name ?? "").trim();
  const given = meta.given_name ? String(meta.given_name) : full.split(" ")[0] ?? "";
  const family = meta.family_name ? String(meta.family_name) : full.split(" ").slice(1).join(" ");
  return { firstName: given, lastName: family };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const wanted = (searchParams.get("role") ?? "").toUpperCase();
  const role = wanted === "BRAND" ? "BRAND" : "PARTICIPANT";

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
    select: { role: true },
  });

  if (existingUser) {
    return NextResponse.redirect(new URL(DESTINATIONS[existingUser.role] ?? next, request.url));
  }

  // ── Compte inconnu : on le crée ──
  const email = data.user.email;
  if (!email) {
    // Un compte LinkedIn sans adresse vérifiée ne peut pas recevoir d'invitation
    // à un entretien : mieux vaut le dire tout de suite que le créer à moitié.
    return NextResponse.redirect(new URL("/login?error=no_email", request.url));
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const { firstName, lastName } = splitName(meta);

  // Le rôle vit aussi dans user_metadata : proxy.ts s'en sert pour router sans
  // interroger la base à chaque requête.
  const serviceClient = await createServiceClient();
  await serviceClient.auth.admin.updateUserById(data.user.id, {
    user_metadata: { ...meta, role },
  });

  try {
    await prisma.user.create({
      data: {
        email,
        role,
        supabaseId: data.user.id,
        ...(role === "BRAND"
          ? {
              brandProfile: {
                create: {
                  // La personne complétera le nom de sa société à l'étape
                  // suivante ; le compte ne peut pas exister sans ce champ.
                  companyName: String(meta.company ?? "").trim() || email.split("@")[1] || "Mon entreprise",
                  contactFirstName: firstName || null,
                  contactLastName: lastName || null,
                },
              },
            }
          : {
              participantProfile: {
                create: { firstName, lastName },
              },
            }),
      },
    });
  } catch {
    // Un compte existe déjà pour cette adresse : on laisse la connexion suivre
    // son cours plutôt que d'afficher une erreur à quelqu'un qui vient
    // simplement de changer de méthode de connexion.
    const again = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: { role: true },
    });
    if (again) {
      return NextResponse.redirect(new URL(DESTINATIONS[again.role] ?? next, request.url));
    }
    return NextResponse.redirect(new URL("/login?error=account_conflict", request.url));
  }

  return NextResponse.redirect(new URL(ONBOARDING[role] ?? next, request.url));
}
