#!/usr/bin/env node
/**
 * Delete all matches between two users (by email) and create one new PENDING match.
 *
 * Usage:
 *   node scripts/reset-match-between.js userA@school.ca userB@school.ca
 * Optional 3rd arg: ISO dropDate (default: now, so the match is live immediately)
 */

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

const emailA = process.argv[2];
const emailB = process.argv[3];
const dropArg = process.argv[4];

if (!emailA || !emailB) {
  console.error("Usage: node scripts/reset-match-between.js <emailA> <emailB> [dropDate ISO]");
  process.exit(1);
}

(async function main() {
  const prisma = new PrismaClient();
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { email: emailA }, select: { id: true, firstName: true, email: true } }),
    prisma.user.findUnique({ where: { email: emailB }, select: { id: true, firstName: true, email: true } }),
  ]);
  if (!a || !b) {
    console.error(!a ? `No user: ${emailA}` : `No user: ${emailB}`);
    process.exit(1);
  }

  const deleted = await prisma.match.deleteMany({
    where: {
      OR: [
        { userAId: a.id, userBId: b.id },
        { userAId: b.id, userBId: a.id },
      ],
    },
  });
  console.log(`Removed ${deleted.count} match(es) between ${a.firstName} (${a.email}) and ${b.firstName} (${b.email}).`);

  const dropDate = dropArg ? new Date(dropArg) : new Date();

  const match = await prisma.match.create({
    data: {
      userAId: a.id,
      userBId: b.id,
      dropDate,
    },
  });

  console.log(`Created match ${match.id}`);
  console.log(`  dropDate: ${match.dropDate.toISOString()}`);
  console.log(`  status: ${match.status} (fresh — both decisions PENDING)`);
  await prisma.$disconnect();
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
