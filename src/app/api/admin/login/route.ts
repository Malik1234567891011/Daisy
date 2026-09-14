import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminSessionToken,
  isValidAdminKey,
} from "@/lib/admin-auth";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** POST { key } — trade the admin key for a browser session. */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit({
    keyPrefix: "admin-login",
    identifier: getRequestIp(req),
    limit: 10,
    window: "15 m",
  });
  if (rl.limited) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key.trim() : "";

  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "That key is not right" }, { status: 401 });
  }

  const token = await adminSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, { ...cookieOptions, maxAge: ADMIN_COOKIE_MAX_AGE });
  return res;
}

/** DELETE — sign the browser out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
