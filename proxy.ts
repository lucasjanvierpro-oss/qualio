import { type NextRequest, NextResponse } from "next/server";

// Les pages légales doivent être lisibles sans compte : un participant les
// consulte avant de s'inscrire, et Google les vérifie pour publier
// l'application de connexion. Sans cette ligne, elles redirigent vers /login.
const PUBLIC_ROUTES = [
  "/", "/login", "/signup/brand", "/signup/participant", "/pricing",
  "/mentions-legales", "/confidentialite", "/conditions",
  "/signup/confirmation",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if Supabase not configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  const { supabaseResponse, user } = await updateSession(request);

  // Public routes — always accessible
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return supabaseResponse;
  }

  // Retours de connexion (Google, LinkedIn, liens reçus par email) : la session
  // n'existe pas encore, ce sont précisément ces routes qui la créent. Sans cette
  // ligne, tout visiteur non connecté repartait vers /login, code perdu.
  if (pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  // Endpoints appelés par des services externes (aucune session utilisateur) :
  // webhooks Stripe & Whereby, et cron Vercel. Ils gèrent leur propre sécurité.
  if (
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/cron/")
  ) {
    return supabaseResponse;
  }

  // Not logged in → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role is stored in Supabase user_metadata — set during signup
  // No DB query needed — avoids RLS issues and is faster
  const role = ((user.user_metadata?.role as string) ?? "").toLowerCase();

  const destinations: Record<string, string> = {
    brand: "/brand/dashboard",
    participant: "/participant/dashboard",
    admin: "/admin",
  };

  // Enforce role-based access
  if (pathname.startsWith("/brand") && role !== "brand") {
    return NextResponse.redirect(new URL(destinations[role] ?? "/", request.url));
  }
  if (pathname.startsWith("/participant") && role !== "participant") {
    return NextResponse.redirect(new URL(destinations[role] ?? "/", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(destinations[role] ?? "/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
