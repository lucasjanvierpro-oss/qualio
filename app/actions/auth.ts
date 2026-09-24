"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";
import { appUrl } from "@/lib/appUrl";
import { emailConfirmationRequired } from "@/lib/auth/emailConfirmation";
import { emailDomain, isProDomain } from "@/lib/brands/certification";

/** Où atterrit chaque rôle après connexion, quelle que soit la méthode. */
const DESTINATIONS: Record<string, string> = {
  BRAND: "/brand/dashboard",
  PARTICIPANT: "/participant/dashboard",
  ADMIN: "/admin",
};

// ─── Schemas ──────────────────────────────────────────────

// Inscription marque en quatre champs : le secteur, le nom et le poste se
// complètent plus tard, depuis le compte.
const BrandSignupSchema = z.object({
  companyName: z.string().trim().min(2, "Nom de société requis"),
  industry: z.string().optional(),
  contactFirstName: z.string().trim().min(1, "Prénom requis"),
  contactLastName: z.string().optional(),
  contactTitle: z.string().optional(),
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
      emailRedirectTo: `${appUrl()}/auth/callback`,
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

  // Tant qu'aucun expéditeur réel n'est branché, on confirme l'adresse nous-mêmes :
  // sinon le compte resterait bloqué en attente d'un email qui n'arrive jamais.
  if (!emailConfirmationRequired()) {
    const serviceClient = await createServiceClient();
    await serviceClient.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
    });
  }

  try {
    await prisma.user.create({
      data: {
        email,
        role: "BRAND",
        supabaseId: authData.user.id,
        brandProfile: {
          create: {
            companyName,
            industry: industry || null,
            contactFirstName,
            contactLastName: contactLastName || null,
            contactTitle: contactTitle || null,
            // Le site se déduit d'une adresse pro ; la marque le corrige au besoin.
            website: isProDomain(emailDomain(email)) ? `https://${emailDomain(email)}` : null,
          },
        },
      },
    });
  } catch {
    // Profile already exists (e.g., from a previous interrupted signup)
  }

  if (emailConfirmationRequired()) {
    redirect(`/signup/confirmation?email=${encodeURIComponent(email)}&next=brand`);
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
      emailRedirectTo: `${appUrl()}/auth/callback`,
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

  // Même raison que pour l'inscription marque.
  if (!emailConfirmationRequired()) {
    const serviceClient = await createServiceClient();
    await serviceClient.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
    });
  }

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

  if (emailConfirmationRequired()) {
    redirect(`/signup/confirmation?email=${encodeURIComponent(email)}&next=participant`);
  }
  redirect("/signup/participant");
}

/**
 * Renvoie le lien de confirmation à une adresse qui n'a pas encore été validée.
 * On ne révèle jamais si l'adresse existe : la réponse est la même dans tous
 * les cas, sinon le formulaire devient un moyen de savoir qui est inscrit.
 */
export async function resendConfirmation(email: string, role: "BRAND" | "PARTICIPANT") {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { error: "Adresse email invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: clean,
    options: { emailRedirectTo: `${appUrl()}/auth/callback?role=${role}` },
  });

  if (error?.status === 429) {
    return { error: "Trop de demandes. Patientez une minute." };
  }
  return { ok: true as const };
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

  redirect(DESTINATIONS[role] ?? "/");
}

// ─── LinkedIn OAuth ────────────────────────────────────────

export type OAuthProvider = "google" | "linkedin_oidc";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  linkedin_oidc: "LinkedIn",
};

/**
 * Connexion par Google ou LinkedIn.
 *
 * Le rôle voulu voyage dans l'URL de retour : sans lui, quelqu'un qui s'inscrit
 * comme marque via Google serait créé comme participant, puisque le fournisseur
 * ne transmet que l'identité, jamais l'intention.
 *
 * Les scopes ne sont pas précisés : Supabase envoie déjà « openid profile
 * email » pour les deux. Les anciens scopes LinkedIn (r_liteprofile,
 * r_emailaddress) appartiennent à une API abandonnée et font échouer l'appel.
 */
export async function signInWithProvider(provider: OAuthProvider, role?: "BRAND" | "PARTICIPANT") {
  const supabase = await createClient();

  const callback = new URL(`${appUrl()}/auth/callback`);
  if (role) callback.searchParams.set("role", role);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callback.toString(),
      // Sans « select_account », Google reconnecte en silence le dernier compte
      // utilisé : impossible d'en changer sur un ordinateur partagé.
      queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
    },
  });

  if (error || !data.url) {
    return { error: `Connexion ${PROVIDER_LABEL[provider]} indisponible. Réessayez ou utilisez votre mot de passe.` };
  }

  redirect(data.url);
}

// ─── Code de vérification par email ────────────────────────

/**
 * Envoie un code à six chiffres pour se connecter sans mot de passe.
 *
 * Ne crée aucun compte : on ne veut pas qu'une faute de frappe dans l'adresse
 * fabrique un compte vide. Le modèle d'email correspondant doit contenir
 * {{ .Token }} dans Supabase, sinon c'est un lien magique qui part, pas un code.
 */
export async function sendEmailCode(email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { error: "Adresse email invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: false },
  });

  if (error) {
    // On ne dit jamais si l'adresse existe : ce serait un moyen de vérifier
    // qui est inscrit sur Rarelyst.
    if (error.status === 429) {
      return { error: "Trop de demandes. Patientez quelques minutes." };
    }
    return { ok: true as const };
  }
  return { ok: true as const };
}

/** Vérifie le code reçu et ouvre la session. */
export async function verifyEmailCode(email: string, code: string) {
  const token = code.replace(/\D/g, "");
  if (token.length !== 6) return { error: "Le code comporte six chiffres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "email",
  });

  if (error || !data.user) {
    return { error: "Code invalide ou expiré. Demandez-en un nouveau." };
  }

  const role = String(data.user.user_metadata?.role ?? "").toUpperCase();
  // Un code reçu dans la boîte prouve qu'on la contrôle : titre II du poinçon.
  if (role === "BRAND" && isProDomain(emailDomain(email))) {
    await prisma.brandProfile.updateMany({
      where: { user: { supabaseId: data.user.id }, domainVerifiedAt: null },
      data: { domainVerifiedAt: new Date() },
    }).catch(() => {});
  }
  redirect(DESTINATIONS[role] ?? "/");
}

// ─── Logout ────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
