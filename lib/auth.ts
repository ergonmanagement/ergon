import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && VALID_EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

/**
 * Server-side function to verify an email OTP (e.g. from sign-up or magic link).
 * Accepts raw query params; validates token_hash and type.
 * Returns { error: null } on success, or { error: message } on failure.
 */
export async function verifyEmailOtp(
  token_hash: string | null,
  type: string | null
): Promise<{ error: string | null }> {
  if (!token_hash || !isEmailOtpType(type)) {
    return { error: "No token hash or type" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  return { error: error?.message ?? null };
}

/**
 * Server-side function to get the currently authenticated user.
 * Redirects to login page if no user is authenticated.
 * Redirects to onboarding if user hasn't completed onboarding (no company).
 * Use this in Server Components, Server Actions, or Route Handlers.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has completed onboarding (has a company)
  const { data: userData, error } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.sub)
    .single();

  if (error || !userData?.company_id) {
    redirect("/auth/onboarding");
  }

  return user;
}
