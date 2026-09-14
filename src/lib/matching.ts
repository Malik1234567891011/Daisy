import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseEthnicityPreference } from "@/lib/ethnicityPreference";
import { parseIdealHangouts } from "@/lib/idealHangouts";

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
 * How long a closed match (declined or rerolled) still counts as "this
 * week's". Inside the window the dashboard shows the calm "didn't work out"
 * screen and the reroll button; past it the user is simply between drops.
 * Seven days because drops are weekly and the seed script only expires
 * PENDING/MUTUAL rows, so closed ones would otherwise linger forever.
 */
export const CLOSED_MATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Fields the ranking and preference checks need. */
const CANDIDATE_SELECT = {
  id: true,
  age: true,
  gender: true,
  school: true,
  major: true,
  ethnicity: true,
  intentions: true,
  vibe: true,
  interests: true,
  idealHangout: true,
  genderPreference: true,
  schoolPreference: true,
  ageRangeMin: true,
  ageRangeMax: true,
  majorPreference: true,
  ethnicityPreference: true,
} as const;

type Candidate = {
  id: string;
  age: number | null;
  gender: string | null;
  school: string | null;
  major: string | null;
  ethnicity: string | null;
  intentions: string | null;
  vibe: string | null;
  interests: string[];
  idealHangout: string | null;
  genderPreference: string | null;
  schoolPreference: string | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  majorPreference: string | null;
  ethnicityPreference: string | null;
};

/**
 * `genderPreference` is one of GENDER_PREFERENCES ("Men" / "Women" /
 * "Everyone"); `gender` is one of GENDERS ("Man" / "Woman" / "Non-binary" /
 * "Other"). A specific preference only ever matches its literal counterpart,
 * so non-binary members are matched by people open to everyone.
 */
function genderFits(preference: string | null, gender: string | null): boolean {
  if (!preference || preference === "Everyone") return true;
  if (!gender) return false;
  if (preference === "Men") return gender === "Man";
  if (preference === "Women") return gender === "Woman";
  return true;
}

function ageFits(age: number | null, min: number | null, max: number | null): boolean {
  if (age == null) return true;
  if (min != null && age < min) return false;
  if (max != null && age > max) return false;
  return true;
}

/**
 * "nearby" is treated as "any": every school in SCHOOLS is in greater
 * Montreal and we don't store campus adjacency, so there is nothing to
 * narrow on. Only "same" is a real constraint.
 */
function schoolFits(preference: string | null, mySchool: string | null, theirSchool: string | null): boolean {
  if (preference !== "same") return true;
  if (!mySchool || !theirSchool) return false;
  return mySchool === theirSchool;
}

function majorFits(preference: string | null, theirMajor: string | null): boolean {
  if (!preference) return true;
  return theirMajor === preference;
}

/**
 * Both sides are comma-separated lists: the profile page lets people pick
 * more than one ethnicity, and the preference is a multi-select. Any overlap
 * passes, which is also what the weekly seed script does.
 */
function ethnicityFits(preference: string | null, theirEthnicity: string | null): boolean {
  const wanted = parseEthnicityPreference(preference);
  if (wanted.length === 0) return true;
  const theirs = parseEthnicityPreference(theirEthnicity);
  if (theirs.length === 0) return false;
  return theirs.some((label) => wanted.includes(label));
}

/** Both sides have to be happy with each other, not just the person paying. */
function isMutuallyCompatible(seeker: Candidate, candidate: Candidate): boolean {
  return (
    genderFits(seeker.genderPreference, candidate.gender) &&
    genderFits(candidate.genderPreference, seeker.gender) &&
    ageFits(candidate.age, seeker.ageRangeMin, seeker.ageRangeMax) &&
    ageFits(seeker.age, candidate.ageRangeMin, candidate.ageRangeMax) &&
    schoolFits(seeker.schoolPreference, seeker.school, candidate.school) &&
    schoolFits(candidate.schoolPreference, candidate.school, seeker.school) &&
    majorFits(seeker.majorPreference, candidate.major) &&
    majorFits(candidate.majorPreference, seeker.major) &&
    ethnicityFits(seeker.ethnicityPreference, candidate.ethnicity) &&
    ethnicityFits(candidate.ethnicityPreference, seeker.ethnicity)
  );
}

/**
 * Soft signals only — these never exclude anyone, they just decide who comes
 * first among people who already passed every hard rule. Someone paying for a
 * reroll should get the best remaining option, not a random one.
 */
function affinityScore(seeker: Candidate, candidate: Candidate): number {
  const sharedInterests = candidate.interests.filter((i) => seeker.interests.includes(i)).length;

  let score = sharedInterests * 3;
  if (seeker.intentions && seeker.intentions === candidate.intentions) score += 4;
  // Ideal hangout is a multi-select: any overlap is worth the same 2 points a
  // single shared answer used to be, so the signal keeps its old weight
  // instead of scaling with how many boxes each side ticked.
  const seekerHangouts = parseIdealHangouts(seeker.idealHangout);
  const sharesHangout = parseIdealHangouts(candidate.idealHangout).some((h) =>
    seekerHangouts.includes(h),
  );
  if (sharesHangout) score += 2;
  if (seeker.vibe && seeker.vibe === candidate.vibe) score += 2;
  if (seeker.school && seeker.school === candidate.school) score += 1;

  return score;
}

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

/* ─── What can be rerolled ─── */

export type RerollTarget =
  | {
      ok: true;
      matchId: string;
      /** PENDING gets closed by the reroll; DECLINED/REROLLED are left as they are. */
      status: "PENDING" | "DECLINED" | "REROLLED";
      partnerId: string;
    }
  | { ok: false; reason: "no-match" | "mutual" };

/**
 * The match a reroll would replace. This week's live PENDING match, or a
 * match that closed this week — you passed, they passed, or they rerolled
 * away — so the person who just clicked "Not for me" can still buy a new one
 * instead of waiting for Wednesday. A MUTUAL match is never rerollable: that
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

  if (match.status === "PENDING") {
    return { ok: true, matchId: match.id, status: "PENDING", partnerId };
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
  if (await hasLiveMatch(tx, candidateId)) {
    throw new CandidateTakenError("candidate was matched");
  }
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
