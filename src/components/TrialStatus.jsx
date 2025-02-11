// components/TrialStatus.jsx
"use client";

import { useEffect, useState } from "react";
import { differenceInDays } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TrialStatus({ trialEndsAt }) {
  const [daysRemaining, setDaysRemaining] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (trialEndsAt) {
      const days = differenceInDays(new Date(trialEndsAt), new Date());
      setDaysRemaining(Math.max(0, days));
    }
  }, [trialEndsAt]);

  if (!trialEndsAt || daysRemaining === null) return null;

  return (
    <Alert className={daysRemaining <= 3 ? "bg-red-50" : "bg-blue-50"}>
      <AlertTitle>
        {daysRemaining === 0
          ? "Trial Expired"
          : `${daysRemaining} days left in trial`}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {daysRemaining <= 3 ? (
          <>
            <p>
              Your trial is ending soon. Upgrade now to keep using all features.
            </p>
            <Button onClick={() => router.push("/pricing")} className="mt-2">
              Upgrade Now
            </Button>
          </>
        ) : (
          <p>
            You're currently on a free trial. Enjoy full access to all features!
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
