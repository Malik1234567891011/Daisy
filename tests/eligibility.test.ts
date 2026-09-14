import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  checkEligibility,
  parseAge,
  isAdultAge,
  MIN_AGE,
  ATTESTATION_COPY,
} from "../src/lib/eligibility.ts";

const ok = { age: "21", studentAttested: true, age18Attested: true };

describe("18+ enforcement", () => {
  test("accepts an adult who attested to both requirements", () => {
    const r = checkEligibility(ok);
    assert.equal(r.ok, true);
    assert.equal(r.ok && r.age, 21);
  });

  test("rejects anyone under 18, whatever they attested", () => {
    for (const age of ["17", "1", "0", 17, 13]) {
      const r = checkEligibility({ ...ok, age });
      assert.equal(r.ok, false, `age ${age} should be rejected`);
      assert.match(r.ok === false ? r.error : "", /at least 18/);
    }
  });

  test("exactly 18 is allowed", () => {
    assert.equal(checkEligibility({ ...ok, age: String(MIN_AGE) }).ok, true);
    assert.equal(isAdultAge(MIN_AGE), true);
    assert.equal(isAdultAge(MIN_AGE - 1), false);
  });

  test("a missing or unparseable age is rejected, never defaulted", () => {
    for (const age of [null, undefined, "", "  ", "twenty", "18.5", "1e3", {}, [], NaN, "-19"]) {
      assert.equal(checkEligibility({ ...ok, age }).ok, false, `age ${JSON.stringify(age)} should be rejected`);
    }
    assert.equal(parseAge("18.5"), null);
    assert.equal(parseAge("abc"), null);
    assert.equal(parseAge(null), null);
  });
});

describe("student and 18+ self-attestation", () => {
  test("both attestations are required", () => {
    assert.equal(checkEligibility({ ...ok, studentAttested: false }).ok, false);
    assert.equal(checkEligibility({ ...ok, age18Attested: false }).ok, false);
    assert.equal(checkEligibility({ age: "21", studentAttested: false, age18Attested: false }).ok, false);
  });

  test("only a literal true counts — truthy stand-ins do not", () => {
    for (const v of ["true", "on", 1, "yes", {}, [], undefined, null]) {
      assert.equal(checkEligibility({ ...ok, studentAttested: v }).ok, false, `studentAttested=${JSON.stringify(v)}`);
      assert.equal(checkEligibility({ ...ok, age18Attested: v }).ok, false, `age18Attested=${JSON.stringify(v)}`);
    }
  });

  test("attestation copy claims confirmation, never verification", () => {
    for (const line of Object.values(ATTESTATION_COPY)) {
      assert.match(line, /^I confirm/);
      assert.doesNotMatch(line, /verif/i);
    }
    assert.match(ATTESTATION_COPY.student, /university, college or CEGEP/);
    assert.match(ATTESTATION_COPY.age18, /18 years of age or older/);
  });
});
