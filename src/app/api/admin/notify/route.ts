import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// POST: Send match notification to a user
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, matchId, message: customMessage } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, smsConsent: true, firstName: true },
    });

    if (!user?.phoneNumber) {
      return NextResponse.json({ error: "User has no phone number" }, { status: 400 });
    }

    if (!user.smsConsent) {
      return NextResponse.json({ error: "User has not consented to SMS" }, { status: 400 });
    }

    if (!FROM_NUMBER) {
      return NextResponse.json({ error: "TWILIO_PHONE_NUMBER not configured" }, { status: 500 });
    }

    const siteBase = (
      process.env.BROADCAST_SITE_URL ||
      process.env.NEXT_PUBLIC_URL ||
      "https://www.daisyweekly.com"
    ).replace(/\/$/, "");
    const body =
      customMessage ||
      `Daisy: your match is ready. Open your dashboard: ${siteBase}/dashboard`;

    const msg = await twilioClient.messages.create({
      to: user.phoneNumber,
      from: FROM_NUMBER,
      body,
    });

    return NextResponse.json({ sent: true, sid: msg.sid });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
