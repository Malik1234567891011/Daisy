import { parseEthnicityPreference } from "./ethnicityPreference.ts";

/**
 * The compatibility rules, with no database in sight.
 *
 * Split out of `matching.ts` so the rules that decide who may be shown to whom
 * can be exercised directly in tests. `matching.ts` keeps the queries and
 * imports everything here.
 */

/** Fields the ranking and preference checks need. */
export const CANDIDATE_SELECT = {
  id: true,
  isTestAccount: true,
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

export type Candidate = {
  id: string;
  isTestAccount: boolean;
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

/**
 * Synthetic accounts and real members never see each other. This is a hard
 * partition, not a filter on names or emails: a reviewer account can only ever
 * be matched with another reviewer account, and a real student can never be
 * rerolled into one.
 */
export function isSamePopulation(seeker: { isTestAccount: boolean }, candidate: { isTestAccount: boolean }): boolean {
  return seeker.isTestAccount === candidate.isTestAccount;
}

/** Both sides have to be happy with each other, not just the person paying. */
export function isMutuallyCompatible(seeker: Candidate, candidate: Candidate): boolean {
  if (!isSamePopulation(seeker, candidate)) return false;
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
export function affinityScore(seeker: Candidate, candidate: Candidate): number {
  const sharedInterests = candidate.interests.filter((i) => seeker.interests.includes(i)).length;

  let score = sharedInterests * 3;
  if (seeker.intentions && seeker.intentions === candidate.intentions) score += 4;
  if (seeker.idealHangout && seeker.idealHangout === candidate.idealHangout) score += 2;
  if (seeker.vibe && seeker.vibe === candidate.vibe) score += 2;
  if (seeker.school && seeker.school === candidate.school) score += 1;

  return score;
}
