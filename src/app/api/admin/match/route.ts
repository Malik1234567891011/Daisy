import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ADMIN_KEY = process.env.ADMIN_API_KEY;

function isAdmin(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key");
  return !!ADMIN_KEY && key === ADMIN_KEY;
}

// POST: Create a manual match between two users
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userAId, userBId, dropDate, suggestedSpotId } = await req.json();

    if (!userAId || !userBId) {
      return NextResponse.json({ error: "Both user IDs required" }, { status: 400 });
    }

    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({ where: { id: userAId }, select: { id: true, firstName: true } }),
      prisma.user.findUnique({ where: { id: userBId }, select: { id: true, firstName: true } }),
    ]);

    if (!userA || !userB) {
      return NextResponse.json({ error: "One or both users not found" }, { status: 404 });
    }

    // Auto-pick a meeting spot if not provided
    let spotId = suggestedSpotId;
    if (!spotId) {
      const [uA, uB] = await Promise.all([
        prisma.user.findUnique({ where: { id: userAId }, select: { school: true } }),
        prisma.user.findUnique({ where: { id: userBId }, select: { school: true } }),
      ]);
      const schools = [uA?.school, uB?.school].filter(Boolean) as string[];
      const spot = await prisma.meetingSpot.findFirst({
        where: { schools: { hasSome: schools } },
      });
      spotId = spot?.id ?? undefined;
    }

    const match = await prisma.match.create({
      data: {
        userAId,
        userBId,
        dropDate: dropDate ? new Date(dropDate) : getNextWednesday(),
        ...(spotId ? { suggestedSpotId: spotId } : {}),
      },
    });

    return NextResponse.json({
      matchId: match.id,
      userA: userA.firstName,
      userB: userB.firstName,
      dropDate: match.dropDate,
    }, { status: 201 });
  } catch (err) {
    console.error("Admin match creation error:", err);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}

// GET: List all users for manual matching
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { onboardingComplete: true, phoneVerified: true },
      select: {
        id: true, firstName: true, email: true, school: true, age: true,
        gender: true, genderPreference: true, intentions: true, vibe: true,
        interests: true, createdAt: true, phoneNumber: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const matches = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, status: true, dropDate: true,
        userAId: true, userBId: true,
        userADecision: true, userBDecision: true,
      },
    });

    return NextResponse.json({ users, matches });
  } catch (err) {
    console.error("Admin list error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

function getNextWednesday(): Date {
  const now = new Date();
  const wed = new Date(now);
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
  wed.setHours(18, 0, 0, 0);
  return wed;
}
