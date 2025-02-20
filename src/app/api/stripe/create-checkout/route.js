// app/api/stripe/create-checkout/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(req) {
  try {
    // Get headers and origin
    const headersList = await headers();
    const origin = headersList.get("origin");

    // Get request data
    const { plan = "pro", interval = "monthly" } = await req.json();

    // Get price ID based on interval
    const priceId =
      interval === "yearly"
        ? process.env.STRIPE_YEARLY_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID;

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      metadata: {
        plan,
        interval,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      redirectUrl: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
