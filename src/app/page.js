"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart, Book, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PricingSection from "@/components/pricing/pricing-section";

// Create a loading component for suspense fallback
const LoadingState = () => (
  <div className="animate-pulse flex space-x-4">
    <div className="h-4 w-24 bg-blue-100 rounded"></div>
  </div>
);

// Navigation Links Component
const NavigationLinks = () => {
  return (
    <>
      <Link
        className="text-sm font-medium text-blue-800 hover:text-blue-600 hover:underline underline-offset-4"
        href="#features"
      >
        Features
      </Link>
      <Link
        className="text-sm font-medium text-blue-800 hover:text-blue-600 hover:underline underline-offset-4"
        href="#testimonials"
      >
        Testimonials
      </Link>
      <Link
        className="text-sm font-medium text-blue-800 hover:text-blue-600 hover:underline underline-offset-4"
        href="#pricing"
      >
        Pricing
      </Link>
      <Button
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
        asChild
      >
        <Link href="/login">Sign In</Link>
      </Button>
    </>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }) => (
  <Card className="border-blue-100 hover:border-blue-200 transition-colors duration-300">
    <CardHeader>
      <Icon className="h-10 w-10 mb-2 text-blue-600" />
      <CardTitle className="text-blue-900">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-blue-700">{description}</CardContent>
  </Card>
);

// Testimonial Card Component
const TestimonialCard = ({ name, role, quote }) => (
  <Card className="border-blue-100">
    <CardHeader>
      <CardTitle className="text-blue-900">{name}</CardTitle>
      <CardDescription className="text-blue-600">{role}</CardDescription>
    </CardHeader>
    <CardContent className="text-blue-700">{quote}</CardContent>
  </Card>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-blue-50/95 backdrop-blur supports-[backdrop-filter]:bg-blue-50/60">
        <div className="container flex h-14 max-w-screen-xl items-center">
          <Link className="flex items-center justify-center gap-2" href="/">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-blue-900">GradeAid</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Suspense fallback={<LoadingState />}>
              <NavigationLinks />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-blue-50 to-white">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-4xl md:text-5xl lg:text-6xl/none">
                  AI-Powered Teaching Assistant
                </h1>
                <p className="mx-auto max-w-[700px] text-blue-700 md:text-xl">
                  Revolutionize your teaching with our AI assistant that
                  analyzes homework, provides personalized tips, and organizes
                  everything in an intuitive dashboard.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  asChild
                >
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  size="lg"
                  asChild
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-white">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl mb-4">
                Key Features
              </h2>
              <p className="text-blue-700">
                Everything you need to streamline your teaching workflow
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 md:gap-12">
              <FeatureCard
                icon={Book}
                title="Homework Analysis"
                description="Our AI analyzes students' homework, providing detailed insights into their performance and areas for improvement."
              />
              <FeatureCard
                icon={Brain}
                title="Personalized Tips"
                description="Generate tailored tips and recommendations to help each student excel in their studies."
              />
              <FeatureCard
                icon={BarChart}
                title="Intuitive Dashboard"
                description="Access a comprehensive dashboard that organizes all student data, progress tracking, and analytics in one place."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 bg-blue-50">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl mb-4">
                What Teachers Say
              </h2>
              <p className="text-blue-700">
                Hear from educators who have transformed their teaching with
                GradeAid
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              <TestimonialCard
                name="Sarah Johnson"
                role="High School Math Teacher"
                quote="This AI teaching assistant has transformed the way I manage my classroom. The homework analysis feature saves me hours of grading time, and the personalized tips help me provide targeted support to each student."
              />
              <TestimonialCard
                name="Michael Lee"
                role="Middle School Science Teacher"
                quote="The intuitive dashboard has made it so much easier to track student progress and identify areas where additional support is needed. It's like having a second pair of eyes in the classroom!"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <Suspense fallback={<div>Loading pricing...</div>}>
          <PricingSection />
        </Suspense>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-b from-blue-50 to-white">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center max-w-2xl mx-auto">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-blue-900 sm:text-5xl">
                  Ready to Transform Your Teaching?
                </h2>
                <p className="text-blue-700 md:text-xl">
                  Join thousands of educators who are already using our AI
                  teaching assistant to enhance their classrooms and improve
                  student outcomes.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  asChild
                >
                  <Link href="/login">
                    Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  size="lg"
                  asChild
                >
                  <Link href="/contact">Request a Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-600">
                © 2024 GradeAid. All rights reserved.
              </p>
            </div>
            <nav className="flex gap-4 sm:gap-6">
              <Link
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline underline-offset-4"
                href="#"
              >
                Terms of Service
              </Link>
              <Link
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline underline-offset-4"
                href="#"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline underline-offset-4"
                href="#"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
