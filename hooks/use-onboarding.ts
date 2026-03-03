"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type OnboardingParams = {
  companyName: string;
  serviceType: string;
  phone: string;
};

export function useOnboarding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeOnboarding(params: OnboardingParams) {
    const { companyName, serviceType, phone } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("onboarding", {
        body: {
          company_name: companyName,
          service_type: serviceType,
          phone,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Unable to complete onboarding.";
        setError(message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Unexpected error during onboarding.");
      setIsLoading(false);
    }
  }

  return { completeOnboarding, isLoading, error };
}

