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

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PLUS_PRICE_ID;
  if (!priceId) {
    throw new Error("Missing STRIPE_PLUS_PRICE_ID");
  }
  return priceId;
}
