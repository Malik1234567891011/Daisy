/**
 * Shapes the raw user rows into what the admin dashboard draws. Pure and
 * synchronous so the server page can run it once and hand the client a
 * serialisable object — no dates, no Prisma types.
 */

/**
 * Every school domain that can legitimately sign up. Anything else is
 * flagged as suspect rather than rejected: a real student on a personal
 * address is worth a look, not an automatic delete.
 */
export const SCHOOL_DOMAINS = [
  "dawsoncollege.qc.ca", "edu.vaniercollege.qc.ca", "johnabbottcollege.net",
  "marianopolis.edu", "bdeb.qc.ca", "cmaisonneuve.qc.ca", "crosemont.qc.ca",
  "claurendeau.qc.ca", "cstlaurent.qc.ca", "etu.cvm.qc.ca",
  "cgodin.qc.ca", "cmvictorin.qc.ca", "grasset.qc.ca", "brebeuf.qc.ca",
  "lasallecollege.com", "tav.ca", "osullivan.edu",
  "mail.mcgill.ca", "mcgill.ca",
  "live.concordia.ca", "mail.concordia.ca", "concordia.ca",
  "umontreal.ca", "hec.ca", "polymtl.ca", "uqam.ca", "courrier.uqam.ca",
  "cmontmorency.qc.ca",
  "champlaincollege.qc.ca", "stu.champlaincollege.qc.ca",
  "cegepmontpetit.ca", "cstjean.qc.ca",
  "clg.qc.ca", "edu.clg.qc.ca", "cstjerome.qc.ca", "cegep-lanaudiere.qc.ca",
  "colval.qc.ca",
] as const;

export function isSuspectEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return !SCHOOL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** The user row as the admin page fetches it. */
export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string | null;
  school: string | null;
  age: number | null;
  gender: string | null;
  genderPreference: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  photoUrl: string | null;
  onboardingComplete: boolean;
  referralCode: string | null;
  referredBy: string | null;
  intentions: string | null;
  vibe: string | null;
  interests: string[];
  idealHangout: string | null;
  rerollCredits: number;
  createdAt: Date;
}

export interface AdminUser extends Omit<AdminUserRow, "createdAt"> {
  createdAt: string;
  suspect: boolean;
  /** Name of whoever owns `referredBy`, resolved once here. */
  referredByName: string | null;
}

export interface BreakdownItem {
  label: string;
  count: number;
  /** Share of the verified pool, 0–100. */
  pct: number;
}

export interface Referrer {
  code: string;
  name: string;
  email: string;
  verified: number;
  total: number;
}

export interface AdminData {
  users: AdminUser[];
  totals: {
    total: number;
    verified: number;
    onboarded: number;
    withPhoto: number;
    suspect: number;
    dropoffs: number;
  };
  gender: BreakdownItem[];
  lookingFor: BreakdownItem[];
  ages: BreakdownItem[];
  schools: BreakdownItem[];
  referrers: Referrer[];
}

export function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0;
}

function tally<T>(items: T[], pick: (item: T) => string | null | undefined, fallback: string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = pick(item) || fallback;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function toBreakdown(
  counts: Map<string, number>,
  denominator: number,
  sort: (a: BreakdownItem, b: BreakdownItem) => number,
): BreakdownItem[] {
  return Array.from(counts, ([label, count]) => ({ label, count, pct: pct(count, denominator) })).sort(sort);
}

const byCountDesc = (a: BreakdownItem, b: BreakdownItem) => b.count - a.count;
const byLabelNumeric = (a: BreakdownItem, b: BreakdownItem) => {
  const na = Number(a.label);
  const nb = Number(b.label);
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.label.localeCompare(b.label);
  return na - nb;
};

export function buildAdminData(rows: AdminUserRow[]): AdminData {
  const byCode = new Map<string, AdminUserRow>();
  for (const row of rows) if (row.referralCode) byCode.set(row.referralCode, row);

  const users: AdminUser[] = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    suspect: isSuspectEmail(row.email),
    referredByName: row.referredBy ? byCode.get(row.referredBy)?.firstName ?? null : null,
  }));

  const verifiedUsers = rows.filter((u) => u.phoneVerified);
  const verified = verifiedUsers.length;
  const total = rows.length;

  const refCounts = new Map<string, { total: number; verified: number }>();
  for (const row of rows) {
    if (!row.referredBy) continue;
    const entry = refCounts.get(row.referredBy) ?? { total: 0, verified: 0 };
    entry.total++;
    if (row.phoneVerified) entry.verified++;
    refCounts.set(row.referredBy, entry);
  }
  const referrers: Referrer[] = Array.from(refCounts, ([code, c]) => {
    const owner = byCode.get(code);
    return {
      code,
      name: owner?.firstName ?? "?",
      email: owner?.email ?? "?",
      verified: c.verified,
      total: c.total,
    };
  }).sort((a, b) => b.verified - a.verified || b.total - a.total);

  return {
    users,
    totals: {
      total,
      verified,
      onboarded: rows.filter((u) => u.onboardingComplete).length,
      withPhoto: rows.filter((u) => u.photoUrl).length,
      suspect: users.filter((u) => u.suspect).length,
      dropoffs: total - verified,
    },
    gender: toBreakdown(tally(verifiedUsers, (u) => u.gender, "Unknown"), verified, byCountDesc),
    lookingFor: toBreakdown(tally(verifiedUsers, (u) => u.genderPreference, "Unknown"), verified, byCountDesc),
    ages: toBreakdown(tally(verifiedUsers, (u) => (u.age ? String(u.age) : null), "?"), verified, byLabelNumeric),
    schools: toBreakdown(tally(verifiedUsers, (u) => u.school, "Unknown"), verified, byCountDesc),
    referrers,
  };
}
