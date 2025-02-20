// app/api/stripe/webhook/route.js
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
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Create subscription from the successful payment
        const subscription = await stripe.subscriptions.create({
          customer: paymentIntent.customer,
          items: [
            {
              price: PRICE_IDS[paymentIntent.metadata.interval],
            },
          ],
          metadata: paymentIntent.metadata,
        });

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

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object;
        await supabase
          .from("teachers")
          .update({
            subscription_status: updatedSubscription.status,
            subscription_period_end: updatedSubscription.current_period_end
              ? new Date(
                  updatedSubscription.current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("stripe_customer_id", updatedSubscription.customer);
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        await supabase
          .from("teachers")
          .update({
            subscription_status: "inactive",
            subscription_id: null,
            trial_ends_at: null,
            subscription_period_end: null,
          })
          .eq("stripe_customer_id", deletedSubscription.customer);
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
