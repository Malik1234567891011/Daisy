export const DAISY_PLUS_PRICE_PER_MONTH_CENTS = 899;
export const DAISY_PLUS_INTERVAL = "month";

export function isPlusActive(params: {
  subscriptionTier: "FREE" | "PLUS";
  stripeCurrentPeriodEnd: Date | null;
}): boolean {
  if (params.subscriptionTier !== "PLUS") return false;
  if (!params.stripeCurrentPeriodEnd) return true;
  return params.stripeCurrentPeriodEnd.getTime() > Date.now();
}
