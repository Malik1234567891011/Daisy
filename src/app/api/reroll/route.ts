import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { findRerollCandidate } from "@/lib/matching";
import { grantRerollCredit } from "@/lib/reroll-credits";

export const runtime = "nodejs";

/** The chosen partner got matched mid-transaction — pick again. */
class CandidateTakenError extends Error {}

/** The credit or the match was already spent by a concurrent request — don't retry. */
class AlreadySpentError extends Error {}

/**
 * Spend one reroll credit: close the current match and open a new one.
 *
 * Separate from checkout on purpose — the credit is the unit of value, so a
 * payment that can't be fulfilled immediately (empty pool, webhook lag,
 * closed tab) is never lost. The user just comes back and spends it.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const perUser = await checkRateLimit({
    keyPrefix: "reroll-user",
    identifier: userId,
    limit: 10,
    window: "10 m",
  });
  if (perUser.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let sessionId: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.sessionId === "string") sessionId = body.sessionId;
  } catch {
    // No body is fine — that's the "spend a credit I already have" case.
  }

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rerollCredits: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Stripe redirects back faster than the webhook arrives. Rather than make
  // the user watch a spinner, settle the payment inline from the session id.
  // grantRerollCredit is keyed on the session, so if the webhook also lands
  // it's a no-op.
  if (user.rerollCredits === 0 && sessionId) {
    try {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (checkoutSession.metadata?.userId === userId) {
        await grantRerollCredit(checkoutSession);
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, rerollCredits: true },
        });
      }
    } catch (error) {
      console.error("reroll session settle error", error);
    }
  }

  if (!user || user.rerollCredits < 1) {
    return NextResponse.json({ error: "No reroll credit available." }, { status: 402 });
  }

  const currentMatch = await prisma.match.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: "PENDING",
      dropDate: { lte: new Date() },
    },
    orderBy: { dropDate: "desc" },
    select: { id: true },
  });

  if (!currentMatch) {
    return NextResponse.json(
      { error: "You don't have a match to reroll right now." },
      { status: 400 },
    );
  }

  // Two attempts: the pool is small, so losing the candidate to someone
  // else's reroll is plausible but rare, and a second pick almost always
  // succeeds.
  for (let attempt = 0; attempt < 2; attempt++) {
    const candidateId = await findRerollCandidate(userId);
    if (!candidateId) {
      return NextResponse.json(
        {
          error:
            "No one new is available to match with right now. Your reroll is saved — try again after the next drop.",
          creditKept: true,
        },
        { status: 409 },
      );
    }

    try {
      const newMatch = await prisma.$transaction(async (tx) => {
        // Conditional decrement doubles as the lock: if two requests race,
        // only one sees count === 1.
        const spent = await tx.user.updateMany({
          where: { id: userId, rerollCredits: { gt: 0 } },
          data: { rerollCredits: { decrement: 1 } },
        });
        if (spent.count !== 1) {
          throw new AlreadySpentError("credit already spent");
        }

        // Same guard for the match, so a double-submit can't reroll twice.
        const closed = await tx.match.updateMany({
          where: { id: currentMatch.id, status: "PENDING" },
          data: { status: "REROLLED", rerolledByUserId: userId },
        });
        if (closed.count !== 1) {
          throw new AlreadySpentError("match already resolved");
        }

        const stillFree = await tx.match.count({
          where: {
            status: { in: ["PENDING", "MUTUAL"] },
            OR: [{ userAId: candidateId }, { userBId: candidateId }],
          },
        });
        if (stillFree > 0) {
          throw new CandidateTakenError("candidate was matched");
        }

        const created = await tx.match.create({
          data: {
            userAId: userId,
            userBId: candidateId,
            dropDate: new Date(),
          },
          select: { id: true },
        });

        const purchase = await tx.rerollPurchase.findFirst({
          where: { userId, consumedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (purchase) {
          await tx.rerollPurchase.update({
            where: { id: purchase.id },
            data: { consumedAt: new Date() },
          });
        }

        return created;
      });

      return NextResponse.json({ matchId: newMatch.id });
    } catch (error) {
      if (error instanceof CandidateTakenError) continue;
      if (error instanceof AlreadySpentError) {
        // The transaction rolled back, so nothing was consumed here — another
        // request got there first and the user already has their new match.
        return NextResponse.json(
          { error: "That reroll was already used. Refresh to see your match." },
          { status: 409 },
        );
      }
      console.error("reroll error", error);
      return NextResponse.json({ error: "Failed to reroll" }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      error: "Couldn't complete that reroll. Your credit is saved — please try again.",
      creditKept: true,
    },
    { status: 409 },
  );
}
