#!/usr/bin/env node

/**
 * Screens every stored profile photo through the same Gemini check the upload
 * gate uses, and reports the ones with no face in frame. Photos uploaded
 * before the gate existed were never checked, so this is how they get looked
 * at — and how a rescan happens if the prompt or the model changes.
 *
 *   node scripts/scan-photo-faces.mjs                     # scan, report, change nothing
 *   node scripts/scan-photo-faces.mjs --write             # also record each verdict on the user
 *   node scripts/scan-photo-faces.mjs --write --unchecked # only users without a verdict yet
 *   node scripts/scan-photo-faces.mjs --limit 20 --concurrency 4 --out /tmp/scan.json
 *
 * A photo the model could not be asked about (timeout, outage) is left
 * unchecked rather than recorded as a pass, so a rerun picks it up again.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const f of [".env", ".env.local"]) {
  const p = resolve(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = await import("@prisma/client");
const { inspectPhoto } = await import("../src/lib/photoCheck.ts");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const WRITE = flag("write");
const UNCHECKED_ONLY = flag("unchecked");
const LIMIT = Number(value("limit", 0)) || undefined;
const CONCURRENCY = Number(value("concurrency", 8)) || 8;
const OUT = resolve(root, value("out", "photo-face-scan.json"));

const EXT_TYPES = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};

/** Supabase serves the type it was uploaded with; fall back to the extension. */
function mediaTypeOf(url, header) {
  if (header && header.startsWith("image/")) return header.split(";")[0].trim();
  const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TYPES[ext] ?? "image/jpeg";
}

const prisma = new PrismaClient();

async function scanOne(user) {
  const res = await fetch(user.photoUrl);
  if (!res.ok) {
    return { ...user, status: "unreachable", detail: `HTTP ${res.status}` };
  }
  const image = Buffer.from(await res.arrayBuffer());
  const inspection = await inspectPhoto(
    image,
    mediaTypeOf(user.photoUrl, res.headers.get("content-type")),
  );

  if (!inspection) return { ...user, status: "error", detail: "check failed" };

  if (WRITE) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        photoFacePresent: inspection.facePresent,
        photoExplicit: inspection.explicit,
        photoCheckReason: inspection.reason,
        photoCheckedAt: new Date(),
      },
    });
  }

  return {
    ...user,
    status: inspection.explicit
      ? "explicit"
      : inspection.facePresent
        ? "face"
        : "no_face",
    detail: inspection.reason,
  };
}

async function run() {
  const users = await prisma.user.findMany({
    where: {
      NOT: { photoUrl: null },
      ...(UNCHECKED_ONLY ? { photoCheckedAt: null } : {}),
    },
    select: { id: true, email: true, firstName: true, school: true, photoUrl: true },
    orderBy: { createdAt: "desc" },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(
    `Scanning ${users.length} photo${users.length === 1 ? "" : "s"} ` +
      `with ${CONCURRENCY} in flight${WRITE ? " (writing verdicts)" : " (read only)"}\n`,
  );

  const results = [];
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < users.length) {
      const user = users[next++];
      let result;
      try {
        result = await scanOne(user);
      } catch (err) {
        result = { ...user, status: "error", detail: String(err?.message ?? err) };
      }
      results.push(result);
      done++;

      if (result.status !== "face") {
        console.log(
          `  ${result.status.padEnd(11)} ${result.firstName ?? "?"} <${result.email}> — ${result.detail}`,
        );
      }
      if (done % 25 === 0) console.log(`  … ${done}/${users.length}`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, users.length) }, worker),
  );

  const by = (status) => results.filter((r) => r.status === status);
  const noFace = by("no_face");

  writeFileSync(OUT, JSON.stringify({ scannedAt: new Date().toISOString(), results }, null, 2));

  console.log(`\nScanned ${results.length}`);
  console.log(`  face present : ${by("face").length}`);
  console.log(`  no face      : ${noFace.length}`);
  console.log(`  explicit     : ${by("explicit").length}`);
  console.log(`  unreachable  : ${by("unreachable").length}`);
  console.log(`  check failed : ${by("error").length}`);
  console.log(`\nReport: ${OUT}`);

  if (noFace.length) {
    console.log("\nNo face in frame:");
    for (const u of noFace) {
      console.log(`  ${(u.firstName ?? "?").padEnd(14)} ${u.email.padEnd(34)} ${u.detail}`);
      console.log(`  ${" ".repeat(14)} ${u.photoUrl}`);
    }
  }
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
