import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/admin-auth";

const PROTECTED = ["/dashboard", "/profile", "/preferences", "/verify-phone"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The admin area has its own gate, separate from student sessions: it is
  // opened with the shared admin key, not with an account.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const ok = await isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const isSecure = req.nextUrl.protocol === "https:";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName,
      salt: cookieName,
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/preferences/:path*",
    "/verify-phone/:path*",
    "/admin/:path*",
  ],
};
