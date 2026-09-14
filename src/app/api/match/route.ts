import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CLOSED_MATCH_WINDOW_MS } from "@/lib/matching";
import { partnerPayload } from "@/lib/matchPayload";

type ClosedMatchReason = "you-declined" | "they-declined" | "rerolled";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    const match = await prisma.match.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: { in: ["PENDING", "MUTUAL"] },
        dropDate: { lte: now },
      },
      orderBy: { dropDate: "desc" },
      include: {
        userA: {
          select: {
            id: true, firstName: true, age: true, school: true, photoUrl: true,
            intentions: true, vibe: true, interests: true, idealHangout: true,
            contactMethod: true, contactValue: true,
          },
        },
        userB: {
          select: {
            id: true, firstName: true, age: true, school: true, photoUrl: true,
            intentions: true, vibe: true, interests: true, idealHangout: true,
            contactMethod: true, contactValue: true,
          },
        },
        suggestedSpot: true,
      },
    });

    if (!match) {
      // Only this week's closed match counts. The seed script never expires
      // DECLINED/REROLLED rows, so without the window a rejection from weeks
      // ago would greet everyone who is simply unmatched this week.
      const lastClosed = await prisma.match.findFirst({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          status: { in: ["DECLINED", "REROLLED"] },
          dropDate: {
            lte: now,
            gte: new Date(now.getTime() - CLOSED_MATCH_WINDOW_MS),
          },
        },
        orderBy: { dropDate: "desc" },
        select: {
          userAId: true,
          userADecision: true,
          userBDecision: true,
          status: true,
        },
      });

      if (lastClosed) {
        const isUserA = lastClosed.userAId === userId;
        const myDecision = isUserA ? lastClosed.userADecision : lastClosed.userBDecision;
        const reason: ClosedMatchReason =
          myDecision === "DECLINED"
            ? "you-declined"
            : lastClosed.status === "REROLLED"
              ? "rerolled"
              : "they-declined";
        return NextResponse.json({
          hasMatch: false,
          closedMatch: { youDeclined: reason === "you-declined", reason },
        });
      }

      return NextResponse.json({ hasMatch: false });
    }

    const isUserA = match.userAId === userId;
    const partner = isUserA ? match.userB : match.userA;
    const myDecision = isUserA ? match.userADecision : match.userBDecision;
    const theirDecision = isUserA ? match.userBDecision : match.userADecision;
    const isMutual = match.status === "MUTUAL";

    return NextResponse.json({
      hasMatch: true,
      matchId: match.id,
      status: match.status,
      myDecision,
      theirDecision,
      isMutual,
      dropDate: match.dropDate,
      partner: partnerPayload(partner, isMutual),
      suggestedSpot: isMutual ? match.suggestedSpot : null,
    });
  } catch (err) {
    console.error("Match fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}
