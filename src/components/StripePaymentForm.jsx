// components/StripePaymentForm.jsx
"use client";
import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const PaymentForm = ({ clientSecret, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientSecret) return;

    const initializeStripe = async () => {
      const stripeInstance = await stripePromise;
      if (!stripeInstance) {
        setError("Failed to initialize payment system");
        return;
      }

      const appearance = {
        theme: "stripe",
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorText: "#1e3a8a",
          colorDanger: "#dc2626",
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: "0.5rem",
        },
      };

      const options = {
        clientSecret,
        appearance,
        layout: {
          type: "accordion",
          defaultCollapsed: false,
          radios: true,
          spacedAccordionItems: true,
        },
      };

      const elementsInstance = stripeInstance.elements(options);
      const paymentElement = elementsInstance.create("payment", {
        layout: {
          type: "accordion",
          defaultCollapsed: false,
        },
      });

      paymentElement.mount("#payment-element");
      setStripe(stripeInstance);
      setElements(elementsInstance);
      setIsLoading(false);
    };

    initializeStripe();

    return () => {
      if (elements) {
        elements.unmount();
      }
    };
  }, [clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?success=true`,
        },
      });

      if (submitError) {
        throw submitError;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>Secure payment powered by Stripe</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div id="payment-element" className="min-h-[300px]" />

          {error && (
            <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !stripe}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
}) {
  if (!clientSecret) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
