/**
 * Read-only check of whichever database a connection string points at.
 *
 * Written after a deploy took login down site-wide: the schema had been
 * applied to the database in .env, but Vercel was connected to a different
 * one, so the deployed Prisma client asked for three columns that database
 * did not have. Every sign-in threw.
 *
 * Deliberately uses raw SQL against information_schema rather than the Prisma
 * model. A model query would itself throw when the client and database
 * disagree — which is precisely the case this exists to detect.
 *
 * Usage:
 *   DATABASE_URL='postgresql://...' node scripts/preflight-db.js
 *
 * Writes nothing. Prints no secrets — the host is shown, credentials are not.
 */
const { PrismaClient } = require("@prisma/client");

const REQUIRED_COLUMNS = ["isTestAccount", "studentAttestedAt", "age18AttestedAt"];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL to the database you want to inspect.");
  console.error("For the production check, use the value from the Vercel project's env vars.");
  process.exit(1);
}

let host = "<unparseable>";
try {
  host = new URL(url).host;
} catch {}

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const out = { host, reachable: false };

  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
  `;
  out.reachable = true;
  const present = new Set(cols.map((c) => c.column_name));

  out.userColumns = present.size;
  out.requiredColumns = Object.fromEntries(
    REQUIRED_COLUMNS.map((c) => [c, present.has(c)]),
  );
  out.schemaReady = REQUIRED_COLUMNS.every((c) => present.has(c));

  // Fingerprint so two databases can be told apart without dumping any data.
  const [{ count: users }] = await prisma.$queryRaw`SELECT count(*)::int AS count FROM "User"`;
  const [{ count: matches }] = await prisma.$queryRaw`SELECT count(*)::int AS count FROM "Match"`;
  const [{ newest }] = await prisma.$queryRaw`SELECT max("createdAt") AS newest FROM "User"`;
  out.fingerprint = { users, matches, newestUser: newest };

  // The id matters more than the email. The same address exists in more than
  // one database, so only the id says which database you are looking at.
  const testers = await prisma.$queryRaw`
    SELECT id, email FROM "User"
    WHERE email IN ('facebooktester@daisyweekly.com','facebooktester2@daisyweekly.com')
  `;
  out.reviewerAccounts = testers.map((t) => `${t.email} (id ${t.id})`);

  const KNOWN = {
    cmtkco7b30000eznaz9xwrg6u: "Neon ep-misty-paper (the DB in .env — NOT production)",
    cmtm62ydq0000jl04xojshjsr: "PRODUCTION (row created accidentally via the live signup endpoint)",
  };
  const marker = testers.map((t) => KNOWN[t.id]).filter(Boolean);
  out.identifiedAs = marker.length ? marker : ["unknown — no known marker row here"];

  console.log(JSON.stringify(out, null, 2));
  console.log(
    out.schemaReady
      ? "\nSCHEMA READY — the three columns exist here."
      : "\nSCHEMA NOT APPLIED — this database is missing columns the code needs.",
  );
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ host, reachable: false, error: String(e.message || e).split("\n")[0] }, null, 2));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
