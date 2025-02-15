import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/signup", "/about"]; // Remove "/pricing" from here
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return res;
  }

  // Special case for pricing page - allow both authenticated and unauthenticated users
  if (req.nextUrl.pathname === "/pricing") {
    return res;
  }

  // Protected routes check
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Trial and subscription checks for authenticated users
  if (session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!teacher) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const now = new Date();
    const trialEndsAt = teacher.trial_ends_at
      ? new Date(teacher.trial_ends_at)
      : null;
    const isTrialExpired = trialEndsAt && now > trialEndsAt;
    const hasActiveSubscription = teacher.subscription_status === "active";
    const isInTrial =
      teacher.subscription_status === "trialing" && !isTrialExpired;

    // Special check for paper analyzer access
    if (req.nextUrl.pathname.includes("/paper-grader")) {
      // Only check paper count if user is in trial
      if (isInTrial) {
        const { count } = await supabase
          .from("paper_analyses")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", teacher.id);

        if (count >= 5) {
          return NextResponse.redirect(
            new URL("/pricing?trial_limit=reached", req.url)
          );
        }
      }
      // If trial expired and no subscription, redirect to pricing
      else if (isTrialExpired && !hasActiveSubscription) {
        return NextResponse.redirect(
          new URL("/pricing?trial_expired=true", req.url)
        );
      }
    }

    // General access check for dashboard
    if (
      isTrialExpired &&
      !hasActiveSubscription &&
      !req.nextUrl.pathname.includes("/pricing")
    ) {
      return NextResponse.redirect(
        new URL("/pricing?subscription_required=true", req.url)
      );
    }

    // Update trial status if needed
    if (isTrialExpired && teacher.trial_active) {
      await supabase
        .from("teachers")
        .update({
          trial_active: false,
          subscription_status: "expired",
        })
        .eq("id", teacher.id);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/pricing",
    "/dashboard",
    "/dashboard/:path*",
    "/api/analyze",
  ],
};
