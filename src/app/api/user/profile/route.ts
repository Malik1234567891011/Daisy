import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeIdealHangouts, stringifyIdealHangouts } from "@/lib/idealHangouts";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      firstName, school, major, age, gender, ethnicity, idealHangout,
      contactMethod, contactValue, smsConsent,
    } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName ?? undefined,
        school: school ?? undefined,
        major: major ?? undefined,
        age: age !== undefined ? (age ? parseInt(age, 10) : null) : undefined,
        gender: gender !== undefined ? (gender || null) : undefined,
        ethnicity: ethnicity !== undefined ? (ethnicity || null) : undefined,
        idealHangout:
          idealHangout !== undefined
            ? stringifyIdealHangouts(sanitizeIdealHangouts(idealHangout)) || null
            : undefined,
        contactMethod: contactMethod ?? undefined,
        contactValue: contactValue ?? undefined,
        // The opt-out promised on the phone step lives here.
        smsConsent: typeof smsConsent === "boolean" ? smsConsent : undefined,
      },
      select: {
        id: true,
        firstName: true,
        school: true,
        major: true,
        age: true,
        gender: true,
        ethnicity: true,
        idealHangout: true,
        contactMethod: true,
        contactValue: true,
        smsConsent: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
