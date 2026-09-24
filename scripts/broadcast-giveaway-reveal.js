#!/usr/bin/env node
/**
 * "Winners in 10 minutes" text for the $200 date giveaway reveal.
 *
 * Twilio keys only live on Vercel, so each text goes through the production
 * /api/admin/notify endpoint (consent is re-checked there). Recipients are
 * picked here: verified + SMS consent + non-test + matched in the last 14 days.
 *
 * Usage:
 *   node scripts/broadcast-giveaway-reveal.js           # dry run, sends nothing
 *   DAISY_BROADCAST_CONFIRM=yes node scripts/broadcast-giveaway-reveal.js --send
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

var SITE = "https://www.daisyweekly.com";
var MATCHED_DAYS = 14;
var DELAY_MS = 300;

function body(user) {
  var name = (user.firstName ? String(user.firstName).trim() : "") || "there";
  return (
    "Hi " + name + ", the Daisy $200 date winners are announced at noon, in 10 min. " +
    "See if you won on your dashboard: " + SITE + "/dashboard"
  );
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

(async function main() {
  var key = process.env.ADMIN_API_KEY;
  if (!key) {
    console.error("Missing ADMIN_API_KEY");
    process.exit(1);
  }
  if (SEND && process.env.DAISY_BROADCAST_CONFIRM !== "yes") {
    console.error("Refusing to send: set DAISY_BROADCAST_CONFIRM=yes when using --send");
    process.exit(1);
  }

  var since = { createdAt: { gte: new Date(Date.now() - MATCHED_DAYS * 864e5) } };
  var prisma = new PrismaClient();
  var users = await prisma.user.findMany({
    where: {
      phoneVerified: true,
      phoneNumber: { not: null },
      smsConsent: true,
      isTestAccount: false,
      OR: [{ matchesAsA: { some: since } }, { matchesAsB: { some: since } }],
    },
    select: { id: true, firstName: true, phoneNumber: true },
    orderBy: { createdAt: "asc" },
  });
  await prisma.$disconnect();

  var sample = body(users[0] || {});
  console.log("Mode:", SEND ? "SEND" : "DRY RUN (no SMS)");
  console.log("Recipients (matched in last " + MATCHED_DAYS + " days):", users.length);
  console.log("\n" + sample + "\n");
  console.log(sample.length, "chars, ~" + Math.ceil(sample.length / 153) + " segments each");

  // Auth check that sends nothing: a valid key gets "userId required".
  var probe = await fetch(SITE + "/api/admin/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: "{}",
  });
  console.log("Admin endpoint check:", probe.status, probe.status === 400 ? "(key OK)" : "(PROBLEM)");
  if (probe.status !== 400) process.exit(1);

  if (!SEND) return;

  var ok = 0, fail = 0;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    try {
      var res = await fetch(SITE + "/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ userId: u.id, message: body(u) }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (res.ok) { ok++; console.log("OK", u.id, data.sid); }
      else { fail++; console.error("FAIL", u.id, res.status, data.error); }
    } catch (e) {
      fail++;
      console.error("FAIL", u.id, e.message || e);
    }
    if (i < users.length - 1) await sleep(DELAY_MS);
  }
  console.log("\nDone. Sent:", ok, "Failed:", fail);
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
