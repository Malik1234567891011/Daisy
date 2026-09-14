/**
 * Shaping of the partner object the dashboard receives.
 *
 * The contact-reveal rule lives here, on its own, because it is the one piece
 * of match handling where a mistake leaks someone's Instagram handle or phone
 * number to a person they never agreed to meet. Keeping it a pure function
 * means it can be tested directly instead of through the route.
 */

export type PartnerRecord = {
  firstName: string | null;
  age: number | null;
  school: string | null;
  /** Optional so older fixtures and callers keep compiling. */
  major?: string | null;
  photoUrl: string | null;
  intentions: string | null;
  vibe: string | null;
  interests: string[];
  idealHangout: string | null;
  contactMethod: string | null;
  contactValue: string | null;
};

export type PartnerPayload = Omit<PartnerRecord, "contactMethod" | "contactValue"> & {
  contactMethod?: string | null;
  contactValue?: string | null;
};

/**
 * Contact details are included only when both people have said yes. Before
 * that the keys are absent entirely, not null — nothing to leak downstream.
 */
export function partnerPayload(partner: PartnerRecord, isMutual: boolean): PartnerPayload {
  const base = {
    firstName: partner.firstName,
    age: partner.age,
    school: partner.school,
    major: partner.major ?? null,
    photoUrl: partner.photoUrl,
    intentions: partner.intentions,
    vibe: partner.vibe,
    interests: partner.interests,
    idealHangout: partner.idealHangout,
  };

  if (!isMutual) return base;

  return {
    ...base,
    contactMethod: partner.contactMethod,
    contactValue: partner.contactValue,
  };
}
