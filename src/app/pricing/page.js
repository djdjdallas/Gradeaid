"use client";
import { useState, useEffect } from "react";
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
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PricingPage() {
  const [stripe, setStripe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Initialize Stripe when component mounts
  useEffect(() => {
    const initializeStripe = async () => {
      console.log("Initializing Stripe...");

      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.error("Stripe publishable key is missing");
        setError("Stripe configuration error");
        return;
      }

      try {
        const stripeInstance = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        );
        console.log("Stripe initialized successfully");
        setStripe(stripeInstance);
      } catch (error) {
        console.error("Failed to initialize Stripe:", error);
        setError("Failed to initialize payment system");
      }
    };

    initializeStripe();
  }, []);

  const handleSubscribe = async (plan) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!stripe) {
        throw new Error("Payment system not initialized");
      }

      // Get auth session
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError || !session) {
        console.log("Auth error or no session:", { authError, session });
        router.push("/login");
        return;
      }

      console.log("Creating checkout session...");

      // Create checkout session with auth header
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // Add this line
        },
        body: JSON.stringify({
          plan,
          interval: billingInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Checkout error response:", data);
        if (data.error === "Already subscribed" && data.redirect) {
          router.push(data.redirect);
          return;
        }
        throw new Error(data.error || "Failed to create checkout session");
      }

      console.log("Checkout session created successfully:", data);

      // Redirect to checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        throw stripeError;
      }
    } catch (error) {
      console.error("Subscription error:", {
        message: error.message,
        error,
      });
      setError(error.message || "Failed to start subscription process");
      toast.error("Subscription Error", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-12 md:py-24 lg:py-32">
        {/* Page Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-blue-700">
            Choose the plan that fits your teaching needs. No hidden fees,
            cancel anytime.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

          {/* Pro Plan Card */}
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
                disabled={isLoading || !stripe}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* School Plan Card */}
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

        {/* Footer Text */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-blue-600">
            All plans include a 14-day free trial. No credit card required to
            start.
          </p>
        </div>
      </div>
    </div>
  );
}
