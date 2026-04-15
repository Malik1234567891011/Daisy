import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, phoneNumber: true, phoneVerified: true },
    });

    if (!user || !user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json({
        ok: true,
        message: "If an account with a verified phone exists for that email, we'll text you a code.",
        phoneLast4: null,
      });
    }

    await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: user.phoneNumber, channel: "sms" });

    const last4 = user.phoneNumber.slice(-4);

    return NextResponse.json({
      ok: true,
      message: "We sent a 6-digit code to your phone ending in " + last4 + ".",
      phoneLast4: last4,
    });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
