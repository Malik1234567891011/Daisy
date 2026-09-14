import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getWednesdayBroadcastRecipients,
  hasRecentPublicDrop,
  isWednesdaySixPmTorontoWindow,
  sendWednesdayBroadcastSms,
  torontoDateKey,
} from "@/lib/wednesdayBroadcastSms";

export const maxDuration = 300;

const JOB = "wednesday_match_sms";

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Vercel Cron: Wednesday 22:00 UTC (`0 22 * * 3`) with a retry at 22:30. Handler only sends
 * during the Wednesday 5:00–7:59 PM Toronto window (covers EST vs EDT); the dedupe row makes
 * the retry a no-op when the first run succeeded. Manual: GET with Bearer CRON_SECRET.
 *
 * Env: CRON_SECRET (required), Twilio + DATABASE_URL, optional BROADCAST_REQUIRE_RECENT_DROP=no
 */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodKey = torontoDateKey(now);

  if (!isWednesdaySixPmTorontoWindow(now)) {
    return NextResponse.json({
      ok: true,
      skipped: "outside_toronto_drop_window",
      periodKey,
    });
  }

  if (!(await hasRecentPublicDrop(prisma, now))) {
    return NextResponse.json({
      ok: true,
      skipped: "no_recent_match_drop",
      periodKey,
      hint: "No Match with dropDate in the last 48h and <= now. Set BROADCAST_REQUIRE_RECENT_DROP=no to override.",
    });
  }

  try {
    await prisma.broadcastDedupe.create({
      data: { job: JOB, periodKey },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({
        ok: true,
        skipped: "already_sent_this_period",
        periodKey,
      });
    }
    throw e;
  }

  try {
    const users = await getWednesdayBroadcastRecipients(prisma, now);
    const result = await sendWednesdayBroadcastSms(prisma, users);
    return NextResponse.json({
      ok: true,
      periodKey,
      recipients: users.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length ? result.errors.slice(0, 20) : undefined,
    });
  } catch (e) {
    await prisma.broadcastDedupe
      .delete({ where: { job_periodKey: { job: JOB, periodKey } } })
      .catch(() => {});
    throw e;
  }
}
