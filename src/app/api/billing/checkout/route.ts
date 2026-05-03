import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const perUser = await checkRateLimit({
    keyPrefix: "billing-checkout-user",
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

  try {
    const stripe = getStripe();
    const priceId = getStripePriceId();
    const baseUrl = getAppBaseUrl();

    let customerId = user.stripeCustomerId;
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

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/dashboard?billing=cancelled`,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
