import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      school: true,
      major: true,
      age: true,
      gender: true,
      ethnicity: true,
      photoUrl: true,
      intentions: true,
      vibe: true,
      interests: true,
      idealHangout: true,
      availability: true,
      genderPreference: true,
      schoolPreference: true,
      ageRangeMin: true,
      ageRangeMax: true,
      majorPreference: true,
      ethnicityPreference: true,
      contactMethod: true,
      contactValue: true,
      phoneNumber: true,
      phoneVerified: true,
      smsConsent: true,
      referralCode: true,
      onboardingComplete: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const referralCount = user.referralCode
    ? await prisma.user.count({ where: { referredBy: user.referralCode } })
    : 0;

  return NextResponse.json({ ...user, referralCount });
}
