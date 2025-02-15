// api/stripe/create-checkout/route.js
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const PRICE_IDS = {
  monthly: "price_1Qr6lWKtETWqXeSXinpd7u6Y",
  yearly: "price_1Qr6mNKtETWqXeSXphdBV97q",
};

export async function POST(req) {
  try {
    // Parse and validate request
    const { plan, interval = "monthly" } = await req.json();

    if (!plan || !["monthly", "yearly"].includes(interval)) {
      return Response.json(
        { error: "Invalid plan or interval" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    let { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("stripe_customer_id, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (teacherError && teacherError.code !== "PGRST116") {
      console.error("Teacher fetch error:", teacherError);
      return Response.json(
        { error: "Failed to fetch teacher profile" },
        { status: 500 }
      );
    }

    // Check if already subscribed
    if (teacher?.subscription_status === "active") {
      return Response.json(
        {
          error: "Already subscribed",
          redirect: "/dashboard/settings?tab=billing",
        },
        { status: 400 }
      );
    }

    // Create or get customer ID
    let customerId = teacher?.stripe_customer_id;

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
            plan: plan,
            interval: interval,
          },
        });
        customerId = customer.id;

        // Update teacher with Stripe customer ID
        const { error: updateError } = await supabase
          .from("teachers")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Failed to update teacher:", updateError);
          throw new Error("Failed to update teacher profile");
        }
      } catch (stripeError) {
        console.error("Stripe customer creation error:", stripeError);
        return Response.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PRICE_IDS[interval],
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            user_id: user.id,
            plan: plan,
            interval: interval,
          },
        },
        metadata: {
          user_id: user.id,
          plan: plan,
          interval: interval,
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
        success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      });

      // Log successful session creation
      console.log("Checkout session created:", {
        sessionId: session.id,
        customerId,
        plan,
        interval,
      });

      return Response.json({
        sessionId: session.id,
        customerId: customerId,
      });
    } catch (stripeError) {
      console.error("Stripe session creation error:", stripeError);
      return Response.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Checkout process error:", error);
    return Response.json(
      {
        error: "Checkout process failed",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
console.log("Creating checkout session with params:", {
  customerId,
  plan,
  interval,
  priceId: PRICE_IDS[interval],
  successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
});
