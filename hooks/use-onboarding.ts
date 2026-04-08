"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Matches highLevelDesign §4.4 (required on this step: company, service type, phone). */
export type OnboardingParams = {
  companyName: string;
  serviceType: string;
  phone: string;
  address?: string | null;
  employees_count?: number | null;
  years_in_business?: number | null;
  estimated_revenue?: number | null;
  referral_source?: string | null;
};

export function useOnboarding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeOnboarding(params: OnboardingParams) {
    const {
      companyName,
      serviceType,
      phone,
      address,
      employees_count,
      years_in_business,
      estimated_revenue,
      referral_source,
    } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Authentication required. Please sign in again.");
        setIsLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "onboarding",
        {
          body: {
            company_name: companyName,
            service_type: serviceType,
            phone,
            address: address ?? null,
            employees_count: employees_count ?? null,
            years_in_business: years_in_business ?? null,
            estimated_revenue: estimated_revenue ?? null,
            referral_source: referral_source ?? null,
          },
        },
      );

      if (fnError) {
        setError(fnError.message || "Unable to complete onboarding.");
        setIsLoading(false);
        return;
      }

      if (data && (data as { error?: string }).error) {
        setError((data as { error: string }).error);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.push("/dashboard");
    } catch {
      setError("Unexpected error during onboarding. Please try again.");
      setIsLoading(false);
    }
  }

  return { completeOnboarding, isLoading, error };
}
