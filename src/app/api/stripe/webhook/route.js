// api/stripe/webhook/route.js
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const supabase = createRouteHandlerClient({ cookies });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;

        // Update teacher subscription status
        await supabase
          .from("teachers")
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            subscription_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_customer_id", subscription.customer);
        break;

      case "customer.subscription.trial_will_end":
        // Send notification email about trial ending
        const trialEndSubscription = event.data.object;
        // Add your email notification logic here
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
