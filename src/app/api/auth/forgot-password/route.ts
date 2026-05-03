import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = "If an account exists and is eligible, we sent instructions.";

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

    const perEmail = await checkRateLimit({
      keyPrefix: "forgot-email",
      identifier: email,
      limit: 5,
      window: "1 h",
    });
    if (perEmail.limited) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const perIp = await checkRateLimit({
      keyPrefix: "forgot-ip",
      identifier: getRequestIp(req),
      limit: 20,
      window: "1 h",
    });
    if (perIp.limited) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, phoneNumber: true, phoneVerified: true },
    });

    if (!user || !user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: user.phoneNumber, channel: "sms" });

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch {
    console.error("forgot-password error");
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }
}
