"use client";

/**
 * useSubscription
 *
 * - Client-side hook to read the current company's subscription status.
 * - Reads from the public.users and public.companies tables under RLS.
 * - NEVER touches Stripe directly (Stripe logic lives only in Billing
 *   Edge Functions).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionStatus = "trial" | "active" | "canceled";

export type CompanySubscription = {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

export function useSubscription() {
  const [company, setCompany] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // 1) Identify current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!isMounted) return;
          setError("Not authenticated.");
          setLoading(false);
          return;
        }

        // 2) Load user's company_id from public.users under RLS
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (!isMounted) return;

        if (userError || !userRow?.company_id) {
          setError("Could not resolve company.");
          setLoading(false);
          return;
        }

        const companyId = userRow.company_id as string;

        // 3) Load company subscription info
        const { data: companyRow, error: companyError } = await supabase
          .from("companies")
          .select("id, name, subscription_status, trial_started_at, trial_ends_at")
          .eq("id", companyId)
          .single();

        if (!isMounted) return;

        if (companyError || !companyRow) {
          setError("Could not load company subscription.");
          setLoading(false);
          return;
        }

        setCompany(companyRow as CompanySubscription);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading subscription.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { company, loading, error };
}

