import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (record.count >= limit) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

const PROTECTED_ROUTES = ["/dashboard", "/connect", "/subscriptions", "/settings", "/api/scan", "/api/subscriptions", "/api/stripe/checkout", "/api/stripe/portal", "/api/user"];
const AUTH_ROUTES = ["/login", "/register"];
const API_LIMITS: Record<string, [number, number]> = {
  "/api/scan/start": [3, 60_000],
  "/api/subscriptions": [30, 60_000],
  "/api/stripe/checkout": [5, 60_000],
  "/api/auth/gmail": [10, 60_000],
  "/api/cron": [1, 60_000],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip = (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    "unknown"
  );

  const global = rateLimit(ip, 100, 10_000);
  if (!global.allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "10", "X-RateLimit-Remaining": "0" },
    });
  }

  const matchedLimit = Object.entries(API_LIMITS).find(([route]) => pathname.startsWith(route));
  if (matchedLimit) {
    const [route, [limit, window]] = matchedLimit;
    const check = rateLimit(`${ip}:${route}`, limit, window);
    if (!check.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil(window / 1000)) } }
      );
    }
  }

  const ua = request.headers.get("user-agent") ?? "";
  const suspiciousPatterns = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /dirbuster/i, /burpsuite/i];
  if (suspiciousPatterns.some((p) => p.test(ua)) && pathname.startsWith("/api")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (pathname.startsWith("/api/cron")) {
    const cronSecret = request.headers.get("authorization");
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...(options as Record<string, unknown>),
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  response.headers.set("X-RateLimit-Remaining", String(global.remaining));
  response.headers.set("X-Request-ID", crypto.randomUUID());

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
