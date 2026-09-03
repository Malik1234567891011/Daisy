import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.tsx?$/.test(e)) acc.push(full);
  }
  return acc;
}

/**
 * Regression guard for a real outage.
 *
 * A bare prisma.user.find* asks Postgres for every column in the model. When
 * the model gained three columns the production database had not been migrated
 * to, every sign-in threw — including for addresses that don't exist, because
 * the query fails before the null check. Auth.js surfaced it as an opaque
 * "Configuration" error and login was down site-wide.
 *
 * Any query on User must name the columns it needs.
 */
describe("User queries name their columns", () => {
  test("no select-all query on User anywhere in src/", () => {
    const offenders: string[] = [];
    const pattern = /prisma\.user\.(findUnique|findFirst|findMany)\(\s*\{(.{0,400}?)\}\s*\)/gs;

    for (const file of walk(join(ROOT, "src"))) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(pattern)) {
        const block = m[2];
        if (!block.includes("select:") && !block.includes("include:")) {
          const line = text.slice(0, m.index).split("\n").length;
          offenders.push(`${file.replace(ROOT, "")}:${line} (${m[1]})`);
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `These select every User column and will break on any un-migrated schema change:\n${offenders.join("\n")}`,
    );
  });

  test("the sign-in path reads only what authorize() needs", () => {
    const auth = readFileSync(join(ROOT, "src/lib/auth.ts"), "utf8");
    assert.match(auth, /const AUTH_SELECT = \{/);
    for (const field of ["id", "email", "passwordHash", "firstName", "phoneVerified"]) {
      assert.match(auth, new RegExp(`${field}:\\s*true`), `AUTH_SELECT must include ${field}`);
    }
    // Nothing added later should quietly widen it back to the whole row.
    assert.doesNotMatch(auth, /findUnique\(\{\s*where:\s*\{[^}]*\}\s*\}\)/);
  });
});
