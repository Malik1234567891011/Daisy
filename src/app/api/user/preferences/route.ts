import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { genderPreference, schoolPreference, ageRangeMin, ageRangeMax, majorPreference, ethnicityPreference } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        genderPreference: genderPreference !== undefined ? (genderPreference || null) : undefined,
        schoolPreference: schoolPreference ?? undefined,
        ageRangeMin: ageRangeMin !== undefined ? parseInt(ageRangeMin, 10) : undefined,
        ageRangeMax: ageRangeMax !== undefined ? parseInt(ageRangeMax, 10) : undefined,
        majorPreference: majorPreference !== undefined ? (majorPreference || null) : undefined,
        ethnicityPreference: ethnicityPreference !== undefined ? (ethnicityPreference || null) : undefined,
      },
      select: {
        genderPreference: true,
        schoolPreference: true,
        ageRangeMin: true,
        ageRangeMax: true,
        majorPreference: true,
        ethnicityPreference: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Preferences update error:", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
