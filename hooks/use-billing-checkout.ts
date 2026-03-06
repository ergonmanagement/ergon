"use client";

/**
 * useBillingCheckout
 *
 * - Client-side hook to start the Stripe Checkout flow via the
 *   billing-create-checkout-session Edge Function.
 * - NEVER calls Stripe directly (Stripe logic is only in Billing
 *   Edge Functions).
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useBillingCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { data, error } = await supabase.functions.invoke(
        "billing-create-checkout-session",
        {
          method: "POST",
          body: {
            success_url: `${origin}/settings`,
            cancel_url: `${origin}/pricing`,
          },
        },
      );

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to start checkout.";
        setError(message);
        setLoading(false);
        return;
      }

      const url = (data as any)?.url as string | undefined;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      } else {
        setError("Missing checkout URL.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error while starting checkout.");
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}

