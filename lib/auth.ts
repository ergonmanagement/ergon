import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// Valid email OTP types that Supabase supports for email verification
const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",      // Email verification after sign up
  "invite",      // Team/organization invite
  "magiclink",   // Magic link login
  "recovery",    // Password reset
  "email",       // General email verification
  "email_change", // Email change verification
];

/**
 * Type guard to check if a string is a valid EmailOtpType
 * Used for runtime validation of OTP types from query parameters
 */
function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && VALID_EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

/**
 * Server-side function to verify an email OTP (One-Time Password)
 * Used for email verification flows like sign-up confirmation, password reset, etc.
 * 
 * @param token_hash - The OTP token hash from the email link
 * @param type - The type of OTP (signup, recovery, etc.)
 * @returns Promise with error message or null on success
 */
export async function verifyEmailOtp(
  token_hash: string | null,
  type: string | null
): Promise<{ error: string | null }> {
  // Validate required parameters
  if (!token_hash || !isEmailOtpType(type)) {
    return { error: "No token hash or type" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  return { error: error?.message ?? null };
}

/**
 * Server-side authentication guard function
 * Ensures user is authenticated and has completed onboarding
 * 
 * Flow:
 * 1. Check if user is authenticated -> redirect to login if not
 * 2. Check if user has completed onboarding (has company_id) -> redirect to onboarding if not
 * 3. Return authenticated user data if all checks pass
 * 
 * Use this in Server Components, Server Actions, or Route Handlers that require authentication
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Redirect to login if no authenticated user
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has completed onboarding by verifying they have a company
  // In this multi-tenant system, every user must belong to a company
  const { data: userData, error } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.sub) // user.sub is the user's unique ID from JWT
    .single();

  // Redirect to onboarding if no company association or query error
  if (error || !userData?.company_id) {
    redirect("/auth/onboarding");
  }

  return user;
}
