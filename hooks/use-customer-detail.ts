"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/hooks/use-customers";
import type { Job } from "@/hooks/use-jobs";

export type CustomerDetail = {
  customer: Customer;
  jobs: Job[];
  revenue_total: number;
};

export function useCustomerDetail(customerId: string) {
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const params = new URLSearchParams({ customer_id: customerId });
        const { data, error } = await supabase.functions.invoke(
          "customer-profile",
          {
            method: "GET",
            headers: {
              "X-Ergon-Query": params.toString(),
            },
          },
        );

        if (!isMounted) return;

        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load customer profile.";
          setError(message);
          setLoading(false);
          return;
        }

        setData(data as CustomerDetail);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading customer profile.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  return { data, loading, error };
}

