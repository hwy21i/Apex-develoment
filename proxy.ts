import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (!request.cookies.has("apex_session")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/Authpage";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/tasks/:path*", "/inventory/:path*", "/equipment/:path*", "/finance/:path*", "/procurement/:path*", "/people/:path*", "/reports/:path*", "/documents/:path*", "/administration/:path*", "/clients/:path*", "/materials/:path*", "/warehouses/:path*", "/calendar/:path*", "/timeline/:path*"],
};
