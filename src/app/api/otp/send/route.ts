import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

const E164_RE = /^\+[1-9]\d{6,14}$/;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_SENDS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_SENDS) return true;

  entry.count++;
  return false;
}

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

    const normalized = phone.replace(/[\s\-()]/g, "");

    if (!E164_RE.test(normalized)) {
      return NextResponse.json(
        { error: "Enter a valid phone number with country code (e.g. +15141234567)" },
        { status: 400 },
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

    if (isRateLimited(normalized)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in an hour." },
        { status: 429 },
      );
    }

    await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: normalized, channel: "sms" });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    console.error("OTP send error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to send code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
