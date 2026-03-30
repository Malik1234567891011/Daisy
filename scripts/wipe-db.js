#!/usr/bin/env node

const { resolve } = require("path");
const { readFileSync, existsSync } = require("fs");

// Load .env and .env.local so BLOB_READ_WRITE_TOKEN is available
for (const f of [".env", ".env.local"]) {
  const p = resolve(__dirname, "..", f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = require("@prisma/client");
const { list, del } = require("@vercel/blob");

const p = new PrismaClient();

(async () => {
  try {
    // 1. Delete all matches
    const { count: matchCount } = await p.match.deleteMany();
    console.log(`  Deleted ${matchCount} match(es)`);

    // 2. Delete all users
    const { count: userCount } = await p.user.deleteMany();
    console.log(`  Deleted ${userCount} user(s)`);

    // 3. Delete all blobs in the photos/ prefix
    let blobCount = 0;
    let cursor;
    do {
      const result = await list({ prefix: "photos/", cursor, limit: 100 });
      for (const blob of result.blobs) {
        await del(blob.url);
        blobCount++;
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);

    console.log(`  Deleted ${blobCount} photo(s) from Blob storage`);
    console.log("\n  ✓ Database and Blob storage wiped.\n");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await p.$disconnect();
  }
})();
