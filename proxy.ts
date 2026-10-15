import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "apex_session";

// ─── Route classifications ────────────────────────────────────────────────────

/**
 * Routes that are always public and never require authentication.
 * Authenticated users who visit / intentionally see the entry page;
 * they are NOT auto-redirected to /dashboard.
 */
const ALWAYS_PUBLIC = new Set([
  "/",           // Entry / presentation page — always first
  "/entrypage",  // Legacy entry route — same content
  "/login",      // Sign-in / register form
  "/Authpage",   // Direct auth route
  "/about",
  "/platform",
  "/homepage",
  "/demo",
]);

// ─── Security headers ─────────────────────────────────────────────────────────

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

// ─── Session verification ─────────────────────────────────────────────────────

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const secret =
    process.env.JWT_SECRET ||
    "apex_enterprise_erp_secure_jwt_secret_key_2026_98374981734918237498127394812374";

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// ─── Proxy (edge middleware) ──────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API routes — let individual handlers do their own auth.
  if (pathname.startsWith("/api")) {
    return withSecurityHeaders(NextResponse.next());
  }

  // 2. Always-public pages — pass through without any session check.
  //    This covers / (entry page) and /login even when the user IS logged in.
  //    We deliberately do NOT redirect authenticated users away from / or /login
  //    so they can always reach the entry page if they want.
  if (ALWAYS_PUBLIC.has(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // 3. Everything else is a protected application route.
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
