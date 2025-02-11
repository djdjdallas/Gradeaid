// app/signup/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check for intended action/plan from pricing page
  useEffect(() => {
    const intendedPlan = localStorage.getItem("intended_plan");
    const intendedAction = localStorage.getItem("intended_action");
    console.log("Intended plan:", intendedPlan);
    console.log("Intended action:", intendedAction);
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) throw authError;

      // Create teacher profile
      if (authData.user) {
        const { error: profileError } = await supabase.from("teachers").insert({
          user_id: authData.user.id,
          full_name: name,
          email: email,
          subscription_status: "trial",
          trial_ends_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

        if (profileError) throw profileError;

        // Check for intended plan/action
        const intendedPlan = localStorage.getItem("intended_plan");
        const intendedAction = localStorage.getItem("intended_action");

        toast.success(
          "Account created! Please check your email to verify your account."
        );

        // Clear stored intentions
        localStorage.removeItem("intended_plan");
        localStorage.removeItem("intended_action");

        // Redirect based on intention
        if (intendedPlan) {
          const plan = JSON.parse(intendedPlan);
          router.push(`/pricing?plan=${plan.plan}&interval=${plan.interval}`);
        } else if (intendedAction === "trial") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-4">Welcome to GradeAid</h1>
          <p className="text-xl">
            Revolutionize your teaching with AI-powered grading assistance.
          </p>
        </div>
        <div className="space-y-6">
          <p className="text-xl leading-relaxed">
            "GradeAid has transformed my teaching workflow. I spend less time
            grading and more time helping my students succeed."
          </p>
          <div>
            <p className="font-medium">Sarah Johnson</p>
            <p className="text-sm opacity-75">High School Math Teacher</p>
          </div>
        </div>
      </div>

      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Create an account
            </CardTitle>
            <CardDescription>
              Enter your details to start your 14-day free trial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignUp}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
