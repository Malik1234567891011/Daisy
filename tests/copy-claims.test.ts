import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

const FILES = walk(join(ROOT, "src"));

/**
 * Daisy does not verify enrollment or age. These are the phrasings that would
 * claim otherwise; the OTP flow legitimately verifies a phone number, so the
 * patterns are written to catch enrollment/identity claims only.
 */
const FORBIDDEN: [RegExp, string][] = [
  [/verified\s+student/i, 'claims students are "verified"'],
  [/students?\s+(are\s+)?verified/i, "claims student status is verified"],
  [/verified\s+through\s+their\s+school/i, "claims school-based verification"],
  [/verify\s+(your|their)\s+(status|enrollment)/i, "claims enrollment verification"],
  [/verifying\s+that\s+you.{0,5}re\s+a\s+student/i, "claims student verification"],
  [/verify\s+you.{0,5}re\s+a\s+student/i, "claims student verification"],
];

describe("public copy makes no verification claims Daisy cannot back", () => {
  test("no file claims to verify student status", () => {
    const hits: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(file, "utf8");
      for (const [pattern, why] of FORBIDDEN) {
        const m = text.match(pattern);
        if (m) hits.push(`${file.replace(ROOT, "")}: ${why} — "${m[0]}"`);
      }
    }
    assert.deepEqual(hits, [], `Verification claims found:\n${hits.join("\n")}`);
  });

  test("eligibility copy is framed as self-confirmation", () => {
    const constants = readFileSync(join(ROOT, "src/lib/constants.ts"), "utf8");
    const faq = constants.slice(constants.indexOf("Who can join Daisy?"));
    assert.match(faq, /confirm that you.{0,5}re currently enrolled/i);
    assert.match(faq, /18 or older/i);
  });

  test("Terms state plainly that Daisy does not verify age or enrollment", () => {
    const terms = readFileSync(join(ROOT, "src/app/terms/page.tsx"), "utf8");
    assert.match(terms, /do not independently verify/i);
    assert.match(terms, /does not ask for\s*\n?\s*identification/i);
    assert.match(terms, /18 or older/i);
  });

  test("Privacy does not claim student verification and discloses the processors", () => {
    const privacy = readFileSync(join(ROOT, "src/app/privacy/page.tsx"), "utf8");
    assert.match(privacy, /don.{0,3}t ask for documents/i);
    assert.match(privacy, /Stripe/);
    assert.match(privacy, /Twilio/);
  });
});
