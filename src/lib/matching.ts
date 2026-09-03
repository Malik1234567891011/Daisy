import { prisma } from "@/lib/db";
import { parseEthnicityPreference } from "@/lib/ethnicityPreference";

/**
 * On-demand matching for paid rerolls.
 *
 * Weekly drops are still curated by hand (matches.md + seed script). This
 * module only exists so a reroll can hand back a new person immediately —
 * it applies the same hard rules the seed script applies (no repeat pairs,
 * nobody who already has a live match) plus the preferences both sides set
 * during onboarding, then ranks what's left by how much they have in common.
 */

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

function ethnicityFits(preference: string | null, theirEthnicity: string | null): boolean {
  const wanted = parseEthnicityPreference(preference);
  if (wanted.length === 0) return true;
  if (!theirEthnicity) return false;
  return wanted.includes(theirEthnicity);
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
  if (seeker.idealHangout && seeker.idealHangout === candidate.idealHangout) score += 2;
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
