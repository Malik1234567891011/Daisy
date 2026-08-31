import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";

export type GrantResult = "granted" | "duplicate" | "ignored";

/**
 * Turn a paid Checkout Session into one reroll credit.
 *
 * Called from two places — the Stripe webhook, and the dashboard's return
 * from checkout when the webhook hasn't landed yet — so it has to be safe to
 * run twice on the same session. RerollPurchase.stripeSessionId is unique,
 * which makes the insert the lock: whoever writes it first grants the credit,
 * everyone after gets "duplicate".
 */
export async function grantRerollCredit(session: Stripe.Checkout.Session): Promise<GrantResult> {
  if (session.mode !== "payment") return "ignored";
  if (session.metadata?.kind !== "reroll") return "ignored";
  if (session.payment_status !== "paid") return "ignored";

  const userId = session.metadata.userId;
  if (!userId) return "ignored";

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  try {
    await prisma.$transaction([
      prisma.rerollPurchase.create({
        data: {
          userId,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          amountCents: session.amount_total ?? 0,
          currency: session.currency ?? "cad",
          fromMatchId: session.metadata.matchId ?? null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { rerollCredits: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "duplicate";
    }
    throw error;
  }

  return "granted";
}
