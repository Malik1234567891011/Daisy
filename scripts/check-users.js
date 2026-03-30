#!/usr/bin/env node

const { resolve } = require("path");
const { readFileSync, existsSync } = require("fs");

for (const f of [".env", ".env.local"]) {
  const p = resolve(__dirname, "..", f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

(async () => {
  try {
    const users = await p.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        school: true,
        age: true,
        gender: true,
        genderPreference: true,
        phoneNumber: true,
        phoneVerified: true,
        photoUrl: true,
        onboardingComplete: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (users.length === 0) {
      console.log("\n  No users yet.\n");
    } else {
      console.log(`\n  ── ${users.length} user(s) ──\n`);
      users.forEach((u, i) => {
        const phone = u.phoneVerified ? `✓ ${u.phoneNumber}` : "not verified";
        const photo = u.photoUrl ? "✓" : "—";
        const ref = u.referredBy ? `(ref: ${u.referredBy})` : "";
        const date = new Date(u.createdAt).toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        console.log(
          `  ${i + 1}. ${u.firstName} — ${u.email}` +
            `\n     ${u.school || "—"} · ${u.age || "—"}yo · ${u.gender || "—"} → ${u.genderPreference || "—"}` +
            `\n     phone: ${phone} · photo: ${photo} · onboarded: ${u.onboardingComplete}` +
            `\n     code: ${u.referralCode || "—"} ${ref}` +
            `\n     joined: ${date}\n`
        );
      });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await p.$disconnect();
  }
})();
