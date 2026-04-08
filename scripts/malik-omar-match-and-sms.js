#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI script */
/**
 * Prepared flow: match Malik + Omar, then SMS both (not run until you pass flags).
 *
 * Defaults Omar → John Abbott account (2357395@johnabbottcollege.net).
 * The other Omar in DB is o_krimly@live.concordia.ca — override with OMAR_EMAIL=...
 *
 *   node scripts/malik-omar-match-and-sms.js              # print plan only
 *   node scripts/malik-omar-match-and-sms.js --match      # create match (no SMS)
 *   DAISY_TEST_SMS_CONFIRM=yes node scripts/malik-omar-match-and-sms.js --sms
 *   DAISY_TEST_SMS_CONFIRM=yes node scripts/malik-omar-match-and-sms.js --match --sms
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

const MALIK_EMAIL =
  process.env.MALIK_EMAIL || "malik@johnabbottcollege.ca";
const OMAR_EMAIL =
  process.env.OMAR_EMAIL || "2357395@johnabbottcollege.net";

const DO_MATCH = process.argv.includes("--match");
const DO_SMS = process.argv.includes("--sms");
const DELAY_MS = 650;

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
  return (
    "Daisy 🌼 your match is ready.\n\n" +
    "Every Wednesday we match you with 1 student in Montreal.\n" +
    "Open your dashboard to see them.\n\n" +
    "If you both say yes, you'll unlock each other's contact.\n\n" +
    "👉 " +
    dash
  );
}

function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

(async function main() {
  const { PrismaClient } = require("@prisma/client");
  const twilio = require("twilio");
  const prisma = new PrismaClient();

  const [malik, omar] = await Promise.all([
    prisma.user.findFirst({
      where: { email: { equals: MALIK_EMAIL, mode: "insensitive" } },
      select: {
        id: true,
        firstName: true,
        email: true,
        phoneNumber: true,
        phoneVerified: true,
        smsConsent: true,
      },
    }),
    prisma.user.findFirst({
      where: { email: { equals: OMAR_EMAIL, mode: "insensitive" } },
      select: {
        id: true,
        firstName: true,
        email: true,
        phoneNumber: true,
        phoneVerified: true,
        smsConsent: true,
      },
    }),
  ]);

  if (!malik || !omar) {
    console.error(!malik ? "Malik not found: " + MALIK_EMAIL : "Omar not found: " + OMAR_EMAIL);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("=== Malik + Omar (prepared) ===\n");
  console.log("Malik:", malik.firstName, malik.email, malik.phoneNumber || "(no phone)");
  console.log("Omar: ", omar.firstName, omar.email, omar.phoneNumber || "(no phone)");
  console.log("");

  if (!DO_MATCH && !DO_SMS) {
    console.log("Dry run — no DB or Twilio changes.\n");
    console.log("When you are ready:\n");
    console.log("  1) Create match:");
    console.log("       node scripts/malik-omar-match-and-sms.js --match\n");
    console.log("  2) SMS both (standard match copy):");
    console.log(
      "       DAISY_TEST_SMS_CONFIRM=yes node scripts/malik-omar-match-and-sms.js --sms\n",
    );
    console.log("  Or both in one go:");
    console.log(
      "       DAISY_TEST_SMS_CONFIRM=yes node scripts/malik-omar-match-and-sms.js --match --sms\n",
    );
    console.log("Other Omar in DB: o_krimly@live.concordia.ca — use OMAR_EMAIL=... if you meant him.");
    await prisma.$disconnect();
    return;
  }

  if (DO_MATCH) {
    const removed = await prisma.match.deleteMany({
      where: {
        OR: [
          { userAId: malik.id, userBId: omar.id },
          { userAId: omar.id, userBId: malik.id },
        ],
      },
    });
    if (removed.count) console.log("Removed prior match row(s) between the two:", removed.count);

    const match = await prisma.match.create({
      data: {
        userAId: malik.id,
        userBId: omar.id,
        dropDate: new Date(),
      },
    });
    console.log("Created match", match.id, "dropDate", match.dropDate.toISOString());
  }

  await prisma.$disconnect();

  if (DO_SMS) {
    if (process.env.DAISY_TEST_SMS_CONFIRM !== "yes") {
      console.error("Refusing SMS: set DAISY_TEST_SMS_CONFIRM=yes");
      process.exit(1);
    }
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
      console.error("Missing Twilio env");
      process.exit(1);
    }

    const body = buildBody();
    const recipients = [malik, omar];
    for (const u of recipients) {
      if (!u.phoneVerified || !u.phoneNumber || !u.smsConsent) {
        console.error("Cannot SMS", u.email, "- need phoneVerified, phoneNumber, smsConsent");
        process.exit(1);
      }
    }

    const client = twilio(sid, token);
    for (let i = 0; i < recipients.length; i++) {
      const u = recipients[i];
      const msg = await client.messages.create({
        to: u.phoneNumber,
        from: from,
        body: body,
      });
      console.log("SMS OK", u.firstName, u.phoneNumber, msg.sid);
      if (i < recipients.length - 1) await sleep(DELAY_MS);
    }
  }
})().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
