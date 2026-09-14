import type { NextRequest } from "next/server";

/**
 * Admin access is gated on one shared secret, `ADMIN_API_KEY` — the same key
 * the ops endpoints already accept in an `x-admin-key` header. There is no
 * admin flag on the User table: the people running Daisy do not have student
 * accounts, and a schema change against the production database is not worth
 * it for a single seat.
 *
 * The browser session is a cookie holding an HMAC of that key under
 * `AUTH_SECRET`. The key itself never reaches the cookie jar, and rotating
 * either secret signs every admin browser out at once.
 */

export const ADMIN_COOKIE = "daisy_admin";
/** Thirty days — long enough that a weekly check-in never asks for the key. */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string compare so a wrong key cannot be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The cookie value a signed-in admin carries. Null when the env is not set. */
export async function adminSessionToken(): Promise<string | null> {
  const key = process.env.ADMIN_API_KEY;
  const secret = process.env.AUTH_SECRET;
  if (!key || !secret) return null;
  return hmacHex(secret, `daisy-admin:${key}`);
}

export function isValidAdminKey(candidate: string | null | undefined): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key || !candidate) return false;
  return safeEqual(candidate, key);
}

export async function isValidAdminCookie(value: string | null | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await adminSessionToken();
  if (!expected) return false;
  return safeEqual(value, expected);
}

/** Header for scripts and curl, cookie for the browser. Either is enough. */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  if (isValidAdminKey(req.headers.get("x-admin-key"))) return true;
  return isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value);
}
