// middleware.js
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(req) {
  try {
    const res = NextResponse.next();
    const cookieStore = cookies();
    const supabase = createMiddlewareClient({
      req,
      res,
      cookies: () => cookieStore,
    });

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Public routes configuration
    const publicRoutes = ["/login", "/signup", "/about"];
    if (publicRoutes.includes(req.nextUrl.pathname)) {
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return res;
    }

    // Special case for pricing page
    if (req.nextUrl.pathname === "/pricing") {
      // Allow access but attach session info to the request
      const response = NextResponse.next();
      response.headers.set("x-session-user", session?.user?.id || "");
      return response;
    }

    // Protected routes check
    if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
      // Store the attempted URL to redirect back after login
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Subscription and trial checks for authenticated users
    if (session && req.nextUrl.pathname.startsWith("/dashboard")) {
      try {
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (teacherError) {
          console.error("Teacher fetch error:", teacherError);
          return NextResponse.redirect(new URL("/login", req.url));
        }

        if (!teacher) {
          const createUrl = new URL("/signup", req.url);
          createUrl.searchParams.set("complete_profile", "true");
          return NextResponse.redirect(createUrl);
        }

        const now = new Date();
        const trialEndsAt = teacher.trial_ends_at
          ? new Date(teacher.trial_ends_at)
          : null;
        const isTrialExpired = trialEndsAt && now > trialEndsAt;
        const hasActiveSubscription = teacher.subscription_status === "active";
        const isInTrial =
          teacher.subscription_status === "trialing" && !isTrialExpired;
        const hasPendingPayment = teacher.pending_payment_intent != null;

        // Check paper analyzer access
        if (req.nextUrl.pathname.includes("/paper-grader")) {
          if (isInTrial) {
            const { count, error: countError } = await supabase
              .from("paper_analyses")
              .select("id", { count: "exact", head: true })
              .eq("teacher_id", teacher.id);

            if (countError) {
              console.error("Paper count error:", countError);
              return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            if (count >= 5) {
              const redirectUrl = new URL("/pricing", req.url);
              redirectUrl.searchParams.set("trial_limit", "reached");
              redirectUrl.searchParams.set("return_to", req.nextUrl.pathname);
              return NextResponse.redirect(redirectUrl);
            }
          } else if (isTrialExpired && !hasActiveSubscription) {
            const redirectUrl = new URL("/pricing", req.url);
            redirectUrl.searchParams.set("trial_expired", "true");
            redirectUrl.searchParams.set("return_to", req.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
          }
        }

        // General dashboard access check
        if (
          isTrialExpired &&
          !hasActiveSubscription &&
          !hasPendingPayment &&
          !req.nextUrl.pathname.includes("/pricing")
        ) {
          const redirectUrl = new URL("/pricing", req.url);
          redirectUrl.searchParams.set("subscription_required", "true");
          redirectUrl.searchParams.set("return_to", req.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }

        // Update trial status if needed
        if (isTrialExpired && teacher.trial_active) {
          const { error: updateError } = await supabase
            .from("teachers")
            .update({
              trial_active: false,
              subscription_status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", teacher.id);

          if (updateError) {
            console.error("Failed to update trial status:", updateError);
          }
        }
      } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Add user info to response headers for client-side access
    const response = NextResponse.next();
    if (session?.user) {
      response.headers.set("x-user-id", session.user.id);
      response.headers.set("x-user-email", session.user.email);
    }

    return response;
  } catch (error) {
    console.error("Middleware critical error:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/pricing",
    "/dashboard",
    "/dashboard/:path*",
    "/api/analyze",
    "/api/stripe/:path*",
  ],
};
