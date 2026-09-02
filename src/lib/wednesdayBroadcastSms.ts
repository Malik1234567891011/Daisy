import type { PrismaClient } from "@prisma/client";
import twilio from "twilio";

const DELAY_MS = 650;

const TZ = "America/Toronto";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildWednesdayBroadcastBody(): string {
  const base = (
    process.env.BROADCAST_SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://www.daisyweekly.com"
  ).replace(/\/$/, "");
  const dash = `${base}/dashboard`;
  const support = process.env.BROADCAST_SUPPORT_EMAIL || "hello@joindaisy.com";
  const custom = process.env.BROADCAST_BODY;
  if (custom && String(custom).trim()) {
    return String(custom)
      .trim()
      .replace(/\{\{DASHBOARD\}\}/g, dash)
      .replace(/\{\{URL\}\}/g, base)
      .replace(/\{\{EMAIL\}\}/g, support);
  }
  return (
    "Daisy 🌼 your match is ready.\n\n" +
    "Every Wednesday we match you with 1 student in Montreal.\n" +
    "Open your dashboard to see them.\n\n" +
    "If you both say yes, you'll unlock each other's contact.\n\n" +
    `👉 ${dash}`
  );
}

/** Calendar date in Toronto, YYYY-MM-DD — used for weekly dedupe. */
export function torontoDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * True during Wednesday ~5:00–6:14 PM Toronto (first quarter of the 5pm or 6pm hour).
 * Vercel cron runs once at 22:00 UTC (`0 22 * * 3`): in summer that is 6:00 PM Toronto,
 * in winter 5:00 PM — one slot covers both without a second daily cron.
 */
export function isWednesdaySixPmTorontoWindow(now: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(now);
  if (weekday !== "Wed") return false;
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    hour12: false,
  }).format(now);
  const minuteStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    minute: "numeric",
  }).format(now);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return (hour === 17 || hour === 18) && minute < 15;
}

/** How far back a match's dropDate can be and still count as "this drop". */
export const DROP_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Matches belonging to the drop that just went live.
 *
 * Synthetic accounts are excluded on both sides. A reviewer's seeded match is
 * still a Match row with a dropDate, and without this it would satisfy the
 * "has a drop happened" gate for the entire production user base.
 */
function realDropWhere(now: Date) {
  return {
    dropDate: { lte: now, gte: new Date(now.getTime() - DROP_WINDOW_MS) },
    userA: { isTestAccount: false },
    userB: { isTestAccount: false },
  } as const;
}

/**
 * At least one real match whose drop time has passed in the last 48h (weekly drop just went live).
 * Disable with BROADCAST_REQUIRE_RECENT_DROP=no
 */
export async function hasRecentPublicDrop(
  prisma: PrismaClient,
  now: Date,
): Promise<boolean> {
  if (process.env.BROADCAST_REQUIRE_RECENT_DROP === "no") return true;
  const n = await prisma.match.count({ where: realDropWhere(now) });
  return n > 0;
}

/**
 * Who gets texted: people who actually have a live match in this drop.
 *
 * This used to return every consenting user regardless of whether they were in
 * the drop, which meant one stray Match row could trigger a message to the
 * whole user base telling them a match was waiting when none was. Recipients
 * are now derived from the drop itself.
 */
export async function getWednesdayBroadcastRecipients(
  prisma: PrismaClient,
  now: Date,
) {
  const where = realDropWhere(now);
  return prisma.user.findMany({
    where: {
      phoneVerified: true,
      phoneNumber: { not: null },
      smsConsent: true,
      isTestAccount: false,
      OR: [
        { matchesAsA: { some: { ...where, status: { in: ["PENDING", "MUTUAL"] } } } },
        { matchesAsB: { some: { ...where, status: { in: ["PENDING", "MUTUAL"] } } } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      phoneNumber: true,
      email: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export type SendWednesdayBroadcastResult = {
  sent: number;
  failed: number;
  sids: string[];
  errors: { to: string; message: string }[];
};

export async function sendWednesdayBroadcastSms(
  prisma: PrismaClient,
  users: { phoneNumber: string | null }[],
): Promise<SendWednesdayBroadcastResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Missing Twilio env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)");
  }
  const body = buildWednesdayBroadcastBody();
  const client = twilio(sid, token);
  const sids: string[] = [];
  const errors: { to: string; message: string }[] = [];
  let sent = 0;
  let failed = 0;
  const list = users.filter((u): u is { phoneNumber: string } => !!u.phoneNumber);
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    try {
      const msg = await client.messages.create({
        to: u.phoneNumber,
        from,
        body,
      });
      sent++;
      sids.push(msg.sid);
    } catch (e) {
      failed++;
      errors.push({
        to: u.phoneNumber,
        message: e instanceof Error ? e.message : String(e),
      });
    }
    if (i < list.length - 1) await sleep(DELAY_MS);
  }
  return { sent, failed, sids, errors };
}
