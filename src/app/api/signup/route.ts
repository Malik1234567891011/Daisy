import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { nanoid } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, firstName, school, major, age, gender, ethnicity,
      intentions, vibe, interests, idealHangout, availability,
      genderPreference, schoolPreference, ageRangeMin, ageRangeMax,
      majorPreference, ethnicityPreference, contactMethod, contactValue,
      referralSource,
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const referralCode = nanoid(8);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName || null,
        school: school || null,
        major: major || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        ethnicity: ethnicity || null,
        intentions: intentions || null,
        vibe: vibe || null,
        interests: Array.isArray(interests) ? interests : [],
        idealHangout: idealHangout || null,
        availability: Array.isArray(availability) ? availability : [],
        genderPreference: genderPreference || null,
        schoolPreference: schoolPreference || "any",
        ageRangeMin: ageRangeMin ? parseInt(ageRangeMin, 10) : 18,
        ageRangeMax: ageRangeMax ? parseInt(ageRangeMax, 10) : 25,
        majorPreference: majorPreference || null,
        ethnicityPreference: ethnicityPreference || null,
        contactMethod: contactMethod || null,
        contactValue: contactValue || null,
        referralCode,
        referredBy: referralSource || null,
        smsConsent: true,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
