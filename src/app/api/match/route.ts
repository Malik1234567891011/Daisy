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

    // findMany, not findFirst: a reroll can give someone a second live match,
    // and returning only the newest would have quietly hidden the one they
    // were already deciding on.
    const activeMatches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: { in: ["PENDING", "MUTUAL"] },
        dropDate: { lte: now },
      },
      orderBy: { dropDate: "asc" },
      include: {
        userA: {
          select: {
            id: true, firstName: true, age: true, school: true, major: true, photoUrl: true,
            intentions: true, vibe: true, interests: true, idealHangout: true,
            contactMethod: true, contactValue: true,
          },
        },
        userB: {
          select: {
            id: true, firstName: true, age: true, school: true, major: true, photoUrl: true,
            intentions: true, vibe: true, interests: true, idealHangout: true,
            contactMethod: true, contactValue: true,
          },
        },
        suggestedSpot: true,
      },
    });

    const match = activeMatches[0] ?? null;

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

    const shape = (m: (typeof activeMatches)[number]) => {
      const mine = m.userAId === userId;
      const other = mine ? m.userB : m.userA;
      const mutual = m.status === "MUTUAL";
      return {
        matchId: m.id,
        status: m.status,
        myDecision: mine ? m.userADecision : m.userBDecision,
        theirDecision: mine ? m.userBDecision : m.userADecision,
        isMutual: mutual,
        dropDate: m.dropDate,
        partner: partnerPayload(other, mutual),
        suggestedSpot: mutual ? m.suggestedSpot : null,
      };
    };

    const primary = shape(match);
    const others = activeMatches.filter((m) => m.id !== match.id).map(shape);

    return NextResponse.json({
      hasMatch: true,
      ...primary,
      /** Further live matches, e.g. after someone rerolled into you. */
      otherMatches: others,
    });
  } catch (err) {
    console.error("Match fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}
