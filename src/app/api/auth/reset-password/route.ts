import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, phoneNumber: true, phoneVerified: true },
    });

    if (!user || !user.phoneNumber || !user.phoneVerified) {
      return NextResponse.json(
        { error: "No verified account found for that email." },
        { status: 400 },
      );
    }

    const check = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: user.phoneNumber, code });

    if (check.status !== "approved") {
      return NextResponse.json(
        { error: "Invalid or expired code. Please try again." },
        { status: 400 },
      );
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
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
