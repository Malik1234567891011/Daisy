#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI script */
/**
 * Put one real account into a sandbox so the whole match flow can be walked
 * through by hand: see the match, accept it, decline it, reroll out of it.
 *
 * The account is flipped to isTestAccount = true for the duration. That flag
 * is the hard population split enforced in src/lib/matchRules.ts, so every
 * reroll can only ever land on one of the synthetic partners seeded here —
 * no real student gets pulled into the test, texted, or force-rematched.
 * Synthetic partners carry no phone number, so no SMS path can reach them.
 *
 * Reroll credits are granted directly, so testing the reroll button does not
 * run a real $1.99 CAD Stripe charge.
 *
 *   node scripts/seed-my-test-match.js                  # print the plan, write nothing
 *   node scripts/seed-my-test-match.js --write          # apply it
 *   node scripts/seed-my-test-match.js --reset          # fresh PENDING match, keep sandbox
 *   node scripts/seed-my-test-match.js --restore        # undo: back to a normal account
 *
 *   TARGET_EMAIL=someone@else.ca node scripts/seed-my-test-match.js --write
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
[".env", ".env.local"].forEach((f) => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
});

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

try {
  console.log(`target database host: ${new URL(process.env.DATABASE_URL).host}\n`);
} catch {
  console.error("DATABASE_URL is not set or not parseable.");
  process.exit(1);
}

const TARGET_EMAIL = process.env.TARGET_EMAIL || "testing@daisyweekly.com";
const WRITE = process.argv.includes("--write");
const RESET = process.argv.includes("--reset");
const RESTORE = process.argv.includes("--restore");
const CREDITS = Number(process.env.REROLL_CREDITS || 3);

const PASSWORD = "DaisyTest2026!";

/** Synthetic partners. Emails are namespaced so --restore can find them all. */
const PARTNERS = [
  {
    email: "sandbox1@daisyweekly.com",
    firstName: "Amara",
    gender: "Woman",
    school: "Collège de Maisonneuve",
    major: "Psychology",
    intentions: "serious",
    vibe: "balanced",
    idealHangout: "coffee,walk",
    interests: ["Music", "Coffee culture", "Reading", "Thrifting"],
    contactMethod: "instagram",
    contactValue: "@sandbox_amara",
    photoUrl: "/avatars/test-a.svg",
  },
  {
    email: "sandbox2@daisyweekly.com",
    firstName: "Naomi",
    gender: "Woman",
    school: "Concordia University",
    major: "Communications",
    intentions: "casual",
    vibe: "social",
    idealHangout: "drinks,food",
    interests: ["Nightlife", "Fashion", "Food", "Dancing"],
    contactMethod: "instagram",
    contactValue: "@sandbox_naomi",
    photoUrl: "/avatars/test-b.svg",
  },
  {
    email: "sandbox3@daisyweekly.com",
    firstName: "Zoe",
    gender: "Woman",
    school: "McGill University",
    major: "Biology",
    intentions: "serious",
    vibe: "homebody",
    idealHangout: "study,coffee",
    interests: ["Reading", "Nature", "Cooking", "Podcasts"],
    contactMethod: "instagram",
    contactValue: "@sandbox_zoe",
    photoUrl: "/avatars/test-c.svg",
  },
];

/** Ages are picked inside the target's own range so nobody is filtered out. */
function ageFor(index, min, max) {
  const lo = min ?? 18;
  const hi = max ?? 30;
  return Math.min(hi, lo + 1 + index);
}

/**
 * The target may have set an ethnicity preference, which is a hard filter in
 * matchRules.ts — a partner with no ethnicity on file is excluded outright.
 * Give every synthetic partner the first ethnicity the target asked for, so
 * the reroll pool is never empty for a reason that has nothing to do with the
 * flow being tested.
 */
function ethnicityFor(preference) {
  const wanted = String(preference || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return wanted[0] ?? null;
}

async function loadTarget() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: TARGET_EMAIL, mode: "insensitive" } },
    select: {
      id: true, email: true, firstName: true, age: true, gender: true, school: true,
      major: true, ethnicity: true, genderPreference: true, schoolPreference: true,
      ageRangeMin: true, ageRangeMax: true, majorPreference: true,
      ethnicityPreference: true, onboardingComplete: true, phoneVerified: true,
      isTestAccount: true, rerollCredits: true, photoUrl: true, createdAt: true,
    },
  });
  if (!user) {
    console.error(`No user with email ${TARGET_EMAIL}`);
    process.exit(1);
  }
  return user;
}

