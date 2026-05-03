import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

const E164_RE = /^\+[1-9]\d{6,14}$/;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perUser = await checkRateLimit({
      keyPrefix: "otp-verify-user",
      identifier: session.user.id,
      limit: 10,
      window: "15 m",
    });
    if (perUser.limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const { phone, code } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const normalized = phone.replace(/[\s\-()]/g, "");

    if (!E164_RE.test(normalized)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Enter a valid 6-digit code" },
        { status: 400 },
      );
    }

    // Check uniqueness again right before verification
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

    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: normalized, code });

    if (check.status !== "approved") {
      return NextResponse.json(
        { error: "Invalid or expired code. Please try again." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneNumber: normalized,
        phoneVerified: true,
        verifiedAt: new Date(),
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    console.error("OTP verify error:", err);
    const message =
      err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
