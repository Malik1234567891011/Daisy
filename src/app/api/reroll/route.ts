import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  CandidateTakenError,
  findRerollCandidate,
  getRerollTarget,
  hasLiveMatch,
  lockUsers,
  openMatch,
  rematchFree,
} from "@/lib/matching";
import { grantRerollCredit } from "@/lib/reroll-credits";
import { notifyNewMatch } from "@/lib/sms";

export const runtime = "nodejs";

/** The credit or the match was already spent by a concurrent request — don't retry. */
class AlreadySpentError extends Error {}

/**
 * Spend one reroll credit: close the current match (if it's still open) and
 * open a new one.
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

  const target = await getRerollTarget(userId);
  if (!target.ok) {
    return NextResponse.json(
      {
        error:
          target.reason === "mutual"
            ? "You already matched with this person — nothing to reroll."
            : "You don't have a match to reroll right now.",
      },
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
      const result = await prisma.$transaction(async (tx) => {
        // Locks both rows for the transaction so a concurrent reroll that
        // picked the same candidate waits here and then sees our match.
        await lockUsers(tx, [userId, candidateId]);

        // Conditional decrement doubles as the lock on the credit: if two
        // requests race, only one sees count === 1.
        const spent = await tx.user.updateMany({
          where: { id: userId, rerollCredits: { gt: 0 } },
          data: { rerollCredits: { decrement: 1 } },
        });
        if (spent.count !== 1) {
          throw new AlreadySpentError("credit already spent");
        }

        let rerolledPartnerId: string | null = null;
        if (target.status === "PENDING") {
          // Same guard for the match, so a double-submit can't reroll twice.
          const closed = await tx.match.updateMany({
            where: { id: target.matchId, status: "PENDING" },
            data: { status: "REROLLED", rerolledByUserId: userId },
          });
          if (closed.count !== 1) {
            throw new AlreadySpentError("match already resolved");
          }
          rerolledPartnerId = target.partnerId;
        } else if (await hasLiveMatch(tx, userId)) {
          // Rerolling out of a closed match, but something (a free rematch,
          // an admin) already gave this user a live one in the meantime.
          throw new AlreadySpentError("already matched");
        }

        const created = await openMatch(tx, userId, candidateId);

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

        return { matchId: created.id, rerolledPartnerId };
      });

      // After commit. The person rerolled away from did nothing wrong, so
      // try to hand them someone new for free; then text everyone who just
      // got a match, since nobody refreshes a dashboard on a Thursday.
      const rematch = result.rerolledPartnerId
        ? await rematchFree(result.rerolledPartnerId)
        : null;

      const texts = [notifyNewMatch(candidateId)];
      if (rematch && result.rerolledPartnerId) {
        texts.push(notifyNewMatch(result.rerolledPartnerId), notifyNewMatch(rematch.partnerId));
      }
      await Promise.all(texts);

      return NextResponse.json({ matchId: result.matchId });
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
