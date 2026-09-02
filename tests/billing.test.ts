import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  REROLL_PRICE_CENTS,
  REROLL_CURRENCY,
  formatRerollPrice,
} from "../src/lib/billing.ts";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("reroll pricing", () => {
  test("is $1.99 CAD", () => {
    assert.equal(REROLL_PRICE_CENTS, 199);
    assert.equal(REROLL_CURRENCY, "cad");
    assert.equal(formatRerollPrice(), "$1.99");
  });

  test("the displayed price is derived from the charged amount", () => {
    // Same constant feeds the Stripe line item and the button label, so the
    // two cannot drift apart.
    const checkout = read("src/app/api/reroll/checkout/route.ts");
    assert.match(checkout, /unit_amount:\s*REROLL_PRICE_CENTS/);
    assert.match(checkout, /currency:\s*REROLL_CURRENCY/);
    assert.match(read("src/app/dashboard/page.tsx"), /formatRerollPrice\(\)/);
  });

  test("the public FAQ states the price, the currency, and that it does not renew", () => {
    const constants = read("src/lib/constants.ts");
    const faq = constants.slice(constants.indexOf("Is Daisy free?"));
    assert.match(faq, /\$1\.99 CAD/);
    assert.match(faq, /no subscription/i);
    assert.match(faq, /does not renew/i);
  });
});

describe("no recurring billing exists", () => {
  test("checkout is a one-time payment, never a subscription", () => {
    const checkout = read("src/app/api/reroll/checkout/route.ts");
    assert.match(checkout, /mode:\s*"payment"/);
    assert.doesNotMatch(checkout, /mode:\s*"subscription"/);
    assert.doesNotMatch(checkout, /recurring/i);
  });

  test("no subscription plumbing anywhere in the app", () => {
    for (const f of [
      "src/app/api/reroll/checkout/route.ts",
      "src/app/api/stripe/webhook/route.ts",
      "src/lib/billing.ts",
      "src/lib/reroll-credits.ts",
    ]) {
      assert.doesNotMatch(read(f), /subscriptionTier|stripeSubscriptionId|auto.?renew/i, f);
    }
  });

  test("Terms disclose the price, the one-time nature, and a refund position", () => {
    const terms = read("src/app/terms/page.tsx");
    assert.match(terms, /\$1\.99 CAD/);
    assert.match(terms, /one-time purchase/i);
    assert.match(terms, /not a subscription/i);
    assert.match(terms, /does not renew/i);
    assert.match(terms, /refund/i);
    assert.match(terms, /core service is free/i);
  });
});
