import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;



export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const normalized = normalizePhone(phone);

    if (!normalized) {
      return NextResponse.json(
        { error: "Enter a valid phone number with country code (e.g. +15141234567)" },
        { status: 400 },
      );
    }

    const perUser = await checkRateLimit({
      keyPrefix: "otp-send-user",
      identifier: session.user.id,
      limit: 3,
      window: "15 m",
    });
    if (perUser.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const perPhone = await checkRateLimit({
      keyPrefix: "otp-send-phone",
      identifier: normalized,
      limit: 3,
      window: "15 m",
    });
    if (perPhone.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Check if phone is already verified by another account
    const existing = await prisma.user.findUnique({
      where: { phoneNumber: normalized },
      select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "This phone number is already linked to another account" },
        { status: 409 },
      );
    }

    await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: normalized, channel: "sms" });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    console.error("OTP send error:", err);
    // Twilio's raw text leaks internals to the user ("Invalid parameter
    // `To`: +5148341887"). Log it, show something actionable.
    console.error("twilio error", err);
    const message = "Couldn't send the code. Please check the number and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
