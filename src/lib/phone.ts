/**
 * Phone number handling, in one place.
 *
 * Daisy's audience is Montreal, so almost everyone types a bare ten-digit
 * number. The onboarding step used to turn that into "+" + digits, which made
 * 5142660119 become +5142660119 — a number Twilio rejects (error 21614) while
 * the API still reported the code as sent. The user then waited on a code that
 * was never going to arrive, with nothing on screen to explain it.
 *
 * A bare NANP number therefore gets +1, and only an explicit leading "+" is
 * treated as the caller supplying their own country code.
 */

/**
 * North American local shape: NXX-NXX-XXXX, where neither the area code nor
 * the exchange may begin with 0 or 1.
 */
const NANP_LOCAL = /^[2-9]\d{2}[2-9]\d{6}$/;

/** E.164 for a number we can actually send to, or null if it isn't one. */
export function normalizePhone(raw: string | null | undefined): string | null {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return null;

  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return null;

  // An explicit "+" usually means the country code is already there — but not
  // always. A "+" followed by exactly ten digits in North American shape is a
  // local number that lost its 1, which is what an older build of the client
  // produced (+5148341887). Twilio rejects those outright, so repair rather
  // than forward: no country code is a bare 10 digits in NANP shape, and a
  // cached browser bundle will keep sending them for a while yet.
  if (cleaned.startsWith("+")) {
    if (NANP_LOCAL.test(digits)) return `+1${digits}`;
    const e164 = `+${digits}`;
    return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
  }

  // Bare North American forms.
  if (NANP_LOCAL.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;

  return null;
}

/**
 * What the input shows as you type. Assumes North America unless the value
 * starts with "+", so a ten-digit entry reads back as +1 (514) 266-0119
 * instead of the old +5 (142) 660-1119.
 */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  if (!digits) return value.startsWith("+") ? "+" : "";

  if (value.startsWith("+") && !/^1\d{0,10}$/.test(digits)) {
    return `+${digits}`; // international: don't impose NANP grouping
  }

  // NANP. A leading 1 is the country code — no area code begins with 1.
  const local = digits.replace(/^1/, "").slice(0, 10);
  if (!local) return "+1";
  if (local.length <= 3) return `+1 (${local}`;
  if (local.length <= 6) return `+1 (${local.slice(0, 3)}) ${local.slice(3)}`;
  return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
