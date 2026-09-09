import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { RAFFLE, qualifies, standing, isOpen } from "../src/lib/raffle.ts";

const full = { phoneVerified: true, onboardingComplete: true, photoUrl: "/p.jpg" };

describe("who counts", () => {
  test("needs a verified number, a photo, and finished onboarding", () => {
    assert.equal(qualifies(full), true);
    assert.equal(qualifies({ ...full, photoUrl: null }), false);
    assert.equal(qualifies({ ...full, phoneVerified: false }), false);
    assert.equal(qualifies({ ...full, onboardingComplete: false }), false);
    assert.equal(qualifies({}), false);
  });
});

describe("entries", () => {
  test("a completed signup is one entry", () => {
    assert.equal(standing(true, 0).entries, 1);
  });

  test("every fifth qualifying referral adds one", () => {
    assert.equal(standing(true, 4).entries, 1);
    assert.equal(standing(true, 5).entries, 2);
    assert.equal(standing(true, 9).entries, 2);
    assert.equal(standing(true, 10).entries, 3);
    assert.equal(standing(true, 47).entries, 1 + 9);
  });

  test("counts down to the next entry", () => {
    assert.equal(standing(true, 0).toNextEntry, 5);
    assert.equal(standing(true, 3).toNextEntry, 2);
    assert.equal(standing(true, 4).toNextEntry, 1);
    assert.equal(standing(true, 5).toNextEntry, 5);
  });

  test("an unfinished profile has no entries, however many it referred", () => {
    const s = standing(false, 12);
    assert.equal(s.entries, 0);
    assert.equal(s.toNextEntry, null);
  });

  test("shrugs off nonsense referral counts", () => {
    assert.equal(standing(true, -3).entries, 1);
    assert.equal(standing(true, 2.7).entries, 1);
    assert.equal(standing(true, NaN).entries, 1);
  });
});

describe("window", () => {
  test("open before the close date, shut after", () => {
    const close = new Date(RAFFLE.closesAt).getTime();
    assert.equal(isOpen(new Date(close - 60_000)), true);
    assert.equal(isOpen(new Date(close + 60_000)), false);
  });

  test("the human label and the real date agree on the month", () => {
    const month = new Date(RAFFLE.closesAt).toLocaleDateString("en-US", { month: "long", timeZone: "America/Toronto" });
    const prev = new Date(new Date(RAFFLE.closesAt).getTime() - 86_400_000)
      .toLocaleDateString("en-US", { month: "long", timeZone: "America/Toronto" });
    assert.ok(
      RAFFLE.closesLabel.includes(month) || RAFFLE.closesLabel.includes(prev),
      `closesLabel "${RAFFLE.closesLabel}" does not match closesAt ${RAFFLE.closesAt}`,
    );
  });
});
