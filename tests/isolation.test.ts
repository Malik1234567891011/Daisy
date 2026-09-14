import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSamePopulation } from "../src/lib/matchRules.ts";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("synthetic accounts and real members never mix", () => {
  test("the partition is symmetric", () => {
    const real = { isTestAccount: false };
    const tester = { isTestAccount: true };

    assert.equal(isSamePopulation(real, tester), false, "a real user must not see a tester");
    assert.equal(isSamePopulation(tester, real), false, "a tester must not see a real user");
    assert.equal(isSamePopulation(real, real), true);
    assert.equal(isSamePopulation(tester, tester), true);
  });

  test("reroll compatibility rejects a cross-population pair outright", async () => {
    const { isMutuallyCompatible } = await import("../src/lib/matchRules.ts");
    const base = {
      age: 21, gender: "Woman", school: "McGill University", major: "Biology",
      ethnicity: null, intentions: "open", vibe: "balanced", interests: [],
      idealHangout: "coffee", genderPreference: "Everyone", schoolPreference: "any",
      ageRangeMin: 18, ageRangeMax: 30, majorPreference: null, ethnicityPreference: null,
    };
    // Identical people, compatible on every other axis.
    const real = { ...base, id: "real", isTestAccount: false };
    const tester = { ...base, id: "test", isTestAccount: true };

    assert.equal(isMutuallyCompatible(real, { ...real, id: "other" }), true);
    assert.equal(isMutuallyCompatible(real, tester), false);
    assert.equal(isMutuallyCompatible(tester, real), false);
  });

  test("the reroll candidate query is partitioned at the database, not just in memory", () => {
    const src = read("src/lib/matching.ts");
    assert.match(src, /isTestAccount:\s*seeker\.isTestAccount/);
  });
});

describe("synthetic accounts cannot reach the SMS paths", () => {
  test("broadcast recipients exclude test accounts", () => {
    const src = read("src/lib/wednesdayBroadcastSms.ts");
    assert.match(src, /isTestAccount:\s*false/);
  });

  test("a test account's match cannot satisfy the drop gate", () => {
    const src = read("src/lib/wednesdayBroadcastSms.ts");
    // Both sides of the pair must be real for the match to count as a drop.
    assert.match(src, /userA:\s*\{\s*isTestAccount:\s*false\s*\}/);
    assert.match(src, /userB:\s*\{\s*isTestAccount:\s*false\s*\}/);
  });

  test("recipients are drawn from the drop, not from the whole user base", () => {
    const src = read("src/lib/wednesdayBroadcastSms.ts");
    const fn = src.slice(src.indexOf("export async function getWednesdayBroadcastRecipients"));
    assert.match(fn, /matchesAsA/, "recipients must be tied to an actual match");
    assert.match(fn, /matchesAsB/);
    assert.match(fn, /PENDING/);
  });

  test("weekly generation and the ops broadcast scripts exclude test accounts", () => {
    assert.match(read("scripts/generate-matches-md.js"), /isTestAccount:\s*false/);
    assert.match(read("scripts/broadcast-daisy-wednesday.js"), /isTestAccount:\s*false/);
    assert.match(read("scripts/seed-week-matches-and-broadcast.js"), /if \(u\.isTestAccount\) continue;/);
  });
});
