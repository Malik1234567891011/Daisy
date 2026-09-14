#!/usr/bin/env node

const { resolve } = require("path");
const { readFileSync, existsSync } = require("fs");

// Load .env and .env.local so SUPABASE_SERVICE_ROLE_KEY is available
for (const f of [".env", ".env.local"]) {
  const p = resolve(__dirname, "..", f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const p = new PrismaClient();

(async () => {
  try {
    // 1. Delete all matches
    const { count: matchCount } = await p.match.deleteMany();
    console.log(`  Deleted ${matchCount} match(es)`);

    // 2. Delete all users
    const { count: userCount } = await p.user.deleteMany();
    console.log(`  Deleted ${userCount} user(s)`);

    // 3. Delete every object under photos/ in the profile-photos bucket
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    const bucket = supabase.storage.from("profile-photos");

    let photoCount = 0;
    for (let offset = 0; ; ) {
      const { data, error } = await bucket.list("photos", { limit: 100, offset });
      if (error) throw new Error(error.message);
      if (!data.length) break;

      const { error: removeError } = await bucket.remove(
        data.map((o) => `photos/${o.name}`),
      );
      if (removeError) throw new Error(removeError.message);
      photoCount += data.length;
      // Removed objects leave the listing, so the offset stays at 0.
    }

    console.log(`  Deleted ${photoCount} photo(s) from Supabase Storage`);
    console.log("\n  ✓ Database and Storage wiped.\n");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await p.$disconnect();
  }
})();
