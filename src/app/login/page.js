"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Current session:", session);

        if (session?.user?.email_confirmed_at) {
          // Check for stored subscription intent
          const subscriptionIntent = localStorage.getItem(
            "subscription_intent"
          );
          console.log("Found subscription intent:", subscriptionIntent);

          if (subscriptionIntent) {
            // If there's a subscription intent, handle checkout
            const { plan, interval } = JSON.parse(subscriptionIntent);

            // Create checkout session
            const response = await fetch("/api/stripe/create-checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ plan, interval }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.error || "Failed to create checkout session"
              );
            }

            // Clear subscription intent before redirect
            localStorage.removeItem("subscription_intent");

            // Redirect to Stripe checkout
            window.location.href = data.redirectUrl;
          } else {
            // No subscription intent, go to dashboard
            router.push("/dashboard");
          }
        } else if (session?.user && !session.user.email_confirmed_at) {
          toast.error("Please verify your email to continue");
        }
      } catch (error) {
        console.error("Session check error:", error);
        toast.error("Failed to check session");
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const handleStoredSubscription = async (session) => {
    try {
      console.log("Processing stored subscription...");
      const subscriptionIntent = localStorage.getItem("subscription_intent");

      if (!subscriptionIntent) {
        console.log("No subscription intent found");
        return;
      }

      const { plan, interval } = JSON.parse(subscriptionIntent);
      console.log("Subscription details:", { plan, interval });

      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, interval }),
      });

      console.log("Checkout response status:", response.status);
      const data = await response.json();
      console.log("Checkout response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Clear subscription intent before redirect
      localStorage.removeItem("subscription_intent");

      // Redirect to Stripe checkout
      window.location.href = data.redirectUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to process subscription", {
        description: error.message,
      });
      localStorage.removeItem("subscription_intent");
      router.push("/dashboard");
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resendConfirmationEmail({
        email,
      });
      if (!error) {
        toast.success("Verification email resent!");
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Email resend error:", error);
      toast.error("Failed to resend verification email");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (!data.user.email_confirmed_at) {
          toast.error("Please verify your email to continue", {
            action: {
              label: "Resend email",
              onClick: () => resendVerificationEmail(email),
            },
          });
          return;
        }

        // Let the useEffect handle redirect and subscription
      } else {
        // Handle signup
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                full_name: name || email.split("@")[0],
              },
            },
          }
        );

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from("teachers")
            .insert({
              user_id: authData.user.id,
              full_name: name,
              email: email,
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            await supabase.auth.signOut();
            throw new Error("Failed to create teacher profile");
          }

          setShowConfirmation(true);
          setEmail("");
          setPassword("");
          toast.success("Account created successfully!");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-white flex items-center justify-center">
              <span className="text-xl font-bold">#</span>
            </div>
            <span className="text-xl">GradeAid AI</span>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-xl leading-relaxed">
            "GradeAid has revolutionized my teaching workflow. I now spend less
            time grading and more time doing what matters most - helping my
            students learn and grow."
          </p>
          <div>
            <p className="font-medium">Sofia Davis</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-6">
          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
              <span className="text-xl font-bold">#</span>
            </div>
            <span className="text-xl">GradeAid AI</span>
          </div>
          <div className="ml-auto space-x-2">
            <Button
              variant={isLogin ? "ghost" : "link"}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </Button>
            <Button
              variant={!isLogin ? "ghost" : "link"}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {showConfirmation && (
            <Alert className="max-w-sm w-full mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>
                We've sent you a confirmation email. Please check your inbox and
                follow the instructions to verify your account.
              </AlertDescription>
            </Alert>
          )}

          <Card className="max-w-sm w-full">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLogin
                    ? "Enter your credentials to sign in"
                    : "Enter your details to create your account"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  {!isLogin && (
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  )}
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
                .
              </p>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setShowConfirmation(false);
                  }}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
