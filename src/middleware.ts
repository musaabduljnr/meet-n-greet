import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./lib/auth/admin-auth";
import { canAccessPath } from "./lib/security/rbac";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Exempt public admin routes (login & unauthorized screen)
  if (pathname === "/admin/login" || pathname === "/admin/unauthorized") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  // 1. Missing session cookie -> redirect to login
  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("returnUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Validate session signature and expiration
  const session = await verifySessionToken(token);

  if (!session) {
    const expiredUrl = new URL("/admin/login", req.url);
    expiredUrl.searchParams.set("error", "session_expired");
    expiredUrl.searchParams.set("returnUrl", pathname);

    const response = NextResponse.redirect(expiredUrl);
    response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
    return response;
  }

  // 3. Role-Based Route Access Control
  const isAllowed = canAccessPath(session.role, pathname);

  if (!isAllowed) {
    const unauthorizedUrl = new URL("/admin/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    unauthorizedUrl.searchParams.set("role", session.role);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
