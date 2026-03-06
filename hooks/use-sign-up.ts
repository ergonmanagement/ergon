"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type SignUpParams = {
  email: string;
  password: string;
  repeatPassword: string;
  firstName?: string;
  lastName?: string;
};

export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(params: SignUpParams) {
    const { email, password, repeatPassword, firstName, lastName } = params;
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/update-password`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (signUpError) throw signUpError;
      // After successful signup, always send the user through onboarding
      // so that companies + users rows are created correctly.
      router.push("/auth/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return { signUp, isLoading, error };
}