async function describe(user) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    orderBy: { dropDate: "desc" },
    select: { id: true, status: true, dropDate: true, userAId: true, userBId: true,
              userADecision: true, userBDecision: true },
  });
  console.log(`target: ${user.firstName} <${user.email}>  id=${user.id}`);
  console.log(`  ${user.age}yo ${user.gender} at ${user.school} → wants ${user.genderPreference}, ages ${user.ageRangeMin}-${user.ageRangeMax}`);
  console.log(`  onboarded=${user.onboardingComplete} phoneVerified=${user.phoneVerified} isTestAccount=${user.isTestAccount} rerollCredits=${user.rerollCredits}`);
  if (user.majorPreference) console.log(`  majorPreference=${user.majorPreference}`);
  if (user.ethnicityPreference) console.log(`  ethnicityPreference=${user.ethnicityPreference}`);
  const spotTotal = await prisma.meetingSpot.count();
  const spotsForSchool = user.school
    ? await prisma.meetingSpot.count({ where: { schools: { has: user.school } } })
    : 0;
  console.log(`  meeting spots: ${spotTotal} total, ${spotsForSchool} listed for ${user.school}`);
  console.log(`  existing matches: ${matches.length}`);
  matches.forEach((m) => {
    console.log(`    ${m.id} ${m.status} drop=${m.dropDate.toISOString()} A=${m.userADecision} B=${m.userBDecision}`);
  });
  return matches;
}

async function upsertPartners(target) {
  const now = new Date();
  const shared = {
    passwordHash: bcrypt.hashSync(PASSWORD, 12),
    isTestAccount: true,
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
    ethnicity: ethnicityFor(target.ethnicityPreference),
    availability: ["flexible"],
  };

  const created = [];
  for (let i = 0; i < PARTNERS.length; i++) {
    const { email, ...profile } = PARTNERS[i];
    const data = { ...shared, ...profile, age: ageFor(i, target.ageRangeMin, target.ageRangeMax) };
    const row = await prisma.user.upsert({
      where: { email },
      update: data,
      create: { ...data, email },
    });
    created.push(row);
  }
  return created;
}

/**
 * Mirrors the hard filters in src/lib/matchRules.ts. Kept deliberately small:
 * its only job is to say "a reroll will find someone" before you click the
 * button, so an empty pool never reads as a broken feature.
 */
function hardFiltersPass(seeker, c) {
  const genderFits = (pref, gender) =>
    !pref || pref === "Everyone"
      ? true
      : !gender
        ? false
        : pref === "Men" ? gender === "Man" : pref === "Women" ? gender === "Woman" : true;
  const ageFits = (age, min, max) =>
    age == null || ((min == null || age >= min) && (max == null || age <= max));
  const schoolFits = (pref, mine, theirs) => pref !== "same" || (!!mine && mine === theirs);
  const majorFits = (pref, theirs) => !pref || theirs === pref;
  const ethFits = (pref, theirs) => {
    const wanted = String(pref || "").split(",").map((x) => x.trim()).filter(Boolean);
    return wanted.length === 0 ? true : !!theirs && wanted.includes(theirs);
  };
  return (
    seeker.isTestAccount === c.isTestAccount &&
    genderFits(seeker.genderPreference, c.gender) &&
    genderFits(c.genderPreference, seeker.gender) &&
    ageFits(c.age, seeker.ageRangeMin, seeker.ageRangeMax) &&
    ageFits(seeker.age, c.ageRangeMin, c.ageRangeMax) &&
    schoolFits(seeker.schoolPreference, seeker.school, c.school) &&
    schoolFits(c.schoolPreference, c.school, seeker.school) &&
    majorFits(seeker.majorPreference, c.major) &&
    majorFits(c.majorPreference, seeker.major) &&
    ethFits(seeker.ethnicityPreference, c.ethnicity) &&
    ethFits(c.ethnicityPreference, seeker.ethnicity)
  );
}

async function verify(target) {
  const [live, history] = await Promise.all([
    prisma.match.findMany({ where: { status: { in: ["PENDING", "MUTUAL"] } }, select: { userAId: true, userBId: true } }),
    prisma.match.findMany({ where: { OR: [{ userAId: target.id }, { userBId: target.id }] }, select: { userAId: true, userBId: true } }),
  ]);
  const excluded = new Set([target.id]);
  live.forEach((m) => { excluded.add(m.userAId); excluded.add(m.userBId); });
  history.forEach((m) => excluded.add(m.userAId === target.id ? m.userBId : m.userAId));

  const pool = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      onboardingComplete: true,
      phoneVerified: true,
      isTestAccount: target.isTestAccount,
    },
    select: {
      id: true, firstName: true, email: true, isTestAccount: true, age: true, gender: true,
      school: true, major: true, ethnicity: true, genderPreference: true, schoolPreference: true,
      ageRangeMin: true, ageRangeMax: true, majorPreference: true, ethnicityPreference: true,
    },
  });
  const ok = pool.filter((c) => hardFiltersPass(target, c));
  console.log(`reroll pool (isTestAccount=${target.isTestAccount}): ${pool.length} free, ${ok.length} compatible`);
  ok.forEach((c) => console.log(`  ✓ ${c.firstName} <${c.email}> ${c.age} ${c.gender} @ ${c.school}`));
  if (ok.length === 0) console.log("  (a reroll right now would return \"no one new is available\")");
}

