import type { PrismaClient } from "@prisma/client";
import twilio from "twilio";

const DELAY_MS = 650;

const TZ = "America/Toronto";

/** A drop counts as "just happened" for this long. Shared by the recipient
 *  query and the has-a-drop-happened guard so they can never disagree. */
export const DROP_WINDOW_MS = 48 * 60 * 60 * 1000;

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
  // One GSM-7 segment (154 chars). Emoji or a curly apostrophe would push
  // this into UCS-2, where a segment is 67 chars instead of 153 - the same
  // text would then bill as 4 segments. Keep it plain ASCII.
  return (
    "Daisy: your match is ready. Open your dashboard to see them - " +
    "if you both say yes, you unlock each other's contact.\n\n" +
    dash
  );
}

/** Calendar date in Toronto, YYYY-MM-DD — used for weekly dedupe. */
export function torontoDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * True on Wednesday between 5:00 PM and 7:59 PM Toronto.
 *
 * Vercel cron fires at 22:00 UTC (`0 22 * * 3`): 6:00 PM in summer, 5:00 PM
 * in winter. The window is three hours wide, not fifteen minutes, because
 * cron delivery can slip — on the Hobby plan by up to an hour — and a missed
 * window means nobody gets texted that week. Dedupe stops double sends.
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
  const hour = parseInt(hourStr, 10);
  return hour >= 17 && hour <= 19;
}

/**
 * At least one match whose drop time has passed in the last 48h (weekly drop just went live).
 * Disable with BROADCAST_REQUIRE_RECENT_DROP=no
 */
export async function hasRecentPublicDrop(
  prisma: PrismaClient,
  now: Date,
): Promise<boolean> {
  if (process.env.BROADCAST_REQUIRE_RECENT_DROP === "no") return true;
  const since = new Date(now.getTime() - DROP_WINDOW_MS);
  const n = await prisma.match.count({
    where: { dropDate: { lte: now, gte: since } },
  });
  return n > 0;
}

/**
 * Only people who actually got a match in this drop. Texting every verified
 * member "your match is ready" sends the unmatched ones to an empty
 * dashboard. EXPIRED is excluded so a reroll from earlier in the week that
 * the seed script just retired doesn't count as this week's drop.
 */
export async function getWednesdayBroadcastRecipients(
  prisma: PrismaClient,
  now: Date = new Date(),
) {
  const since = new Date(now.getTime() - DROP_WINDOW_MS);
  const matches = await prisma.match.findMany({
    where: {
      dropDate: { lte: now, gte: since },
      status: { not: "EXPIRED" },
    },
    select: { userAId: true, userBId: true },
  });

  const ids = [...new Set(matches.flatMap((m) => [m.userAId, m.userBId]))];
  if (ids.length === 0) return [];

  return prisma.user.findMany({
    where: {
      id: { in: ids },
      phoneVerified: true,
      phoneNumber: { not: null },
      smsConsent: true,
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
