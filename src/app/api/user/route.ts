import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { qualifies, standing } from "@/lib/raffle";

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
      rerollCredits: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Draw entries only count a referral that can actually be matched: verified
  // number, photo, onboarding finished. The old count checked phoneVerified
  // alone, which would have paid out entries for half-finished accounts.
  const referralCount = user.referralCode
    ? await prisma.user.count({
        where: {
          referredBy: user.referralCode,
          phoneVerified: true,
          onboardingComplete: true,
          photoUrl: { not: null },
          isTestAccount: false,
        },
      })
    : 0;

  const raffle = standing(qualifies(user), referralCount);

  return NextResponse.json({ ...user, referralCount, raffle });
}
