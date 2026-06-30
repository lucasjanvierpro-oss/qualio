"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

// ─── Schemas ──────────────────────────────────────────────

const BrandSignupSchema = z.object({
  companyName: z.string().min(2, "Nom de société requis"),
  industry: z.string().min(1, "Secteur requis"),
  contactFirstName: z.string().min(1, "Prénom requis"),
  contactLastName: z.string().min(1, "Nom requis"),
  contactTitle: z.string().min(1, "Poste requis"),
  email: z.email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

const ParticipantSignupSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
});

const LoginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// ─── Brand Signup ──────────────────────────────────────────

export async function signupBrand(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = BrandSignupSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { email, password, companyName, industry, contactFirstName, contactLastName, contactTitle } = parsed.data;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { role: "BRAND" }, // stored in user_metadata — used by proxy for routing
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { error: "Un compte avec cet email existe déjà. Connectez-vous." };
    }
    return { error: authError.message ?? "Erreur lors de la création du compte" };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Auto-confirm email for V1 (no email infrastructure yet)
  const serviceClient = await createServiceClient();
  await serviceClient.auth.admin.updateUserById(authData.user.id, {
    email_confirm: true,
  });

  try {
    await prisma.user.create({
      data: {
        email,
        role: "BRAND",
        supabaseId: authData.user.id,
        brandProfile: {
          create: {
            companyName,
            industry,
            contactFirstName,
            contactLastName,
            contactTitle,
          },
        },
      },
    });
  } catch {
    // Profile already exists (e.g., from a previous interrupted signup)
  }

  redirect("/brand/onboarding");
}

// ─── Participant Signup ────────────────────────────────────

export async function signupParticipant(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ParticipantSignupSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { email, password, firstName, lastName } = parsed.data;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { role: "PARTICIPANT" }, // stored in user_metadata
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { error: "Un compte avec cet email existe déjà. Connectez-vous." };
    }
    return { error: authError.message ?? "Erreur lors de la création du compte" };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Auto-confirm email for V1
  const serviceClient = await createServiceClient();
  await serviceClient.auth.admin.updateUserById(authData.user.id, {
    email_confirm: true,
  });

  try {
    await prisma.user.create({
      data: {
        email,
        role: "PARTICIPANT",
        supabaseId: authData.user.id,
        participantProfile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
    });
  } catch {
    // Profile already exists
  }

  redirect("/participant/onboarding");
}

// ─── Login ─────────────────────────────────────────────────

export async function login(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = LoginSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail." };
    }
    return { error: "Email ou mot de passe incorrect" };
  }

  // Role is stored in Supabase user_metadata — no DB query needed
  const role = (data.user?.user_metadata?.role as string) ?? "";

  const destinations: Record<string, string> = {
    BRAND: "/brand/dashboard",
    PARTICIPANT: "/participant/dashboard",
    ADMIN: "/admin",
  };

  redirect(destinations[role] ?? "/");
}

// ─── LinkedIn OAuth ────────────────────────────────────────

export async function signInWithLinkedIn() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: {
      scopes: "r_liteprofile r_emailaddress",
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: "Impossible de se connecter avec LinkedIn" };
  }

  redirect(data.url);
}

// ─── Logout ────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
