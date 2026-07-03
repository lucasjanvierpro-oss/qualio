import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup/brand", "/signup/participant", "/pricing"];

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
