import React from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50"
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-blue-700">
            Affordable plans designed specifically for educators. No hidden
            fees, cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-screen-xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">Monthly</CardTitle>
              <CardDescription className="text-blue-600">
                Perfect for trying out GradeAid
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">$9.99</span>
                <span className="text-blue-600 ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Up to 30 students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>AI-powered grading</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <Button
                className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white"
                asChild
                size="lg"
              >
                <Link href="/login">Start Monthly Plan</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="relative flex flex-col border-2 border-blue-600 bg-white shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-blue-900">Annual</CardTitle>
              <CardDescription className="text-blue-600">
                Best value for committed educators
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">$89</span>
                <span className="text-blue-600 ml-2">/year</span>
                <p className="text-sm text-blue-600 mt-1">
                  Save $30+ compared to monthly
                </p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Everything in Monthly</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Up to 50 students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Bulk grading features</span>
                </li>
              </ul>
              <Button
                className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white"
                asChild
                size="lg"
              >
                <Link href="/login">Get Annual Access</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative flex flex-col border-blue-100 hover:border-blue-200 transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-blue-900">Enterprise</CardTitle>
              <CardDescription className="text-blue-600">
                For schools and districts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-4xl font-bold text-blue-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-blue-700">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Unlimited students</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>District-wide analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Dedicated support team</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                  <span>Training and onboarding</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full mt-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                asChild
                size="lg"
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-blue-600">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
