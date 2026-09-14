import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getSupportEmail } from "@/lib/sms";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Same reply whether or not the email has an account, so the form can't be
 * used to enumerate members. The one exception is an account that exists but
 * has no verified phone: there is no way to text them a code, and pretending
 * we did leaves them waiting forever, so they get told to email us.
 */
const GENERIC_MESSAGE = "If that email has an account with a verified phone, a code is on its way.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const [perEmail, perIp] = await Promise.all([
      checkRateLimit({ keyPrefix: "forgot-email", identifier: email, limit: 5, window: "1 h" }),
      checkRateLimit({ keyPrefix: "forgot-ip", identifier: getRequestIp(req), limit: 20, window: "1 h" }),
    ]);
    if (perEmail.limited || perIp.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait an hour and try again." },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, phoneNumber: true, phoneVerified: true },
    });

    if (!user) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    if (!user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json(
        {
          error:
            `This account has no verified phone number, so we can't text you a code. ` +
            `Email ${getSupportEmail()} and we'll sort it out.`,
        },
        { status: 400 },
      );
    }

    await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: user.phoneNumber, channel: "sms" });

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("forgot-password error", error);
    return NextResponse.json(
      { error: "Couldn't send a code right now. Please try again in a minute." },
      { status: 500 },
    );
  }
}
