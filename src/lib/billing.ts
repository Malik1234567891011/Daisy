/**
 * Daisy charges per reroll, not per month. One purchase buys one reroll of
 * one match.
 */

export const REROLL_PRICE_CENTS = 199;

/**
 * Stripe settles in whatever your account supports; Daisy is Montreal-only so
 * this is CAD. Change it here if your Stripe account settles in USD.
 */
export const REROLL_CURRENCY = "cad";

export const REROLL_PRODUCT_NAME = "Daisy reroll";

export const REROLL_PRODUCT_DESCRIPTION =
  "Swap this week's match for a new one, right now.";

/** "$1.99" — used on the button so the price never drifts from the charge. */
export function formatRerollPrice(): string {
  const dollars = REROLL_PRICE_CENTS / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
