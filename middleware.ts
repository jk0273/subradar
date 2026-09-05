import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const rateLimitStore = new Map();

function rateLimit(ip, limit, windowMs) {
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

function getClientIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim()
    || "unknown";
}

const PROTECTED = ["/dashboard","/connect","/subscriptions","/settings","/api/scan","/api/subscriptions","/api/stripe","/api/user"];
const AUTH_ROUTES = ["/login","/register"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  const g = rateLimit(ip, 100, 10000);
  if (!g.allowed) return new NextResponse("Too Many Requests", { status: 429 });

  if (pathname.startsWith("/api/cron")) {
    if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, httpOnly: true, secure: true, sameSite: "lax" })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (PROTECTED.some(r => pathname.startsWith(r)) && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ROUTES.some(r => pathname.startsWith(r)) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
