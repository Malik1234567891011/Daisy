import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  CANDIDATE_SELECT,
  isMutuallyCompatible,
  affinityScore,
} from "@/lib/matchRules";

/**
 * How long a closed match (declined or rerolled) still counts as "this
 * week's". Inside the window the dashboard shows the calm "didn't work out"
 * screen and the reroll button; past it the user is simply between drops.
 * Seven days because drops are weekly and the seed script only expires
 * PENDING/MUTUAL rows, so closed ones would otherwise linger forever.
 */
export const CLOSED_MATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;


/**
 * On-demand matching for paid rerolls.
 *
 * Weekly drops are still curated by hand (matches.md + seed script). This
 * module only exists so a reroll can hand back a new person immediately —
 * it applies the same hard rules the seed script applies (no repeat pairs,
 * nobody who already has a live match) plus the preferences both sides set
 * during onboarding, then ranks what's left by how much they have in common.
 */

/**
 * Best available partner for `userId` right now, or null if the pool is dry.
 *
 * Excluded: the user themselves, anyone currently in a PENDING or MUTUAL
 * match, and anyone this user has ever been paired with before (in either
 * direction, at any status) so a reroll can't hand back a familiar face.
 */
export async function findRerollCandidate(userId: string): Promise<string | null> {
  const seeker = await prisma.user.findUnique({
    where: { id: userId },
    select: CANDIDATE_SELECT,
  });
  if (!seeker) return null;

  const history = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });

  // Being in a live match no longer rules someone out: a reroll can give them
  // a second match. Only the rerolling user's own history is excluded, so a
  // reroll never hands back a familiar face.
  const excluded = new Set<string>([userId]);
  for (const m of history) {
    excluded.add(m.userAId === userId ? m.userBId : m.userAId);
  }

  // Who is already in a live match. Not an exclusion any more — a reroll can
  // give someone a second match — but a strong preference: sending the reroll
  // to someone with nobody is better for them, and avoids handing a second
  // match to a person whose dashboard shows one at a time.
  const busy = new Set<string>();
  for (const m of await prisma.match.findMany({
    where: { status: { in: ["PENDING", "MUTUAL"] } },
    select: { userAId: true, userBId: true },
  })) {
    busy.add(m.userAId);
    busy.add(m.userBId);
  }

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      onboardingComplete: true,
      phoneVerified: true,
      // No photo means no match, the same rule the weekly drop applies.
      photoUrl: { not: null },
      // Enforced again in isMutuallyCompatible; kept here so the two
      // populations never even load into the same list.
      isTestAccount: seeker.isTestAccount,
    },
    select: CANDIDATE_SELECT,
  });

  // Unmatched people win any tie against a matched one, whatever the affinity
  // difference — the bonus is larger than the maximum affinity score.
  const UNMATCHED_BONUS = 1000;

  let best: { id: string; score: number } | null = null;
  for (const candidate of candidates) {
    if (!isMutuallyCompatible(seeker, candidate)) continue;
    const score =
      affinityScore(seeker, candidate) + (busy.has(candidate.id) ? 0 : UNMATCHED_BONUS);
    if (!best || score > best.score) best = { id: candidate.id, score };
  }

  return best?.id ?? null;
}

/* ─── What can be rerolled ─── */

export type RerollTarget =
  | {
      ok: true;
      matchId: string;
      /**
       * The match being replaced. PENDING means it is still live and the
       * reroll will decline it on the user's behalf — the client warns first.
       */
      status: "PENDING" | "DECLINED" | "REROLLED";
      partnerId: string;
    }
  | { ok: false; reason: "no-match" | "mutual" | "pending" };

/**
 * The match a reroll would replace: one that closed this week — you passed,
 * they passed, or they rerolled away — so the person who just clicked "Not
 * for me" can buy a new one instead of waiting for Wednesday.
 *
 * A live PENDING match is deliberately not rerollable. The product rule is
 * that you answer the person in front of you first; a reroll is what you do
 * after a no, not instead of one. A MUTUAL match is never rerollable: that
 * one worked.
 */
export async function getRerollTarget(userId: string): Promise<RerollTarget> {
  const now = new Date();
  const match = await prisma.match.findFirst({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      dropDate: { lte: now },
    },
    orderBy: [{ dropDate: "desc" }, { createdAt: "desc" }],
    select: { id: true, status: true, userAId: true, userBId: true, dropDate: true },
  });

  if (!match) return { ok: false, reason: "no-match" };
  if (match.status === "MUTUAL") return { ok: false, reason: "mutual" };

  const partnerId = match.userAId === userId ? match.userBId : match.userAId;

  // A live match is rerollable. The client warns that continuing declines it,
  // and the spend marks it REROLLED. Refusing the reroll and sending them back
  // to a person they have already decided against helps nobody.
  if (match.status === "PENDING") {
    return { ok: true, matchId: match.id, status: match.status, partnerId };
  }

  const recent = match.dropDate.getTime() >= now.getTime() - CLOSED_MATCH_WINDOW_MS;
  if (recent && (match.status === "DECLINED" || match.status === "REROLLED")) {
    return { ok: true, matchId: match.id, status: match.status, partnerId };
  }

  return { ok: false, reason: "no-match" };
}

/* ─── Creating a match safely under concurrency ─── */

/** The chosen partner got matched by someone else mid-transaction — pick again. */
export class CandidateTakenError extends Error {}

/** The seeker already got a match from a concurrent request — stop. */
export class AlreadyMatchedError extends Error {}

/**
 * Row-lock the given users for the rest of the transaction, always in sorted
 * order so two transactions touching the same pair can never deadlock. Two
 * rerolls that picked the same candidate serialise here: the second one
 * waits, then sees the first one's match in hasLiveMatch and retries.
 */
export async function lockUsers(tx: Prisma.TransactionClient, ids: string[]): Promise<void> {
  const sorted = [...new Set(ids)].sort();
  await tx.$queryRaw`SELECT id FROM "User" WHERE id IN (${Prisma.join(sorted)}) ORDER BY id FOR UPDATE`;
}

export async function hasLiveMatch(tx: Prisma.TransactionClient, userId: string): Promise<boolean> {
  const n = await tx.match.count({
    where: {
      status: { in: ["PENDING", "MUTUAL"] },
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
  return n > 0;
}

/**
 * Create the match, dropping right now. Call after lockUsers so the
 * candidate check can't race another transaction.
 */
export async function openMatch(
  tx: Prisma.TransactionClient,
  seekerId: string,
  candidateId: string,
): Promise<{ id: string }> {
  return tx.match.create({
    data: { userAId: seekerId, userBId: candidateId, dropDate: new Date() },
    select: { id: true },
  });
}

/**
 * Free re-match for someone whose partner paid to reroll away. They did
 * nothing wrong, so they shouldn't lose their week. Best effort: null when
 * the pool is dry or they already have a live match again.
 */
export async function rematchFree(
  userId: string,
): Promise<{ matchId: string; partnerId: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const candidateId = await findRerollCandidate(userId);
    if (!candidateId) return null;

    try {
      const created = await prisma.$transaction(async (tx) => {
        await lockUsers(tx, [userId, candidateId]);
        if (await hasLiveMatch(tx, userId)) throw new AlreadyMatchedError();
        return openMatch(tx, userId, candidateId);
      });
      return { matchId: created.id, partnerId: candidateId };
    } catch (error) {
      if (error instanceof CandidateTakenError) continue;
      if (error instanceof AlreadyMatchedError) return null;
      console.error("rematch error", error);
      return null;
    }
  }
  return null;
}
