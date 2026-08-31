import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

/**
 * Optional. Set STRIPE_REROLL_PRICE_ID to bill against a real Price so
 * rerolls roll up under one product in Stripe reporting. Leave it unset and
 * checkout falls back to inline price_data, which needs no dashboard setup.
 */
export function getRerollPriceId(): string | null {
  return process.env.STRIPE_REROLL_PRICE_ID?.trim() || null;
}
