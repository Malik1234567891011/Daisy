import { prisma } from "@/lib/db";
import {
  CANDIDATE_SELECT,
  isMutuallyCompatible,
  affinityScore,
} from "@/lib/matchRules";

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

  const [liveMatches, history] = await Promise.all([
    prisma.match.findMany({
      where: { status: { in: ["PENDING", "MUTUAL"] } },
      select: { userAId: true, userBId: true },
    }),
    prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    }),
  ]);

  const excluded = new Set<string>([userId]);
  for (const m of liveMatches) {
    excluded.add(m.userAId);
    excluded.add(m.userBId);
  }
  for (const m of history) {
    excluded.add(m.userAId === userId ? m.userBId : m.userAId);
  }

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      onboardingComplete: true,
      phoneVerified: true,
      // Enforced again in isMutuallyCompatible; kept here so the two
      // populations never even load into the same list.
      isTestAccount: seeker.isTestAccount,
    },
    select: CANDIDATE_SELECT,
  });

  let best: { id: string; score: number } | null = null;
  for (const candidate of candidates) {
    if (!isMutuallyCompatible(seeker, candidate)) continue;
    const score = affinityScore(seeker, candidate);
    if (!best || score > best.score) best = { id: candidate.id, score };
  }

  return best?.id ?? null;
}
