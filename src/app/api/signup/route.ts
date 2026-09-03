import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { nanoid } from "@/lib/utils";
import { checkEligibility } from "@/lib/eligibility";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, firstName, school, major, age, gender, ethnicity,
      intentions, vibe, interests, idealHangout, availability,
      genderPreference, schoolPreference, ageRangeMin, ageRangeMax,
      majorPreference, ethnicityPreference, contactMethod, contactValue,
      referralSource, studentAttested, age18Attested,
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 18+ and student eligibility. The onboarding form checks these too, but
    // this is the gate — a request that skips the UI still has to pass here.
    const eligibility = checkEligibility({ age, studentAttested, age18Attested });
    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.error }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const BLOCKED_DOMAINS = [
      "gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com",
      "yahoo.com","yahoo.ca","ymail.com","icloud.com","me.com","mac.com","aol.com",
      "protonmail.com","proton.me","pm.me","mail.com","zoho.com","gmx.com","gmx.net",
      "tutanota.com","tuta.io","fastmail.com","yandex.com",
    ];
    const [localPart, domain] = normalizedEmail.split("@");
    if (!localPart || localPart.length < 4 || !domain || BLOCKED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Please use a valid school email address" }, { status: 400 });
    }

    // Existence check only — select one column so this cannot break when the
    // model gains fields the database does not have yet.
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
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
        age: eligibility.age,
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
        studentAttestedAt: new Date(),
        age18AttestedAt: new Date(),
        onboardingComplete: false,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
