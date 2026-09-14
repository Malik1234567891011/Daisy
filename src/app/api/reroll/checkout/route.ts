import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getStripe, getRerollPriceId } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { findRerollCandidate, getRerollTarget } from "@/lib/matching";
import {
  REROLL_CURRENCY,
  REROLL_PRICE_CENTS,
  REROLL_PRODUCT_DESCRIPTION,
  REROLL_PRODUCT_NAME,
} from "@/lib/billing";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      rerollCredits: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const perUser = await checkRateLimit({
    keyPrefix: "reroll-checkout-user",
    identifier: user.id,
    limit: 5,
    window: "10 m",
  });
  if (perUser.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // Only a match that closed this week can be rerolled. A live one has to
  // be answered first, and a MUTUAL one worked.
  const target = await getRerollTarget(user.id);
  if (!target.ok) {
    return NextResponse.json(
      {
        error:
          target.reason === "mutual"
            ? "You already matched with this person — nothing to reroll."
            : target.reason === "pending"
              ? "Answer your current match first. Rerolls open up once a match closes."
              : "You don't have a match to reroll right now.",
      },
      { status: 400 },
    );
  }

  // Already paid and never spent it — don't charge twice.
  if (user.rerollCredits > 0) {
    return NextResponse.json({ alreadyPaid: true, matchId: target.matchId });
  }

  // Check the pool before taking money. Racy by nature (someone could get
  // matched while this user is on the Stripe page), which is why a paid
  // reroll becomes a credit rather than an instant swap — an unspendable
  // credit survives until the pool refills.
  const candidateId = await findRerollCandidate(user.id);
  if (!candidateId) {
    return NextResponse.json(
      {
        error:
          "No one new is available to match with right now. Try again after the next drop.",
      },
      { status: 409 },
    );
  }

  try {
    const stripe = getStripe();
    const requestOrigin = new URL(req.url).origin;
    const baseUrl = requestOrigin || getAppBaseUrl();

    let customerId = user.stripeCustomerId;
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = getRerollPriceId();
    const metadata = { kind: "reroll", userId: user.id, matchId: target.matchId };

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: REROLL_CURRENCY,
                unit_amount: REROLL_PRICE_CENTS,
                product_data: {
                  name: REROLL_PRODUCT_NAME,
                  description: REROLL_PRODUCT_DESCRIPTION,
                },
              },
            },
      ],
      success_url: `${baseUrl}/dashboard?reroll=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?reroll=cancelled`,
      metadata,
      payment_intent_data: { metadata },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("reroll checkout error", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
