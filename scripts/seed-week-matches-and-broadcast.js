#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI script */
/**
 * Parse ../matches.md pairs, create Match rows for this drop, then SMS the
 * users in those pairs (phoneVerified + phoneNumber + smsConsent only).
 *
 *   node scripts/seed-week-matches-and-broadcast.js                                   # dry run
 *   node scripts/seed-week-matches-and-broadcast.js --seed                            # expires prior-week active + writes Match rows
 *   DAISY_BROADCAST_CONFIRM=yes node scripts/seed-week-matches-and-broadcast.js --seed --sms
 *
 * Safety rails:
 * - Expires prior-week active matches (PENDING/MUTUAL -> EXPIRED) before seeding.
 * - Blocks any pair already seen in match history (week 1/2/etc.) unless explicitly overridden.
 */

const path = require("path");
const fs = require("fs");

for (const f of [".env", ".env.local"]) {
  const p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, "utf8").split("\n").forEach(function (line) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
}

const DO_SEED = process.argv.includes("--seed");
const DO_SMS = process.argv.includes("--sms");
const ALLOW_HISTORY_DUPES = process.argv.includes("--allow-history-duplicates");
const SKIP_WEEKLY_RESET = process.argv.includes("--skip-weekly-reset");
const MD_PATH = path.resolve(__dirname, "..", "..", "matches.md");
const DELAY_MS = 650;

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function parsePairsFromMd(mdText) {
  const pairs = [];
  const blocks = mdText.split(/^#### Pair \d+:/m).slice(1);
  for (const blk of blocks) {
    const aMatch = blk.match(/\*\*A:\*\*\s+([^\s·]+)/);
    const bMatch = blk.match(/\*\*B:\*\*\s+([^\s·]+)/);
    const slotMatch = blk.match(/\*\*Drop slot:\*\*\s+(WED|FRI|SUN)/i);
    if (aMatch && bMatch) {
      pairs.push({
        emailA: aMatch[1].trim(),
        emailB: bMatch[1].trim(),
        dropSlot: slotMatch ? slotMatch[1].toUpperCase() : "WED",
      });
    }
  }
  return pairs;
}

function getNextWednesdayAtSix(baseNow) {
  const now = new Date(baseNow);
  const wed = new Date(now);
  const diff = (3 - wed.getDay() + 7) % 7;
  wed.setDate(wed.getDate() + diff);
  wed.setHours(18, 0, 0, 0);
  if (diff === 0 && now > wed) {
    // If already past Wed 6pm, treat this as this week's Wednesday drop time.
    return new Date(baseNow);
  }
  return wed;
}

function getDropDateForSlot(slot, now) {
  const wed = getNextWednesdayAtSix(now);
  if (slot === "FRI") {
    const d = new Date(wed);
    d.setDate(d.getDate() + 2);
    return d;
  }
  if (slot === "SUN") {
    const d = new Date(wed);
    d.setDate(d.getDate() + 4);
    return d;
  }
  return wed;
}

function buildBody() {
  const BASE = (
    process.env.BROADCAST_SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://www.daisyweekly.com"
  ).replace(/\/$/, "");
  const dash = BASE + "/dashboard";
  const custom = process.env.BROADCAST_BODY;
  if (custom && String(custom).trim()) {
    const SUPPORT = process.env.BROADCAST_SUPPORT_EMAIL || "hello@joindaisy.com";
    return String(custom)
      .trim()
      .replace(/\{\{DASHBOARD\}\}/g, dash)
      .replace(/\{\{URL\}\}/g, BASE)
      .replace(/\{\{EMAIL\}\}/g, SUPPORT);
  }
  /*
   * GSM-7 only. One emoji, curly apostrophe or em dash switches the whole
   * message to UCS-2, where a segment is 67 characters instead of 153 — the
   * old body billed 4 segments per person for 220 characters. Keep this to
   * plain ASCII and a straight apostrophe, and check the printed segment
   * count after any edit.
   */
  return (
    "Daisy: your match is ready.\n\n" +
    "Open your dashboard to see them. If you both say yes, you unlock contact details.\n\n" +
    dash
  );
}

(async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  if (!fs.existsSync(MD_PATH)) {
    console.error("matches.md not found at " + MD_PATH);
    process.exit(1);
  }

  const md = fs.readFileSync(MD_PATH, "utf8");
  const pairs = parsePairsFromMd(md);
  console.log("Parsed " + pairs.length + " pairs from matches.md");

  const emails = [...new Set(pairs.flatMap((p) => [p.emailA.toLowerCase(), p.emailB.toLowerCase()]))];
  const users = await prisma.user.findMany({
    where: { email: { in: emails, mode: "insensitive" } },
    select: {
      id: true, firstName: true, email: true,
      phoneNumber: true, phoneVerified: true, smsConsent: true,
      isTestAccount: true,
    },
  });

  const byEmail = {};
  for (const u of users) byEmail[u.email.toLowerCase()] = u;

  const now = new Date();
  const localDayStart = new Date(now);
  localDayStart.setHours(0, 0, 0, 0);

  const activeMatches = await prisma.match.findMany({
    where: { status: { in: ["PENDING", "MUTUAL"] } },
    select: { id: true, userAId: true, userBId: true, dropDate: true, status: true },
  });

  const allHistory = await prisma.match.findMany({
    select: { userAId: true, userBId: true },
  });
  const historicalPairs = new Set();
  for (const m of allHistory) {
    historicalPairs.add(m.userAId + ":" + m.userBId);
    historicalPairs.add(m.userBId + ":" + m.userAId);
  }

  const priorWeekActive = activeMatches.filter((m) => m.dropDate < localDayStart);
  console.log("Active matches now: " + activeMatches.length);
  console.log("Prior-week active to expire on seed: " + priorWeekActive.length);

  if (DO_SEED && !SKIP_WEEKLY_RESET && priorWeekActive.length) {
    const priorWeekIds = priorWeekActive.map((m) => m.id);
    const reset = await prisma.match.updateMany({
      where: { id: { in: priorWeekIds } },
      data: { status: "EXPIRED" },
    });
    console.log("Expired prior-week active matches: " + reset.count);
  } else if (DO_SEED && SKIP_WEEKLY_RESET) {
    console.log("WARNING: weekly reset skipped via --skip-weekly-reset");
  } else if (!DO_SEED && priorWeekActive.length) {
    console.log("Dry run note: would expire " + priorWeekActive.length + " prior-week active match(es).");
  }

  let activeAfterReset;
  if (DO_SEED && !SKIP_WEEKLY_RESET) {
    activeAfterReset = await prisma.match.findMany({
      where: { status: { in: ["PENDING", "MUTUAL"] } },
      select: { id: true, userAId: true, userBId: true },
    });
  } else {
    // Dry run (or explicit skip): simulate post-reset active set without mutating DB.
    const willExpireIds = new Set(
      SKIP_WEEKLY_RESET ? [] : priorWeekActive.map((m) => m.id),
    );
    activeAfterReset = activeMatches
      .filter((m) => !willExpireIds.has(m.id))
      .map((m) => ({ id: m.id, userAId: m.userAId, userBId: m.userBId }));
  }
  const busy = new Set();
  for (const m of activeAfterReset) {
    busy.add(m.userAId);
    busy.add(m.userBId);
  }

  const plan = [];
  const missing = [];
  const skipped = [];
  const duplicateHistory = [];
  for (const p of pairs) {
    const a = byEmail[p.emailA.toLowerCase()];
    const b = byEmail[p.emailB.toLowerCase()];
    if (!a || !b) {
      missing.push(p);
      continue;
    }
    if (busy.has(a.id) || busy.has(b.id)) {
      skipped.push({ a: a.email, b: b.email, reason: "already has active match" });
      continue;
    }
    if (historicalPairs.has(a.id + ":" + b.id)) {
      duplicateHistory.push({ a: a.email, b: b.email });
      continue;
    }
    plan.push({ a, b, dropSlot: p.dropSlot || "WED" });
  }

  console.log("Ready to seed: " + plan.length);
  console.log("Missing user for at least one side: " + missing.length);
  console.log("Skipped (already in active match): " + skipped.length);
  console.log("Blocked as historical duplicate: " + duplicateHistory.length);
  if (missing.length) console.log("  missing examples:", missing.slice(0, 5));
  if (skipped.length) console.log("  skipped examples:", skipped.slice(0, 5));
  if (duplicateHistory.length)
    console.log("  duplicate examples:", duplicateHistory.slice(0, 5));

  if (!DO_SEED) {
    console.log("\nDRY RUN — pass --seed to write Match rows.");
    await prisma.$disconnect();
    return;
  }

  if (duplicateHistory.length && !ALLOW_HISTORY_DUPES) {
    console.error(
      "Aborting seed: found " +
        duplicateHistory.length +
        " pair(s) that already existed historically. " +
        "Fix matches.md and re-generate, or pass --allow-history-duplicates to override.",
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const created = [];
  const nowForDrop = new Date();
  for (const { a, b, dropSlot } of plan) {
    const dropDate = getDropDateForSlot(dropSlot, nowForDrop);
    const row = await prisma.match.create({
      data: { userAId: a.id, userBId: b.id, dropDate },
    });
    created.push({ id: row.id, a, b, dropDate, dropSlot });
  }
  console.log("Created " + created.length + " Match rows.");

  await prisma.$disconnect();

  if (!DO_SMS) {
    console.log("Seed complete — re-run with DAISY_BROADCAST_CONFIRM=yes and --sms to send.");
    return;
  }

  if (process.env.DAISY_BROADCAST_CONFIRM !== "yes") {
    console.error("Refusing SMS: set DAISY_BROADCAST_CONFIRM=yes");
    process.exit(1);
  }

  const twilio = require("twilio");
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.error("Missing Twilio env (TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER).");
    process.exit(1);
  }
  const client = twilio(sid, token);
  const body = buildBody();

  const recipients = [];
  const nowAtSend = new Date();
  const seen = new Set();
  for (const row of created) {
    if (row.dropDate.getTime() > nowAtSend.getTime()) continue;
    for (const u of [row.a, row.b]) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      if (u.isTestAccount) continue;
      if (u.phoneVerified && u.phoneNumber && u.smsConsent) recipients.push(u);
    }
  }
  const createdBySlot = created.reduce(
    (acc, row) => {
      acc[row.dropSlot] = (acc[row.dropSlot] || 0) + 1;
      return acc;
    },
    {},
  );
  console.log("Created by slot:", createdBySlot);
  console.log("SMS recipients due now (verified + phone + consent): " + recipients.length);

  // Print the encoding and segment count before anything goes out: a single
  // emoji or curly apostrophe quadruples the bill, and the only way that gets
  // noticed is if the number is on screen.
  var _uni = false;
  for (var _i = 0; _i < body.length; _i++) if (body.charCodeAt(_i) > 127) _uni = true;
  var _seg = _uni ? 67 : 153;
  var _per = Math.ceil(body.length / _seg);
  console.log("\n--- message (" + body.length + " chars, " + (_uni ? "UNICODE" : "GSM-7") +
    ", " + _per + " segment(s) each, " + (_per * recipients.length) + " total) ---\n");
  console.log(body + "\n");

  let ok = 0, fail = 0;
  for (let i = 0; i < recipients.length; i++) {
    const u = recipients[i];
    try {
      const msg = await client.messages.create({ to: u.phoneNumber, from, body });
      ok++;
      console.log("OK", u.firstName || "?", u.phoneNumber, msg.sid);
    } catch (e) {
      fail++;
      console.error("FAIL", u.phoneNumber, e.message || e);
    }
    if (i < recipients.length - 1) await sleep(DELAY_MS);
  }
  console.log("\nSMS done. Sent:", ok, "Failed:", fail);

  // Tell the Wednesday cron this drop is already texted, so matched users
  // don't get a second "your match is ready" at 6 PM. Same key the cron
  // uses (src/app/api/cron/wednesday-broadcast/route.ts). Prisma reconnects
  // on its own after the earlier $disconnect().
  if (ok > 0) {
    const periodKey = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
    await prisma.broadcastDedupe.upsert({
      where: { job_periodKey: { job: "wednesday_match_sms", periodKey } },
      create: { job: "wednesday_match_sms", periodKey },
      update: {},
    });
    await prisma.$disconnect();
    console.log("Recorded broadcast dedupe for " + periodKey + " — the cron will skip today.");
  }
})().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
