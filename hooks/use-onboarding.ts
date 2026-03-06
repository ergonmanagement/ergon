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

      // Get the current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Authentication required. Please sign in again.");
        setIsLoading(false);
        return;
      }

      console.log('Calling onboarding Edge Function with:', {
        company_name: companyName,
        service_type: serviceType,
        phone,
      });

      const { data, error } = await supabase.functions.invoke("onboarding", {
        body: {
          company_name: companyName,
          service_type: serviceType,
          phone,
        },
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        let errorMessage = "Unable to complete onboarding.";

        if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data && (data as any).error) {
        console.error('Edge Function returned error:', (data as any));
        setError(`Error: ${(data as any).error}`);
        setIsLoading(false);
        return;
      }

      console.log('Onboarding successful, redirecting to dashboard');
      router.push("/dashboard");
    } catch (err) {
      console.error('Unexpected error:', err);
      setError("Unexpected error during onboarding. Please try again.");
      setIsLoading(false);
    }
  }

  return { completeOnboarding, isLoading, error };
}

