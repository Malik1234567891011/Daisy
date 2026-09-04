/**
 * Seed the two synthetic accounts used by platform reviewers (e.g. Meta).
 *
 * Idempotent: upserts by email and reuses the existing match, so re-running it
 * is safe. Creates no real-user data and sends nothing.
 *
 * The accounts carry isTestAccount = true, which is what actually keeps them
 * out of production. That flag is enforced server-side in:
 *   - src/lib/matchRules.ts        (reroll compatibility: hard population split)
 *   - src/lib/matching.ts          (reroll candidate query)
 *   - src/lib/wednesdayBroadcastSms.ts (drop gate + SMS recipients)
 *   - scripts/generate-matches-md.js
 *   - scripts/seed-week-matches-and-broadcast.js
 *   - scripts/broadcast-daisy-wednesday.js
 *
 * Usage:  node scripts/seed-test-accounts.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
[".env", ".env.local"].forEach((f) => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    // Fill gaps only. An explicitly exported DATABASE_URL must win: these
    // files point at a non-production database, and clobbering the caller's
    // value is how the schema once got applied to the wrong one.
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
});

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Say out loud which database is about to be written to. Silence here is
// what allowed a migration to land on the wrong one.
try {
  console.log(`target database host: ${new URL(process.env.DATABASE_URL).host}`);
} catch {
  console.error("DATABASE_URL is not set or not parseable.");
  process.exit(1);
}

const PASSWORD = "DaisyTest2026!";
const REVIEWER_EMAIL = "facebooktester@daisyweekly.com";
const PARTNER_EMAIL = "facebooktester2@daisyweekly.com";

// Recent enough that the dashboard shows a live match. Safe because the
// broadcast gate ignores matches where either side is a test account.
const DROP = new Date(Date.now() - 60 * 60 * 1000);

const now = new Date();
const shared = {
  passwordHash: bcrypt.hashSync(PASSWORD, 12),
  isTestAccount: true,
  // Reviewers cannot receive an SMS code, so verification is set directly.
  // No number and no consent means no SMS path can ever reach these rows.
  phoneVerified: true,
  phoneNumber: null,
  smsConsent: false,
  onboardingComplete: true,
  studentAttestedAt: now,
  age18AttestedAt: now,
  genderPreference: "Everyone",
  schoolPreference: "any",
  ageRangeMin: 18,
  ageRangeMax: 30,
  majorPreference: null,
  ethnicityPreference: null,
  availability: ["flexible"],
};

/**
 * Profiles are applied on update as well as create. An earlier run absorbed a
 * half-formed row whose firstName was null, and the dashboard greeted the
 * reviewer as "friend" — re-running should normalise the account, not just
 * create it.
 */
const REVIEWER_PROFILE = {
  firstName: "Alex",
  age: 21,
  gender: "Man",
  school: "McGill University",
  major: "Computer Science",
  intentions: "serious",
  vibe: "balanced",
  idealHangout: "coffee",
  interests: ["Music", "Coffee culture", "Movies"],
  contactMethod: "instagram",
  contactValue: "@daisy_test_reviewer",
};

const PARTNER_PROFILE = {
  firstName: "Jordan",
  age: 22,
  gender: "Woman",
  school: "Concordia University",
  major: "Communications",
  intentions: "serious",
  vibe: "balanced",
  idealHangout: "coffee",
  interests: ["Music", "Coffee culture", "Photography"],
  contactMethod: "instagram",
  contactValue: "@daisy_test_partner",
  // Synthetic placeholder served from /public. Deliberately not a photograph
  // of a real person: this profile is fictional and sits on the live site.
  photoUrl: "/avatars/jordan.svg",
};

async function main() {
  const reviewer = await prisma.user.upsert({
    where: { email: REVIEWER_EMAIL },
    update: { ...shared, ...REVIEWER_PROFILE },
    create: { ...shared, ...REVIEWER_PROFILE, email: REVIEWER_EMAIL },
  });

  const partner = await prisma.user.upsert({
    where: { email: PARTNER_EMAIL },
    update: { ...shared, ...PARTNER_PROFILE },
    create: { ...shared, ...PARTNER_PROFILE, email: PARTNER_EMAIL },
  });

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { userAId: reviewer.id, userBId: partner.id },
        { userAId: partner.id, userBId: reviewer.id },
      ],
    },
  });

  // The partner has already said yes, so the reviewer clicking "Interested"
  // flips the match to MUTUAL and demonstrates the contact reveal.
  const state = {
    status: "PENDING",
    dropDate: DROP,
    userADecision: "PENDING",
    userBDecision: "INTERESTED",
  };

  const match = existing
    ? await prisma.match.update({
        where: { id: existing.id },
        data:
          existing.userAId === reviewer.id
            ? state
            : { ...state, userADecision: "INTERESTED", userBDecision: "PENDING" },
      })
    : await prisma.match.create({
        data: { userAId: reviewer.id, userBId: partner.id, ...state },
      });

  console.log(
    JSON.stringify(
      {
        reviewer: { id: reviewer.id, email: reviewer.email, isTestAccount: reviewer.isTestAccount },
        partner: { id: partner.id, email: partner.email, isTestAccount: partner.isTestAccount },
        match: { id: match.id, status: match.status, dropDate: match.dropDate.toISOString() },
        password: PASSWORD,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
