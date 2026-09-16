import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

// POST: Create a manual match between two users
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
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

    let spotId = suggestedSpotId;
    if (!spotId) {
      const [uA, uB] = await Promise.all([
        prisma.user.findUnique({ where: { id: userAId }, select: { school: true } }),
        prisma.user.findUnique({ where: { id: userBId }, select: { school: true } }),
      ]);
      const schoolA = uA?.school;
      const schoolB = uB?.school;
      const schools = [schoolA, schoolB].filter(Boolean) as string[];

      let spots;
      if (schoolA && schoolB && schoolA === schoolB) {
        spots = await prisma.meetingSpot.findMany({ where: { schools: { has: schoolA } } });
      } else if (schools.length === 2) {
        spots = await prisma.meetingSpot.findMany({ where: { schools: { hasEvery: schools } } });
        if (spots.length === 0) {
          spots = await prisma.meetingSpot.findMany({ where: { schools: { hasSome: schools } } });
        }
      } else {
        spots = await prisma.meetingSpot.findMany({ where: { schools: { hasSome: schools } } });
      }

      if (spots.length > 0) {
        spotId = spots[Math.floor(Math.random() * spots.length)].id;
      }
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
  if (!(await isAdminRequest(req))) {
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

/**
 * The drop moment a manually created match is stamped with.
 *
 * No `|| 7` on the offset: on a Wednesday it is legitimately 0, and 0 being
 * falsy used to push the whole of drop day a week out — a match created this
 * afternoon would have been dated next Wednesday and stayed invisible until
 * then, since /api/match only returns rows whose dropDate has passed.
 *
 * Deliberately no roll-forward either. A match an admin creates after 6pm on
 * drop day should go live now, not next week.
 */
function getNextWednesday(): Date {
  const now = new Date();
  const wed = new Date(now);
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7));
  wed.setHours(18, 0, 0, 0);
  return wed;
}
