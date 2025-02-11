import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected route, redirect to login
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If session exists and on login page, redirect to dashboard
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Check trial status for authenticated users accessing dashboard
  if (session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("trial_ends_at, subscription_status")
      .eq("user_id", session.user.id)
      .single();

    if (teacher) {
      const trialEnded =
        teacher.trial_ends_at && new Date(teacher.trial_ends_at) < new Date();
      const noActiveSubscription =
        !teacher.subscription_status ||
        teacher.subscription_status === "inactive";

      // If trial ended and no active subscription, redirect to pricing
      // But don't redirect if already on pricing page to avoid loops
      if (
        trialEnded &&
        noActiveSubscription &&
        !req.nextUrl.pathname.includes("/pricing")
      ) {
        return NextResponse.redirect(new URL("/pricing", req.url));
      }

      // If actively in trial, allow access to all dashboard features
      const inTrial = teacher.subscription_status === "trialing";

      // If trying to access paper grading but exceeded trial limit
      if (inTrial && req.nextUrl.pathname.includes("/paper-grader")) {
        const { count } = await supabase
          .from("paper_analyses")
          .select("id", { count: "exact" })
          .eq("teacher_id", session.user.id);

        if (count >= 5) {
          return NextResponse.redirect(
            new URL("/pricing?trial_limit=reached", req.url)
          );
        }
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/pricing",
    "/paper-grader",
  ],
};
