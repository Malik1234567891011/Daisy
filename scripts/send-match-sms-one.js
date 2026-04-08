#!/usr/bin/env node
/**
 * Send the standard "match is ready" SMS to one user by email (for testing).
 * Match creation in DB does NOT auto-text — use this or POST /api/admin/notify.
 *
 *   node scripts/send-match-sms-one.js you@school.edu           # dry run
 *   DAISY_TEST_SMS_CONFIRM=yes node scripts/send-match-sms-one.js you@school.edu --send
 */

var path = require("path");
var fs = require("fs");

[".env", ".env.local"].forEach(function (f) {
  var p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split("\n").forEach(function (line) {
    var m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
});

var SEND = process.argv.indexOf("--send") !== -1;
var email = process.argv.find(function (a) {
  return a.indexOf("@") !== -1;
});

function buildBody() {
  var BASE = (
    process.env.BROADCAST_SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://www.daisyweekly.com"
  ).replace(/\/$/, "");
  var dash = BASE + "/dashboard";
  var custom = process.env.BROADCAST_BODY;
  if (custom && String(custom).trim()) {
    var SUPPORT = process.env.BROADCAST_SUPPORT_EMAIL || "hello@joindaisy.com";
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

(async function () {
  if (!email) {
    console.error("Usage: node scripts/send-match-sms-one.js <email> [--send]");
    process.exit(1);
  }

  if (SEND && process.env.DAISY_TEST_SMS_CONFIRM !== "yes") {
    console.error("Refusing: set DAISY_TEST_SMS_CONFIRM=yes for --send");
    process.exit(1);
  }

  var PrismaClient = require("@prisma/client").PrismaClient;
  var twilio = require("twilio");
  var prisma = new PrismaClient();

  var user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      firstName: true,
      phoneNumber: true,
      smsConsent: true,
      phoneVerified: true,
    },
  });

  await prisma.$disconnect();

  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }
  if (!user.phoneNumber) {
    console.error("No phone on file for", email);
    process.exit(1);
  }
  if (!user.smsConsent) {
    console.error("smsConsent is false for", email, "(admin notify would also block)");
    process.exit(1);
  }

  var body = buildBody();
  console.log("To:", user.firstName, user.phoneNumber);
  console.log("---");
  console.log(body);
  console.log("---");

  if (!SEND) {
    console.log("\nDry run. To send:");
    console.log(
      "  DAISY_TEST_SMS_CONFIRM=yes node scripts/send-match-sms-one.js " +
        email +
        " --send",
    );
    return;
  }

  var sid = process.env.TWILIO_ACCOUNT_SID;
  var token = process.env.TWILIO_AUTH_TOKEN;
  var from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.error("Missing Twilio env");
    process.exit(1);
  }

  var client = twilio(sid, token);
  var msg = await client.messages.create({
    to: user.phoneNumber,
    from: from,
    body: body,
  });
  console.log("Sent. SID:", msg.sid);
})().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
