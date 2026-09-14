/**
 * One-shot migration: copy profile photos from Vercel Blob into the Supabase
 * `profile-photos` bucket, preserving the object key so the delete guard in
 * src/lib/photoStorage.ts keeps working.
 *
 * Reads:  a JSON array of { id, photoUrl } on stdin or at --in <path>
 * Writes: a JSON array of { id, oldUrl, newUrl } to --out <path>
 *
 * It does NOT touch Postgres. Applying the new URLs is a separate, reviewable
 * step so a half-finished copy can never leave rows pointing at nothing.
 *
 *   node --env-file=.env scripts/migrate-photos-to-supabase.mjs \
 *     --in /tmp/photos.json --out /tmp/photos-migrated.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "profile-photos";
const CONCURRENCY = 8;
const ATTEMPTS = 3;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

const inPath = arg("--in");
const outPath = arg("--out");
const fromDb = process.argv.includes("--from-db");
const dryRun = process.argv.includes("--dry-run");
if ((!inPath && !fromDb) || !outPath) {
  console.error("usage: (--in <input.json> | --from-db) --out <output.json> [--dry-run]");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

let rows;
if (fromDb) {
  const { data, error } = await supabase
    .from("User")
    .select("id, photoUrl")
    .like("photoUrl", "%blob.vercel-storage.com%");
  if (error) {
    console.error(`Could not read User rows: ${error.message}`);
    process.exit(1);
  }
  rows = data;
} else {
  rows = JSON.parse(readFileSync(inPath, "utf8"));
}
console.log(`${rows.length} photos to migrate${dryRun ? " (dry run)" : ""}`);

const CONTENT_TYPE = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function migrateOne(row) {
  // Vercel Blob URLs are public: downloading needs no token.
  const res = await fetch(row.photoUrl);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());

  const key = new URL(row.photoUrl).pathname.replace(/^\//, "");
  const ext = key.split(".").pop().toLowerCase();
  const contentType =
    CONTENT_TYPE[ext] ?? res.headers.get("content-type") ?? "image/jpeg";

  if (dryRun) return { ...row, newUrl: null, bytes: body.length, key };

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${error.message}`);

  const newUrl = supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  return { id: row.id, oldUrl: row.photoUrl, newUrl, bytes: body.length };
}

const done = [];
const failed = [];
let cursor = 0;

async function worker() {
  while (cursor < rows.length) {
    const row = rows[cursor++];
    let lastError;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        done.push(await migrateOne(row));
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
    if (lastError) {
      failed.push({ id: row.id, oldUrl: row.photoUrl, error: String(lastError) });
      console.error(`FAIL ${row.id}: ${lastError.message}`);
    }
    const n = done.length + failed.length;
    if (n % 25 === 0) console.log(`  ${n}/${rows.length}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

writeFileSync(outPath, JSON.stringify(done, null, 2));
const mb = done.reduce((a, d) => a + (d.bytes ?? 0), 0) / 1024 / 1024;
console.log(`\nmigrated: ${done.length}  failed: ${failed.length}  (${mb.toFixed(1)} MB)`);
if (failed.length) {
  writeFileSync(outPath.replace(/\.json$/, "-failed.json"), JSON.stringify(failed, null, 2));
  console.log(`failures written to ${outPath.replace(/\.json$/, "-failed.json")}`);
}
console.log(`mapping written to ${outPath}`);
