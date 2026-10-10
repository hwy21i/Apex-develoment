import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "apex_session";

// Routes that never require a session.
const AUTH_ROUTES = ["/login", "/Authpage", "/entrypage"];
const PUBLIC_ROUTES = ["/about", "/platform", "/homepage", "/demo"];

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret =
    process.env.JWT_SECRET ||
    "apex_enterprise_erp_secure_jwt_secret_key_2026_98374981734918237498127394812374";
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: only attach security headers. Authorization is enforced
  // inside each route handler via requireAuth/requirePermission.
  if (pathname.startsWith("/api")) {
    return withSecurityHeaders(NextResponse.next());
  }

  const authed = await isAuthenticated(request);

  // Signed-in users should not see the login/entry screens.
  if (AUTH_ROUTES.includes(pathname)) {
    if (authed) return NextResponse.redirect(new URL("/dashboard", request.url));
    return withSecurityHeaders(NextResponse.next());
  }

  // Public marketing pages are always reachable.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Root: route into the real app or the login screen.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(authed ? "/dashboard" : "/login", request.url));
  }

  // Everything else is a protected application route.
  if (!authed) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
