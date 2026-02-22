"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface SubscriptionDetails {
  status: string;
  has_subscription: boolean;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export function useSubscription() {
  const { data: session } = useSession();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .getSubscriptionStatus()
        .then((data) => {
          setHasSubscription(data.has_subscription);
          setDetails(data);
        })
        .catch(() => setHasSubscription(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  const subscribe = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Failed to start checkout. Is Stripe configured?");
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Failed to open subscription portal.");
    }
  }, []);

  return { hasSubscription, details, loading, subscribe, manageSubscription };
}
