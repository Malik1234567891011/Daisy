/**
 * Relaunch giveaway: one fully-completed signup is one entry, and every fifth
 * qualifying referral adds another.
 *
 * "Qualifying" is deliberately strict — a verified number AND a photo AND
 * finished onboarding. The invite count already on the dashboard only checked
 * phoneVerified, which would hand out entries for half-finished accounts and
 * make the draw impossible to defend if anyone questioned it.
 *
 * Everything the promotion says lives here so the copy on the landing page,
 * the dashboard and the rules page cannot drift apart.
 */

export const RAFFLE = {
  /** Flip to false the moment the draw closes; every surface hides itself. */
  enabled: true,

  prizeLabel: "$200 date",
  prizeBlurb: "a $200 date, fully covered",

  /** Referrals needed for each additional entry beyond the signup entry. */
  referralsPerEntry: 5,

  // ---------------------------------------------------------------
  // EDIT THESE TWO BEFORE LAUNCH — everything else follows from them.
  /** Entries close. ISO, UTC. Currently: Oct 1 2026, 00:00 Montreal (EDT). */
  closesAt: "2026-10-01T04:00:00.000Z",
  /** Human wording used in copy. Keep in step with closesAt. */
  closesLabel: "September 30",
  // ---------------------------------------------------------------

  rulesHref: "/giveaway",
} as const;

export type RaffleStanding = {
  /** Whether this account's own signup counts. */
  selfQualified: boolean;
  /** Referrals meeting the full bar. */
  qualifiedReferrals: number;
  /** Total times the name goes in the draw. */
  entries: number;
  /** Referrals still needed for the next entry, or null if not entered yet. */
  toNextEntry: number | null;
};

/**
 * A profile only counts once it can actually be matched: verified number,
 * photo, onboarding finished. Same bar for the account itself and for anyone
 * it refers, so the rule is one sentence rather than two.
 */
export function qualifies(u: {
  phoneVerified?: boolean | null;
  photoUrl?: string | null;
  onboardingComplete?: boolean | null;
}): boolean {
  return Boolean(u.phoneVerified && u.onboardingComplete && u.photoUrl);
}

export function standing(selfQualified: boolean, qualifiedReferrals: number): RaffleStanding {
  const referrals = Math.max(0, Math.floor(qualifiedReferrals || 0));

  if (!selfQualified) {
    // No signup entry means the referral bonuses have nothing to attach to.
    return { selfQualified: false, qualifiedReferrals: referrals, entries: 0, toNextEntry: null };
  }

  const bonus = Math.floor(referrals / RAFFLE.referralsPerEntry);
  const remainder = referrals % RAFFLE.referralsPerEntry;

  return {
    selfQualified: true,
    qualifiedReferrals: referrals,
    entries: 1 + bonus,
    toNextEntry: RAFFLE.referralsPerEntry - remainder,
  };
}

export function isOpen(now: Date = new Date()): boolean {
  return RAFFLE.enabled && now.getTime() < new Date(RAFFLE.closesAt).getTime();
}
