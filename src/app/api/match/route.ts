import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const match = await prisma.match.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: { in: ["PENDING", "MUTUAL"] },
        dropDate: { lte: new Date() },
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
      const lastClosed = await prisma.match.findFirst({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          status: "DECLINED",
        },
        orderBy: { dropDate: "desc" },
        select: {
          userAId: true,
          userADecision: true,
          userBDecision: true,
        },
      });

      if (lastClosed) {
        const isUserA = lastClosed.userAId === userId;
        const myDecision = isUserA ? lastClosed.userADecision : lastClosed.userBDecision;
        const youDeclined = myDecision === "DECLINED";
        return NextResponse.json({
          hasMatch: false,
          closedMatch: { youDeclined },
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
      partner: {
        firstName: partner.firstName,
        age: partner.age,
        school: partner.school,
        photoUrl: partner.photoUrl,
        intentions: partner.intentions,
        vibe: partner.vibe,
        interests: partner.interests,
        idealHangout: partner.idealHangout,
        // Only reveal contact info if mutual
        ...(isMutual
          ? { contactMethod: partner.contactMethod, contactValue: partner.contactValue }
          : {}),
      },
      suggestedSpot: isMutual ? match.suggestedSpot : null,
    });
  } catch (err) {
    console.error("Match fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}
