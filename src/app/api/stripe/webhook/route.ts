import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, getStripePriceId } from "@/lib/stripe";

export const runtime = "nodejs";

function isPlusStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;

  const periodEndUnix =
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  const periodEnd = typeof periodEndUnix === "number" ? new Date(periodEndUnix * 1000) : null;
  let plusPriceId: string | null = null;
  try {
    plusPriceId = getStripePriceId();
  } catch {
    plusPriceId = null;
  }
  const eligibleForPlus = isPlusStatus(subscription.status) && !!plusPriceId && priceId === plusPriceId;

  const update = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: periodEnd,
    stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
    subscriptionTier: eligibleForPlus ? "PLUS" : "FREE",
  } as const;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: update });
    return;
  }

  const userId = subscription.metadata?.userId;
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: update });
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("stripe webhook signature error", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        if (event.type === "customer.subscription.deleted") {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              subscriptionTier: "FREE",
              stripeCancelAtPeriodEnd: false,
              stripeCurrentPeriodEnd: null,
            },
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook processing error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
