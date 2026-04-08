import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  generatePasswordResetRawToken,
  hashPasswordResetToken,
} from "@/lib/password-reset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error(
      "[forgot-password] RESEND_API_KEY is not set — reset emails are not sent. Add RESEND_API_KEY and EMAIL_FROM in production.",
    );
    return false;
  }

  const from =
    process.env.EMAIL_FROM ?? "Daisy Weekly <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Daisy password",
      html: `
        <p>Hi,</p>
        <p>We received a request to reset your Daisy password.</p>
        <p><a href="${resetUrl}">Choose a new password</a></p>
        <p>This link expires in one hour. If you didn&rsquo;t ask for this, you can ignore this email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[forgot-password] Resend error:", res.status, text);
    return false;
  }

  return true;
}

const GENERIC_OK = {
  ok: true as const,
  message:
    "If an account exists for that email, you’ll get a link to reset your password shortly.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(GENERIC_OK);
    }

    const rawToken = generatePasswordResetRawToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpires,
      },
    });

    const base = getAppBaseUrl();
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const sent = await sendPasswordResetEmail(user.email, resetUrl);

    if (!sent) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpires: null,
        },
      });
      return NextResponse.json(
        {
          error:
            "We couldn’t send the email right now. Please try again in a few minutes, or contact support if it keeps happening.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
