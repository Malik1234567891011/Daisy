#!/usr/bin/env node
/**
 * Twilio SMS broadcast: “Daisy Wednesday / matches are live”
 *
 * Default: DRY RUN — prints recipient count, message, and first few numbers. Sends nothing.
 *
 * Usage:
 *   node scripts/broadcast-daisy-wednesday.js              # dry run
 *   node scripts/broadcast-daisy-wednesday.js --send       # real send (needs env + confirm below)
 *
 * Required env (same as app + admin notify):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (E.164 sender)
 *   DATABASE_URL
 *
 * For --send you must also set:
 *   DAISY_BROADCAST_CONFIRM=yes
 *
 * Optional:
 *   NEXT_PUBLIC_URL or BROADCAST_SITE_URL — link inserted into the text (no trailing slash)
 *   BROADCAST_SUPPORT_EMAIL — shown at end of message (default: your team inbox placeholder)
 *
 * Recipients: phoneVerified + phoneNumber + smsConsent (same policy as /api/admin/notify).
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
var PrismaClient = require("@prisma/client").PrismaClient;
var twilio = require("twilio");

var BASE_URL = (
  process.env.BROADCAST_SITE_URL ||
  process.env.NEXT_PUBLIC_URL ||
  "https://www.daisyweekly.com"
).replace(/\/$/, "");
var SUPPORT = process.env.BROADCAST_SUPPORT_EMAIL || "hello@joindaisy.com";

/** Override with env: {{URL}} = site root, {{DASHBOARD}} = /dashboard, {{EMAIL}} = support */
function buildBody() {
  var dash = BASE_URL + "/dashboard";
  var custom = process.env.BROADCAST_BODY;
  if (custom && String(custom).trim()) {
    return String(custom)
      .trim()
      .replace(/\{\{DASHBOARD\}\}/g, dash)
      .replace(/\{\{URL\}\}/g, BASE_URL)
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

var BODY = buildBody();

var DELAY_MS = 650;

function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

(async function main() {
  var sid = process.env.TWILIO_ACCOUNT_SID;
  var token = process.env.TWILIO_AUTH_TOKEN;
  var from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.error("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER");
    process.exit(1);
  }

  if (SEND && process.env.DAISY_BROADCAST_CONFIRM !== "yes") {
    console.error(
      "Refusing to send: set DAISY_BROADCAST_CONFIRM=yes when using --send",
    );
    process.exit(1);
  }

  var prisma = new PrismaClient();
  var users = await prisma.user.findMany({
    where: {
      phoneVerified: true,
      phoneNumber: { not: null },
      smsConsent: true,
    },
    select: {
      id: true,
      firstName: true,
      phoneNumber: true,
      email: true,
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.$disconnect();

  console.log("=== Daisy Wednesday broadcast ===\n");
  console.log("Mode:", SEND ? "SEND" : "DRY RUN (no SMS)\n");
  console.log("Site link base:", BASE_URL);
  console.log("Support email in text:", SUPPORT);
  console.log("Recipients (verified + phone + SMS consent):", users.length);
  console.log("\n--- Message body ---\n");
  console.log(BODY);
  console.log("\n--- Length ---\n", BODY.length, "chars (may split into multiple SMS segments)\n");

  if (users.length <= 10) {
    users.forEach(function (u) {
      console.log(" -", u.firstName || "?", u.phoneNumber, u.email);
    });
  } else {
    users.slice(0, 5).forEach(function (u) {
      console.log(" -", u.firstName || "?", u.phoneNumber);
    });
    console.log(" ... and", users.length - 5, "more");
  }

  if (!SEND) {
    console.log(
      "\nTo send for real: DAISY_BROADCAST_CONFIRM=yes node scripts/broadcast-daisy-wednesday.js --send",
    );
    return;
  }

  var client = twilio(sid, token);
  var ok = 0;
  var fail = 0;

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    try {
      var msg = await client.messages.create({
        to: u.phoneNumber,
        from: from,
        body: BODY,
      });
      ok++;
      console.log("OK", u.phoneNumber, msg.sid);
    } catch (e) {
      fail++;
      console.error("FAIL", u.phoneNumber, e.message || e);
    }
    if (i < users.length - 1) await sleep(DELAY_MS);
  }

  console.log("\nDone. Sent:", ok, "Failed:", fail);
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
