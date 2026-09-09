import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, formatPhoneDisplay } from "../src/lib/phone.ts";

describe("normalizePhone", () => {
  test("a bare ten-digit Montreal number gets +1", () => {
    // The regression: this used to become +5142660119, which Twilio rejects
    // with error 21614 while the API still reported the code as sent.
    assert.equal(normalizePhone("5142660119"), "+15142660119");
    assert.equal(normalizePhone("514-266-0119"), "+15142660119");
    assert.equal(normalizePhone("(514) 266-0119"), "+15142660119");
    assert.equal(normalizePhone("514 266 0119"), "+15142660119");
  });

  test("never produces the broken +514 form", () => {
    for (const input of ["5142660119", "514-266-0119", "(514) 266-0119", " 5142660119 "]) {
      assert.notEqual(normalizePhone(input), "+5142660119", `regressed on ${input}`);
    }
  });

  test("accepts the number with a country code, typed either way", () => {
    assert.equal(normalizePhone("15142660119"), "+15142660119");
    assert.equal(normalizePhone("+15142660119"), "+15142660119");
    assert.equal(normalizePhone("+1 (514) 266-0119"), "+15142660119");
  });

  test("keeps a genuine international number", () => {
    assert.equal(normalizePhone("+442071838750"), "+442071838750");
    assert.equal(normalizePhone("+33612345678"), "+33612345678");
  });

  test("rejects what cannot be dialled", () => {
    for (const bad of ["", "   ", null, undefined, "abc", "123", "51426601", "+", "+0123456789"]) {
      assert.equal(normalizePhone(bad as string), null, `should reject ${JSON.stringify(bad)}`);
    }
  });
});

describe("formatPhoneDisplay", () => {
  test("a ten-digit entry reads back as +1, not +5", () => {
    assert.equal(formatPhoneDisplay("5142660119"), "+1 (514) 266-0119");
    assert.notEqual(formatPhoneDisplay("5142660119"), "+5 (142) 660-1119");
  });

  test("formats progressively while typing", () => {
    assert.equal(formatPhoneDisplay("514"), "+1 (514");
    assert.equal(formatPhoneDisplay("514266"), "+1 (514) 266");
    assert.equal(formatPhoneDisplay("5142660119"), "+1 (514) 266-0119");
  });

  test("what it displays still normalizes to the same number", () => {
    const shown = formatPhoneDisplay("5142660119");
    assert.equal(normalizePhone(shown), "+15142660119");
  });

  test("leaves international numbers alone", () => {
    assert.equal(formatPhoneDisplay("+442071838750"), "+442071838750");
  });
});
