import { type NextRequest, NextResponse } from "next/server";
import { LANG_COOKIE, isLang, langFromAcceptLanguage } from "@/lib/i18n/detect";

// Les pages légales doivent être lisibles sans compte : un participant les
// consulte avant de s'inscrire, et Google les vérifie pour publier
// l'application de connexion. Sans cette ligne, elles redirigent vers /login.
const PUBLIC_ROUTES = [
  "/", "/en", "/login", "/signup/brand", "/signup/participant", "/pricing",
  "/mentions-legales", "/confidentialite", "/conditions", "/accord-confidentialite", "/garanties", "/a-propos", "/en/about",
  "/signup/confirmation",
];

const PUBLIC_PREFIXES = ["/guides", "/en/guides"];
const PUBLIC_FILES = /^\/(robots\.txt|sitemap\.xml|llms(-full)?\.txt|manifest\.webmanifest|[a-f0-9]{32}\.txt)$|^\/(en\/)?(opengraph|twitter)-image/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if Supabase not configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  // Page d'accueil : un visiteur anglophone (ou qui a choisi l'anglais) part
  // sur /en. Les robots n'envoient pas de langue : ils restent sur la version
  // française, qui est la page de référence.
  if (pathname === "/") {
    const saved = request.cookies.get(LANG_COOKIE)?.value;
    const wanted = isLang(saved) ? saved : langFromAcceptLanguage(request.headers.get("accept-language"));
    if (wanted === "en") return NextResponse.redirect(new URL("/en", request.url));
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  const { supabaseResponse, user } = await updateSession(request);

  // Public routes — always accessible
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return supabaseResponse;
  }

  // Fichiers lus par les moteurs de recherche et les assistants IA, et pages
  // de contenu : jusqu'au 30/09/2026, robots.txt et sitemap.xml renvoyaient
  // vers /login — Google ne pouvait lire ni l'un ni l'autre.
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || PUBLIC_FILES.test(pathname)) {
    return supabaseResponse;
  }

  // Lien de parrainage : pose le cookie du parrain puis renvoie à l'inscription.
  if (pathname.startsWith("/r/")) {
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
