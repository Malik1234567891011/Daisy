import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { partnerPayload, type PartnerRecord } from "../src/lib/matchPayload.ts";

const partner: PartnerRecord = {
  firstName: "Sam", age: 21, school: "McGill University", photoUrl: null,
  intentions: "serious", vibe: "balanced", interests: ["Music"], idealHangout: "coffee",
  contactMethod: "instagram", contactValue: "@sam",
};

describe("contact details are gated on mutual interest", () => {
  test("hidden before both sides say yes", () => {
    const out = partnerPayload(partner, false);
    assert.equal("contactValue" in out, false, "contactValue must be absent, not null");
    assert.equal("contactMethod" in out, false);
    assert.equal(JSON.stringify(out).includes("@sam"), false, "handle must not appear anywhere");
  });

  test("revealed once mutual", () => {
    const out = partnerPayload(partner, true);
    assert.equal(out.contactValue, "@sam");
    assert.equal(out.contactMethod, "instagram");
  });

  test("non-contact profile fields are shown either way", () => {
    for (const mutual of [true, false]) {
      const out = partnerPayload(partner, mutual);
      assert.equal(out.firstName, "Sam");
      assert.equal(out.school, "McGill University");
    }
  });
});