async function main() {
  const target = await loadTarget();
  const matches = await describe(target);
  console.log();

  if (process.argv.includes("--verify")) {
    await verify(target);
    return;
  }

  if (RESTORE) {
    if (!WRITE) {
      console.log("--restore plan (add --write to apply):");
      console.log(`  delete ${matches.length} match(es) involving ${target.email}`);
      console.log(`  set ${target.email}: isTestAccount=false, rerollCredits=0`);
      console.log(`  delete synthetic partners: ${PARTNERS.map((p) => p.email).join(", ")}`);
      return;
    }
    await prisma.match.deleteMany({
      where: { OR: [{ userAId: target.id }, { userBId: target.id }] },
    });
    await prisma.user.update({
      where: { id: target.id },
      data: { isTestAccount: false, rerollCredits: 0 },
    });
    const emails = PARTNERS.map((p) => p.email);
    const partnerRows = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const ids = partnerRows.map((r) => r.id);
    if (ids.length) {
      await prisma.match.deleteMany({
        where: { OR: [{ userAId: { in: ids } }, { userBId: { in: ids } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    console.log(`Restored. ${target.email} is a normal account again; ${ids.length} synthetic partner(s) removed.`);
    return;
  }

  const ages = PARTNERS.map((_, i) => ageFor(i, target.ageRangeMin, target.ageRangeMax));
  if (!WRITE) {
    console.log(RESET ? "--reset plan (add --write to apply):" : "plan (add --write to apply):");
    if (!RESET) {
      console.log(`  set ${target.email}: isTestAccount=true  ← sandboxes the reroll pool`);
      console.log(`  set ${target.email}: rerollCredits=${CREDITS}  ← reroll button skips Stripe`);
      console.log(`  upsert ${PARTNERS.length} synthetic partners (isTestAccount, no phone):`);
      const eth = ethnicityFor(target.ethnicityPreference);
    PARTNERS.forEach((p, i) =>
      console.log(`    ${p.firstName} ${ages[i]} ${p.gender} @ ${p.school}${eth ? ` (${eth})` : ""}`));
    }
    console.log(`  delete ${matches.length} existing match(es) for the target`);
    console.log(`  create PENDING match with ${PARTNERS[0].firstName} — she has already said INTERESTED,`);
    console.log("    so clicking Interested flips it to MUTUAL and reveals contact + meeting spot");
    return;
  }

  if (!RESET) {
    await prisma.user.update({
      where: { id: target.id },
      data: { isTestAccount: true, rerollCredits: CREDITS },
    });
    console.log(`${target.email}: isTestAccount=true, rerollCredits=${CREDITS}`);
  }

  const partners = await upsertPartners({ ...target, isTestAccount: true });
  console.log(`synthetic partners ready: ${partners.map((p) => `${p.firstName} (${p.age})`).join(", ")}`);

  const partnerIds = partners.map((p) => p.id);
  const cleared = await prisma.match.deleteMany({
    where: {
      OR: [
        { userAId: target.id }, { userBId: target.id },
        { userAId: { in: partnerIds } }, { userBId: { in: partnerIds } },
      ],
    },
  });
  console.log(`cleared ${cleared.count} match(es)`);

  const match = await prisma.match.create({
    data: {
      userAId: target.id,
      userBId: partners[0].id,
      // An hour ago so it is already dropped and the dashboard shows it now.
      dropDate: new Date(Date.now() - 60 * 60 * 1000),
      status: "PENDING",
      userADecision: "PENDING",
      // She said yes first: accepting flips straight to MUTUAL.
      userBDecision: "INTERESTED",
    },
  });

  console.log(`\nmatch ${match.id}: ${target.firstName} ↔ ${partners[0].firstName} (PENDING, drop ${match.dropDate.toISOString()})`);
  console.log(`\nOpen /dashboard as ${target.email}. Partner logins use password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
