/**
 * Eligibility rules for joining Daisy.
 *
 * Daisy is 18+ and student-only, and verifies neither with documents. What it
 * does instead is recorded here: an age the user states, plus two explicit
 * attestations. Everything in this module is pure so the rules can be tested
 * without a database, and every caller that creates an account runs it —
 * client-side validation is a convenience, never the gate.
 */

export const MIN_AGE = 18;
export const MAX_AGE = 30;

export type EligibilityInput = {
  age: unknown;
  studentAttested: unknown;
  age18Attested: unknown;
};

export type EligibilityResult =
  | { ok: true; age: number }
  | { ok: false; error: string };

/**
 * Accepts the string the onboarding form posts as well as a real number.
 * Anything else — null, "", "twenty", NaN, 18.5 — is not an age.
 */
export function parseAge(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(n) ? n : null;
}

export function isAdultAge(age: number | null): boolean {
  return age !== null && age >= MIN_AGE;
}

/** Only a literal `true` counts. "false", "on", 1 and undefined do not. */
function isAffirmed(value: unknown): boolean {
  return value === true;
}

/**
 * The single gate every signup passes through. Order matters only for which
 * message the user sees first; all three conditions are required.
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const age = parseAge(input.age);

  if (age === null) {
    return { ok: false, error: "Please enter your age." };
  }
  if (!isAdultAge(age)) {
    return { ok: false, error: "You must be at least 18 to use Daisy." };
  }
  if (age > MAX_AGE) {
    return { ok: false, error: `Please enter an age between ${MIN_AGE} and ${MAX_AGE}.` };
  }
  if (!isAffirmed(input.age18Attested)) {
    return { ok: false, error: "Please confirm that you are 18 or older." };
  }
  if (!isAffirmed(input.studentAttested)) {
    return {
      ok: false,
      error: "Please confirm that you are currently enrolled at a university, college or CEGEP.",
    };
  }

  return { ok: true, age };
}

/** Wording shown in onboarding. Exported so tests assert on the real strings. */
export const ATTESTATION_COPY = {
  age18: "I confirm that I am 18 years of age or older.",
  student:
    "I confirm that I am currently enrolled at a university, college or CEGEP.",
} as const;
