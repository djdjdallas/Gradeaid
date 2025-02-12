"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PricingSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubscribe = async (plan) => {
    try {
      setIsLoading(true);

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval: billingInterval,
        }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="pricing"
      className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50"
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-blue-700">
            Choose the plan that fits your teaching needs. No hidden fees,
            cancel anytime.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-blue-50 p-1 rounded-lg inline-flex">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-white shadow text-blue-900"
                  : "text-blue-600 hover:bg-blue-100"
              }`}
              onClick={() => setBillingInterval("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "yearly"
                  ? "bg-white shadow text-blue-900"
                  : "text-blue-600 hover:bg-blue-100"
              }`}
              onClick={() => setBillingInterval("yearly")}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-screen-xl mx-auto">
          {/* Free Trial */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">Free Trial</CardTitle>
              <CardDescription className="text-blue-600">
                Try GradeAid risk-free
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">$0</span>
                <span className="text-blue-600 ml-2">/14 days</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>AI-powered grading for 5 assignments</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Basic analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Up to 10 students</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full mt-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => router.push("/dashboard")}
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative flex flex-col border-2 border-blue-600 bg-white shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-blue-900">Pro</CardTitle>
              <CardDescription className="text-blue-600">
                For individual teachers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                {billingInterval === "monthly" ? (
                  <>
                    <span className="text-4xl font-bold text-blue-900">
                      $9.99
                    </span>
                    <span className="text-blue-600 ml-2">/month</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-blue-900">
                      $99.99
                    </span>
                    <span className="text-blue-600 ml-2">/year</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Unlimited AI-powered grading</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Advanced analytics & insights</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Unlimited students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Student progress tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Priority email support</span>
                </li>
              </ul>
              <Button
                className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleSubscribe("pro")}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Subscribe Now"}
              </Button>
            </CardContent>
          </Card>

          {/* School Plan */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">School</CardTitle>
              <CardDescription className="text-blue-600">
                For entire schools & districts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Everything in Pro plan</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>School-wide analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Admin dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full mt-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => router.push("/contact")}
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-blue-600">
            All plans include a 14-day free trial. No credit card required to
            start.
          </p>
        </div>
      </div>
    </section>
  );
}
