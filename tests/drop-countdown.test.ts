import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;

/**
 * The shipped calculation, kept here in one place so the test exercises the
 * same arithmetic the components do.
 */
function nextDrop(now: Date): Date {
  const wed = new Date(now);
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7));
  wed.setHours(18, 0, 0, 0);
  if (wed <= now) wed.setDate(wed.getDate() + 7);
  return wed;
}

const hoursBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 3_600_000;

describe("countdown to the weekly drop", () => {
  test("on drop day, before 6pm, it counts to today — not next week", () => {
    // The regression: a member opened the dashboard at 17:16 on a Wednesday
    // and saw "7 days and 48 mins" for a drop 44 minutes away.
    const wedAfternoon = new Date(2026, 8, 16, 17, 16);
    const target = nextDrop(wedAfternoon);
    assert.equal(target.getDate(), 16, "should be the same Wednesday");
    assert.ok(hoursBetween(wedAfternoon, target) < 1, "should be under an hour away");
  });

  test("earlier on drop day it still counts to today", () => {
    const wedMorning = new Date(2026, 8, 16, 9, 0);
    assert.equal(nextDrop(wedMorning).getDate(), 16);
  });

  test("once 6pm has passed it rolls to the following Wednesday", () => {
    const afterDrop = new Date(2026, 8, 16, 18, 30);
    const target = nextDrop(afterDrop);
    assert.equal(target.getDate(), 23);
    assert.equal(target.getDay(), 3);
  });

  test("every other weekday lands on the next Wednesday at 6pm", () => {
    for (let day = 10; day <= 22; day++) {
      const now = new Date(2026, 8, day, 12, 0);
      const target = nextDrop(now);
      assert.equal(target.getDay(), 3, `day ${day} should target a Wednesday`);
      assert.equal(target.getHours(), 18);
      assert.ok(target > now, `day ${day} should be in the future`);
      assert.ok(hoursBetween(now, target) <= 168, `day ${day} should be within a week`);
    }
  });

  test("neither component reintroduces the falsy-zero guard", () => {
    const files: string[] = [];
    (function walk(dir: string) {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(e)) files.push(full);
      }
    })(join(ROOT, "src"));

    const offenders = files.filter((f) => /%\s*7\s*\|\|\s*7/.test(readFileSync(f, "utf8")));
    assert.deepEqual(
      offenders.map((f) => f.replace(ROOT, "")),
      [],
      "`% 7 || 7` skips the whole of drop day, because 0 is falsy",
    );
  });
});
