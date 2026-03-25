import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, decision } = await req.json();

    if (!matchId || !["INTERESTED", "DECLINED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = session.user.id;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const isUserA = match.userAId === userId;
    const isUserB = match.userBId === userId;

    if (!isUserA && !isUserB) {
      return NextResponse.json({ error: "Not your match" }, { status: 403 });
    }

    if (match.status !== "PENDING") {
      return NextResponse.json({ error: "Match already resolved" }, { status: 400 });
    }

    const updateField = isUserA ? "userADecision" : "userBDecision";
    const otherDecision = isUserA ? match.userBDecision : match.userADecision;

    let newStatus: MatchStatus = match.status;
    if (decision === "DECLINED") {
      newStatus = MatchStatus.DECLINED;
    } else if (decision === "INTERESTED" && otherDecision === "INTERESTED") {
      newStatus = MatchStatus.MUTUAL;
    }

    // If mutual, pick a suggested meeting spot
    let suggestedSpotId = match.suggestedSpotId;
    if (newStatus === "MUTUAL" && !suggestedSpotId) {
      const [userA, userB] = await Promise.all([
        prisma.user.findUnique({ where: { id: match.userAId }, select: { school: true } }),
        prisma.user.findUnique({ where: { id: match.userBId }, select: { school: true } }),
      ]);

      const schools = [userA?.school, userB?.school].filter(Boolean) as string[];

      // Find a spot associated with either school
      const spot = await prisma.meetingSpot.findFirst({
        where: { schools: { hasSome: schools } },
        orderBy: { id: "asc" },
      });

      suggestedSpotId = spot?.id ?? null;
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        [updateField]: decision,
        status: newStatus,
        ...(suggestedSpotId ? { suggestedSpotId } : {}),
      },
    });

    return NextResponse.json({
      status: updated.status,
      myDecision: decision,
      isMutual: updated.status === "MUTUAL",
    });
  } catch (err) {
    console.error("Decision error:", err);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
