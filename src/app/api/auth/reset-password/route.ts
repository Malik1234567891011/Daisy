import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

/**
 * One message for every way the code can be wrong — mistyped, expired, or
 * never issued because the account has no verified phone. The page sends the
 * user back to the code step whenever the error mentions "code".
 */
const BAD_CODE = "Invalid or expired code. Please try again.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter a valid 6-digit code" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const [perEmail, perIp] = await Promise.all([
      checkRateLimit({ keyPrefix: "reset-email", identifier: email, limit: 10, window: "1 h" }),
      checkRateLimit({ keyPrefix: "reset-ip", identifier: getRequestIp(req), limit: 30, window: "1 h" }),
    ]);
    if (perEmail.limited || perIp.limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait an hour and try again." },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, phoneNumber: true, phoneVerified: true },
    });

    if (!user || !user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json({ error: BAD_CODE }, { status: 400 });
    }

    // Twilio throws (404) when there is no pending verification for this
    // number — an expired code lands here, not in the "not approved" branch.
    let approved = false;
    try {
      const check = await client.verify.v2
        .services(VERIFY_SID)
        .verificationChecks.create({ to: user.phoneNumber, code });
      approved = check.status === "approved";
    } catch (error) {
      console.error("reset-password verify check error", error);
    }

    if (!approved) {
      return NextResponse.json({ error: BAD_CODE }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-password error", error);
    return NextResponse.json(
      { error: "Couldn't reset your password right now. Please try again." },
      { status: 500 },
    );
  }
}
