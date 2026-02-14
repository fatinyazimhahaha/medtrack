import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_ROLES = ["doctor"];
const FRONTDESK_ROLES = ["frontdesk"];
const ALL_INTERNAL_ROLES = ["doctor", "frontdesk", "admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware entirely for public paths — no Supabase calls needed
  const publicPaths = ["/", "/login", "/demo", "/api-docs", "/api/cron", "/api/seed", "/auth"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // 2. Require Supabase env in middleware (Edge may not have .env.local in some setups)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Middleware: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
  // 3. For protected routes, refresh session via Supabase
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Fetch role - try profiles table first, fall back to user metadata
  let role: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  role = profile?.role || user.user_metadata?.role || null;

  // Unknown role — redirect to login to avoid wrong dashboard
  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based routing guards
  if (pathname.startsWith("/patient") && role !== "patient") {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : STAFF_ROLES.includes(role) ? "/doctor" : "/";
    return NextResponse.redirect(url);
  }

  // /doctor routes are accessible to doctor (staff roles)
  if (pathname.startsWith("/doctor") && !STAFF_ROLES.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : role === "patient" ? "/patient" : "/";
    return NextResponse.redirect(url);
  }

  // /admin routes are accessible only to admin role
  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = STAFF_ROLES.includes(role) ? "/doctor" : FRONTDESK_ROLES.includes(role) ? "/frontdesk" : role === "patient" ? "/patient" : "/";
    return NextResponse.redirect(url);
  }

  // /frontdesk routes are accessible only to frontdesk role
  if (pathname.startsWith("/frontdesk") && role !== "frontdesk") {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : STAFF_ROLES.includes(role) ? "/doctor" : role === "patient" ? "/patient" : "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
  } catch (err) {
    console.error("Middleware error:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
