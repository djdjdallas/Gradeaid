// components/pricing/PricingSection.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Move pricing data to constants
const PRICING_PLANS = {
  trial: {
    name: "Free Trial",
    description: "Try GradeAid risk-free",
    price: 0,
    period: "14 days",
    features: [
      "AI-powered grading (5 papers)",
      "Basic analytics dashboard",
      "Up to 10 students",
      "Basic student progress tracking",
      "Single subject test generation (3 tests)",
    ],
  },
  pro: {
    name: "Pro",
    description: "For individual teachers",
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      "Unlimited AI grading",
      "Advanced analytics & insights",
      "Unlimited students",
      "Comprehensive student progress tracking",
      "Personalized study guides",
      "AI-powered test generation",
      "Custom test templates",
      "Study progress monitoring",
      "Subject-specific learning paths",
      "Performance-based content adaptation",
      "Priority support",
    ],
  },
  school: {
    name: "School",
    description: "For entire schools & districts",
    price: "Custom",
    features: [
      "Everything in Pro plan",
      "School-wide analytics",
      "Admin dashboard",
      "Curriculum alignment tools",
      "Advanced study guide customization",
      "Department-wide test sharing",
      "Cross-subject learning paths",
      "Student performance benchmarking",
      "LMS integrations",
      "Dedicated support",
    ],
  },
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function PricingSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Handle plan selection from URL params
  useEffect(() => {
    const plan = searchParams.get("plan");
    const interval = searchParams.get("interval");

    if (interval === "yearly" || interval === "monthly") {
      setBillingInterval(interval);
    }

    if (plan) {
      handleSubscribe(plan);
    }
  }, [searchParams]);

  const handleStartTrial = async () => {
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session) {
        localStorage.setItem("intended_action", "trial");
        router.push("/signup");
        return;
      }

      // Redirect to dashboard if already has session
      router.push("/dashboard");
    } catch (error) {
      console.error("Trial start error:", error);
      toast.error("Failed to start trial");
    }
  };

  // In PricingSection.jsx
  const handleSubscribe = async (plan) => {
    try {
      setIsLoading(true);

      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      // Store subscription intent before redirecting to login
      if (authError || !session) {
        localStorage.setItem(
          "subscription_intent",
          JSON.stringify({
            plan,
            interval: billingInterval,
          })
        );
        router.push("/login");
        return;
      }

      // If we have a session, proceed with checkout
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval: billingInterval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to start subscription process");
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
            Choose the plan that fits your teaching needs. Each plan now
            includes our new personalized study guides and AI test generation
            features.
          </p>
        </div>

        {/* Billing Interval Selector */}
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

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-screen-xl mx-auto">
          {/* Free Trial Card */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">
                {PRICING_PLANS.trial.name}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {PRICING_PLANS.trial.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">$0</span>
                <span className="text-blue-600 ml-2">/14 days</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                {PRICING_PLANS.trial.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={handleStartTrial}
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card className="relative flex flex-col border-2 border-blue-600 bg-white shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-blue-900">
                {PRICING_PLANS.pro.name}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {PRICING_PLANS.pro.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                {billingInterval === "monthly" ? (
                  <>
                    <span className="text-4xl font-bold text-blue-900">
                      ${PRICING_PLANS.pro.monthlyPrice}
                    </span>
                    <span className="text-blue-600 ml-2">/month</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-blue-900">
                      ${PRICING_PLANS.pro.yearlyPrice}
                    </span>
                    <span className="text-blue-600 ml-2">/year</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                {PRICING_PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
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

          {/* School Plan Card */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">
                {PRICING_PLANS.school.name}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {PRICING_PLANS.school.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                {PRICING_PLANS.school.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
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
